const {chromium} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(15000);
    const errors = [], network = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../astro-jyotish-premium.html')).href);
    fs.mkdirSync(path.join(__dirname, 'screenshots'), {recursive: true});
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({width, height: 1000});
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => { state.theme = theme; render(); }, theme);
        for (const route of ['home', 'experts', 'mall', 'temples', 'workspace', 'account', 'admin']) {
          await page.evaluate(route => go(route), route);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `Overflow ${width}/${theme}/${route}`);
          assert.equal(await page.locator('img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0)), true, `Image failure ${route}`);
          if (['home', 'account', 'admin'].includes(route)) await page.screenshot({path: path.join(__dirname, `screenshots/${route}-${width}-${theme}.png`), fullPage: true, animations: 'disabled'});
        }
      }
    }
    await page.evaluate(() => { state.lang = 'hi'; go('account'); });
    assert.match(await page.locator('#app').innerText(), /प्रोफ़ाइल|सारांश/);
    await page.locator('.wallet-card [data-action="wallet"]').click();
    await page.locator('[data-recharge="100"]').click();
    assert.equal(await page.evaluate(() => state.wallet), 1050);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { state.lang = 'en'; go('mall'); });
    await page.locator('[data-product="0"]').first().click();
    await page.locator('[data-add="0"]').click();
    assert.equal(await page.evaluate(() => state.cart.length), 1);
    await page.keyboard.press('Escape');
    await page.evaluate(() => go('workspace'));
    await page.locator('#chat-input').fill('Preview question');
    await page.locator('#chat-form button').click();
    assert.equal(await page.evaluate(() => state.messages.length), 2);
    await page.evaluate(() => { go('admin'); state.adminTab = 'content'; render(); });
    await page.locator('#cms-title').fill('A calmer, clearer tomorrow.');
    await page.locator('#content-form button').click();
    await page.evaluate(() => go('home'));
    assert.equal(await page.locator('.hero h1').innerText(), 'A calmer, clearer tomorrow.');
    await page.evaluate(() => { go('admin'); state.adminTab = 'orders'; render(); });
    await page.locator('[data-order-update="0"]').click();
    assert.equal(await page.evaluate(() => state.orderStatus[0]), 'Preparing');
    assert.deepEqual(errors, []);
    assert.deepEqual(network, [], 'HTML must work fully offline');
    console.log('PASS offline preview: 7 screens × 3 widths × 2 themes; images, Hindi, wallet demo, product bag, chat, CMS and admin controls.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
