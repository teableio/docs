#!/usr/bin/env python3
"""Normalize published updates and roll older months into their existing history."""
import argparse
from collections import defaultdict
import html
import json
from pathlib import Path
import re
import sys
from changelog_order import BLOCK, LABEL, parse_date, sort_changelog

SCRIPT = re.compile(r'<script\s+type="application/ld\+json"\s+dangerouslySetInnerHTML=\{\{[\s\S]*?\}\}\s*/>\s*\n?')
HEADING = re.compile(r'^(#{1,6})\s+(.+?)(\r?\n)?$')
EXPLICIT = re.compile(r'\s+\{#([^}]+)\}\s*$')


def date_slug(label):
    # Date labels contain letters, digits and separators; unlike prose headings,
    # they have no Markdown or ampersands. Preserve non-Latin letters.
    return re.sub(r'\s+', '-', re.sub(r'[^\w\s-]', '', label.lower())).strip('-')


def entries(source, locale):
    sort_changelog(source, locale)  # Validate dates, balanced blocks and gaps.
    return [(parse_date(LABEL.search(m.group().split('>', 1)[0])[2], locale), m.group()) for m in BLOCK.finditer(source)]


def fence_marker(line):
    return re.match(r'^\s*(`{3,}|~{3,})(.*)$', line)


def closes_fence(marker, fence):
    return marker and marker[1][0] == fence[0] and len(marker[1]) >= fence[1] and not marker[2].strip()


def map_unfenced(source, transform, protected=lambda line: line):
    result, pending, fence = [], [], None
    for line in source.splitlines(keepends=True):
        marker = fence_marker(line)
        if fence:
            result.append(protected(line))
            if closes_fence(marker, fence):
                fence = None
        elif marker:
            result.extend([transform(''.join(pending)), protected(line)])
            pending = []
            fence = (marker[1][0], len(marker[1]))
        else:
            pending.append(line)
    result.append(transform(''.join(pending)))
    return ''.join(result)


def heading_indices(lines):
    fence = None
    for index, line in enumerate(lines):
        marker = fence_marker(line)
        if fence:
            if closes_fence(marker, fence):
                fence = None
            continue
        if marker:
            fence = (marker[1][0], len(marker[1]))
        elif HEADING.match(line):
            yield index


def named_ids(block):
    block = map_unfenced(block, lambda text: text, lambda line: '')
    result = {html.unescape(value) for value in re.findall(r'<span\b[^>]*\bid="([^"]+)"', block)}
    lines = block.splitlines(keepends=True)
    for index in heading_indices(lines):
        explicit = EXPLICIT.search(HEADING.match(lines[index])[2])
        if explicit:
            result.add(explicit[1].replace('&', ''))
    return result


def normalize(block, released, assign_ids=False, reserved_ids=None):
    block = map_unfenced(block, lambda text: SCRIPT.sub('', text))
    lines = block.splitlines(keepends=True)
    headings = list(heading_indices(lines))
    shift = any(lines[index].startswith('# ') for index in headings)
    used = defaultdict(int)
    occupied = named_ids(block) | (reserved_ids or set())
    for index in headings:
        explicit = EXPLICIT.search(HEADING.match(lines[index])[2])
        if explicit:
            occupied.update([explicit[1], explicit[1].replace('&', '')])
    for index in headings:
        match = HEADING.match(lines[index])
        level, text = match[1], match[2]
        if shift and len(level) < 6:
            level += '#'
        if assign_ids and not EXPLICIT.search(text):
            plain = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
            slug = re.sub(r'[^\w-]+', '-', re.sub(r'<[^>]*>', '', plain).lower()).strip('-_') or 'section'
            base = f'{released.isoformat()}-{slug}'
            identity = base
            while identity in occupied:
                used[base] = max(used[base], 1) + 1
                identity = base + f'-{used[base]}'
            occupied.add(identity)
            text += ' {#' + identity + '}'
        lines[index] = level + ' ' + text + (match[3] or '')
    if reserved_ids is not None:
        reserved_ids.update(occupied)
    return ''.join(lines)


def anchors(block):
    label = LABEL.search(block.split('>', 1)[0])[2]
    block = map_unfenced(block, lambda text: text, lambda line: '')
    result = [date_slug(label)]
    for value in re.findall(r'^#{1,6} .*?\{#([^}]+)\}\s*$', block, re.M):
        result.extend([value, value.replace('&', '')])
    result.extend(html.unescape(value) for value in re.findall(r'<span\b[^>]*\bid="([^"]+)"', block))
    return list(dict.fromkeys(result))


def replace_entry(old, new):
    # Keep the old label spelling, and therefore its published date ID.
    old_label = LABEL.search(old.split('>', 1)[0])[2]
    new = LABEL.sub(lambda m: 'label=' + m[1] + old_label + m[1], new, count=1)
    missing = [value for value in anchors(old)[1:] if value not in anchors(new)]
    if missing:
        insert = '\n' + '\n'.join('<span id="' + html.escape(value, quote=True) + '" />' for value in missing) + '\n'
        position = new.index('>') + 1
        new = new[:position] + insert + new[position:]
    return new


def merge(existing, incoming):
    for released in {day for day, _ in incoming}:
        if sum(day == released for day, _ in existing) > 1 or sum(day == released for day, _ in incoming) > 1:
            raise ValueError(f'Ambiguous same-day republication on {released}: combine the updates into one Update before publishing; separate entries require publisher identity support')
    result = list(existing)
    consumed = defaultdict(int)
    for released, block in incoming:
        positions = [index for index, (day, _) in enumerate(result) if day == released]
        offset = consumed[released]
        if offset < len(positions):
            index = positions[offset]
            result[index] = (released, replace_entry(result[index][1], block))
        else:
            result.append((released, block))
        consumed[released] += 1
    return sorted(result, key=lambda item: item[0], reverse=True)


def picker(resources):
    return '<span id="changelog-labels" data-date-picker-label="' + html.escape(resources['datePickerLabel'], quote=True) + '" hidden />'


def monthly_page(locale, month, resources):
    fields = {'title': resources['monthTitle'].format(month=month), 'sidebarTitle': month,
              'description': resources['monthDescription'].format(month=month)}
    prefix = '---\n' + ''.join(key + ': ' + json.dumps(value, ensure_ascii=False) + '\n' for key, value in fields.items()) + 'rss: true\n---\n\n'
    tail = '\n\n' + picker(resources) + '\n\n[' + resources['latestLabel'] + f'](/{locale}/changelog)\n'
    return prefix, tail


def main_footer(root, locale, resources, manifest, planned):
    prefix = f'{locale}/changelog-'
    months = sorted({name[len(prefix):-4] for name in planned if name.startswith(prefix) and re.fullmatch(r'\d{4}-\d{2}', name[len(prefix):-4])}
                    | {p.stem[len('changelog-'):] for p in root.joinpath(locale).glob('changelog-????-??.mdx')}, reverse=True)
    result = '\n\n' + picker(resources) + '\n\n## ' + resources['historyLabel'] + '\n\n'
    for month in months:
        result += f'- [{month}](/{locale}/changelog-{month})\n'
    for year in sorted((p.stem[len('changelog-'):] for p in root.joinpath(locale).glob('changelog-????.mdx')), reverse=True):
        result += f'- [{year}](/{locale}/changelog-{year})\n'
    for month, values in sorted(manifest.items()):
        result += f'\n<span data-changelog-month="{month}" data-changelog-anchors="' + html.escape('|'.join(values), quote=True) + '" hidden />\n'
    return result, months


def maintain(root):
    resources = json.loads(root.joinpath('.github/changelog-locales.json').read_text())
    manifest_path = '.github/changelog-history-anchors.json'
    manifest = json.loads(root.joinpath(manifest_path).read_text())
    config = json.loads(root.joinpath('docs.json').read_text())
    planned = {}
    history_changed = False
    for locale, copy in resources.items():
        name = f'{locale}/changelog.mdx'
        source = root.joinpath(name).read_text()
        original = entries(source, locale)
        days = [day for day, _ in original]
        if len(days) != len(set(days)):
            raise ValueError(f'{name}: multiple entries share a date and Mintlify would duplicate their date anchor; combine these entries before publishing')
        newest_month = max(day for day, _ in original).strftime('%Y-%m')
        reserved = set().union(*(named_ids(block) for _, block in original))
        normalized = [(day, normalize(block, day, assign_ids=True, reserved_ids=reserved)) for day, block in original]
        older = defaultdict(list)
        recent = []
        for day, block in normalized:
            if day.strftime('%Y-%m') == newest_month:
                recent.append((day, block))
            else:
                annual = f'{locale}/changelog-{day.year}.mdx'
                target = annual if root.joinpath(annual).exists() else f'{locale}/changelog-{day:%Y-%m}.mdx'
                older[target].append((day, block))
        for target, incoming in older.items():
            if root.joinpath(target).exists():
                archived = root.joinpath(target).read_text()
                matches = list(BLOCK.finditer(archived))
                prefix, tail = archived[:matches[0].start()], archived[matches[-1].end():]
                old_entries = [(day, normalize(block, day)) for day, block in entries(archived, locale)]
            else:
                prefix, tail = monthly_page(locale, target[-11:-4], copy)
                old_entries = []
            combined = merge(old_entries, incoming)
            planned[target] = prefix + '\n\n'.join(block for _, block in combined) + tail
            if re.search(r'\d{4}-\d{2}\.mdx$', target):
                month = target[-11:-4]
                known = manifest.setdefault(locale, {}).setdefault(month, [])
                for _, block in combined:
                    known.extend(value for value in anchors(block) if value not in known)
        matches = list(BLOCK.finditer(source))
        prefix = source[:matches[0].start()]
        prefix = re.sub(r'^title:.*$', 'title: ' + json.dumps(copy['currentTitle'].format(year=max(day for day, _ in original).year), ensure_ascii=False), prefix, count=1, flags=re.M)
        if older:
            tail, months = main_footer(root, locale, copy, manifest[locale], planned)
            language = next(value for value in config['navigation']['languages'] if value['language'] == locale)
            tab = next(value for value in language['tabs'] if f'{locale}/changelog' in value.get('pages', []))
            tab['pages'] = [value for value in tab['pages'] if not (isinstance(value, dict) and value.get('pages') and all(re.fullmatch(re.escape(locale) + r'/changelog-\d{4}-\d{2}', item) for item in value['pages']))]
            groups = defaultdict(list)
            for month in months:
                groups[month[:4]].append(f'{locale}/changelog-{month}')
            for offset, (year, pages) in enumerate(sorted(groups.items(), reverse=True), 1):
                tab['pages'].insert(offset, {'group': copy['historyLabel'] + ' ' + year, 'pages': pages})
            history_changed = True
        else:
            tail = source[matches[-1].end():]
        planned[name] = prefix + '\n\n'.join(block for _, block in sorted(recent, key=lambda value: value[0], reverse=True)) + tail
    if history_changed:
        planned[manifest_path] = json.dumps(manifest, indent=2, ensure_ascii=False) + '\n'
        planned['docs.json'] = json.dumps(config, indent=2, ensure_ascii=False) + '\n'
    # Validate every resulting MDX before mutating any files.
    for name, content in planned.items():
        if name.endswith('.mdx'):
            sort_changelog(content, name.split('/')[0])
    return {name: content for name, content in planned.items() if not root.joinpath(name).exists() or root.joinpath(name).read_text() != content}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    try:
        changes = maintain(args.root)
    except (ValueError, KeyError, StopIteration) as error:
        print(f'Changelog maintenance failed: {error}', file=sys.stderr)
        return 1
    for name, content in changes.items():
        print(('Updated: ' if args.write else 'Needs maintenance: ') + name)
        if args.write:
            args.root.joinpath(name).write_text(content)
    return 0 if args.write or not changes else 1


if __name__ == '__main__':
    sys.exit(main())
