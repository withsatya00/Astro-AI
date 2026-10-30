// Catalogue cards show only the essentials; the full story lives on the detail page.
// Needs the frontend on :3000 and a backend on :8002. Run with: npm run test:cards
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0;
  const check = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name, '-', String(e.message).split('\n')[0]); } };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => localStorage.setItem('astro_lang', 'en'));

    // ---------------------------------------------------------------- Mandir Seva
    await page.goto('http://localhost:3000/mandir-seva', { waitUntil: 'networkidle' });
    await page.locator('.mt-card').first().waitFor();
    await check('temple card has no description paragraph or offerings list', async () => {
      assert.equal(await page.locator('.mt-card .shop-card__text').count(), 0);
      assert.equal(await page.locator('.mt-card .shop-card__list').count(), 0);
    });
    await check('temple card text stays short (name, deity, place, price, one action)', async () => {
      const lengths = await page.locator('.mt-card').evaluateAll(els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim().length));
      assert.ok(Math.max(...lengths) <= 170, `longest card has ${Math.max(...lengths)} characters`);
    });
    await check('temple card has exactly one button', async () => {
      assert.equal(await page.locator('.mt-card').first().locator('button').count(), 1);
    });
    await check('clicking anywhere on a temple card opens its detail page', async () => {
      const card = page.locator('.mt-card').first();
      const slug = await card.locator('a.shop-card__media').getAttribute('href');
      await card.locator('.shop-price').click();
      await page.waitForURL('**' + slug);
    });
    await check('temple detail page shows facts, about, sevas, aarti, priests and how it works', async () => {
      await page.locator('#tp-facts').waitFor();
      for (const id of ['#tp-facts', '#tp-about', '#tp-sevas', '#tp-aarti', '#tp-priests', '#tp-how']) assert.ok(await page.locator(id).count(), `${id} missing`);
      const facts = await page.locator('#tp-facts').innerText();
      assert.match(facts, /Deity/i); assert.match(facts, /Location|City/i); assert.match(facts, /₹/);
    });
    await check('significance is shown on the detail page in Hindi (the language it is written in)', async () => {
      await page.evaluate(() => window.I18n.setLanguage('hi'));
      await page.waitForTimeout(1500);
      assert.ok(await page.locator('#tp-significance').count(), '#tp-significance missing');
      assert.ok(/[ऀ-ॿ]/.test(await page.locator('#tp-significance').innerText()));
      await page.evaluate(() => window.I18n.setLanguage('en'));
    });
    await check('no mixed-language significance block in English', async () => {
      await page.waitForTimeout(1500);
      const text = await page.locator('#tp-significance').count() ? await page.locator('#tp-significance').innerText() : '';
      assert.ok(!/[ऀ-ॿ]/.test(text), 'Hindi text shown in English mode');
    });

    // ---------------------------------------------------------------- Astro Mall
    await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'networkidle' });
    await page.locator('.ml-card').first().waitFor();
    await check('product card has no description paragraph and no separate Details button', async () => {
      assert.equal(await page.locator('.ml-card .shop-card__text').count(), 0);
      assert.equal(await page.locator('.ml-card [data-act="details"]').count(), 0);
    });
    await check('product card keeps title, price and a primary action only', async () => {
      const card = page.locator('.ml-card').first();
      assert.ok((await card.locator('.shop-card__title').innerText()).length > 2);
      assert.match(await card.locator('.shop-price').innerText(), /₹/);
      const lengths = await page.locator('.ml-card').evaluateAll(els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim().length));
      assert.ok(Math.max(...lengths) <= 190, `longest card has ${Math.max(...lengths)} characters`);
    });
    await check('wishlist and add-to-cart buttons do not navigate away', async () => {
      const before = page.url();
      await page.locator('.ml-card [data-act="wish"]').first().click({ force: true });
      await page.waitForTimeout(400);
      assert.equal(page.url(), before);
    });
    await check('clicking a product card body opens the product page', async () => {
      const card = page.locator('.ml-card').first();
      const href = await card.locator('a.shop-card__media').getAttribute('href');
      await card.locator('.shop-price').click();
      await page.waitForURL('**' + href);
      await page.locator('.pp-title').waitFor();
    });
    await check('product page has gallery, price, delivery check, trust badges, details, specs, reviews', async () => {
      for (const sel of ['.pp-gallery', '.pp-price', '#pp-pin-form', '.pp-trust', '[data-panel="details"]', '[data-panel="specs"]', '[data-panel="reviews"]', '[data-panel="returns"]']) assert.ok(await page.locator(sel).count(), `${sel} missing`);
    });
    assert.equal(errors.length, 0, 'page errors: ' + errors[0]);
  } finally { await browser.close(); }
  if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
  console.log('\nAll catalogue-card checks passed');
})();
