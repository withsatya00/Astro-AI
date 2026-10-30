// Trust and legal content: footer links, bilingual policy copy and no unsafe claims. Run with: npm run test:trust
const fs = require('fs'), path = require('path'), assert = require('assert');
const FRONT = path.resolve(__dirname, '..', 'website', 'frontend');
const read = f => fs.readFileSync(path.join(FRONT, f), 'utf8');
const failures = [];
const check = (name, fn) => { try { fn(); console.log('PASS', name); } catch (e) { failures.push(name); console.log('FAIL', name, '-', e.message.split('\n')[0]); } };

const experience = read('src/utils/experience.js');
const pair = key => { const q = "((?:[^'\\\\]|\\\\.)*)"; const m = experience.match(new RegExp(key + ':\\s*\\[' + "'" + q + "',\\s*'" + q + "'\\]")); return m && [m[1], m[2]]; };

check('footer links to privacy, terms, refunds, contact and help', () => {
  const footer = read('src/components/GlobalFooter/GlobalFooter.html');
  for (const kind of ['privacy', 'terms', 'refund', 'contact', 'help']) assert.ok(footer.includes(`data-service-info="${kind}"`), `${kind} link missing`);
});

check('service dialog opens every footer policy kind', () => {
  const info = read('src/components/ServiceInfo.js');
  for (const kind of ['privacy', 'terms', 'refund', 'contact', 'help']) assert.ok(info.includes(`'${kind}'`), `${kind} not allowed in ServiceInfo.open`);
});

check('every policy has English and Hindi title and copy', () => {
  for (const kind of ['privacy', 'terms', 'refund', 'contact', 'help']) for (const part of ['Title', 'Copy']) {
    const p = pair(kind + part);
    assert.ok(p && p[0].length > 3 && /[ऀ-ॿ]/.test(p[1]) && !/[ऀ-ॿ]/.test(p[0]), `${kind}${part} needs English + Hindi`);
  }
});

check('policy copy makes no tax, guarantee or verified-outcome claims', () => {
  const banned = /80G|tax[- ]exempt(?!ion certificate)|guaranteed (results|outcome)|100% (genuine|verified)|certified by/i;
  for (const kind of ['privacy', 'terms', 'refund']) assert.ok(!banned.test(pair(kind + 'Copy')[0]), `${kind} contains a banned claim`);
});

check('refund policy mentions wallet, orders, returns and donations', () => {
  const text = pair('refundCopy')[0].toLowerCase();
  for (const word of ['wallet', 'mandir seva', 'astro mall', 'return', 'donation', 'support']) assert.ok(text.includes(word), `missing "${word}"`);
});

check('wallet UI blocks recharge when the server says payments are unavailable', () => {
  assert.ok(/payments_available/.test(read('js/app.js')), 'app.js ignores payments_available');
  assert.ok(/provider === 'unavailable'/.test(read('js/api.js')), 'api.js has no unavailable handling');
  assert.ok(!/provider: 'test' };\s*\}\s*catch/.test(read('js/api.js')), 'config failure must not fall back to test mode');
});

if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nAll trust-content checks passed');
