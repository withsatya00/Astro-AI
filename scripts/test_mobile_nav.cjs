// Mobile bottom bar: Mandir Seva and Astro Mall are one tap away, labels follow the language, targets are tappable.
// Needs the frontend on :3000 and backend on :8002. Run with: npm run test:mobile
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0;
  const check = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name, '-', String(e.message).split('\n')[0]); } };
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
    page.setDefaultTimeout(15000);
    await page.addInitScript(() => localStorage.setItem('astro_lang', 'en'));
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForSelector('.pm-tabbar');

    await check('tab bar offers Home, Astrologers, Seva, Mall and Profile', async () => {
      const ids = await page.locator('.pm-tab').evaluateAll(els => els.map(e => e.dataset.tab));
      assert.deepEqual(ids, ['home', 'astrologers', 'seva', 'mall', 'profile']);
    });
    await check('every tab is at least 44px tall and fits the screen width', async () => {
      const boxes = await page.locator('.pm-tab').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return [r.width, r.height, r.right]; }));
      for (const [w, h, right] of boxes) { assert.ok(h >= 44, `height ${h}`); assert.ok(w >= 56, `width ${w}`); assert.ok(right <= 390.5, `overflow ${right}`); }
    });
    await check('Seva tab opens Mandir Seva and becomes active', async () => {
      await page.locator('.pm-tab[data-tab="seva"]').click();
      await page.waitForURL('**/mandir-seva');
      assert.equal(await page.locator('.pm-tab.active').getAttribute('data-tab'), 'seva');
    });
    await check('Mall tab opens Astro Mall and becomes active', async () => {
      await page.locator('.pm-tab[data-tab="mall"]').click();
      await page.waitForURL('**/astro-mall');
      assert.equal(await page.locator('.pm-tab.active').getAttribute('data-tab'), 'mall');
    });
    await check('temple sub-pages keep the Seva tab active', async () => {
      await page.evaluate(() => window.Router.navigate('/mandir-seva/kashi-vishwanath-varanasi'));
      assert.equal(await page.locator('.pm-tab.active').getAttribute('data-tab'), 'seva');
    });
    await check('tab labels are translated to Hindi', async () => {
      await page.evaluate(() => window.I18n.setLanguage('hi'));
      await page.waitForTimeout(600);
      const labels = await page.locator('.pm-tab > span[translate]').allInnerTexts();
      assert.ok(labels.every(t => /[ऀ-ॿ]/.test(t)), labels.join(' | '));
    });
    await check('page has no horizontal scroll with the bar', async () => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    });
  } finally { await browser.close(); }
  if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
  console.log('\nAll mobile-nav checks passed');
})();
