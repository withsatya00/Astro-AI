const {chromium} = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:3000', {waitUntil: 'networkidle'});
    await page.waitForFunction(() => window.DashboardPageComponent && window.App);
    fs.mkdirSync('scratch/account-layout', {recursive: true});
    await page.evaluate(() => {
      window.App.currentUser = {full_name: 'Satya', email: 'satya@example.com'};
      const dashboard = window.DashboardPageComponent;
      dashboard.failed = new Set();
      dashboard.data = {wallet: {balance: 500, transactions: [{amount: 800, type: 'credit'}, {amount: -300, type: 'debit'}]}, orders: {orders: []}, pujas: {bookings: []}, profiles: [], sessions: [], catalog: {products: []}, consultations: Array.from({length: 4}, (_, i) => ({id: String(i), title: 'Personal consultation', started_at: '2026-10-28'}))};
      window.Router.switchView('view-dashboard');
      dashboard.render();
    });
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({width, height: 1000});
      for (const lang of ['en', 'hi']) {
        for (const theme of ['light', 'dark']) {
          await page.evaluate(({lang, theme}) => { window.I18n.currentLang = lang; document.documentElement.dataset.theme = theme; window.DashboardPageComponent.render(); }, {lang, theme});
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `overflow ${width}/${lang}/${theme}`);
          assert.equal(await page.locator('.exp-profile-header h1').innerText(), 'Satya');
          assert.equal(await page.locator('.exp-account-wallet .exp-wallet > strong').innerText(), '₹500');
          await page.screenshot({path: `scratch/account-layout/profile-${width}-${lang}-${theme}.png`, fullPage: true});
        }
      }
    }
    await page.locator('.exp-dashboard-tabs [data-dashboard-tab="orders"]').click();
    assert.equal(await page.locator('.exp-dashboard-tabs [data-dashboard-tab="orders"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-account-settings]').click();
    assert.equal(await page.locator('#modal-user-account').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log('PASS redesigned account: profile/settings, tab navigation, wallet summary, no overflow at 375/768/1440px in English/Hindi and light/dark.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
