const {chromium} = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    fs.mkdirSync('scratch/premium-features', {recursive: true});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { window.__API_BASE__ = 'http://127.0.0.1:8012/api/v1'; });
    await page.goto('http://localhost:3100/dashboard');
    await page.waitForSelector('[data-dashboard-login]');
    assert.equal(await page.locator('.exp-wallet').count(), 0);
    const register = await page.request.post('http://127.0.0.1:8012/api/v1/auth/register', {data: {email: `premium-${Date.now()}@test.in`, password: 'Premium-QA-123!', full_name: 'Premium QA'}});
    assert.equal(register.status(), 201);
    const session = await register.json();
    await page.evaluate(async token => { localStorage.setItem('astro_access_token', token); await window.App.checkUserSession(); }, session.access_token);
    await page.waitForSelector('.exp-wallet');
    assert.equal(await page.locator('.exp-wallet > strong').innerText(), '₹0');
    assert.equal(await page.locator('#view-dashboard [role="alert"]').count(), 0, 'all dashboard sources should load');
    const auth = {Authorization: 'Bearer ' + session.access_token};
    await page.evaluate(() => window.App.rechargeWallet(1000));
    assert.equal(await page.locator('.exp-wallet > strong').innerText(), '₹1,000', 'dashboard should update after wallet recharge');
    const temple = await (await page.request.get('http://127.0.0.1:8012/api/v1/mandir/temples/mahakaleshwar-ujjain?lang=en')).json();
    const booking = await page.request.post('http://127.0.0.1:8012/api/v1/mandir/chadawa/book', {headers: auth, data: {offering_id: temple.offerings[0].id, devotee_name: 'Premium QA', gotra: 'Kashyap', include_prasad: false}});
    assert.equal(booking.status(), 200);
    await page.evaluate(() => window.Router.navigate('/astro-mall'));
    await page.waitForSelector('#products-grid [data-compare]');
    let releaseCatalog;
    const catalogGate = new Promise(resolve => { releaseCatalog = resolve; });
    const catalogRoute = '**/api/v1/marketplace/products?*';
    await page.route(catalogRoute, async route => { await catalogGate; await route.continue(); });
    await page.evaluate(() => { void window.AstroMallPageComponent.loadProducts(); });
    await page.waitForSelector('#mall-loading-state .exp-skeleton');
    releaseCatalog();
    await page.waitForSelector('#products-grid [data-compare]');
    await page.unroute(catalogRoute);
    const ids = await page.locator('#products-grid [data-compare]').evaluateAll(bs => bs.slice(0, 4).map(b => b.dataset.compare));
    for (const id of ids) await page.locator(`#products-grid [data-compare="${id}"]`).click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('astro_compare_v1')).length), 3);
    await page.locator('#view-mall [data-open-compare]').click();
    await page.waitForSelector('.exp-compare-table');
    assert.equal(await page.locator('.exp-compare-table thead th').count(), 4);
    await page.setViewportSize({width: 375, height: 900});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    await page.screenshot({path: 'scratch/premium-features/compare-375.png'});
    await page.setViewportSize({width: 1440, height: 1000});
    await page.locator('[data-remove-compare]').first().click();
    await page.waitForFunction(() => document.querySelectorAll('.exp-compare-table thead th').length === 3);
    await page.keyboard.press('Escape');
    for (const id of ids.slice(0, 2)) {
      await page.evaluate(id => window.Router.navigate('/astro-mall/product/' + id), id);
      await page.waitForSelector('#view-product .pp-title');
    }
    // Exercise a seller's multi-image gallery without modifying the catalog database.
    const galleryRoute = `**/api/v1/marketplace/products/${ids[1]}?*`;
    await page.route(galleryRoute, async route => {
      const response = await route.fetch();
      const product = await response.json();
      product.images = [product.image_url, '/assets/img/products/rudraksha-5.jpg'];
      await route.fulfill({response, json: product});
    });
    await page.evaluate(id => window.ProductPageComponent.open(id, true), ids[1]);
    await page.locator('[data-thumb="1"]').click();
    assert.match(await page.locator('#pp-photo-count').innerText(), /2 \/ 2/);
    assert.equal(await page.locator('[data-thumb="1"]').getAttribute('aria-pressed'), 'true');
    await page.unroute(galleryRoute);
    await page.waitForSelector('#view-product .exp-shelf');
    await page.locator('#pp-pin').fill('123');
    await page.locator('#pp-pin-form button').click();
    assert.match(await page.locator('#pp-pin-res').getAttribute('class'), /is-bad/);
    await page.locator('#pp-pin').fill('110001');
    await page.locator('#pp-pin-form button').click();
    assert.match(await page.locator('#pp-pin-res').getAttribute('class'), /is-ok/);
    await page.locator('#pp-stage').click();
    assert.equal(await page.locator('#pp-lb').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.locator('#pp-wish').click();
    await page.waitForTimeout(600);
    await page.reload();
    await page.waitForSelector('#view-product .pp-title');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('astro_recent_v1')).length), 2);
    await page.evaluate(() => window.Router.navigate('/dashboard'));
    await page.waitForSelector('.exp-wallet');
    await page.waitForSelector('.exp-booking .exp-journey');
    assert.equal(await page.locator('.exp-booking .is-done').count(), 1, 'new booking must show only confirmed stage');
    await page.locator('.exp-dashboard-tabs [data-dashboard-tab="saved"]').click();
    await page.waitForSelector('#view-dashboard .exp-panel .exp-mini-card');
    const failureRoute = '**/api/v1/marketplace/my-orders*';
    await page.route(failureRoute, route => route.fulfill({status: 503, contentType: 'application/json', body: '{"detail":"Unavailable"}'}));
    await page.locator('[data-dashboard-refresh]').click();
    await page.waitForSelector('.exp-dashboard-tabs');
    await page.locator('.exp-dashboard-tabs [data-dashboard-tab="orders"]').click();
    await page.waitForSelector('#view-dashboard [data-exp-retry]');
    await page.unroute(failureRoute);
    await page.locator('#view-dashboard [data-exp-retry]').click();
    await page.waitForSelector('.exp-dashboard-tabs');
    assert.equal(await page.locator('#view-dashboard [role="alert"]').count(), 0);
    fs.mkdirSync('scratch/premium-features', {recursive: true});
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({width, height: 1000});
      for (const lang of ['en', 'hi']) {
        for (const theme of ['light', 'dark']) {
          await page.evaluate(({lang, theme}) => { window.I18n.setLanguage(lang, false); document.documentElement.dataset.theme = theme; }, {lang, theme});
          await page.waitForSelector('.exp-dashboard-tabs');
          await page.locator('.exp-dashboard-tabs [data-dashboard-tab="overview"]').click();
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `dashboard overflow ${width}/${lang}/${theme}`);
          await page.screenshot({path: `scratch/premium-features/dashboard-${width}-${lang}-${theme}.png`, fullPage: true});
        }
      }
    }
    // Timeline only completes stages supported by actual booking fields.
    const timeline = await page.evaluate(async () => {
      const {bookingTimeline} = await import('/src/utils/experience.js');
      const el = document.createElement('div');
      el.innerHTML = bookingTimeline({status: 'PAID', include_prasad: true, created_at: '2026-10-27'});
      const paid = el.querySelectorAll('.is-done').length;
      el.innerHTML = bookingTimeline({status: 'COMPLETED', include_prasad: true});
      const completed = el.querySelectorAll('.is-done').length;
      el.innerHTML = bookingTimeline({status: 'COMPLETED', include_prasad: true, prasad_tracking_id: 'TRACK-QA'});
      return {paid, completed, dispatched: el.querySelectorAll('.is-done').length};
    });
    assert.deepEqual(timeline, {paid: 1, completed: 4, dispatched: 5});
    await page.locator('#view-dashboard [data-clear-recent]').click();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('astro_recent_v1'))), []);
    const second = await (await page.request.post('http://127.0.0.1:8012/api/v1/auth/register', {data: {email: `premium-second-${Date.now()}@test.in`, password: 'Premium-QA-123!', full_name: 'Second account'}})).json();
    await page.evaluate(async token => { localStorage.setItem('astro_access_token', token); await window.App.checkUserSession(); }, second.access_token);
    await page.waitForSelector('.exp-dashboard-tabs');
    await page.locator('.exp-dashboard-tabs [data-dashboard-tab="saved"]').click();
    assert.equal(await page.locator('#view-dashboard .exp-panel .exp-mini-card').count(), 0, 'wishlist must not leak between accounts');
    await page.evaluate(() => window.App.handleLogout());
    await page.waitForSelector('[data-dashboard-login]');
    assert.equal(await page.locator('.exp-wallet').count(), 0, 'logout clears private dashboard');
    assert.deepEqual(errors, []);
    console.log('PASS premium: dashboard auth/privacy, 3-product comparison/removal, wishlist, persistent recently viewed/clear, zoom/PIN, section failure/retry, truthful booking stages, light/dark × English/Hindi × 375/768/1440px.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
