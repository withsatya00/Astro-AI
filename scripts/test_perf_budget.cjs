// Performance budget: image weight, lazy loading and font requests. Run with: npm run test:perf
const fs = require('fs'), path = require('path'), assert = require('assert');
const FRONT = path.resolve(__dirname, '..', 'website', 'frontend');
const walk = (dir, filter, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walk(p, filter, out); } else if (filter(p)) out.push(p);
  }
  return out;
};
const failures = [];
const check = (name, fn) => { try { fn(); console.log('PASS', name); } catch (e) { failures.push(name); console.log('FAIL', name, '-', e.message.split('\n')[0]); } };

check('photos in assets/img and assets/portraits are at most 250 KB', () => {
  const big = walk(path.join(FRONT, 'assets'), p => /\.(jpe?g|webp)$/i.test(p) && /\/(img|portraits)\//.test(p.split(path.sep).join('/')))
    .filter(p => fs.statSync(p).size > 250 * 1024).map(p => path.relative(FRONT, p));
  assert.strictEqual(big.length, 0, `${big.length} oversized: ${big.slice(0, 3).join(', ')}`);
});

check('every <img> rendered by templates declares loading="lazy" or loading="eager"', () => {
  const files = walk(path.join(FRONT, 'src'), p => /\.(html|js)$/.test(p));
  const missing = [];
  for (const f of files) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/<img[^>]*>/g)) {
      if (!/loading=/.test(m[0])) missing.push(path.relative(FRONT, f).split(path.sep).join('/'));
    }
  }
  assert.strictEqual(missing.length, 0, `${missing.length} <img> without loading: ${[...new Set(missing)].slice(0, 4).join(', ')}`);
});

check('index.html requests at most three font families', () => {
  const html = fs.readFileSync(path.join(FRONT, 'index.html'), 'utf8');
  const families = [...html.matchAll(/fonts\.googleapis\.com\/css2\?([^"']+)/g)].flatMap(m => m[1].split('&').filter(s => s.startsWith('family=')));
  assert.ok(families.length <= 3, `${families.length} families: ${families.map(f => f.slice(7).split(':')[0]).join(', ')}`);
});

check('scripts are deferred so they never block first paint', () => {
  const html = fs.readFileSync(path.join(FRONT, 'index.html'), 'utf8');
  const blocking = [...html.matchAll(/<script\b[^>]*\bsrc=[^>]*>/g)].map(m => m[0]).filter(s => !/defer|async|type="module"/.test(s));
  assert.strictEqual(blocking.length, 0, blocking[0]);
});

if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll performance checks passed');
