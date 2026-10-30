const {chromium} = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  const page = await browser.newPage();
  await page.addInitScript(() => { window.__API_BASE__ = 'http://127.0.0.1:8012/api/v1'; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:3100', {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => window.App && window.I18n && document.querySelector('#products-grid .shop-card'), {timeout: 30000});
  fs.mkdirSync('scratch/storefront-qa', {recursive: true});
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({width, height: 900});
    for (const lang of ['en', 'hi']) {
      await page.evaluate(lang => window.I18n.setLanguage(lang, false), lang);
      await page.evaluate(() => window.Router.navigate('/astro-mall'));
      await page.waitForTimeout(600);
      await page.waitForSelector('#view-mall .shop-card');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `mall overflow ${width} ${lang}`);
      await page.screenshot({path: `scratch/storefront-qa/mall-${width}-${lang}.png`, fullPage: true});
      const product = page.locator('#products-grid .shop-card__title a').first();
      await product.click();
      await page.waitForSelector('#view-product .pp-title');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `product overflow ${width} ${lang}`);
      await page.screenshot({path: `scratch/storefront-qa/product-${width}-${lang}.png`, fullPage: true});
      await page.evaluate(() => window.Router.navigate('/mandir-seva'));
      await page.waitForSelector('#view-mandir .shop-card__media');
      await page.locator('#view-mandir .shop-card__media').first().click();
      await page.waitForSelector('#view-temple .tp-hero');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `temple overflow ${width} ${lang}`);
      await page.screenshot({path: `scratch/storefront-qa/temple-${width}-${lang}.png`, fullPage: true});
    }
  }
  const registration = await page.request.post('http://127.0.0.1:8012/api/v1/auth/register', {data: {
    email: `browser-wallet-${Date.now()}@test.in`, password: 'Storefront-QA-123!', full_name: 'Wallet QA'
  }});
  assert.equal(registration.status(), 201);
  const session = await registration.json();
  await page.evaluate(async session => {
    localStorage.setItem('astro_access_token', session.access_token);
    await window.App.checkUserSession();
    window.I18n.setLanguage('en', false);
    await window.App.openWalletModal();
  }, session);
  assert.equal((await page.locator('#modal-wallet-amount').innerText()).trim(), '₹0.00');
  assert.match(await page.locator('#wallet-transaction-list').innerText(), /No transactions/);
  await page.evaluate(() => window.App.rechargeWallet(500));
  assert.equal((await page.locator('#modal-wallet-amount').innerText()).trim(), '₹500.00');
  assert.equal(await page.locator('.wallet-transaction').count(), 1);
  assert.match(await page.locator('.wallet-transaction').innerText(), /TXN_/);
  await page.setViewportSize({width: 375, height: 900});
  await page.screenshot({path: 'scratch/storefront-qa/wallet-375-en.png', fullPage: true});
  console.log('PASS wallet browser: newly registered account ₹0; recharge ₹500; account receipt visible.');
  assert.deepEqual(errors, [], 'browser runtime errors');
  console.log('PASS browser: Mall, product and temple pages at 375/768/1440px, English and Hindi; no horizontal overflow or runtime errors.');
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
