const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'help-link-tracking.js'), 'utf8');

function anchor(href, rel = 'noreferrer') {
  const attributes = { href, rel };
  return {
    get href() { return attributes.href; },
    getAttribute(name) { return attributes[name] ?? null; },
    setAttribute(name, value) { attributes[name] = value; },
    matches(selector) { return selector === 'a[href]'; },
    closest() { return this; },
    querySelectorAll() { return []; },
  };
}
function runtime(links = [], href = 'https://help.teable.ai/zh/basic/ai/overview') {
  const listeners = {};
  const observers = [];
  const events = [];
  const location = new URL(href);
  const document = {
    documentElement: {},
    querySelectorAll() { return links; },
    addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
  };
  const window = { location, addEventListener() {}, gtag(...args) { events.push(args); } };
  const context = vm.createContext({ window, document, URL, MutationObserver: class {
    constructor(callback) { observers.push(callback); }
    observe() {}
  } });
  vm.runInContext(source, context);
  return {
    window, links, listeners, observers, events,
    rerun() { vm.runInContext(source, context); },
    mutate(mutations) { observers.forEach(callback => callback(mutations)); },
    click(link, type = 'click', button = 0) {
      (listeners[type] || []).forEach(callback => callback({ target: link, type, button }));
    },
  };
}

test('trusted public official links retain security and other rel tokens', () => {
  for (const host of ['teable.ai', 'www.teable.ai', 'teable.cn', 'www.teable.cn']) {
    for (const segment of ['ai-app-builder', 'zh/compare/airtable', 'blog/example', 'customers/example']) {
      const link = anchor(`https://${host}/${segment}?utm_source=existing#section`, 'nofollow NoReferrer sponsored');
      runtime([link]);
      assert.equal(link.getAttribute('rel'), 'nofollow sponsored noopener');
      assert.match(link.href, /utm_source=existing&help_source=.*&help_host=help.teable.ai#section$/);
    }
  }
});
test('untrusted, private, credentialed and malformed destinations remain untouched', () => {
  for (const href of ['https://evil.example/products/ai', 'http://teable.ai/blog/example',
    'https://teable.ai:8443/blog/example', 'https://x@teable.ai/products/ai',
    'https://teable.ai.evil.example/blog/example', 'https://teable.ai/app/private',
    'https://teable.ai/blog/a%40b', 'https://teable.ai/customer/example', 'https://teable.ai/products/private', 'https://teable.ai/blog/a/b', 'javascript:alert(1)', 'mailto:x@teable.ai']) {
    const link = anchor(href);
    runtime([link]);
    assert.equal(link.getAttribute('rel'), 'noreferrer', href);
    assert.equal(link.href, href);
  }
});
test('late rendering and replaced attributes are repaired once without observer churn', () => {
  const state = runtime();
  const link = anchor('https://teable.ai/ai-app-builder');
  state.mutate([{ type: 'childList', addedNodes: [link] }]);
  assert.equal(link.getAttribute('rel'), 'noopener');
  link.setAttribute('rel', 'noreferrer noopener');
  state.mutate([{ type: 'attributes', target: link }]);
  assert.equal(link.getAttribute('rel'), 'noopener');
  let writes = 0;
  link.setAttribute = () => { writes++; };
  state.mutate([{ type: 'attributes', target: link }]);
  assert.equal(writes, 0);
  state.rerun();
  assert.equal(state.observers.length, 1);
  assert.equal(state.events.length, 0);
});

test('markers preserve original query encoding and hashes while replacing stale markers', () => {
  const link = anchor('https://teable.ai/ai-app-builder?utm_source=google&utm_medium=cpc&term=hello%20world&help_source=old&help_host=old&x=1#feature');
  const state = runtime([link], 'https://help.teable.cn/zh/basic/ai/overview?token=private#section');
  assert.equal(link.href, 'https://teable.ai/ai-app-builder?utm_source=google&utm_medium=cpc&term=hello%20world&x=1&help_source=%2Fzh%2Fbasic%2Fai%2Foverview&help_host=help.teable.cn#feature');
  assert.equal(state.events.length, 0);
  state.mutate([{ type: 'attributes', target: link }]);
  assert.equal(new URL(link.href).searchParams.getAll('help_source').length, 1);
});
test('only real primary and middle clicks emit bounded sanitized events to Help GA4', () => {
  const link = anchor('https://teable.ai/ai-app-builder?customer_email=private#part');
  const state = runtime([link], 'https://help.teable.cn/zh/basic/ai/overview?token=private#part');
  state.click(link);
  state.click(link, 'auxclick', 1);
  state.click(link, 'auxclick', 0);
  state.click(link, 'click', 1);
  state.click(link, 'auxclick', 2);
  assert.equal(state.events.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(state.events[0])), ['event', 'teable_help_link_click', {
    send_to: 'G-LQ8H9TEDRD', source_path: '/zh/basic/ai/overview', target_path: '/ai-app-builder',
    source_domain: 'help.teable.cn', link_category: 'product', locale: 'zh',
    page_location: 'https://help.teable.cn/zh/basic/ai/overview',
  }]);
  assert.ok(!JSON.stringify(state.events).includes('private'));
  state.rerun();
  state.click(link);
  assert.equal(state.events.length, 3);
});
test('private, internal, unsupported, overlong and local source routes never emit or add markers', () => {
  for (const path of ['/src/_props/zh/basic/ai/overview', '/zh/locale-router', '/app/private',
    '/zh/basic/a%40b', '/zh/basic/' + 'x'.repeat(100)]) {
    const link = anchor('https://teable.ai/ai-app-builder');
    const state = runtime([link], 'https://help.teable.ai' + path);
    state.click(link);
    assert.equal(state.events.length, 0, path);
    assert.equal(link.href, 'https://teable.ai/ai-app-builder');
  }
  const link = anchor('https://teable.ai/ai-app-builder');
  const state = runtime([link], 'http://localhost:3003/zh/basic/ai/overview');
  state.click(link);
  assert.equal(state.events.length, 0);
  assert.equal(link.href, 'https://teable.ai/ai-app-builder');
});
test('SPA navigation refreshes retained links and click context without page_view ownership', () => {
  const link = anchor('https://teable.ai/blog/guide');
  const state = runtime([link]);
  state.window.location = new URL('https://help.teable.ai/fr/basic/base');
  state.mutate([{ type: 'childList', addedNodes: [] }]);
  assert.equal(new URL(link.href).searchParams.get('help_source'), '/fr/basic/base');
  state.window.location = new URL('https://help.teable.ai/de/basic/base');
  state.click(link);
  assert.equal(state.events[0][2].source_path, '/de/basic/base');
  assert.equal(state.events[0][2].locale, 'de');
  assert.equal(state.events[0][2].link_category, 'blog');
  assert.equal(state.events.filter(event => event[1] === 'page_view').length, 0);
});
test('early clicks queue exactly one event and rendering alone queues none', () => {
  const link = anchor('https://teable.cn/zh/compare/airtable');
  const state = runtime([link]);
  delete state.window.gtag;
  assert.equal(state.window.dataLayer, undefined);
  state.click(link);
  assert.equal(state.window.dataLayer.length, 1);
  assert.equal(state.window.dataLayer[0][0], 'event');
  assert.equal(state.window.dataLayer[0][1], 'teable_help_link_click');
});
test('every public catalog product route and all locale sources are supported', () => {
  const products = ['products', 'csv-compare', 'email-permutator', 'pdf-to-table', 'ai-flowchart-generator',
    'lead-enrichment', 'ai-market-research', 'seo-reporting-tool', 'ai-email-reply-generator',
    'online-database-builder', 'ai-newsletter-generator', 'client-portal', 'purchase-order-generator',
    'ai-social-media-manager', 'ai-ads-agency', 'ai-proposal-generator', 'vendor-portal',
    'directory-website-builder', 'ai-spreadsheet-generator', 'employee-portal', 'ai-report-generator',
    'dashboard-creator', 'ai-app-builder', 'no-code-app-builder', 'excel-to-app', 'spreadsheet-to-app',
    'online-form-builder', 'ai-web-scraper', 'ai-email-parser', 'find-influencers', 'workflow-generator',
    'ai-project-management', 'ctms-system'];
  for (const product of products) {
    const link = anchor('https://teable.ai/' + product);
    const state = runtime([link]);
    state.click(link);
    assert.equal(state.events[0][2].link_category, 'product', product);
  }
  for (const locale of ['en', 'zh', 'ru', 'de', 'fr', 'es', 'it', 'ja', 'tr', 'uk', 'ar']) {
    for (const suffix of ['', '/basic/base', '/deploy/docker', '/api-doc/token', '/compare/airtable', '/changelog-2026-09/']) {
      const link = anchor('https://teable.ai/customers/example');
      const state = runtime([link], 'https://help.teable.ai/' + locale + suffix);
      state.click(link);
      assert.equal(state.events[0][2].locale, locale);
      assert.equal(state.events[0][2].link_category, 'customer');
    }
  }
});
