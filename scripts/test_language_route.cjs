const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'language-route.js'), 'utf8');
function route({ cookie = '', languages = ['en'], pathname = '/en/locale-router' } = {}) {
  const destinations = [];
  const window = {
    location: { pathname, search: '?ref=docs', hash: '#guides', replace(value) { destinations.push(value); } },
    addEventListener() {}, setInterval() {},
  };
  vm.runInNewContext(source, {
    window, document: { cookie, addEventListener() {} },
    navigator: { languages, language: languages[0] }, URL,
  });
  return destinations;
}
test('all supported browser locales land on their documentation homepage', () => {
  for (const locale of ['en', 'zh', 'ru', 'de', 'fr', 'es', 'it', 'ja', 'tr', 'uk', 'ar']) {
    assert.deepEqual(route({ languages: [locale + '-XX'] }), [`/${locale}?ref=docs#guides`]);
  }
});
test('saved language wins, unsupported or malformed preferences fall back, and content routes remain open', () => {
  assert.deepEqual(route({ cookie: 'TEABLE_DOCS_LOCALE=zh', languages: ['de'] }), ['/zh?ref=docs#guides']);
  assert.deepEqual(route({ cookie: 'TEABLE_DOCS_LOCALE=%E0%A4%A', languages: ['fr'] }), ['/fr?ref=docs#guides']);
  assert.deepEqual(route({ languages: ['pt-BR'] }), ['/en?ref=docs#guides']);
  assert.deepEqual(route({ pathname: '/zh/basic/base' }), []);
});
