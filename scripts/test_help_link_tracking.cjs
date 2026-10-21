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
  const window = { location, gtag(...args) { events.push(args); } };
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
      assert.match(link.href, /utm_source=existing#section$/);
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
