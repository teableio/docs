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
| 10 | Add release regression checks | CI validates links, metadata, navigation, archive policy and changelog structure | Complete locally |
| 11 | Maintain changelog publishing conventions | New automated releases keep H2 headings, monthly bounds and history footer; backfill/republication remain safe | Complete locally |
| 12 | Make Card destinations crawlable | Current documentation cards expose real anchors without losing existing navigation behavior | Complete locally |
| 13 | Verify invalid historical release dates | Correct July 31 and July 24, 2024 labels using authoritative evidence and preserve historical hashes | Complete |
| 14 | Correct Gmail guide heading hierarchy | Each localized guide has one page H1 and preserves all existing section hashes | Complete |
| 15 | Update Gmail setup instructions | Current Google account prerequisites and app-password steps in all locales; legacy hashes retained | Complete |
| 16 | Correct archive AI guide headings | Two retained guides have one H1, retain old hashes and remain noindex | Complete |
| 17 | Resolve Chinese Artifact FAQ ID collision | Section and accordion IDs are unique; old section hash and ARIA links remain valid | Complete |
| 18 | Integrate current production releases before deployment | Retain October 18–20 announcements, current layout and exact latest published hash-to-entry mappings; keep test fixtures independent | Complete locally |
| 19 | Preserve release dates in RSS | Every Update uses its label-derived RSS date; hosted feeds show historical publication dates | Complete locally |
| 20 | Run repair tests after source normalization | Automated raw releases can reach maintenance; normalized output is tested before any push | Complete locally |
| 21 | Match RSS links to rendered date anchors | All 132 feeds resolve to the correct Update; published Unicode IDs remain unchanged; future releases retain explicit IDs | Complete locally |

## Validation boundaries and discoveries

- Production verification on October 21 found Mintlify's RSS fallback transliterates
  date labels while HTML preserves Unicode. Across 132 feeds, 536 of 1,265 current
  feed links on 60 pages did not resolve to a rendered ID. Item 21 fixes the shared
  cause with explicit Update IDs, preserving all existing published date anchors.

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

### 09 — GA4 status confirmed

- Rechecked the repository and production HTML: the docs have no GA4 integration or Google measurement tag. The connected GA4 property `428837143`, filtered to exact hostname `help.teable.ai` over the last 90 days, returns no rows. This property currently provides no docs traffic data.
- Existing shared stream `7563554072` has browser-history pageviews enabled while Mintlify also sends route pageviews. A dedicated docs stream ID is still needed to configure collection without changing shared-site behavior. The connected API cannot create or list Web streams; no GA4 Admin settings have been changed.
- Item 09 remains open. Actual event receipt and route-pageview counts also require a deployed environment after configuration.

### 10 — SEO regression checks

- Added read-only source checks for all 1,840 current pages and 29 archive pages: localized metadata, title uniqueness, heading levels, native card markup, navigation/dispositions, indexability, retired redirects, release periods, RSS flags and historical aliases. Code examples remain excluded.
- Added an HTML checker with a full-site option. The final local run passed all 1,869 pages, including historical hashes, native Card destinations, robots policies, unique content IDs and retired-route destinations.
- Independent review found three meaningful gaps: accidental noindex on important pages, duplicate IDs and deletion of old route redirects. Added independent policies and regression tests for each; re-review passed. The HTML scan also found and led to separate fixes 16 and 17.
- All 24 Python tests and 12 Node tests passed; fixed-version Mintlify build validation and full anchor/redirect link checks passed with zero broken links. Workflow YAML parses and uses read-only permissions for checks.
- Added the `Docs SEO` CI workflow, dependency installation for the existing test workflow, reliable documented commands and ignored Python caches. Live CI execution and server-managed production checks remain release follow-ups.

### 17 — Artifact section and FAQ IDs

- The full rendered scan found one remaining duplicate content ID: the Chinese AI chat Artifact section and a sharing FAQ both rendered `artifact`. Gave the Accordion its own supported `artifact-sharing-faq` ID, retaining the existing section hash.
- Local HTTP checks and independent subagent review passed: content IDs are unique, `#artifact` remains the H2, and the FAQ’s aria-controls/aria-labelledby refer to the matching panel/title. The final full-site HTML check passed all 1,869 pages.

### 18 — Release integration with current production

- Merged the four newer main commits, retaining the October 18, 19 and 20 announcements and the latest MCP banners in all locales. The current-year content remains 126 releases per locale; independent review verified text/media conservation.
- Preserved main’s restored date layout and removed the retired floating date picker without removing historical routing or lazy video behavior. Maintenance tests now use controlled fixtures; publisher tests derive a future date from current content.
- Captured the latest production mappings for all 1,386 current-year Updates and 3,959 heading IDs. Reassigned safe IDs and aliases by the correct release, rebuilt monthly routing manifests, and retained older aliases where unambiguous. Current production mappings take precedence where repeated automatic titles had already shifted between releases.
- Source checks, 24 Python tests, 12 Node tests, Mintlify validation and link checks passed. Independent source review passed; after restarting the preview, main/English/Chinese/Arabic monthly samples match source and preserved hashes. Full published-ID and hosted checks continue as deployment gates.

### 20 — Repair workflow test ordering

- An isolated reproduction showed that raw automated releases fail the repository-idempotence test before the repair could run. Running maintenance first makes the same complete test suite pass.
- Moved repair-job tests after normalization and sorting, before staging/commit/push. Read-only check-job behavior, token permissions and the existing three-attempt retry model are unchanged.
- Local preview checks remain HTTP 200 with one H1; the isolated raw-publisher reproduction and independent workflow review passed. Failure in normalization or tests still stops the job before publishing.

### 19 — Explicit RSS release dates

- Added label-derived `rss.date` to all 1,540 Updates across 132 changelog pages, following Mintlify’s supported Update metadata. Removing the new RSS attribute reproduces the preceding release’s MDX byte-for-byte.
- Maintenance normalizes dates for existing historical pages and future automated entries; source checks reject date mismatches. Static custom RSS fields remain intact, code fences are protected, and unsafe expressions fail before any files are written.
- Independent review caught opening-tag truncation when RSS fields precede the label and contain `>`. Shared safe attribute parsing now handles sorting, normalization and historical replacement; a full integration regression covers this case and preserves old labels/hashes.
- Source checks, 31 Python tests and 12 Node tests passed; local main/month/year/Arabic pages render HTTP 200 with one H1 and no empty custom JSON-LD. Independent review passed. The hosted RSS pubDate comparison remains a release gate because local preview does not serve feeds.

### 21 — RSS fragment and HTML date ID consistency

- Hosted checks found 536 broken RSS fragments across 60 pages in seven languages. All 132 feeds otherwise retained valid XML, content and true release dates. Mintlify's implicit RSS slug transliterates labels while rendered date IDs preserve Unicode.
- Added explicit IDs equal to the existing published date IDs on all 1,540 Updates. Removing only these new attributes reproduces all 132 MDX files byte-for-byte. Maintenance applies the convention to future updates and retains the original localized date ID during historical republication; conflicting IDs fail safely.
- Added source regression checks and localized-date/republication tests. All 33 Python and 12 Node tests, source SEO checks, Mintlify 4.2.1059 build validation and full link/anchor/redirect checks passed.
- Independent subagent review exercised all 1,540 Updates through Mintlify's real AST, TOC and RSS pipelines: explicit RSS anchors match both rendered and original date IDs without changing existing routing. Local preview also preserves all 1,386 current-year date IDs and 3,959 heading IDs within their original Updates.
- Local RSS routes are unavailable in Mintlify dev; generated RSS items were checked through the actual installed RSS processor. Hosted feed-to-HTML verification remains the release gate.
