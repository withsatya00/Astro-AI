// Unit tests for the dashboard "what to do next" logic. Run with: npm run test:steps
const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
const failures = [];
const check = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (e) { failures.push(name); console.log('FAIL', name, '-', String(e.message).split('\n')[0]); } };

(async () => {
  let nextSteps;
  try { ({ nextSteps } = await import(pathToFileURL(path.resolve(__dirname, '..', 'website/frontend/src/utils/next-steps.js')).href)); } catch (e) { console.log('FAIL module not loadable -', e.message.split('\n')[0]); process.exit(1); }
  const empty = { profiles: [], consultations: [], orders: [], pujas: [], wallet: { balance: 0 } };
  const full = { profiles: [{ id: 1 }], consultations: [{ id: 1 }], orders: [{ status: 'DELIVERED' }], pujas: [{ status: 'COMPLETED' }], wallet: { balance: 500 } };
  const ids = (d, lang = 'en') => nextSteps(d, lang).map(s => s.id);

  await check('a brand-new account is guided: kundli first, then consult, then wallet', () => assert.deepEqual(ids(empty), ['kundli', 'consult', 'wallet']));
  await check('never returns more than three steps', () => assert.ok(nextSteps(empty, 'en').length <= 3));
  await check('a user with a chart skips the kundli step', () => assert.ok(!ids({ ...empty, profiles: [{ id: 1 }] }).includes('kundli')));
  await check('an in-flight order is surfaced before generic suggestions', () => assert.equal(ids({ ...full, orders: [{ status: 'DISPATCHED' }] })[0], 'track-order'));
  await check('cancelled and delivered orders are not "in flight"', () => assert.ok(!ids({ ...full, orders: [{ status: 'CANCELLED' }, { status: 'DELIVERED' }] }).includes('track-order')));
  await check('a user who did everything still gets one gentle suggestion (seva)', () => {
    const steps = ids({ ...full, pujas: [] });
    assert.deepEqual(steps, ['seva']);
  });
  await check('a fully active user gets a calm empty list, not noise', () => assert.deepEqual(ids(full), []));
  await check('low wallet balance suggests a top-up only below the threshold', () => {
    assert.ok(ids({ ...full, wallet: { balance: 20 } }).includes('wallet'));
    assert.ok(!ids({ ...full, wallet: { balance: 80 } }).includes('wallet'));
  });
  await check('no top-up nudge while payments are unavailable', () => assert.ok(!ids({ ...empty, wallet: { balance: 0, payments_available: false } }).includes('wallet')));
  await check('missing or failed data never crashes or invents steps', () => {
    assert.deepEqual(ids({}), []);
    assert.doesNotThrow(() => nextSteps(null, 'en'));
  });
  await check('every step has a link, English and Hindi text', () => {
    for (const lang of ['en', 'hi']) for (const s of nextSteps(empty, lang)) {
      assert.ok(s.href && s.title && s.text, `${s.id} incomplete`);
      assert.equal(/[ऀ-ॿ]/.test(s.title + s.text), lang === 'hi', `${s.id} wrong script for ${lang}`);
    }
  });
  await check('failed endpoints (undefined lists) do not trigger "empty account" nudges', () => {
    const failed = { profiles: undefined, consultations: undefined, orders: undefined, pujas: undefined, wallet: undefined };
    assert.deepEqual(ids(failed, 'en'), []);
  });

  if (failures.length) { console.log(`\n${failures.length} check(s) failed`); process.exit(1); }
  console.log('\nAll next-steps checks passed');
})();
