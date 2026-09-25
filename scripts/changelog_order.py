#!/usr/bin/env python3
"""Check or stably sort current changelogs by their localized release dates."""

import argparse
from datetime import date
from pathlib import Path
import re
import sys


# Full and abbreviated month labels used by the documentation's locales.
MONTHS = {
    "en": "jan|january feb|february mar|march apr|april may jun|june jul|july aug|august sep|sept|september oct|october nov|november dec|december",
    "de": "jan|januar feb|februar mär|märz apr|april mai jun|juni jul|juli aug|august sep|september okt|oktober nov|november dez|dezember",
    "es": "ene|enero feb|febrero mar|marzo abr|abril may|mayo jun|junio jul|julio ago|agosto sep|sept|septiembre oct|octubre nov|noviembre dic|diciembre",
    "fr": "janv|janvier févr|février mars avr|avril mai juin juil|juillet août sept|septembre oct|octobre nov|novembre déc|décembre",
    "it": "gen|gennaio feb|febbraio mar|marzo apr|aprile mag|maggio giu|giugno lug|luglio ago|agosto set|settembre ott|ottobre nov|novembre dic|dicembre",
    "ru": "янв|января фев|февр|февраля мар|марта апр|апреля мая июн|июня июл|июля авг|августа сен|сент|сентября окт|октября ноя|ноября дек|декабря",
    "uk": "січня лютого березня квітня травня червня липня серпня вересня жовтня листопада грудня",
    "tr": "ocak şubat mart nisan mayıs haziran temmuz ağustos eylül ekim kasım aralık",
    "ar": "يناير فبراير مارس أبريل مايو يونيو يوليو أغسطس سبتمبر أكتوبر نوفمبر ديسمبر",
}
MONTH_LOOKUP = {
    locale: {alias: month for month, aliases in enumerate(names.split(), 1)
             for alias in aliases.split("|")}
    for locale, names in MONTHS.items()
}
BLOCK = re.compile(r"^<Update\b[^>]*>.*?^</Update>[ \t]*", re.MULTILINE | re.DOTALL)
LABEL = re.compile(r"\blabel\s*=\s*([\"'])(.*?)\1", re.DOTALL)


def parse_date(label, locale):
    value = label.strip().lower()
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return date.fromisoformat(value)
    japanese = re.fullmatch(r"(\d{4})年(\d{1,2})月(\d{1,2})日", value)
    if japanese:
        return date(*map(int, japanese.groups()))
    value = re.sub(r"[,.]", "", value)
    value = re.sub(r"\s+de\s+", " ", value)
    value = re.sub(r"\s+г$", "", value)
    parts = value.split()
    if len(parts) != 3 or locale not in MONTH_LOOKUP:
        raise ValueError(f"unsupported date label: {label!r} ({locale})")
    month, day, year = parts if locale == "en" else (parts[1], parts[0], parts[2])
    if month not in MONTH_LOOKUP[locale]:
        raise ValueError(f"unknown month in {label!r} ({locale})")
    return date(int(year), MONTH_LOOKUP[locale][month], int(day))


def sort_changelog(source, locale):
    blocks = list(BLOCK.finditer(source))
    if not blocks or len(blocks) != len(re.findall(r"<Update\b", source)):
        raise ValueError("missing or malformed Update blocks")
    if len(blocks) != len(re.findall(r"</Update\s*>", source)):
        raise ValueError("unbalanced Update blocks")
    # Refuse to relocate free-standing content between entries.
    for left, right in zip(blocks, blocks[1:]):
        gap = source[left.end():right.start()]
        if re.sub(r"\{/\*.*?\*/\}", "", gap, flags=re.DOTALL).strip():
            raise ValueError("unexpected content between Update blocks")
    dated = []
    for block in blocks:
        opening = block.group().split(">", 1)[0]
        match = LABEL.search(opening)
        if not match:
            raise ValueError("Update has no literal date label")
        dated.append((parse_date(match[2], locale), block.group()))
    # Python's stable sort preserves the editorial order of same-day updates.
    ordered = sorted(dated, key=lambda item: item[0], reverse=True)
    chunks = [source[:blocks[0].start()]]
    for index, (_, block) in enumerate(ordered):
        chunks.append(block)
        end = blocks[index + 1].start() if index + 1 < len(blocks) else len(source)
        chunks.append(source[blocks[index].end():end])
    return "".join(chunks)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="fix ordering in place")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    paths = sorted(args.root.glob("*/changelog.mdx"))
    if not paths:
        parser.error("no current changelog files found")
    changes = []
    errors = []
    for path in paths:
        source = path.read_text(encoding="utf-8")
        try:
            result = sort_changelog(source, path.parent.name)
        except ValueError as error:
            errors.append(f"{path.relative_to(args.root)}: {error}")
            continue
        if result != source:
            changes.append((path, result))
    # Validate every locale before writing any changes.
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    for path, result in changes:
        print(f"{'Sorted' if args.write else 'Out of order:'} {path.relative_to(args.root)}")
        if args.write:
            path.write_text(result, encoding="utf-8")
    if changes and not args.write:
        print("Run python3 scripts/changelog_order.py --write", file=sys.stderr)
        return 1
    print(f"Checked {len(paths)} current changelogs: newest dates first.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
