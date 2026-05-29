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
  `space`, `sso`, `authority-matrix`, `get-id`, `sql-query`, or `activate`.
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

Push to origin main branch, the changes will be deployed to production automatically.

#### Troubleshooting

- Mintlify dev isn't running - Run `mintlify install` it'll re-install dependencies.
- Page loads as a 404 - Make sure you are running in a folder with docs.json
