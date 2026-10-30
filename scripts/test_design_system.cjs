// Design-system contract: tokens, shared primitives, focus/motion rules and WCAG contrast of key colour pairs.
// Run with: npm run test:ds
const fs = require('fs'), path = require('path'), assert = require('assert');
const STYLES = path.resolve(__dirname, '..', 'website', 'frontend', 'src', 'styles');
const read = f => fs.readFileSync(path.join(STYLES, f), 'utf8');
const failures = [];
const check = (name, fn) => { try { fn(); console.log('PASS', name); } catch (e) { failures.push(name); console.log('FAIL', name, '-', e.message.split('\n')[0]); } };

const tokens = {};
const cyclic = [];
for (const m of read('tokens.css').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  if (m[2].trim() === `var(${m[1]})`) cyclic.push(m[1]); else if (!(m[1] in tokens)) tokens[m[1]] = m[2].trim();
}
const resolve = v => { let guard = 0; while (v && v.startsWith('var(') && guard++ < 5) v = tokens[v.slice(4, -1)]; return v; };
const lum = hex => {
  const n = parseInt(hex.slice(1).length === 3 ? hex.slice(1).replace(/./g, c => c + c) : hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  assert.ok(/^#[0-9a-f]{3,6}$/i.test(a) && /^#[0-9a-f]{3,6}$/i.test(b), `not a hex colour: ${a} / ${b}`); const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

check('tokens.css has no self-referencing variables', () => {
  assert.strictEqual(cyclic.length, 0, `cyclic: ${cyclic.join(', ')}`);
});

check('design-system.css exists and is loaded by index.html', () => {
  assert.ok(fs.existsSync(path.join(STYLES, 'design-system.css')), 'design-system.css missing');
  assert.ok(/design-system\.css/.test(fs.readFileSync(path.join(STYLES, '..', '..', 'index.html'), 'utf8')), 'not linked in index.html');
});

check('shared primitives are defined (button, card, chip, state, skeleton)', () => {
  const css = fs.existsSync(path.join(STYLES, 'design-system.css')) ? read('design-system.css') : '';
  for (const cls of ['.ds-btn', '.ds-btn--primary', '.ds-btn--ghost', '.ds-card', '.ds-chip', '.ds-state', '.ds-state--error', '.ds-skeleton', '.ds-visually-hidden'])
    assert.ok(css.includes(cls), `${cls} missing`);
});

check('primitives use design tokens only (no hard-coded hex colours)', () => {
  const css = fs.existsSync(path.join(STYLES, 'design-system.css')) ? read('design-system.css') : '';
  assert.ok(css.length > 0, 'file missing');
  const hex = css.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  assert.strictEqual(hex.length, 0, `hex colours found: ${hex.slice(0, 3).join(', ')}`);
});

check('global keyboard focus ring and reduced-motion rule exist', () => {
  const css = fs.existsSync(path.join(STYLES, 'design-system.css')) ? read('design-system.css') : '';
  assert.ok(/:focus-visible/.test(css), 'no :focus-visible rule');
  assert.ok(/prefers-reduced-motion:\s*reduce/.test(css), 'no reduced-motion rule');
});

check('tokens used by primitives are all defined', () => {
  const css = fs.existsSync(path.join(STYLES, 'design-system.css')) ? read('design-system.css') : '';
  const used = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]))];
  const own = new Set([...css.matchAll(/(--ds-[\w-]+)\s*:/g)].map(m => m[1]));
  const missing = used.filter(t => !(t in tokens) && !own.has(t));
  assert.strictEqual(missing.length, 0, `undefined tokens: ${missing.join(', ')}`);
});

check('text/background colour pairs meet WCAG AA (4.5:1)', () => {
  const pairs = [['--text-inverted', '--color-purple-primary'], ['--text-inverted', '--color-purple-hover'], ['--text-primary', '--bg-page'],
    ['--text-secondary', '--bg-page'], ['--text-secondary', '--bg-card'], ['--color-gold-dark', '--color-gold-soft'], ['--color-purple-primary', '--bg-page']];
  const bad = pairs.map(([f, b]) => [f, b, contrast(resolve(tokens[f]), resolve(tokens[b]))]).filter(([, , c]) => c < 4.5)
    .map(([f, b, c]) => `${f} on ${b} = ${c.toFixed(2)}`);
  assert.strictEqual(bad.length, 0, bad.join('; '));
});

check('muted text token is readable on cards (AA for small text)', () => {
  const c = contrast(resolve(tokens['--text-muted']), resolve(tokens['--bg-card']));
  assert.ok(c >= 4.5, `--text-muted on --bg-card = ${c.toFixed(2)}`);
});

if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll design-system checks passed');
