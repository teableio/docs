#!/usr/bin/env node
// Dependency-free, post-deployment IndexNow submission for public websites.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w:-]+)=(?:"([^"]*)"|'([^']*)')/g)].map(([, k, double, single]) => [k.toLowerCase(), decode(double ?? single)]));
const hash = (s) => createHash('sha256').update(s).digest('hex');
const normalize = (s) => s.replace(/\s+/g, ' ').trim();
const state = '.indexnow-state';

export function publicUrl(value, origin) {
  const u = new URL(value);
  assert.equal(u.origin, origin, 'URL must belong to the configured canonical origin');
  assert.ok(!u.username && !u.password && !u.search && !u.hash, 'No credentials, query strings or fragments');
  assert.ok(!/^\/(?:[a-z]{2,3}(?:-[a-zA-Z]+)?\/)?(?:api|admin|settings|dashboard|sign-in|sign-up|login|register|account|auth)(?:\/|$)/i.test(u.pathname), 'Private/application path excluded');
  return u.href;
}

export function digestHtml(html, url) {
  const meta = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([s]) => attrs(s));
  if (meta.some((m) => /^(robots|bingbot|googlebot)$/i.test(m.name || '') && /noindex/i.test(m.content || ''))) return null;
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(([s]) => attrs(s));
  const canonical = links.find((l) => l.rel === 'canonical')?.href;
  if (canonical && new URL(canonical, url).href.replace(/\/$/, '') !== url.replace(/\/$/, '')) return null;
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1];
  assert.ok(main, `Missing HTML body: ${url}`);
  const text = normalize(main.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, (tag) => {
      const a = attrs(tag);
      const fields = ['href', 'src', 'alt', 'title', 'poster'].filter((k) => a[k]).map((k) => [k, a[k]]);
      return fields.length ? ' ' + JSON.stringify(fields) + ' ' : ' ';
    }));
  const schemas = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(([, s]) => JSON.parse(s));
  return hash(JSON.stringify({ title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1], text,
    meta: meta.filter((m) => m.name === 'description' || m.property?.startsWith('og:')).map((m) => [m.name || m.property, m.content]).sort(),
    alternates: links.filter((l) => l.hreflang).map((l) => [l.hreflang, l.href]).sort(), schemas }));
}

export function difference(current, previous) {
  assert.equal(current.version, 1);
  assert.ok(Object.keys(current.pages).length, 'Refusing to advance an empty snapshot');
  if (previous) {
    assert.equal(previous.version, 1);
    assert.equal(previous.origin, current.origin, 'Baseline origin mismatch');
    assert.ok(Object.keys(previous.pages).length, 'Invalid empty baseline');
  }
  return [...new Set([...Object.keys(current.pages), ...Object.keys(previous?.pages || {})])]
    .filter((u) => current.pages[u] !== previous?.pages[u]).sort();
}

async function save(path, data) {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, JSON.stringify(data, null, 2) + '\n');
}

async function get(url, request = fetch) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await request(url, { redirect: 'manual', headers: { 'User-Agent': 'IndexNow-site-publisher/1.0', 'Accept-Language': 'en' }, signal: AbortSignal.timeout(45000) });
      if ((r.status === 429 || r.status >= 500) && attempt < 3) { await sleep(2000 * (attempt + 1)); continue; }
      return r;
    } catch (e) { if (attempt === 3) throw e; await sleep(2000 * (attempt + 1)); }
  }
}

export async function collectSitemap(config, request = fetch) {
  const queue = [...(config.sitemaps || [`${config.origin}/sitemap.xml`])], visited = new Set(), urls = new Set();
  while (queue.length) {
    const url = publicUrl(queue.shift(), config.origin);
    if (visited.has(url)) continue;
    assert.ok(visited.size < 100, 'Sitemap index limit exceeded; do not truncate and infer deletions');
    visited.add(url);
    const r = await get(url, request);
    assert.equal(r.status, 200, `Sitemap fetch failed: ${url}`);
    const xml = await r.text();
    assert.match(xml, /<(?:urlset|sitemapindex)\b/, 'Expected XML sitemap');
    const locations = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map(([, s]) => decode(s));
    if (/<sitemapindex\b/.test(xml)) queue.push(...locations);
    else for (const value of locations) {
      try { urls.add(publicUrl(value, config.origin)); } catch { console.log(`Excluded off-site/private/noncanonical URL: ${value}`); }
    }
    assert.ok(urls.size <= 50000, 'URL limit exceeded; refusing incomplete snapshot');
  }
  assert.ok(urls.size, 'No public URLs found');
  return [...urls].sort();
}

export async function snapshot(config, request = fetch) {
  const urls = await collectSitemap(config, request), pages = {}, excluded = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const r = await get(url, request);
      // A stale sitemap's redirect/deleted page still needs a change signal.
      if ([301, 302, 307, 308, 404, 410].includes(r.status)) { pages[url] = hash(`status:${r.status}:${r.headers.get('location') || ''}`); continue; }
      assert.equal(r.status, 200, `Public page fetch failed: ${url}`);
      if (/noindex/i.test(r.headers.get('x-robots-tag') || '')) { excluded.push(url); continue; }
      assert.match(r.headers.get('content-type') || '', /text\/html/i, `Expected HTML: ${url}`);
      const digest = digestHtml(await r.text(), url);
      if (digest) pages[url] = digest; else excluded.push(url);
      await sleep(100);
    }
  }));
  assert.ok(Object.keys(pages).length, 'Refusing an empty/noindex-only snapshot');
  return { version: 1, origin: config.origin, pages: Object.fromEntries(Object.entries(pages).sort()), excluded };
}

export async function postUrls(config, input, { request = fetch, wait = sleep } = {}) {
  const urls = [...new Set(input.map((u) => publicUrl(u, config.origin)))], receipts = [];
  for (let i = 0; i < urls.length; i += 10000) {
    const batch = urls.slice(i, i + 10000);
    for (let attempt = 0; ; attempt++) {
      let r;
      try {
        r = await request(config.endpoint || 'https://www.bing.com/indexnow', { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(45000),
          headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: new URL(config.origin).host, key: config.key, keyLocation: config.keyLocation || `${config.origin}/${config.key}.txt`, urlList: batch }) });
      } catch (e) { if (attempt === 3) throw e; await wait([5000, 15000, 45000][attempt]); continue; }
      if ([200, 202].includes(r.status)) { receipts.push({ count: batch.length, status: r.status }); console.log(`IndexNow: ${batch.length} URLs received; HTTP ${r.status}`); break; }
      // A newly published, independently verified key can take time to reach
      // the engine. Bound 403 retries as well; never silently accept a failure.
      assert.ok([403, 429].includes(r.status) || r.status >= 500, `IndexNow rejected HTTP ${r.status}`);
      assert.ok(attempt < 3, `IndexNow retries exhausted, HTTP ${r.status}`);
      const retryAfter = Number(r.headers.get('retry-after'));
      await wait(Math.max([5000, 15000, 45000][attempt], Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 60000) : 0));
    }
  }
  return receipts;
}

export async function guard(config, env = process.env, request = fetch) {
  assert.ok(env.GITHUB_REPOSITORY && env.GH_TOKEN, 'GitHub CI context required');
  const branch = config.branch || 'main';
  const event = JSON.parse(await fs.readFile(env.GITHUB_EVENT_PATH, 'utf8'));
  const api = async (path) => {
    const r = await request(`https://api.github.com/repos/${env.GITHUB_REPOSITORY}/${path}`, { headers: { Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(30000) });
    assert.equal(r.status, 200, 'Unable to verify deployed revision'); return r.json();
  };
  const head = (await api(`commits/${encodeURIComponent(branch)}`)).sha;
  const deployment = config.deployment;
  let revision;
  if (env.GITHUB_EVENT_NAME === 'deployment_status') {
    if (deployment.kind !== 'deployment_status' || event.deployment_status?.state !== 'success' || event.deployment?.creator?.login !== deployment.creator || event.deployment?.environment?.toLowerCase() !== deployment.environment.toLowerCase()) return null;
    if (deployment.environmentUrl && event.deployment_status.environment_url !== deployment.environmentUrl) return null;
    revision = event.deployment.sha;
  } else if (env.GITHUB_EVENT_NAME === 'check_run') {
    if (deployment.kind !== 'check_run' || event.check_run?.conclusion !== 'success' || event.check_run?.app?.slug !== deployment.app || event.check_run?.name !== deployment.name) return null;
    revision = event.check_run.head_sha;
  } else if (env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    assert.equal(env.GITHUB_REF, `refs/heads/${branch}`, 'Manual submission is main-only');
    revision = env.GITHUB_SHA;
    if (deployment.kind === 'deployment_status') {
      const deployments = await api(`deployments?sha=${encodeURIComponent(revision)}&per_page=100`);
      const matching = deployments.find((d) => d.creator?.login === deployment.creator && d.environment.toLowerCase() === deployment.environment.toLowerCase());
      assert.ok(matching, 'No matching production deployment for manual recovery');
      const latest = (await api(`deployments/${matching.id}/statuses?per_page=1`))[0];
      assert.equal(latest?.state, 'success', 'Production deployment has not succeeded');
      if (deployment.environmentUrl) assert.equal(latest.environment_url, deployment.environmentUrl);
    } else {
      const checks = await api(`commits/${encodeURIComponent(revision)}/check-runs?per_page=100`);
      assert.ok(checks.check_runs.some((c) => c.app?.slug === deployment.app && c.name === deployment.name && c.conclusion === 'success'), 'Production build/deploy check has not succeeded');
    }
  } else throw new Error('Unsupported submission trigger');
  if (revision !== head) return null;
  return revision;
}

async function main() {
  const config = JSON.parse(await fs.readFile('.indexnow/config.json', 'utf8'));
  assert.equal(new URL(config.origin).origin, config.origin, 'Use the final HTTPS canonical origin without a trailing slash');
  assert.match(config.origin, /^https:\/\//);
  assert.match(config.key, /^[a-zA-Z0-9-]{8,128}$/);
  const command = process.argv[2];
  if (command === 'guard') {
    const revision = await guard(config);
    await fs.appendFile(process.env.GITHUB_OUTPUT, `ready=${Boolean(revision)}\nrevision=${revision || ''}\n`);
    console.log(revision ? `Verified production event for ${revision}` : 'Unrelated or superseded deployment; skipped');
    return;
  }
  const keyLocation = config.keyLocation || `${config.origin}/${config.key}.txt`;
  publicUrl(keyLocation, config.origin);
  const key = await get(keyLocation);
  assert.equal(key.status, 200, 'Public key must return HTTP 200 without redirects');
  assert.equal((await key.text()).trim(), config.key, 'Key file content mismatch');
  if (command === 'verify') { console.log('Public IndexNow key verified'); return; }
  if (command === 'snapshot') { const current = await snapshot(config); await save(`${state}/current.json`, current); console.log(`${Object.keys(current.pages).length} public pages fingerprinted`); return; }
  assert.equal(command, 'submit', 'Usage: indexnow.mjs guard|verify|snapshot|submit');
  const revision = await guard(config);
  assert.ok(revision && revision === process.env.INDEXNOW_REVISION, 'Verified production event/revision required');
  const current = await snapshot(config);
  const baseline = `${state}/baseline/manifest.json`;
  const previous = existsSync(baseline) ? JSON.parse(await fs.readFile(baseline, 'utf8')) : undefined;
  const urls = difference(current, previous);
  console.log(`IndexNow: ${Object.keys(current.pages).length} pages; ${urls.length} changed/new/removed URLs`);
  assert.equal(await guard(config), revision, 'Production changed during snapshot; retry using the newer deployment');
  const receipts = await postUrls(config, urls);
  // Advance state only after every batch has been received.
  await save(`${state}/accepted/manifest.json`, current);
  await save(`${state}/accepted/receipt.json`, { origin: config.origin, revision, timestamp: new Date().toISOString(), urls, receipts });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
