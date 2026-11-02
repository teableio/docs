import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { publicUrl, digestHtml, difference, collectSitemap, postUrls, guard } from './indexnow.mjs';

const origin = 'https://example.com';
const config = { origin, key: 'a'.repeat(32), deployment: { kind: 'deployment_status', creator: 'vercel[bot]', environment: 'Production' } };
const html = (body = 'Hello') => `<html><head><title>Page</title><meta name="description" content="Description"/><link rel="canonical" href="${origin}/page"/></head><body><main class="old">${body}</main><script src="/build-1.js"></script></body></html>`;
const manifest = (pages) => ({ version: 1, origin, pages });

test('public URL validation rejects foreign hosts, credentials, tracking and application paths', () => {
  assert.equal(publicUrl(origin + '/zh/blog/post', origin), origin + '/zh/blog/post');
  assert.equal(publicUrl(origin + '/en/basic/admin-panel/settings', origin), origin + '/en/basic/admin-panel/settings');
  assert.equal(publicUrl(origin + '/en/api-reference/admin/list', origin), origin + '/en/api-reference/admin/list');
  for (const u of ['https://evil.example/', 'https://user@example.com/', origin + '/?utm_source=x', origin + '/#a', origin + '/zh/admin/users', origin + '/api/data']) assert.throws(() => publicUrl(u, origin));
});

test('body/metadata/media changes count; repeated build IDs, style and hydration do not', () => {
  const a = html('<h1 id="react1">Hello</h1>');
  assert.equal(digestHtml(a, origin + '/page'), digestHtml(a.replace('react1', 'react2').replace('class="old"', 'class="new"').replace('build-1', 'build-2').replace('</main>', '<script>self.__next_f=[]</script></main>'), origin + '/page'));
  assert.notEqual(digestHtml(html(), origin + '/page'), digestHtml(html('Changed'), origin + '/page'));
  assert.equal(digestHtml(html().replace('Description', 'Description"/><meta name="robots" content="noindex'), origin + '/page'), null);
  assert.equal(digestHtml(html(), origin + '/other'), null);
});

test('diff includes added, changed and removed URLs and refuses empty/cross-site state', () => {
  assert.deepEqual(difference(manifest({ a: '1', b: '2' }), manifest({ a: '0', c: '3' })), ['a', 'b', 'c']);
  assert.deepEqual(difference(manifest({ a: '1' }), manifest({ a: '1' })), []);
  assert.throws(() => difference(manifest({}), undefined));
  assert.throws(() => difference(manifest({ a: '1' }), { ...manifest({ a: '1' }), origin: 'https://other.example' }));
});

test('sitemap indexes recurse, deduplicate and exclude private/offsite entries', async () => {
  const pages = new Map([
    [origin + '/sitemap.xml', `<sitemapindex><sitemap><loc>${origin}/a.xml</loc></sitemap></sitemapindex>`],
    [origin + '/a.xml', `<urlset><url><loc>${origin}/page</loc></url><url><loc>${origin}/page</loc></url><url><loc>${origin}/admin</loc></url><url><loc>https://other.example/</loc></url></urlset>`],
  ]);
  assert.deepEqual(await collectSitemap(config, async (u) => new Response(pages.get(u))), [origin + '/page']);
  await assert.rejects(collectSitemap(config, async () => new Response('<html>Login</html>')), /XML/);
});

test('batching, deduplication and accepted statuses; failures retry boundedly', async () => {
  const calls = [];
  await postUrls(config, Array.from({ length: 10001 }, (_, i) => `${origin}/page${i}`), { request: async (_, o) => {
    const p = JSON.parse(o.body); calls.push(p.urlList.length); assert.equal(p.host, 'example.com'); return new Response(null, { status: calls.length === 1 ? 202 : 200 });
  } });
  assert.deepEqual(calls, [10000, 1]);
  let attempts = 0; const waits = [];
  await postUrls(config, [origin + '/page'], { request: async () => new Response(null, { status: ++attempts === 1 ? 403 : 200 }), wait: async (n) => waits.push(n) });
  assert.deepEqual(waits, [5000]);
  await assert.rejects(postUrls(config, [origin + '/page'], { request: async () => new Response(null, { status: 403 }), wait: async () => {} }), /exhausted/);
  await assert.rejects(postUrls(config, [origin + '/page'], { request: async () => new Response(null, { status: 422 }) }), /422/);
  await postUrls(config, [], { request: async () => { throw Error('Unexpected POST'); } });
});

test('deployment guard rejects preview, wrong provider and superseded revisions', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'indexnow-guard-'));
  const file = path.join(dir, 'event.json');
  const event = { deployment_status: { state: 'success' }, deployment: { environment: 'Production', creator: { login: 'vercel[bot]' }, sha: 'current' } };
  const env = { GITHUB_REPOSITORY: 'owner/repo', GH_TOKEN: 'test-token', GITHUB_EVENT_PATH: file, GITHUB_EVENT_NAME: 'deployment_status' };
  const request = async () => Response.json({ sha: 'current' });
  await fs.writeFile(file, JSON.stringify(event));
  assert.equal(await guard(config, env, request), 'current');
  for (const deployment of [{ ...event.deployment, environment: 'Preview' }, { ...event.deployment, creator: { login: 'zeabur[bot]' } }, { ...event.deployment, sha: 'old' }]) {
    await fs.writeFile(file, JSON.stringify({ ...event, deployment })); assert.equal(await guard(config, env, request), null);
  }
  const manual = { ...env, GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_REF: 'refs/heads/main', GITHUB_SHA: 'current' };
  const manualRequest = (success) => async (u) => {
    if (u.includes('/statuses?')) return Response.json([{ state: success ? 'success' : 'pending' }]);
    if (u.includes('/deployments?')) return Response.json([{ id: 1, creator: { login: 'vercel[bot]' }, environment: 'Production' }]);
    return Response.json({ sha: 'current' });
  };
  await assert.rejects(guard(config, manual, manualRequest(false)), /not succeeded/);
  assert.equal(await guard(config, manual, manualRequest(true)), 'current');
  await fs.rm(dir, { recursive: true });
});
