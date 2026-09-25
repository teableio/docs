const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { changelogDateKey, sortChangelogUpdates, upsertChangelogByDate } = require('./changelog_publisher_order.cjs');

const header = '---\ntitle: "Changelog 2026"\nrss: true\n---\n\n';
const entry = (date, body) => `<Update label="${date}">\n\n${body}\n\n</Update>`;
const labels = (source) => [...source.matchAll(/<Update label="([^"]+)"/g)].map((match) => match[1]);

test('backfills go between newer and older releases in both publisher languages', () => {
  for (const dates of [['Sep 24, 2026', 'Sep 23, 2026', 'Sep 21, 2026'], ['2026-09-24', '2026-09-23', '2026-09-21']]) {
    const newer = entry(dates[0], '# Announcement\n\n<img src="cover.png" />');
    const older = entry(dates[2], '# Previous release');
    const added = entry(dates[1], '# Backfill\n\n<video src="demo.mp4" />');
    const result = upsertChangelogByDate(header + newer + '\n\n' + older, dates[1], added);
    assert.deepEqual(labels(result), dates);
    for (const block of [newer, older, added]) assert.ok(result.includes(block));
    assert.ok(result.startsWith(header));
  }
});

test('re-publishing updates an existing entry without duplicates or moving it ahead of a newer release', () => {
  const source = header + entry('Sep 24, 2026', '# Newer') + '\n\n' + entry('Sep 23, 2026', '# Old body');
  const replacement = entry('Sep 23, 2026', '# Corrected $& content');
  const first = upsertChangelogByDate(source, 'Sep 23, 2026', replacement);
  const second = upsertChangelogByDate(first, 'Sep 23, 2026', replacement);
  assert.deepEqual(labels(second), ['Sep 24, 2026', 'Sep 23, 2026']);
  assert.ok(second.includes(replacement));
  assert.ok(!second.includes('# Old body'));
});

test('sort repairs existing inversions and preserves same-day ordering, comments, and year boundaries', () => {
  const one = entry('Jan 1, 2027', '# First');
  const two = entry('Jan 1, 2027', '# Second');
  const old = entry('Dec 31, 2026', '# Old');
  const gap = '\n\n{/* mintlify-resync: 2026-05-28 */}\n';
  const sorted = sortChangelogUpdates(header + old + gap + one + '\n\n' + two);
  assert.equal(sorted, header + one + gap + two + '\n\n' + old);
  assert.equal(sortChangelogUpdates(sorted), sorted);
});

test('invalid dates and malformed blocks prevent publishing', () => {
  for (const label of ['Feb 30, 2026', '2026-02-29', '2026-13-01', 'unknown']) {
    assert.throws(() => changelogDateKey(label));
  }
  assert.equal(changelogDateKey('Feb 29, 2028'), Date.UTC(2028, 1, 29));
  for (const source of [header + '<Update label="Sep 24, 2026">unclosed',
    header + entry('Sep 24, 2026', '# New') + '\nstray text\n' + entry('Sep 23, 2026', '# Old')]) {
    assert.throws(() => sortChangelogUpdates(source));
  }
});

test('the publisher sorter preserves both real production changelogs byte-for-byte', () => {
  for (const locale of ['en', 'zh']) {
    const source = readFileSync(path.join(__dirname, '..', locale, 'changelog.mdx'), 'utf8');
    assert.equal(sortChangelogUpdates(source), source);
  }
});
