#!/usr/bin/env python3
"""Read-only SEO checks for Mintlify sources and documented route policies."""
import argparse
from collections import Counter
import json
import html
from pathlib import Path
import re
import sys

import yaml
from changelog_maintenance import anchors, entries, maintain, map_unfenced, rss_date, with_date_id
from changelog_order import sort_changelog


def frontmatter(source):
    match = re.match(r'\A---\r?\n(.*?)\r?\n---(?:\r?\n|$)', source, re.S)
    if not match:
        raise ValueError('missing YAML frontmatter')
    metadata = yaml.safe_load(match[1])
    if not isinstance(metadata, dict):
        raise ValueError('frontmatter must be a mapping')
    return metadata, source[match.end():]


def unfenced(source):
    return map_unfenced(source, lambda text: text, lambda line: '')


def markup(source):
    content = unfenced(source)
    content = re.sub(r'(`+)(.*?)(?<!`)\1(?!`)', '', content, flags=re.S)
    return re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.S)


def page_errors(source):
    metadata, body = frontmatter(source)
    errors = []
    for key in ('title', 'description'):
        if not isinstance(metadata.get(key), str) or not metadata[key].strip():
            errors.append(f'missing nonempty {key}')
    if re.search(r'(?m)^ {0,3}#\s|<h1\b', markup(body), re.I):
        errors.append('body H1 duplicates the page title')
    content = markup(body)
    if re.search(r'<Card\b[^>]*\bhref\s*=', content, re.S):
        errors.append('Card href is not a crawlable native anchor; use docs-card-link wrapper')
    if re.search(r'<script\b[^>]*type\s*=\s*[\"\']application/ld\+json', content, re.I):
        errors.append('custom MDX JSON-LD is stripped by Mintlify; use supported platform metadata')
    return errors


def navigation_pages(value):
    if isinstance(value, dict):
        for key, child in value.items():
            if key == 'pages':
                for item in child:
                    if isinstance(item, str):
                        yield item
                    else:
                        yield from navigation_pages(item)
            elif isinstance(child, (dict, list)):
                yield from navigation_pages(child)
    elif isinstance(value, list):
        for child in value:
            yield from navigation_pages(child)


def indexability_errors(pages, noindex_routes):
    return [f'{route}: noindex differs from the documented page policy'
            for route, (metadata, _) in pages.items()
            if (metadata.get('noindex') is True) != (route in noindex_routes)]


def retired_redirect_errors(config, locales):
    errors = []
    for locale in locales:
        source = f'/{locale}/basic/space/ai-setting'
        expected = f'/{locale}/basic/ai/custom-model'
        matches = [item for item in config.get('redirects', []) if item.get('source') == source]
        if len(matches) != 1 or matches[0].get('destination') != expected or matches[0].get('permanent') is not True:
            errors.append(f'{source}: retired route requires one permanent redirect to {expected}')
    return errors


def check(root):
    errors = []
    config = json.loads((root / 'docs.json').read_text())
    locales = [entry['language'] for entry in config['navigation']['languages']]
    errors.extend(retired_redirect_errors(config, locales))
    pages = {}
    for locale in locales:
        for path in sorted((root / locale).rglob('*.mdx')):
            route = path.relative_to(root).with_suffix('').as_posix()
            source = path.read_text()
            try:
                metadata, _ = frontmatter(source)
                pages[route] = (metadata, source)
                errors.extend(f'{route}: {message}' for message in page_errors(source))
            except (ValueError, yaml.YAMLError) as error:
                errors.append(f'{route}: {error}')
        titles = Counter(metadata.get('title') for route, (metadata, _) in pages.items() if route.startswith(locale + '/'))
        for title, count in titles.items():
            if title and count > 1:
                errors.append(f'{locale}: duplicate title {title!r} ({count} pages)')
    nav = list(navigation_pages(config['navigation']))
    for route in nav:
        if route not in pages:
            errors.append(f'navigation: missing MDX {route}')
    for locale in locales:
        for suffix in ('index', 'basic/ai/overview', 'api-doc/overview', 'deploy/docker', 'deploy/nginx', 'changelog'):
            if f'{locale}/{suffix}' not in nav:
                errors.append(f'navigation: missing core guide {locale}/{suffix}')
    for language in config['navigation']['languages']:
        def specs(node):
            if isinstance(node, dict):
                if 'openapi' in node:
                    yield node['openapi']['source']
                for value in node.values():
                    yield from specs(value)
            elif isinstance(node, list):
                for value in node:
                    yield from specs(value)
        for source in specs(language):
            if not (root / source).is_file():
                errors.append(f'OpenAPI: missing {source}')
    hidden = json.loads((root / '.github/seo-hidden-pages.json').read_text())
    hidden_routes = [item['page'] for item in hidden]
    noindex_routes = set(hidden_routes) | {f'{locale}/deploy/dashboard' for locale in locales}
    errors.extend(indexability_errors(pages, noindex_routes))
    for route in set(pages) - set(nav) - set(hidden_routes):
        errors.append(f'{route}: hidden page has no documented disposition')
    for route in hidden_routes:
        if route not in pages or pages[route][0].get('noindex') is not True:
            errors.append(f'{route}: hidden policy requires an existing noindex page')
        if route in nav:
            errors.append(f'{route}: hidden policy is stale; page is now in navigation')
    archive = json.loads((root / '.github/seo-archive-policy.json').read_text())
    archived = {p.relative_to(root).with_suffix('').as_posix() for p in (root / 'archive').rglob('*.mdx')}
    if set(item['page'] for item in archive) != archived:
        errors.append('archive policy does not match historical MDX pages')
    for item in archive:
        path = root / (item['page'] + '.mdx')
        if not path.exists():
            continue
        metadata, body = frontmatter(path.read_text())
        if re.search(r'(?m)^ {0,3}#\s|<h1\b', markup(body), re.I):
            errors.append(f'{item["page"]}: body H1 duplicates the archive page title')
        if metadata.get('noindex') is not True:
            errors.append(f'{item["page"]}: archive must be noindex')
        if item['currentGuide'].lstrip('/') not in pages or item['currentGuide'] not in body:
            errors.append(f'{item["page"]}: current guide missing or not linked')
    history = json.loads((root / '.github/changelog-history-anchors.json').read_text())
    annual = json.loads((root / '.github/changelog-annual-anchors.json').read_text())
    for route, (metadata, source) in pages.items():
        if not re.fullmatch(r'[^/]+/changelog(?:-\d{4}(?:-\d{2})?)?', route):
            continue
        locale = route.split('/')[0]
        try:
            if sort_changelog(source, locale) != source:
                errors.append(f'{route}: releases are not newest first')
            dated = entries(source, locale)
            for released, block in dated:
                if rss_date(block) != released.isoformat():
                    errors.append(f'{route}: RSS publication date must equal release date {released.isoformat()}')
                if with_date_id(block) != block:
                    errors.append(f'{route}: Update needs an explicit date ID to match its RSS links ({released.isoformat()})')
            labels = [day for day, _ in dated]
            if len(labels) != len(set(labels)):
                errors.append(f'{route}: duplicate release dates create duplicate HTML IDs')
            suffix = route.split('changelog', 1)[1].lstrip('-')
            if suffix and any(not day.isoformat().startswith(suffix) for day, _ in dated):
                errors.append(f'{route}: release date is outside its history period')
            if not suffix and len({day.strftime('%Y-%m') for day, _ in dated}) != 1:
                errors.append(f'{route}: current changelog exceeds newest month')
            if metadata.get('rss') is not True:
                errors.append(f'{route}: RSS must remain enabled')
            required = annual.get(route, []) if len(suffix) == 4 else history.get(locale, {}).get(suffix, [])
            actual = set().union(*(set(anchors(block)) for _, block in dated))
            for identity in required:
                if identity not in actual:
                    errors.append(f'{route}: lost historical hash {identity}')
        except ValueError as error:
            errors.append(f'{route}: {error}')
    for locale, periods in history.items():
        for period in periods:
            if f'{locale}/changelog-{period}' not in pages:
                errors.append(f'{locale}/changelog-{period}: history manifest target is missing')
    for route in annual:
        if route not in pages:
            errors.append(f'{route}: annual manifest target is missing')
    for item in json.loads((root / '.github/changelog-date-corrections.json').read_text()):
        source = pages.get(item['page'], ({}, ''))[1]
        if item['legacyAnchor'] not in anchors(source) or f'label="{item["newLabel"]}"' not in source:
            errors.append(f'{item["page"]}: lost corrected release label or old date alias')
    for route, identities in json.loads((root / '.github/gmail-setup-evidence.json').read_text())['legacy_anchors'].items():
        body = unfenced(pages.get(route, ({}, ''))[1])
        ids = {html.unescape(value) for value in re.findall(r'<span\b[^>]*\bid="([^"]+)"', body)}
        for identity in identities:
            if identity not in ids:
                errors.append(f'{route}: lost legacy Gmail hash {identity}')
    try:
        for name in maintain(root):
            errors.append(f'{name}: publishing maintenance is required')
    except (ValueError, KeyError, StopIteration) as error:
        errors.append(f'changelog maintenance: {error}')
    return errors, len(pages), len(archive)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        errors, count, historical = check(args.root)
    except (ValueError, KeyError, OSError, yaml.YAMLError) as error:
        print(f'SEO check failed: {error}', file=sys.stderr)
        return 1
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f'SEO source checks passed: {count} current pages, {historical} archive pages.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
