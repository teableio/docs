const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'changelog-toc.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.github/changelog-history-anchors.json'), 'utf8'));

function run(pathname, hash, { existing = [], search = '', stalePath = '' } = {}) {
  const redirects = [];
  const attributes = { 'data-current-path': stalePath };
  const locale = pathname.split('/')[1];
  const histories = Object.entries(manifest[locale] || {}).map(([month, anchors]) => ({
    getAttribute(name) { return name === 'data-changelog-month' ? month : anchors.join('|'); },
  }));
  const document = {
    documentElement: { setAttribute(k, v) { attributes[k] = v; } },
    getElementById(id) { return existing.includes(id) ? {} : null; },
    querySelectorAll(selector) { return selector.includes('[data-changelog-month]') ? histories : []; },
  };
  const window = {
    location: { pathname, hash, search, replace(value) { redirects.push(value); } },
    matchMedia() { return { matches: false }; },
    addEventListener() {}, clearTimeout() {}, setTimeout() {},
  };
  vm.runInNewContext(source, { document, window, MutationObserver: class { observe() {} } });
  return { redirects, attributes };
}

test('every previously published historical date and heading hash routes to its month in all locales', () => {
  let count = 0;
  for (const [locale, months] of Object.entries(manifest)) {
    for (const [month, anchors] of Object.entries(months)) {
      for (const anchor of anchors) {
        const result = run(`/${locale}/changelog`, '#' + encodeURIComponent(anchor), { search: '?from=old-link' });
        assert.deepEqual(result.redirects, [`/${locale}/changelog-${month}?from=old-link#${encodeURIComponent(anchor)}`]);
        count++;
      }
    }
  }
  assert.ok(count > 4000);
});

test('current headings, unknown hashes, malformed encoding and archive URLs never redirect', () => {
  const anchor = Object.values(manifest.en)[0][0];
  for (const result of [
    run('/en/changelog', '#' + anchor, { existing: [anchor] }),
    run('/en/changelog', '#not-a-published-anchor'),
    run('/en/changelog', '#%E0%A4%A'),
    run('/en/changelog-2026-01', '#' + anchor),
    run('/en/changelog-2025', '#' + anchor),
  ]) assert.deepEqual(result.redirects, []);
});

test('SPA navigation replaces the stale path used for changelog styling', () => {
  const result = run('/en/basic/ai/overview', '', { stalePath: '/en/changelog' });
  assert.equal(result.attributes['data-current-path'], '/en/basic/ai/overview');
});

test('an existing date picker updates its accessible label on language navigation and is removed on other pages', () => {
  let observerCallback;
  let picker;
  const labels = { en: 'Jump to date', zh: '跳转到日期' };
  const select = { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, appendChild() {}, addEventListener() {} };
  const updates = ['one', 'two'].map((id) => ({ id, querySelector() { return { textContent: id }; } }));
  const window = {
    location: { pathname: '/en/changelog', hash: '' },
    matchMedia() { return { matches: false }; },
    addEventListener() {}, clearTimeout() {}, setTimeout(fn) { fn(); },
  };
  const document = {
    documentElement: { setAttribute() {} },
    getElementById(id) {
      return id === 'changelog-labels' ? { getAttribute() { return labels[window.location.pathname.split('/')[1]]; } } : null;
    },
    querySelectorAll(selector) { return selector === '.update-container[id]' ? updates : []; },
    createElement(tag) {
      if (tag === 'option') return {};
      picker = {
        isConnected: false,
        querySelector(selector) { return selector === 'select' ? select : { textContent: '' }; },
        contains() { return false; }, remove() { this.isConnected = false; },
      };
      return picker;
    },
    body: { appendChild(node) { node.isConnected = true; } },
  };
  vm.runInNewContext(source, { document, window, MutationObserver: class {
    constructor(callback) { observerCallback = callback; } observe() {}
  } });
  assert.equal(select.attrs['aria-label'], labels.en);
  window.location.pathname = '/zh/changelog-2026-09';
  observerCallback([{ target: {} }]);
  assert.equal(select.attrs['aria-label'], labels.zh);
  assert.ok(picker.isConnected);
  window.location.pathname = '/zh/basic/ai/overview';
  observerCallback([{ target: {} }]);
  assert.equal(picker.isConnected, false);
});
