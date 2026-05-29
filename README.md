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

Images are shared repo assets. Keep paths boring. Keep names searchable. Keep
rendering predictable.

#### Folder Rules

- Use `images/{top-level-group}/{topic}/`.
- Top-level groups: `docs`, `selfhosted`, `api`, `security`, `changelog`.
- `docs` means Help Center Docs tab. Do not flatten `images/docs/{topic}/` into
  `images/{topic}/`.
- `{topic}` means real subject folder: `ai`, `base`, `space`, `sso`,
  `authority-matrix`, `get-id`, `sql-query`, `activate`, etc.
- No new screenshots in `images/` root.
- No random staging folders in committed image tree.
- Unused images go to `images/orphans/YYYY-MM-DD/...`. Do not delete first.
- Docs pages must not reference `images/orphans/...`.

#### Naming

Use this shape:

```text
images/{top-level-group}/{topic}/YYYY-MM-DD-page-slug-purpose.png
images/{top-level-group}/{topic}/YYYY-MM-DD-page-slug-purpose.webp
images/{top-level-group}/{topic}/YYYY-MM-DD-page-slug-purpose-zh.png
```

- Date = day asset enters docs repo.
- Page slug = doc page or feature area.
- Purpose = visible UI/action, not `image1`, not random hash.
- Use `.png` for static UI screenshots.
- Use `.webp` for baked animations.
- English-only screenshot = shared asset. No `-en`.
- Chinese-specific screenshot = add `-zh`.

#### Screenshot Format

- Static UI screenshot -> baked PNG card.
- Animated UI capture -> baked WebP card.
- Raw screenshots stay outside repo, for example `/tmp/teable-doc-screenshot-inbox/`.
- Commit final baked assets only.
- Logos, icons, external buttons, videos, historical changelog media: do not
  force into screenshot card style.

#### MDX Usage

Use explicit `<img>` for docs screenshots:

```mdx
<img
  src="/images/docs/ai/YYYY-MM-DD-page-slug-purpose.png"
  alt="AI Chat context selector"
  className="docs-screenshot"
/>
```

- Use `className="docs-screenshot"` for new baked PNG/WebP screenshots under
  `images/docs/`, `images/api/`, `images/selfhosted/`, and `images/security/`.
- Alt must be non-empty.
- Alt describes visible UI/action. Not `screenshot`. Not file name.
- Avoid `![](...)` for new docs screenshots.
- Avoid `width="400"`, percentage widths, and one-off image sizing.
- Changelog images keep historical display. Add useful alt when context exists.
  Do not add `docs-screenshot` blindly.

#### Before Commit

Run checks that match image work:

```bash
rg "/images/docs|/images/self-hosted|/images/geng-xin-ri-zhi|/images/ji-ben-gong-neng|/images/kai-fa-zhe|/images/staged-" en zh docs.json
git diff --check
mintlify validate
```

For bigger moves, also audit refs:

- no missing local image files
- no active unreferenced screenshots
- no docs page pointing to `images/orphans/...`

### Publishing Changes

Push to origin main branch, the changes will be deployed to production automatically.

#### Troubleshooting

- Mintlify dev isn't running - Run `mintlify install` it'll re-install dependencies.
- Page loads as a 404 - Make sure you are running in a folder with docs.json
