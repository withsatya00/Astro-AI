// Browser check: account overview shows next steps, and the footer refund policy opens in both languages.
// Needs the frontend on :3000 and a DEV backend on :8012 (use a throwaway database; the test registers a user).
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const API = 'http://127.0.0.1:8012/api/v1';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0;
  const check = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name, '-', String(e.message).split('\n')[0]); } };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { window.__API_BASE__ = 'http://127.0.0.1:8012/api/v1'; localStorage.setItem('astro_lang', 'en'); });
    const res = await page.request.post(`${API}/auth/register`, { data: { email: `steps-${Date.now()}@test.in`, password: 'Steps-QA-123!', full_name: 'Steps QA' } });
    assert.equal(res.status(), 201);
    const { access_token } = await res.json();
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.evaluate(async token => { localStorage.setItem('astro_access_token', token); await window.App.checkUserSession(); }, access_token);

    await check('new account overview lists next steps starting with the Kundli', async () => {
      await page.evaluate(() => window.Router.navigate('/dashboard'));
      await page.waitForSelector('.exp-next .exp-step');
      const titles = await page.locator('.exp-step strong').allInnerTexts();
      assert.equal(titles[0], 'Create your Kundli');
      assert.ok(titles.length >= 2 && titles.length <= 3, `${titles.length} steps`);
    });
    await check('a next-step link navigates inside the app', async () => {
      await page.locator('.exp-step[href="/calculators"]').click();
      await page.waitForURL('**/calculators');
    });
    await check('overview never shows more than three steps', async () => {
      await page.evaluate(() => window.Router.navigate('/dashboard'));
      await page.waitForSelector('.exp-next');
      assert.ok((await page.locator('.exp-step').count()) <= 3);
    });
    await check('steps switch to Hindi', async () => {
      await page.evaluate(() => window.I18n.setLanguage('hi'));
      await page.waitForTimeout(800);
      assert.ok(/[\u0900-\u097F]/.test(await page.locator('.exp-next h2').innerText()));
    });
    await check('footer refund policy opens with real content in English and Hindi', async () => {
      for (const [lang, test] of [['en', /refund/i], ['hi', /[\u0900-\u097F]/]]) {
        await page.evaluate(l => window.I18n.setLanguage(l), lang);
        await page.waitForTimeout(500);
        await page.locator('[data-service-info="refund"]').first().click();
        await page.waitForSelector('.service-dialog[open]');
        assert.match(await page.locator('.service-dialog').innerText(), test);
        assert.ok((await page.locator('.service-dialog p').first().innerText()).length > 80, 'copy too short');
        await page.keyboard.press('Escape');
      }
    });
    assert.equal(errors.length, 0, `page errors: ${errors[0]}`);
  } finally { await browser.close(); }
  if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
  console.log('\nAll account next-steps checks passed');
})();
