// Run against the frontend: node scripts/test_gau_sewa_layout.cjs
// All Gau Sewa API calls are intercepted; no live donation orders are created.
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    let available = false;
    const orders = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('astro_lang', 'en'));
    await page.route('**/api/v1/gau-sewa/**', route => {
      const path = new URL(route.request().url()).pathname;
      const json = path.endsWith('/config') ? { available, reason: 'payments_not_configured', min_amount: 11, max_amount: 100000, presets: [101, 501, 1100] }
        : path.endsWith('/gaushalas') ? { gaushalas: [] }
        : path.endsWith('/updates') ? { updates: [] } : { detail: 'Test checkout unavailable' };
      if (path.endsWith('/donations/order')) orders.push(route.request().postDataJSON());
      return route.fulfill({ status: path.endsWith('/donations/order') ? 503 : 200, json });
    });
    await page.goto('http://localhost:3000/gau-sewa', { waitUntil: 'networkidle' });
    await page.locator('#gs-custom').waitFor();
    assert.equal(await page.locator('.gs-hero-art img').evaluate(img => img.complete && img.naturalWidth > 0), true);

    for (const language of ['en', 'hi']) {
      await page.evaluate(lang => window.I18n.setLanguage(lang, false), language);
      for (const width of [360, 390, 600, 640, 768, 850, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${language}: overflow at ${width}px`);
        const clipped = await page.locator('.gs-hero h1, .gs-hero-copy > p, .gs-purpose-copy').evaluateAll(nodes => nodes.some(node => node.scrollWidth > node.clientWidth + 1));
        assert.equal(clipped, false, `${language}: clipped copy at ${width}px`);
      }
      assert.doesNotMatch(await page.locator('#view-gau-sewa').innerText(), /gs_(hero|step|purpose|amount)_/);
      console.log(`PASS ${language}: banner, descriptions and layout at eight widths`);
    }
    await page.evaluate(() => window.I18n.setLanguage('en', false));
    await page.locator('#gs-custom').fill('777');
    assert.match(await page.locator('.gs-form [type=submit]').innerText(), /777/);
    assert.equal(await page.locator('.gs-form [type=submit]').isDisabled(), true);
    await page.locator('.gs-form').evaluate(form => form.requestSubmit());
    assert.equal(orders.length, 0);
    console.log('PASS custom amount is editable while unavailable; checkout stays blocked');

    available = true;
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#gs-custom').fill('777');
    await page.locator('[data-gs-purpose="general"]').click();
    assert.equal(await page.locator('#gs-custom').inputValue(), '777');
    await page.locator('[data-gs-amount="1100"]').click();
    assert.equal(await page.locator('#gs-custom').inputValue(), '');
    assert.match(await page.locator('.gs-form [type=submit]').innerText(), /1,100/);
    await page.locator('#gs-name').fill('Test Donor');
    for (const invalid of ['10', '100001', '12.5', 'abc']) {
      await page.locator('#gs-custom').fill(invalid);
      await page.locator('.gs-form').evaluate(form => form.requestSubmit());
      await page.locator('#gs-custom[aria-invalid="true"]').waitFor();
    }
    assert.equal(orders.length, 0);
    await page.locator('#gs-custom').fill('777');
    const request = page.waitForRequest('**/api/v1/gau-sewa/donations/order');
    await page.locator('.gs-form').evaluate(form => form.requestSubmit());
    await request;
    assert.equal(orders[0].amount, 777);
    assert.equal(orders[0].purpose, 'general');
    console.log('PASS amount limits, whole rupees, preset switching and exact custom order amount');
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
