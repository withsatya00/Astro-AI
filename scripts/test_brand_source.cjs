// Source-level brand check: the old palettes must be gone and the shared maroon must come from tokens.
// Run with: npm run test:brandsrc
const fs = require('fs'), path = require('path'), assert = require('assert');
const FRONT = path.resolve(__dirname, '..', 'website', 'frontend');
const LEGACY = ['#3d2851', '#2b1d3c', '#513264', '#241830', '#7439ea', '#4c1d95', '#5b21b6', '#755584'];
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name === '.git') continue; const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const failures = [];
const check = (name, fn) => { try { fn(); console.log('PASS', name); } catch (e) { failures.push(name); console.log('FAIL', name, '-', String(e.message).split('\n')[0]); } };
const files = walk(FRONT).filter(f => /\.(css|js|html|webmanifest)$/.test(f) && !/ui-locales\.js$/.test(f) && !/[\/](assets)[\/]/.test(f));
const tokens = fs.readFileSync(path.join(FRONT, 'src/styles/tokens.css'), 'utf8');
const tok = k => (tokens.match(new RegExp(k + ': *(#[0-9a-fA-F]{6})')) || [])[1];

check('tokens carry the shared maroon (deep, primary, hover, soft)', () => {
  assert.equal((tok('--brand-deep') || '').toLowerCase(), '#3e0b18');
  assert.equal((tok('--brand-primary') || '').toLowerCase(), '#650f23');
  assert.ok(tok('--brand-hover'), 'no --brand-hover'); assert.ok(tok('--brand-soft'), 'no --brand-soft');
});

check('no legacy plum / bright-purple hex codes remain in CSS, JS, HTML or the manifest', () => {
  const hits = {};
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8').toLowerCase();
    for (const hex of LEGACY) { const n = text.split(hex).length - 1; if (n) hits[path.relative(FRONT, f).split(path.sep).join('/')] = (hits[path.relative(FRONT, f).split(path.sep).join('/')] || []).concat(`${hex}x${n}`); }
  }
  const list = Object.entries(hits);
  assert.strictEqual(list.length, 0, `${list.length} files still use legacy colours: ${list.slice(0, 4).map(([f, h]) => f + ' ' + h.join(',')).join(' | ')}`);
});

check('theme-color and manifest match the brand', () => {
  const html = fs.readFileSync(path.join(FRONT, 'index.html'), 'utf8');
  assert.match(html, /name="theme-color" content="#3e0b18"/i);
  assert.match(fs.readFileSync(path.join(FRONT, 'manifest.webmanifest'), 'utf8'), /"theme_color": *"#3e0b18"/i);
});

check('compiled Tailwind contains the new brand utilities used by templates', () => {
  const used = new Set(); for (const f of files.filter(f => /\.(html|js)$/.test(f))) for (const m of fs.readFileSync(f, 'utf8').matchAll(/(?:bg|from|to|via|text|border)-\[#(?:4a1b9a|1e0b44|3b1580)\]/gi)) used.add(m[0].toLowerCase());
  const css = fs.readFileSync(path.join(FRONT, 'css/tailwind.css'), 'utf8').toLowerCase();
  const BS = String.fromCharCode(92); const esc = c => c.split('').map(ch => ('[]#'.includes(ch) ? BS + ch : ch)).join('');
  const missing = [...used].filter(c => !css.includes(esc(c)));
  assert.strictEqual(missing.length, 0, `not compiled: ${missing.slice(0, 4).join(', ')}`);
});

if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll brand-source checks passed');
