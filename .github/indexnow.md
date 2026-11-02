# IndexNow

After the latest main revision is successfully published by Mintlify to
`https://help.teable.ai`, the IndexNow workflow submits new, changed and removed
public sitemap URLs to Bing. It verifies the Mintlify identity, deployment
environment, exact production domain and current revision. Preview deployments
do not submit. Manual recovery also requires a successful production deployment
for the same main revision.

The ownership file is a root-level YAML scalar whose entire UTF-8 contents are
the key. YAML is a supported Mintlify static file type on all plans; the exact
same-host keyLocation is explicitly sent to IndexNow. The published file must
return 200 without redirects and match the key before any submission.

Body/metadata/media/schema fingerprints are compared with the last successfully
accepted manifest. Public documentation paths containing `admin`, `api-reference`
or `settings` are preserved; real root-level application paths, noindex pages,
foreign canonicals and tracking URLs are excluded. The first run initializes
the sitemap baseline; future runs submit changes. Every batch is at most 10,000
URLs, and transient errors retry with bounded backoff.

The first run submits the canonical sitemap once and saves the accepted baseline;
subsequent runs submit only changes. The `indexnow-production-state` Actions artifact stores the accepted manifest
and receipt for 90 days. Failed batches never replace the previous baseline.
HTTP 200 confirms receipt; 202 confirms receipt with key validation pending.
Neither guarantees crawling or indexing.

```sh
node --test scripts/indexnow.test.mjs
node scripts/indexnow.mjs verify    # read-only production key check
node scripts/indexnow.mjs snapshot  # read-only production content snapshot
```

Protocol: https://www.indexnow.org/documentation
Mintlify static files: https://www.mintlify.com/docs/create/files
