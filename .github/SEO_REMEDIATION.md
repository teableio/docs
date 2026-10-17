# Docs SEO remediation

Branch: `codex/docs-seo-remediation`. Baseline: `63203ad`.
Source audit: `../Research/docs-seo-audit-2026-10-17.md`.

Each numbered item is a separate fix and commit. Before committing, run its
checks against the running local Mintlify preview, request an independent
subagent review, and resolve actionable findings. Record newly discovered
issues below; small related issues belong in the current fix, independent
issues become additional numbered items. Production-only checks remain explicit.

| ID | Fix | Acceptance | Status |
| --- | --- | --- | --- |
| 01 | Repair active-document anchors | All active anchors resolve in local HTML; Mintlify active-file link check passes | Pending |
| 02 | Disambiguate duplicate page titles in every locale | Unique, accurate source titles and matching local title/H1 | Pending |
| 03 | Add missing localized descriptions | Every current MDX page has a specific description; local metadata matches | Pending |
| 04 | Repair archive resources and indexing | Missing images restored using existing assets; superseded archive pages excluded from indexing | Pending |
| 05 | Reconcile navigation and language counterparts | Useful hidden docs reachable in navigation; retired pages have an explicit disposition | Pending |
| 06 | Bound changelog size and heading depth | Recent updates stay at existing URL; history is accessible; old hashes resolve; publisher/order checks pass | Pending |
| 07 | Repair video structured data | No empty JSON-LD; video data is valid and matches visible media | Pending |
| 08 | Add localized documentation homepages | Indexable hub for every locale with working Docs/API/Deployment/Changelog paths | Pending |
| 09 | Configure docs analytics | Verified measurement ID, supported Mintlify integration, local preview avoids production collection | Pending |
| 10 | Add release regression checks | CI validates links, metadata, navigation, archive policy and changelog structure | Pending |

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
