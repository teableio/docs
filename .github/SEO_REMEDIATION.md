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
| 08 | Add localized documentation homepages | Indexable hub for every locale with working Docs/API/Deployment/Changelog paths | Complete locally |
| 09 | Configure docs analytics | Verified measurement ID, supported Mintlify integration, local preview avoids production collection | Waiting for dedicated stream ID |
| 10 | Add release regression checks | CI validates links, metadata, navigation, archive policy and changelog structure | Pending |
| 11 | Maintain changelog publishing conventions | New automated releases keep H2 headings, monthly bounds and history footer; backfill/republication remain safe | Complete locally |
| 12 | Make Card destinations crawlable | Current documentation cards expose real anchors without losing existing navigation behavior | Complete locally |
| 13 | Verify invalid historical release dates | Correct July 31 and July 24, 2024 labels using authoritative evidence and preserve historical hashes | Complete |
| 14 | Correct Gmail guide heading hierarchy | Each localized guide has one page H1 and preserves all existing section hashes | Complete |

| 15 | Update Gmail setup instructions | Current Google account prerequisites and app-password steps in all locales; legacy hashes retained | Complete |

| 16 | Correct archive AI guide headings | Two retained guides have one H1, retain old hashes and remain noindex | Complete |

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

- New issue found during fix 08: Mintlify Card href renders as div/role=link without an anchor in both local and production HTML (confirmed on English AI overview). Homepages now have explicit anchor links; audit and repair remaining current cards in item 12.
- GA4 investigation: existing shared stream `7563554072` in property `428837143` has enhanced browser-history pageviews enabled. Mintlify’s native integration calls gtag config on route changes. Reusing the shared stream risks duplicate pageviews; changing its global settings could affect the main site/app. Requested a dedicated docs Measurement ID because the connected MCP cannot create streams.

### 08 — Localized documentation homepages

- Added 11 locale index pages with localized introductory metadata, four primary documentation sections and six popular guides; added each as the first Docs navigation group. Card descriptions reuse existing localized page metadata.
- Root language selection now lands on the selected `/locale` homepage; malformed locale-cookie encoding falls back safely. Two router tests cover all languages, preference precedence, query/hash preservation and content routes.
- Restarted local preview: all 11 `/locale` URLs return HTTP 200 directly, each has its localized title, description, one H1 and indexable robots. All 110 destination links return 200. Core Card destinations are explicit rendered anchors.
- Full link check and independent subagent review passed. Production canonical/hreflang and sitemap remain deployment checks.

- New issue found while extending publisher checks: all 11 annual 2024 changelogs contain June 31, 2024, an impossible date. Item 13 requires source verification; do not guess June 30 or July 31.

### 12 — Crawlable Card links

- Confirmed both local and production Mintlify Card href outputs div/role=link without an anchor. Replaced 474 current cards across 121 MDX files with native anchor wrappers, retaining full-card navigation, original destinations, titles, icons and descriptions. External links use noopener/noreferrer.
- No card bodies contain interactive descendants; removed Card href props to avoid nested interaction. Added focused CSS for hover, focus and full-card appearance. Homepage cards now use the same native-link pattern.
- Restarted local preview and verified every one of the 474 wrappers across all 121 pages: exact href, expected Card child, no nested interactive elements. Mintlify build validation passed.
- Independent review compared all source transformations and sampled rendered AI, SSO, security and homepage HTML; passed with no findings.

### 13 — Historical release dates

- GitHub Releases API confirms view embedding in v1.3.1 (2024-07-31T02:17:49Z) and unique/nonempty constraints plus API query builder in v1.3.0-beta.0 (2024-07-24T05:11:04Z). Corrected the two June labels in all 11 locales; content is unchanged. Evidence URLs and every old/new label are recorded in `changelog-date-corrections.json`.
- Preserved 22 old date hashes with aliases. Restarted local preview and checked both new labels and all old anchors on every locale’s 2024 page; all 2024 dates now parse and remain correctly ordered.
- Independent subagent review re-fetched the two authoritative releases and checked translated labels, unchanged content and rendered old/new IDs; passed.

- Full source heading scan for item 10 found one remaining duplicate H1 pattern outside changelogs: the Gmail IMAP guide in all 11 locales. Track its heading hierarchy and hash preservation in item 14.

### 11 — Publishing maintenance

- Added maintenance for direct automated writes: H2/subsection normalization, unsupported JSON-LD cleanup, stable new heading IDs, latest-month bounds, monthly history/navigation/footer updates and historical republication into existing monthly/annual pages. Locale messages are centralized in `changelog-locales.json`.
- Existing main-branch repair workflow runs maintenance with its existing retry model; PR checks remain read-only. Publishers can run the same command before committing.
- Stabilized 969 annual heading IDs with safe IDs and raw aliases so backfills cannot renumber previously shared hashes. Restarted preview and verified all 969 aliases across 22 rendered annual pages.
- Independent review caught nested-fence/code-example corruption, cross-entry ID collisions and ambiguous same-day replacement. Fixed all three, with 17 Python and 12 Node regression tests passing. True code examples remain unchanged; ambiguous same-day updates fail before any files are written and must be combined into one Update.
- Final review passed, including independent test execution and rendered anchor samples. Live workflow execution is a deployment follow-up.

### 14 — Gmail heading hierarchy

- Demoted the five body headings in each of the 11 localized Gmail IMAP guides by one level; page metadata provides the single H1.
- Restarted local preview and checked all 11 guides: one H1 each and all 55 previously published section hashes retained.
- Independent subagent review passed: source changes are limited to heading levels; rendered English, Chinese and French samples also retain all old hashes.
- New content issue: the guides still ask users to enable personal Gmail IMAP, an option Google removed in January 2025. Current account prerequisites and application-password instructions are tracked separately in item 15.

### 15 — Current Gmail setup instructions

- Replaced obsolete personal Gmail IMAP-toggle steps and app/device dropdown instructions in all 11 locales. Google confirms IMAP is always enabled for personal Gmail; managed accounts need administrator-approved access and app-password availability.
- Linked current Google account entry points, documented two-step verification prerequisites and password revocation, and removed three screenshots of previous settings screens. Evidence and legacy IDs are recorded in `gmail-setup-evidence.json`.
- Restarted local preview: all 11 pages have one H1, five appropriately nested sections and all 55 old hashes. Independent review rechecked Google’s primary documentation, translations and rendered English/Chinese/Japanese samples; passed.

### 16 — Archive AI guide headings

- The rendered regression scan discovered duplicate H1s in the English and Chinese historical AI field practical guides. Demoted their 19 body headings by one level; text, images, historical notices and noindex remain unchanged.
- Local preview checks and independent review passed for both pages: one H1, all 19 previously published section IDs and noindex retained.
