# Agent Notes

## Help Center Screenshot Processing

Use the local Teable screenshot skill for docs screenshot work:

```bash
python3 /Users/leo/.agents/skills/teable-doc-screenshots/scripts/stage_image.py \
  --input /tmp/clean.png \
  --output images/staged-field-preview/2026-05-11-topic.png \
  --padding-y 24 \
  --auto-fit-width
```

Final screenshot PNGs in the docs repo should be baked assets, not raw captures.

- Keep raw screenshots and experiment outputs in `/tmp` or an ignored scratch directory.
- Commit only final PNGs that are referenced by Markdown or MDX.
- Use one standard canvas for normal docs images: `1600px` wide.
- Normal output uses `padding-x=48` and `padding-y=24`.
- `--auto-fit-width` may reduce horizontal padding to `24px` and upscale modestly when all of these are true:
  - source width is at least `1200px`
  - aspect ratio is between `1.35` and `2.6`
  - ordinary rendered width would be below `1472px`
  - required scale is at most `1.3`
  - final height is at most `1000px`
- Very wide local UI strips should not be fit-width; leave them at normal size.
- Do not use legacy `wide`, `panel`, `small`, or `tall` presets for normal docs images.
- Dotted background, screenshot corner radius, and screenshot shadow are baked into the PNG.
- Docs CSS owns only the outer image border and small radius.

In MDX, prefer:

```mdx
<img
  src="/images/staged-field-preview/2026-05-11-topic.png"
  alt="Describe the UI state"
  className="docs-screenshot"
/>
```

Avoid random per-image widths such as `50%`, `65%`, or `100%`, and avoid
`docs-screenshot-full`, `docs-screenshot-panel`, `docs-screenshot-sm`, and
`docs-screenshot-tall`.

Before committing screenshot batches, verify that every staged screenshot is
referenced and no experiment image is included:

```bash
python3 - <<'PY'
import re, subprocess
from pathlib import Path

refs = set()
for root in ("en", "zh"):
    for path in Path(root).rglob("*"):
        if path.suffix.lower() in {".md", ".mdx"}:
            refs.update(r.lstrip("/") for r in re.findall(r"/images/staged-[^\s)\"']+\.png", path.read_text(errors="ignore")))

staged = subprocess.check_output(["git", "diff", "--cached", "--name-only"], text=True).splitlines()
images = {path for path in staged if path.startswith("images/staged-") and path.endswith(".png")}

print("extra staged images", sorted(images - refs))
print("missing staged image refs", sorted(refs - images))
PY
```
