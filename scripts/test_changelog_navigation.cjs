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

test('changelog navigation preserves the upstream date layout without injecting a floating picker', () => {
  let created = 0;
  const document = {
    documentElement: { setAttribute() {} },
    getElementById() { return null; },
    querySelectorAll() { return []; },
    createElement() { created++; throw new Error('unexpected floating date control'); },
  };
  const window = {
    location: { pathname: '/zh/changelog-2026-09', hash: '' },
    addEventListener() {}, clearTimeout() {}, setTimeout() {},
  };
  vm.runInNewContext(source, { document, window, MutationObserver: class { observe() {} } });
  assert.equal(created, 0);
});

function readerHarness() {
  const document = {
    documentElement: { setAttribute() {} },
    getElementById() { return null; },
    querySelectorAll() { return []; },
  };
  const window = {
    location: { pathname: '/en/basic', hash: '' },
    addEventListener() {}, clearTimeout() {}, setTimeout() {},
  };
  const exposed = source.replace('  collectPairs();\n})();', `
    window.reader = { pageMonth, nextMonth, updateReadingMonth,
      setState(state) { monthReader = state; } };
  })();`);
  vm.runInNewContext(exposed, { document, window, MutationObserver: class { observe() {} } });
  return window.reader;
}

test('month detection skips legacy title aliases and accepts localized dated headings', () => {
  const reader = readerHarness();
  assert.equal(reader.pageMonth({ querySelectorAll() {
    return [{id: 'ancien-titre'}, {id: 'release-2026-10-20-section-1'}];
  } }), '2026-10');
  assert.equal(reader.pageMonth({ querySelectorAll() { return [{id: '2026-10-21-字段转换'}]; } }), '2026-10');
});

test('continuous reading chooses the next older available month without loading duplicate months', () => {
  const reader = readerHarness();
  const state = { loaded: new Map([['2026-10', {}]]), months: [
    {month: '2026-10'}, {month: '2026-09'}, {month: '2026-07'},
  ] };
  assert.equal(reader.nextMonth(state).month, '2026-09');
  state.loaded.set('2026-09', {});
  assert.equal(reader.nextMonth(state).month, '2026-07');
  state.loaded.set('2026-07', {});
  assert.equal(reader.nextMonth(state), undefined);
});

test('sidebar selection follows reading forward and backward without scrolling the document', () => {
  const reader = readerHarness();
  let septemberTop = 900;
  const link = () => ({ attributes: {},
    setAttribute(k,v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; },
  });
  const october = link(), september = link();
  const state = { initial: '2026-10', links: new Map([['2026-10', october], ['2026-09', september]]),
    loaded: new Map([
      ['2026-09', {first: {getBoundingClientRect() { return {top: septemberTop}; }}}],
      ['2026-10', {first: {getBoundingClientRect() { return {top: -100}; }}}],
    ]),
  };
  reader.setState(state);
  reader.updateReadingMonth();
  assert.equal(october.attributes['aria-current'], 'location');
  septemberTop = 120;
  reader.updateReadingMonth();
  assert.equal(september.attributes['aria-current'], 'location');
  assert.equal(october.attributes['aria-current'], undefined);
  septemberTop = 600;
  reader.updateReadingMonth();
  assert.equal(october.attributes['aria-current'], 'location');
  assert.equal(september.attributes['aria-current'], undefined);
});

test('hosted navigation labels stop being headings without replacing their interactive children', () => {
  const button = { text: 'On this page', clickHandler: () => true };
  const labels = [
    { attributes: [], children: [{text: 'Documentation Index'}] },
    { attributes: [{name: 'id', value: 'toc-label'}, {name: 'class', value: 'm-0 font-normal'}], children: [button] },
  ].map(node => ({ ...node,
    get firstChild() { return this.children[0]; },
    replaceWith(replacement) { this.replacement = replacement; },
  }));
  const document = {
    documentElement: { setAttribute() {} },
    querySelectorAll(selector) { return selector.startsWith('[data-agent-docs-index]') ? labels.filter(x => !x.replacement) : []; },
    createElement(tag) { return { tag, attributes: {}, children: [],
      setAttribute(k,v) { this.attributes[k] = v; },
      appendChild(child) {
        const owner = labels.find(x => x.children.includes(child));
        owner.children.splice(owner.children.indexOf(child), 1);
        this.children.push(child);
      },
    }; },
  };
  const window = {addEventListener() {}};
  const exposed = source.replace('  collectPairs();\n})();', '  window.normalize = normalizeNavigationHeadings;\n})();');
  vm.runInNewContext(exposed, {document, window, MutationObserver: class {observe() {}}});
  window.normalize();
  window.normalize();
  assert.equal(labels[0].replacement.tag, 'div');
  assert.equal(labels[1].replacement.attributes.id, 'toc-label');
  assert.equal(labels[1].replacement.attributes.class, 'm-0 font-normal');
  assert.equal(labels[1].replacement.children[0], button);
  assert.equal(button.clickHandler(), true);
});
