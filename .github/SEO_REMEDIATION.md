# Docs SEO remediation

Branch: `codex/docs-seo-remediation`. Baseline: `63203ad`.
Source audit: `../../Research/docs-seo-audit-2026-10-17.md`.

Each numbered item is a separate fix and commit. Before committing, run its
checks against the running local Mintlify preview, request an independent
subagent review, and resolve actionable findings. Record newly discovered
issues below; small related issues belong in the current fix, independent
issues become additional numbered items. Production-only checks remain explicit.

| ID | Fix | Acceptance | Status |
| --- | --- | --- | --- |
| 01 | Repair active-document anchors | All active anchors resolve in local HTML; Mintlify active-file link check passes | Complete |
| 02 | Disambiguate duplicate page titles in every locale | Unique, accurate source titles and matching local title/H1 | Complete |
| 03 | Add missing localized descriptions | Every current MDX page has a specific description; local metadata matches | Complete |
| 04 | Repair archive resources and indexing | Missing images restored using existing assets; superseded archive pages excluded from indexing | Complete locally |
| 05 | Reconcile navigation and language counterparts | Useful hidden docs reachable in navigation; retired pages have an explicit disposition | Complete locally |
| 06 | Bound changelog size and heading depth | Recent updates stay at existing URL; history is accessible; old hashes resolve; publisher/order checks pass | Complete locally |
| 07 | Repair video structured data | No empty JSON-LD; video data is valid and matches visible media | Complete locally |
| 08 | Add localized documentation homepages | Indexable hub for every locale with working Docs/API/Deployment/Changelog paths | Pending |
| 09 | Configure docs analytics | Verified measurement ID, supported Mintlify integration, local preview avoids production collection | Pending |
| 10 | Add release regression checks | CI validates links, metadata, navigation, archive policy and changelog structure | Pending |
| 11 | Maintain changelog publishing conventions | New automated releases keep H2 headings, monthly bounds and history footer; backfill/republication remain safe | Pending |

## Validation boundaries and discoveries

- This is a Mintlify content repository without `package.json`; the generic Node
  preflight's `package_json_missing` result does not prevent Mintlify preview.
- Local preview canonicals include Mintlify's `/src/_props/` development prefix
  and do not provide production hreflang. Production canonical/hreflang and GA4
  collection require a deployed-preview/production follow-up; do not claim local
  HTTP checks prove those server-managed signals.
- Baseline link check: 24 active anchor failures, 57 archive image failures.
- The initial audit's connection between navigation and hreflang is a working
  hypothesis. Check language pairing against Mintlify's supported configuration.
- Changelog changes must preserve RSS, date anchors, language routing, lazy video
  loading and existing automated publisher behavior.

## Review and verification log

Append the local checks, reviewer result and any remaining deployment checks for
each fix here before committing it.

### 01 — Active anchors

- Corrected all 24 failing links across 17 active files, preserving existing target IDs.
- Started Mintlify locally on port 3000; checked 32 links against 12 rendered target pages with no missing IDs.
- Mintlify full link check now reports only the 57 known archive image failures; active-file failures are zero.
- Independent subagent review passed: 24 changed links checked against 13 target pages, no actionable findings.

### 02 — Page titles

- Replaced ambiguous overview titles and distinguished instance administration, member fields, script authoring, AI script generation and API references across all 11 locales.
- Full source scan: no duplicate titles within a locale. Mintlify build validation passed.
- Restarted local preview; all 232 changed pages match their source title in rendered title/H1.
- Independent review identified terminology and translation issues; corrected them and passed re-review.
- New local-runtime issue: bulk hot reload exceeded Node’s default 4 GB heap and then the file-descriptor limit. Restarted with 8 GB heap and `ulimit -n 65536`; full HTTP verification passed. Keep this in the changelog-size investigation and document the reliable preview command.

### 03 — Localized descriptions

- Added 143 page-specific descriptions for changelogs, deployment, formula grammar, API references and Chinese conditional logic. All 1,741 current MDX pages now have nonempty descriptions.
- Restarted local preview and verified all 143 changed meta descriptions against source.
- Independent review found a Turkish FieldId terminology issue; corrected it and passed final review.
- Corrected an audit counting error found during archive investigation: sitemap has 20 historical `/archive/` pages, plus 77 current `*/api-reference/archive/*` endpoints. The earlier 97 figure mixed those categories; current API endpoints must remain indexable.

### 04 — Archive resources and indexing

- Retained 29 historical source pages for old links, all explicitly noindex; 20 previously lacked noindex. Added localized historical notes and related current guides, with a per-page disposition in `seo-archive-policy.json`.
- Repaired all 57 image references using their existing original assets. Current record archive API pages remain indexable and untouched.
- Restarted local preview: verified noindex and guide links on all 29 pages; all 57 image URLs return HTTP 200 with image content types. Full Mintlify anchor/redirect link check now passes with zero failures.
- Independent review caught an unrelated example mapping and ambiguous organization-to-instance relationships; corrected the example destination and labeled related guides explicitly. Final review passed.
- After deployment, confirm the 20 previously indexed historical URLs leave sitemap and expose noindex.

### 05 — Navigation and retired routes

- Added Docker and Nginx to their existing localized Self-hosted groups in all 11 languages. Added legacy Dashboard to Deprecated and applied noindex.
- Removed 11 retired space AI settings stubs and configured explicit permanent redirects to the same-language custom model guides.
- Documented the 34 intentionally hidden/noindex pages (enterprise organization features, consolidated migration guides and language router); none are accidental navigation omissions.
- Restarted local preview and checked all 11 locales: Docker/Nginx navigation and indexability, Dashboard navigation/noindex, retired route destinations and target HTTP 200. Local dev emits 307 even with `permanent: true`; verify hosted 308 after deployment, together with Docker/Nginx canonical and reciprocal hreflang.
- Full Mintlify link check passed. Independent subagent review passed with no actionable findings.

- New issue found during fix 06: automated publishers still generate H1 headings, and historical backfills currently target the main file. Track publishing normalization and rollover in item 11; static archive changes alone do not prevent recurrence.

### 06 — Changelog history and heading structure

- Split January–September 2026 into 99 localized monthly pages; the main URLs retain October’s seven entries and crawlable history links. Each locale retains all 123 original updates.
- Normalized release/subsection heading levels across current and historical changelogs and restored the visible page H1. Captured actual historical IDs before migration and retained them explicitly, including 228 raw span aliases for IDs Mintlify otherwise re-normalizes.
- Updated custom TOC, lazy video and date picker behavior for monthly/annual routes; labels come from locale MDX and refresh on SPA language changes. Old main-page hashes route to their original month.
- Restarted preview and checked 132 rendered pages: one H1 each, every historical ID exists, all history links present, and main HTML size reduced 88.0–89.2% (English 2,583,851 → 309,886 bytes).
- Mintlify build validation passed. Five Python order tests and ten Node navigation/publisher tests passed, including all published old hashes, SPA label changes and real-footer insertion/republication. Full link check passed.
- Independent review found re-normalized special-character IDs and a stale aria-label; both corrected and re-reviewed. Future publisher recurrence is item 11.
- RSS remains enabled on all changelogs. Local RSS endpoint is 404; verify feed contents on a deployed preview before merging.

### 07 — Empty video structured data

- Removed 407 unsupported custom VideoObject script blocks from 110 changelog files. Mintlify strips their dangerouslySetInnerHTML content; several also used the site-wide image instead of a video thumbnail. Removing invalid declarations preserves visible media without inventing missing metadata.
- Restarted local preview and checked all 132 changelog pages: no empty JSON-LD scripts remain (the local CLI emits no platform-generated JSON-LD); source video tags and every attribute are unchanged.
- Independent review verified that all non-script content is unchanged and no MDX custom VideoObject/dangerouslySetInnerHTML blocks remain. Review passed.
- After deployment, parse Mintlify’s platform-generated JSON-LD and confirm no empty scripts; publisher recurrence is covered by item 11.
