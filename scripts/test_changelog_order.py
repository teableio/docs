from datetime import date
import unittest

from changelog_order import parse_date, sort_changelog


def entry(label, content):
    return f'<Update label="{label}">\n\n{content}\n\n</Update>'


class ChangelogOrderTest(unittest.TestCase):
    def test_backfill_keeps_newer_announcement_first_and_preserves_content(self):
        old = entry("Sep 23, 2026", '# Backfill\n\n<video src="demo.mp4" />')
        new = entry("Sep 24, 2026", '# Announcement\n\n<img src="image.png" />')
        prefix = '---\ntitle: "Changelog 2026"\nrss: true\n---\n\n'
        self.assertEqual(sort_changelog(prefix + old + "\n\n\n" + new + "\n", "en"),
                         prefix + new + "\n\n\n" + old + "\n")

    def test_same_day_stability_year_boundary_and_idempotence(self):
        entries = [entry("Dec 31, 2025", "old"), entry("Jan 1, 2026", "first"),
                   entry("Jan 1, 2026", "second")]
        result = sort_changelog("\n\n".join(entries), "en")
        self.assertEqual(result, "\n\n".join([entries[1], entries[2], entries[0]]))
        self.assertEqual(sort_changelog(result, "en"), result)

    def test_all_locales(self):
        labels = {"en": "Sep 24, 2026", "zh": "2026-09-24", "ja": "2026年9月24日",
                  "ar": "24 سبتمبر 2026", "de": "24. September 2026", "es": "24 sep 2026",
                  "fr": "24 septembre 2026", "it": "24 set 2026", "ru": "24 сентября 2026 г.",
                  "tr": "24 Eylül 2026", "uk": "24 вересня 2026"}
        for locale, label in labels.items():
            with self.subTest(locale=locale):
                self.assertEqual(parse_date(label, locale), date(2026, 9, 24))
        self.assertEqual(parse_date("30 de abril de 2026", "es"), date(2026, 4, 30))
        self.assertEqual(parse_date("07 янв. 2026 г.", "ru"), date(2026, 1, 7))

    def test_mintlify_resync_comment_is_preserved(self):
        separator = '\n\n{/* mintlify-resync: 2026-05-28 */}\n'
        older = entry("2026-05-26", "older")
        newer = entry("2026-05-28", "newer")
        self.assertEqual(sort_changelog(older + separator + newer, "zh"),
                         newer + separator + older)

    def test_invalid_dates_or_structure_fail_closed(self):
        for source in [entry("Feb 30, 2026", "bad"), entry("Someday", "bad"),
                       '<Update label="Sep 24, 2026">unclosed',
                       entry("Sep 24, 2026", "ok") + "\n</Update>",
                       entry("Sep 23, 2026", "a") + "\nstray text\n" + entry("Sep 24, 2026", "b")]:
            with self.subTest(source=source), self.assertRaises(ValueError):
                sort_changelog(source, "en")


if __name__ == "__main__":
    unittest.main()
