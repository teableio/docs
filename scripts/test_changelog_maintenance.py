import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import date

from changelog_maintenance import maintain, normalize, merge, entries, anchors, BLOCK

ROOT = Path(__file__).resolve().parents[1]


def insert(source, block):
    position = source.index('<Update')
    return source[:position] + block + '\n\n' + source[position:]


def apply(root, changes):
    for name, source in changes.items():
        root.joinpath(name).write_text(source)


class MaintenanceTests(unittest.TestCase):
    def fixture(self):
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)
        root = Path(folder.name)
        root.joinpath('.github').mkdir()
        for name in ['docs.json', '.github/changelog-locales.json', '.github/changelog-history-anchors.json']:
            shutil.copyfile(ROOT / name, root / name)
        for source in ROOT.glob('*/changelog*.mdx'):
            dest = root / source.relative_to(ROOT)
            dest.parent.mkdir(exist_ok=True)
            shutil.copyfile(source, dest)
        # Controlled October fixtures must not depend on how many announcements
        # have been published in the live repository since the tests were added.
        for path in root.glob('*/changelog.mdx'):
            source = path.read_text()
            blocks = list(BLOCK.finditer(source))
            controlled = '\n\n'.join(
                f'<Update label="2026-10-{day}">\n## Fixture {day} {{#fixture-{day}}}\n</Update>'
                for day in (15, 14, 13))
            path.write_text(source[:blocks[0].start()] + controlled + source[blocks[-1].end():])
        return root

    def test_real_repository_is_idempotent_and_date_aliases_match_published_manifest(self):
        self.assertEqual(maintain(ROOT), {})
        manifest = json.loads((ROOT / '.github/changelog-history-anchors.json').read_text())
        for locale, months in manifest.items():
            for month, identities in months.items():
                source = (ROOT / locale / f'changelog-{month}.mdx').read_text()
                for _, block in entries(source, locale):
                    self.assertIn(anchors(block)[0], identities)

    def test_new_month_rollover_in_every_locale_keeps_history_and_localized_metadata(self):
        root = self.fixture()
        resources = json.loads(root.joinpath('.github/changelog-locales.json').read_text())
        for locale in resources:
            path = root / locale / 'changelog.mdx'
            path.write_text(insert(path.read_text(), '<Update label="2026-11-01">\n# New month\n\n## Details\n</Update>'))
        changes = maintain(root)
        apply(root, changes)
        for locale, copy in resources.items():
            self.assertTrue((root / locale / 'changelog-2026-10.mdx').exists())
            current = (root / locale / 'changelog.mdx').read_text()
            self.assertEqual(len(entries(current, locale)), 1)
            self.assertIn('## New month {#2026-11-01-new-month}', current)
            self.assertIn(f'/{locale}/changelog-2026-10', current)
            archived = (root / locale / 'changelog-2026-10.mdx').read_text()
            self.assertEqual(len(entries(archived, locale)), 3)
            self.assertIn(copy['datePickerLabel'], archived)
        self.assertEqual(maintain(root), {})

    def test_historical_republication_updates_once_and_preserves_old_heading_hashes(self):
        root = self.fixture()
        archive = root / 'en/changelog-2026-09.mdx'
        original = entries(archive.read_text(), 'en')
        released, old = original[0]
        label = released.isoformat()
        block = f'<Update label="{label}">\n# Revised release\n\n<video src="demo.mp4" />\n<script type="application/ld+json" dangerouslySetInnerHTML={{{{ __html: JSON.stringify({{}}) }}}} />\n</Update>'
        current = root / 'en/changelog.mdx'
        current.write_text(insert(current.read_text(), block))
        apply(root, maintain(root))
        revised = archive.read_text()
        self.assertEqual(len(entries(revised, 'en')), len(original))
        self.assertEqual(revised.count('Revised release'), 1)
        self.assertIn('<video src="demo.mp4" />', revised)
        self.assertNotIn('dangerouslySetInnerHTML', revised)
        for identity in anchors(old):
            self.assertIn(identity, anchors(entries(revised, 'en')[0][1]))
        self.assertEqual(len(entries(current.read_text(), 'en')), 3)
        self.assertEqual(maintain(root), {})

    def test_ambiguous_same_day_republication_fails_without_overwriting_either_entry(self):
        released = date(2026, 9, 30)
        old_one = '<Update label="Sep 30, 2026">\n## One {#one}\n</Update>'
        old_two = '<Update label="Sep 30, 2026">\n## Two {#two}\n</Update>'
        new = '<Update label="2026-09-30">\n## Revised {#revised}\n</Update>'
        existing = [(released, old_one), (released, old_two)]
        with self.assertRaisesRegex(ValueError, 'Ambiguous same-day'):
            merge(existing, [(released, new)])
        self.assertEqual(existing, [(released, old_one), (released, old_two)])
        # Untouched same-day entries keep their editorial order.
        result = merge(existing, [(date(2026, 10, 1), new)])
        self.assertEqual(result[1:], existing)

    def test_heading_normalization_keeps_fenced_code_and_existing_ids(self):
        source = '<Update label="2026-10-18">\n# Release\n\n## Section {#existing}\n\n```markdown\n# Code heading\n```\n\n## Section\n## Section\n</Update>'
        result = normalize(source, date(2026, 10, 18), assign_ids=True)
        self.assertIn('## Release {#2026-10-18-release}', result)
        self.assertIn('### Section {#existing}', result)
        self.assertIn('```markdown\n# Code heading\n```', result)
        self.assertIn('{#2026-10-18-section-2}', result)
        self.assertEqual(normalize(result, date(2026, 10, 18), assign_ids=True), result)

    def test_new_headings_do_not_reuse_an_existing_explicit_id(self):
        source = '<Update label="2026-10-18">\n## Section {#2026-10-18-section}\n## Section\n</Update>'
        result = normalize(source, date(2026, 10, 18), assign_ids=True)
        self.assertIn('## Section {#2026-10-18-section-2}', result)

    def test_long_fences_and_jsonld_code_examples_remain_byte_for_byte(self):
        code = '````markdown\n```javascript\n# literal code heading {#example-only}\n```\n<span id="code-only" />\n<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({}) }} />\n````\n'
        live = '<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({}) }} />\n'
        source = '<Update label="2026-10-18">\n# Release\n' + code + live + '</Update>'
        result = normalize(source, date(2026, 10, 18), assign_ids=True)
        self.assertIn(code, result)
        self.assertEqual(result.count('dangerouslySetInnerHTML'), 1)
        self.assertIn('## Release {#2026-10-18-release}', result)
        self.assertNotIn('example-only', anchors(result))
        self.assertNotIn('code-only', anchors(result))

    def test_shared_page_id_reservations_keep_same_day_headings_unique(self):
        occupied = set()
        block = '<Update label="2026-10-18">\n## Features\n</Update>'
        first = normalize(block, date(2026, 10, 18), True, occupied)
        second = normalize(block, date(2026, 10, 18), True, occupied)
        self.assertIn('{#2026-10-18-features}', first)
        self.assertIn('{#2026-10-18-features-2}', second)

    def test_duplicate_current_dates_fail_before_creating_duplicate_update_ids(self):
        root = self.fixture()
        current = root / 'en/changelog.mdx'
        block = '<Update label="2026-10-18">\n## Features\n</Update>'
        current.write_text(insert(insert(current.read_text(), block), block))
        with self.assertRaisesRegex(ValueError, 'multiple entries share a date'):
            maintain(root)

    def test_annual_backfill_retains_existing_ids_and_does_not_create_a_monthly_duplicate(self):
        root = self.fixture()
        annual = root / 'en/changelog-2024.mdx'
        original = entries(annual.read_text(), 'en')
        released, old = original[-1]
        current = root / 'en/changelog.mdx'
        current.write_text(insert(current.read_text(), f'<Update label="{released.isoformat()}">\n# Revised old release\n</Update>'))
        apply(root, maintain(root))
        result = entries(annual.read_text(), 'en')
        self.assertEqual(len(result), len(original))
        self.assertIn('Revised old release', result[-1][1])
        for identity in anchors(old):
            self.assertIn(identity, anchors(result[-1][1]))
        self.assertFalse((root / 'en/changelog-2024-07.mdx').exists())
        self.assertEqual(maintain(root), {})

    def test_year_rollover_updates_the_main_title_and_preserves_rss(self):
        root = self.fixture()
        current = root / 'en/changelog.mdx'
        current.write_text(insert(current.read_text(), '<Update label="2027-01-01">\n# New year\n</Update>'))
        apply(root, maintain(root))
        self.assertIn('title: "Changelog 2027"', current.read_text())
        self.assertIn('rss: true', current.read_text())
        self.assertEqual(len(entries(current.read_text(), 'en')), 1)
        self.assertTrue((root / 'en/changelog-2026-10.mdx').exists())
        self.assertEqual(maintain(root), {})

    def test_bad_locale_prevents_all_write_mode_changes(self):
        root = self.fixture()
        english = root / 'en/changelog.mdx'
        source = insert(english.read_text(), '<Update label="2026-10-18">\n# Needs normalization\n</Update>')
        english.write_text(source)
        root.joinpath('zh/changelog.mdx').write_text('---\ntitle: "Bad"\n---\n<Update label="2026-10-18">unclosed')
        result = subprocess.run([sys.executable, str(ROOT / 'scripts/changelog_maintenance.py'), '--root', str(root), '--write'], capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(english.read_text(), source)


if __name__ == '__main__':
    unittest.main()
