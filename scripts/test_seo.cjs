// SEO contract for page titles, robots rules and private pages. Run with: npm run test:seo
const fs = require('fs'), path = require('path'), assert = require('assert');
const { parseHTML } = require('linkedom');
const SRC = fs.readFileSync(path.resolve(__dirname, '..', 'website/frontend/js/seo.js'), 'utf8');
const failures = [];
const check = (name, fn) => { try { fn(); console.log('PASS', name); } catch (e) { failures.push(name); console.log('FAIL', name, '-', String(e.message).split('\n')[0]); } };

function load(lang = 'en') {
  const { window, document } = parseHTML('<!doctype html><html><head><title>start</title></head><body></body></html>');
  window.location = { origin: 'https://example.test', pathname: '/' };
  window.I18n = { currentLang: lang };
  new Function('window', 'document', 'location', SRC)(window, document, window.location);
  const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');
  const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
  return { Seo: window.Seo, document, robots, canonical };
}

check('Gau Sewa has its own indexable title, description and canonical', () => {
  const { Seo, document, robots, canonical } = load();
  Seo.update('/gau-sewa');
  assert.match(document.title, /Gau Sewa/);
  assert.match(robots(), /^index/);
  assert.equal(canonical(), 'https://example.test/gau-sewa');
});

check('Hindi titles are used when the site is in Hindi', () => {
  const { Seo, document } = load('hi');
  Seo.update('/gau-sewa');
  assert.ok(/[ऀ-ॿ]/.test(document.title), document.title);
});

check('donation receipt pages are noindex and canonicalise to /gau-sewa (never expose the token)', () => {
  const { Seo, document, robots, canonical } = load();
  Seo.update('/gau-sewa/receipt/SECRETtoken_1234567890abcdefghijklmnop');
  assert.match(robots(), /noindex/);
  assert.ok(!canonical().includes('SECRET'), canonical());
  assert.ok(!document.title.includes('SECRET'));
});

check('private pages are noindex', () => {
  const { Seo, robots } = load();
  for (const p of ['/dashboard', '/admin', '/seller', '/rewards']) { Seo.update(p); assert.match(robots(), /noindex/, p); }
});

check('every public marketing route has its own title', () => {
  const { Seo, document } = load();
  const seen = new Set();
  for (const p of ['/', '/astrologers', '/calculators', '/panchang', '/rashiphal', '/mandir-seva', '/astro-mall', '/gau-sewa', '/gifts']) {
    Seo.update(p);
    assert.ok(!seen.has(document.title), `duplicate or stale title on ${p}: ${document.title}`);
    seen.add(document.title);
  }
});

check('unknown routes do not keep the previous page title and are noindex', () => {
  const { Seo, document, robots } = load();
  Seo.update('/gau-sewa');
  const before = document.title;
  Seo.update('/no-such-page');
  assert.notEqual(document.title, before);
  assert.match(robots(), /noindex/);
});

if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll SEO checks passed');
