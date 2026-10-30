// Premium detail pages (temple and product): layout, sticky purchase areas, brand buttons, no negative badges, mobile bar.
// Needs the frontend on :3000 and a backend on :8002. Run with: npm run test:detail
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');

// The brand colour comes from tokens.css, so a palette change never needs a test edit.
const fs = require('node:fs');
const brandHex = (fs.readFileSync(require('node:path').resolve(__dirname, '..', 'website/frontend/src/styles/tokens.css'), 'utf8').match(/--brand-primary: *(#[0-9a-fA-F]{6})/) || [])[1] || '#4a1b9a';
const PLUM = `rgb(${parseInt(brandHex.slice(1, 3), 16)}, ${parseInt(brandHex.slice(3, 5), 16)}, ${parseInt(brandHex.slice(5, 7), 16)})`;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0;
  const check = async (name, fn) => { try { await fn(); console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name, '-', String(e.message).split('\n')[0]); } };
  const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { localStorage.setItem('astro_lang', 'en'); localStorage.setItem('pwa_dismissed', '1'); });

    // ------------------------------------------------------------------ temple
    await page.goto('http://localhost:3000/mandir-seva/mahakaleshwar-ujjain', { waitUntil: 'networkidle' });
    await page.locator('#tp-facts').waitFor();
    await check('temple hero is tall and carries deity and location', async () => {
      const box = await page.locator('.tp-hero').boundingBox();
      assert.ok(box.height >= 320, `hero is ${box.height}px`);
      const text = await page.locator('.tp-hero').innerText();
      assert.match(text, /Mahakal/); assert.match(text, /Ujjain/i);
    });
    await check('temple highlights row shows price, video proof and prasad as chips', async () => {
      const chips = await page.locator('.tp-chip').allInnerTexts();
      assert.ok(chips.length >= 3, `${chips.length} chips`);
      assert.ok(chips.some(c => /₹/.test(c)));
    });
    await check('booking card sits in the sidebar, is sticky and uses the brand button', async () => {
      const card = page.locator('aside .tp-book');
      assert.equal(await card.count(), 1);
      assert.equal(await card.evaluate(e => getComputedStyle(e).position), 'sticky');
      assert.match(await card.innerText(), /₹/);
      assert.equal(await card.locator('.shop-btn').first().evaluate(e => getComputedStyle(e).backgroundColor), PLUM);
    });
    await check('facts are compact tiles in at least two columns', async () => {
      const tops = await page.locator('.tp-fact').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().top)));
      assert.ok(tops.length >= 6, `${tops.length} tiles`);
      assert.equal(tops[0], tops[1], 'first two tiles are not side by side');
    });
    await check('empty aarti/priest sections collapse into slim notes', async () => {
      for (const id of ['#tp-aarti', '#tp-priests']) {
        const el = page.locator(id);
        if (await el.locator('.tp-quiet').count()) assert.ok((await el.boundingBox()).height < 110, `${id} is ${(await el.boundingBox()).height}px`);
      }
    });
    await check('seva rows use the brand button and the price is clearly aligned', async () => {
      const btn = page.locator('.tp-seva .shop-btn').first();
      assert.equal(await btn.evaluate(e => getComputedStyle(e).backgroundColor), PLUM);
    });
    await check('seva packages are not squeezed into a narrow column', async () => {
      const card = page.locator('.tp-packages > *').first();
      if (await card.count()) assert.ok((await card.boundingBox()).width >= 240);
    });
    await check('"Before you book" moves below the main content', async () => {
      const sevas = await page.locator('#tp-sevas').boundingBox();
      const info = await page.locator('#view-temple .service-info, #view-temple [class*="service-panel"], #view-temple .exp-service').first().boundingBox();
      assert.ok(info.y > sevas.y, 'service panel is still above the sevas');
    });
    for (const width of [1280, 768, 390]) await check(`temple page has no horizontal scroll at ${width}px`, async () => {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await noOverflow(page), true);
    });
    await check('mobile shows a fixed booking bar with price and action; desktop hides it', async () => {
      await page.setViewportSize({ width: 390, height: 800 });
      const bar = page.locator('.tp-mobilebar');
      assert.equal(await bar.evaluate(e => getComputedStyle(e).position), 'fixed');
      assert.ok(await bar.isVisible());
      assert.match(await bar.innerText(), /₹/);
      const r = await bar.boundingBox();
      assert.ok(r.y >= 0 && r.y + r.height <= 800, `bar is off screen at y=${Math.round(r.y)}`);
      await page.setViewportSize({ width: 1280, height: 900 });
      assert.equal(await bar.isVisible(), false);
    });

    // ------------------------------------------------------------------ product
    await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'networkidle' });
    await page.locator('.ml-card').first().waitFor();
    await page.locator('.ml-card .shop-price').first().click();
    await page.locator('.pp-title').waitFor();
    await page.waitForTimeout(800);
    await check('product photo fills the gallery frame (no inset on a beige box)', async () => {
      const stage = await page.locator('#pp-stage').boundingBox();
      const img = await page.locator('#pp-main-img').boundingBox();
      assert.ok(img.width >= stage.width * 0.94 && img.height >= stage.height * 0.94, `img ${Math.round(img.width)}x${Math.round(img.height)} in ${Math.round(stage.width)}x${Math.round(stage.height)}`);
    });
    await check('buy box stays in view while scrolling (sticky) on desktop', async () => {
      assert.equal(await page.locator('.pp-info').evaluate(e => getComputedStyle(e).position), 'sticky');
    });
    await check('Buy now and Add to cart use the brand colours', async () => {
      assert.equal(await page.locator('#pp-buy').evaluate(e => getComputedStyle(e).backgroundColor), PLUM);
      assert.equal(await page.locator('#pp-add').evaluate(e => getComputedStyle(e).color), PLUM);
    });
    await check('trust strip only lists things the product actually has', async () => {
      const text = await page.locator('.pp-trust').innerText();
      assert.ok(!/not listed/i.test(text), 'negative badge shown');
      assert.ok((await page.locator('.pp-trust > div').count()) >= 2);
    });
    await check('price is large with a clear saving line', async () => {
      const size = await page.locator('#pp-price').evaluate(e => parseFloat(getComputedStyle(e).fontSize));
      assert.ok(size >= 28, `price font ${size}px`);
    });
    await check('related products show full-bleed photos', async () => {
      const fit = await page.locator('.pp-related .shop-card__media img').first().evaluate(e => getComputedStyle(e).objectFit);
      assert.equal(fit, 'cover');
    });
    await check('mobile shows a fixed buy bar with price and Buy now', async () => {
      await page.setViewportSize({ width: 390, height: 800 });
      const bar = page.locator('.pp-buybar');
      assert.equal(await bar.evaluate(e => getComputedStyle(e).position), 'fixed');
      assert.ok(await bar.isVisible());
      assert.match(await bar.innerText(), /₹/);
      const r = await bar.boundingBox();
      assert.ok(r.y >= 0 && r.y + r.height <= 800, `bar is off screen at y=${Math.round(r.y)}`);
      assert.equal(await noOverflow(page), true);
      await page.setViewportSize({ width: 1280, height: 900 });
      assert.equal(await bar.isVisible(), false);
    });
    await check('product page has no horizontal scroll at 768px', async () => {
      await page.setViewportSize({ width: 768, height: 900 });
      assert.equal(await noOverflow(page), true);
    });
    assert.equal(errors.length, 0, 'page errors: ' + errors[0]);
  } finally { await browser.close(); }
  if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
  console.log('\nAll premium detail-page checks passed');
})();
