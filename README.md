# Teable Help

### Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mintlify) to preview the documentation changes locally. To install, use the following command

```
npm i -g mintlify
```

Run the following command at the root of your documentation (where docs.json is)

```
mintlify dev
```

### Paste Image

Use the [Paste Image](https://marketplace.visualstudio.com/items?itemName=mushan.vscode-paste-image) extension to paste images into the markdown file.
Open mdx file and press `cmd + option + v` to paste image.

### Image Assets

Images are shared repo assets. Keep paths stable, names searchable, and
rendering consistent.

When a change includes images, ask the agent to read this section first and
commit only images processed according to these rules.

#### Folder Rules

- Use `images/{top-level-group}/{topic}/`.
- Top-level groups: `docs`, `selfhosted`, `api`, `security`, `changelog`.
- `docs` maps to the Help Center Docs tab. Do not flatten
  `images/docs/{topic}/` into `images/{topic}/`.
- `{topic}` maps to the navigation name in `docs.json`, such as `ai`, `base`,
  `space`, `sso`, `authority-matrix`, `get-id`, or `activate`.
- Do not put new screenshots in the `images/` root.
- Do not commit random staging folders.
- Put unreferenced images in `images/orphans/YYYY-MM-DD/...` first. Do not
  delete them directly.
- Docs pages must not reference `images/orphans/...`.

#### Naming

Use this format:

```text
images/{top-level-group}/{topic}/YYYY-MM-DD-page-slug-purpose.png
images/{top-level-group}/{topic}/YYYY-MM-DD-page-slug-purpose.webp
images/{top-level-group}/{topic}/YYYY-MM-DD-page-slug-purpose-zh.png
```

- Date = day the image enters the docs repo.
- Page slug = docs page or feature area.
- Purpose = visible UI or action. Do not use `image1` or random hashes.
- Use `.png` for static UI screenshots.
- Prefer `.webp` for animated screenshots.
- English-only screenshot = shared asset. Do not add `-en`.
- Chinese-specific screenshot = add `-zh`.

#### Image Handling

- Logos, inline icons, external button images, videos, and historical changelog
  media do not need screenshot styling.

#### MDX Usage

Use explicit `<img>` for docs screenshots:

```mdx
<img
  src="/images/docs/ai/YYYY-MM-DD-page-slug-purpose.png"
  alt="AI Chat context selector"
  className="docs-screenshot"
/>
```

- Use `className="docs-screenshot"` for new PNG/WebP docs screenshots under
  `images/docs/`, `images/api/`, `images/selfhosted/`, and `images/security/`.
- Alt text must be non-empty.
- Alt text describes the visible UI or action. Do not use `screenshot` or the
  file name.
- Do not use `![](...)` for new docs screenshots.
- Avoid `width="400"`, percentage widths, and one-off image sizing.
- Changelog images keep their historical display. Add useful alt text when
  context exists. Do not add `docs-screenshot` blindly.

### Publishing Changes

Changelog entries must be ordered by release date, newest first, in every
language. Backfilled releases belong below newer announcements, even when
published later. Keep same-day entries in their existing editorial order.

Before publishing a changelog, run:

```bash
python3 scripts/changelog_order.py --write
python3 scripts/changelog_order.py
```

The `Changelog date order` workflow validates all current language changelogs
on pull requests and pushes. It also corrects ordering after direct writes to
`main`, including automated backfills. This repair happens after the push;
publishers should run the sorter before committing to avoid a temporarily
misordered deployment. Archived year files are outside this check.

The Teable `Publish Website Changelog` automation (also used by the scheduled
publisher) sorts and validates its English and Chinese entries before creating
GitHub blobs. It embeds the functions from
`scripts/changelog_publisher_order.cjs`; keep that copy synchronized with this
tested source when updating the automation. Run its regression checks with
`node --test scripts/test_changelog_publisher_order.cjs`.

Push to origin main branch, the changes will be deployed to production automatically.

#### Troubleshooting

- Mintlify dev isn't running - Run `mintlify install` it'll re-install dependencies.
- Page loads as a 404 - Make sure you are running in a folder with docs.json

### Changelog history and local preview

The main `*/changelog.mdx` pages contain recent releases. January–September 2026
entries live in `*/changelog-2026-MM.mdx`; annual 2024 and 2025 pages retain their
existing URLs. Monthly pages and their RSS feeds are reachable from the changelog
navigation and the history links at the end of the main page.

Use `##` for a release title and `###` for its subsections. The page title provides
the single H1. Preserve explicit heading IDs and adjacent legacy `<span id>`
aliases: Mintlify normalizes custom heading IDs differently from some historical
automatic IDs. The main page's `data-changelog-*` attributes route previously
shared hashes to the correct month. Keep those attributes after the last Update
so the publisher can prepend entries without moving the history footer.

Run `node --test scripts/test_changelog_navigation.cjs` and the publisher tests
when changing history navigation. RSS generation and hosted permanent redirects
need a deployed preview; the local CLI does not serve RSS feeds.

For this large multilingual repository, a reliable local preview command is:

```bash
ulimit -n 65536
NODE_OPTIONS=--max-old-space-size=8192 npx --yes mintlify dev --no-open
```

Restart the preview after a large batch of MDX edits before checking the rendered
pages, to avoid accumulating hot-reload memory during a full-site review.

Automated changelog writes are also checked with:

```bash
python3 scripts/changelog_maintenance.py --write
python3 scripts/changelog_maintenance.py
```

Maintenance keeps the newest published month at the main URL, moves older
entries into monthly history (or an existing annual page), and merges historical
republications by release date. It preserves old heading/date aliases, updates
history navigation and routing metadata, removes unsupported custom JSON-LD,
and gives new headings stable IDs. Messages for newly generated pages live in
`.github/changelog-locales.json`. Annual heading aliases are retained so future
backfills cannot renumber old automatic IDs.

Publishers should run maintenance before committing. The existing main-branch
repair workflow also runs it after direct automated writes, using the same
retry behavior as date-order repairs. PR checks have read-only permissions.

Date-based publishers must use one Update per date. If historical data has
multiple entries on the same date, maintenance preserves their order when
untouched and rejects ambiguous republications. Currently combine the intended content into one Update. Supporting separate
entries on the same date requires a future publisher identity format. This
prevents both silent content loss and duplicate date IDs generated by Mintlify.
