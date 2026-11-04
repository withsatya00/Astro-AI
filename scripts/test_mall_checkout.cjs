// Astro Mall checkout, end to end: add to cart, option pricing, validation, a cash-on-delivery order and a wallet order.
// Needs the frontend on :3000 and a backend on :8002 in development mode (test-mode wallet recharge). Run with: npm run test:checkout
const { chromium } = require('@playwright/test');
const assert = require('assert');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
let failed = 0;
const step = async (name, fn) => {
  try { await fn(); console.log(`PASS ${name}`); } catch (e) { failed += 1; console.log(`FAIL ${name} - ${String(e.message).split('\n')[0]}`); }
};

const api = async (path, { method = 'GET', token, body } = {}) => {
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
};

const fill = async (page, { wallet = false } = {}) => {
  const fields = page.locator('.mc-fields input, .mc-fields textarea');
  await fields.nth(1).fill('9876543210');
  await fields.nth(3).fill('12 Temple Road, Varanasi, UP 221001');
  await page.locator(`input[name=method][value=${wallet ? 'WALLET' : 'COD'}]`).check();
};

(async () => {
  const email = `mallcheck-${Date.now()}@test.in`;
  const reg = await api('/api/v1/auth/register', { method: 'POST', body: { email, password: 'Passw0rd!x1', full_name: 'Mall Check' } });
  assert.strictEqual(reg.status, 201, 'could not create the test user');
  const { access_token: token, user } = reg.json;
  assert.strictEqual((await api('/api/v1/wallet/recharge', { method: 'POST', token, body: { amount: 10000 } })).status, 200, 'test-mode recharge needs APP_ENV=development');

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(([t, u]) => { try { localStorage.setItem('astro_access_token', t); localStorage.setItem('astro_user', JSON.stringify(u)); } catch (e) { /* ignore */ } }, [token, user]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await step('shop lists catalogue products from the API', async () => {
    await page.goto(`${BASE}/astro-mall`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.ml-products-grid article');
    assert.ok((await page.locator('.ml-products-grid article').count()) >= 5);
    assert.strictEqual(await page.getByText('sample products are shown').count(), 0);
  });

  await step('adding a plain product twice merges into one cart line', async () => {
    const card = page.locator('.ml-products-grid article', { hasText: 'Tulsi Kanthi' }).first();
    await card.getByRole('button', { name: /Add to Cart/ }).click();
    await page.getByRole('button', { name: '✕' }).click(); // the cart drawer opens on add and covers the grid
    await card.getByRole('button', { name: /Add to Cart/ }).click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('astro_mall_cart_v1')));
    assert.strictEqual(cart.length, 1);
    assert.strictEqual(cart[0].quantity, 2);
  });

  await step('the cart follows the account to another device', async () => {
    await page.waitForTimeout(1200); // the saved copy is written shortly after a change
    const server = (await api('/api/v1/cart', { token })).json.items;
    assert.strictEqual(server.length, 1);
    assert.strictEqual(server[0].quantity, 2);
    const other = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await other.addInitScript(([t, u]) => { try { localStorage.setItem('astro_access_token', t); localStorage.setItem('astro_user', JSON.stringify(u)); } catch (e) { /* ignore */ } }, [token, user]);
    const p2 = await other.newPage();
    await p2.goto(`${BASE}/astro-mall/checkout`, { waitUntil: 'networkidle' });
    await p2.waitForSelector('.mc-lines li');
    assert.match(await p2.locator('.mc-line-title').first().innerText(), /Tulsi/);
    assert.strictEqual(await p2.locator('.mc-qty span').first().innerText(), '2');
    await p2.reload({ waitUntil: 'networkidle' }); // reloading must not double the quantity
    await p2.waitForSelector('.mc-lines li');
    assert.strictEqual(await p2.locator('.mc-qty span').first().innerText(), '2');
    await other.close();
  });

  await step('a product with options opens its page instead of adding blindly', async () => {
    await page.goto(`${BASE}/astro-mall`, { waitUntil: 'networkidle' });
    await page.locator('.ml-products-grid article', { hasText: 'Emerald' }).first().getByRole('button', { name: /Add to Cart/ }).click();
    await page.waitForURL(/\/mall\/product\//);
  });

  await step('choosing an option changes the price and the cart keeps the choice', async () => {
    await page.waitForSelector('h1');
    const price = async () => Number((await page.locator('.text-3xl').first().innerText()).replace(/[^\d]/g, ''));
    const before = await price();
    const select = page.locator('label select').first();
    const last = await select.locator('option').last().getAttribute('value');
    await select.selectOption(last);
    assert.ok((await price()) > before, 'a heavier stone should cost more');
    await page.getByRole('button', { name: /Add to Cart/ }).first().click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('astro_mall_cart_v1')));
    assert.strictEqual(cart.length, 2);
    assert.ok(cart.some((i) => i.options && i.options.ratti === last));
  });

  await step('checkout shows server-priced totals and blocks a gemstone order without the confirmation', async () => {
    await page.goto(`${BASE}/astro-mall/checkout`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.mc-totals');
    const total = Number((await page.locator('.mc-grand dd').innerText()).replace(/[^\d]/g, ''));
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('astro_mall_cart_v1')));
    assert.strictEqual(total, cart.reduce((n, i) => n + i.unit_price * i.quantity, 0));
    await fill(page);
    await page.locator('button[type=submit]').click();
    assert.match(await page.locator('.mc-msg[role=alert]').first().innerText(), /gemstone/i);
  });

  await step('cash on delivery order is placed and the cart is cleared', async () => {
    await page.locator('.mc-check input').check();
    await page.locator('button[type=submit]').click();
    await page.waitForSelector('.mc-done');
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('astro_mall_cart_v1')), '[]');
    const orders = (await api('/api/v1/marketplace/my-orders', { token })).json.orders;
    assert.strictEqual(orders.length, 2);
    assert.ok(orders.every((o) => o.payment_method === 'COD' && o.status === 'PLACED'));
    await page.waitForTimeout(1200);
    assert.strictEqual((await api('/api/v1/cart', { token })).json.items.length, 0, 'the saved cart should be emptied after ordering');
  });

  await step('wallet order is paid from the wallet balance', async () => {
    const before = (await api('/api/v1/wallet', { token })).json.balance;
    await page.goto(`${BASE}/astro-mall`, { waitUntil: 'networkidle' });
    await page.locator('.ml-products-grid article', { hasText: 'Tulsi Kanthi' }).first().getByRole('button', { name: /Add to Cart/ }).click();
    await page.goto(`${BASE}/astro-mall/checkout`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.mc-totals');
    await fill(page, { wallet: true });
    await page.locator('button[type=submit]').click();
    await page.waitForSelector('.mc-done');
    const after = (await api('/api/v1/wallet', { token })).json.balance;
    assert.strictEqual(before - after, 299);
    const orders = (await api('/api/v1/marketplace/my-orders', { token })).json.orders;
    assert.ok(orders.some((o) => o.payment_method === 'WALLET' && o.status === 'PAID'));
  });

  await step('wallet page shows the real balance and tops up through the server', async () => {
    const before = (await api('/api/v1/wallet', { token })).json.balance;
    await page.goto(`${BASE}/wallet`, { waitUntil: 'networkidle' });
    await page.waitForFunction((b) => document.body.innerText.includes(`₹${b.toFixed(2)}`), before);
    await page.getByRole('button', { name: /Add Funds/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: '₹500', exact: true }).click();
    assert.strictEqual(await page.getByText(/Extra|Welcome Bonus/).count(), 0, 'no invented bonus credit');
    await page.getByRole('dialog').getByRole('button', { name: /^Add ₹500/ }).click();
    await page.getByText('₹500 added to your wallet.').waitFor();
    assert.strictEqual((await api('/api/v1/wallet', { token })).json.balance - before, 500);
  });

  await step('an empty cart shows a way back to the shop', async () => {
    await page.goto(`${BASE}/astro-mall/checkout`, { waitUntil: 'networkidle' });
    assert.strictEqual(await page.locator('.mc-empty a[href="/astro-mall"]').count(), 1);
  });

  await step('mobile checkout has no sideways scroll', async () => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(`${BASE}/astro-mall`, { waitUntil: 'networkidle' });
    await page.locator('.ml-products-grid article', { hasText: 'Tulsi Kanthi' }).first().getByRole('button', { name: /Add to Cart/ }).click();
    await page.goto(`${BASE}/astro-mall/checkout`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.mc-totals');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  });

  await step('no runtime errors on the way', async () => { assert.deepStrictEqual(errors, []); });

  await browser.close();
  if (failed) { console.log(`${failed} check(s) failed`); process.exit(1); }
  console.log('All Mall checkout checks passed');
})().catch((e) => { console.error(e); process.exit(1); });
