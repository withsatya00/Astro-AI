// Global search, trust panel, SEO, image loading, privacy controls and PWA wiring (test stack: :3100 + :8012).
const {chromium} = require('@playwright/test');
const assert = require('node:assert/strict');
const API = 'http://127.0.0.1:8012/api/v1';
(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  try {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { window.__API_BASE__ = 'http://127.0.0.1:8012/api/v1'; });
    await page.goto('http://localhost:3100/', {waitUntil: 'networkidle'});

    // PWA + SEO basics
    assert.equal(await page.locator('link[rel=manifest]').getAttribute('href'), '/manifest.webmanifest');
    assert.match(await page.title(), /Vedic Astrology/);
    assert.match(await page.locator('script#seo-jsonld').innerText(), /Organization/);
    await page.evaluate(() => window.Router.navigate('/mandir-seva'));
    assert.match(await page.title(), /Mandir Seva/);
    await page.evaluate(() => window.Router.navigate('/admin'));
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'), 'noindex, nofollow');
    await page.evaluate(() => window.Router.navigate('/astrologers/dr-meenakshi-iyer'));
    await page.waitForSelector('#profile-page-content .profile-name-text');
    assert.match(await page.title(), /Meenakshi Iyer/);
    assert.match(await page.locator('script#seo-jsonld').innerText(), /"@type":"Person"/);
    await page.evaluate(() => window.Router.navigate('/'));

    // Trust panel (real counts) in both languages
    await page.waitForSelector('.trust-panel li');
    const en = await page.locator('.trust-panel').innerText();
    assert.match(en, /\d+ profiles listed: \d+ verified astrologers and \d+ instant guidance services/);
    await page.evaluate(() => window.I18n.setLanguage('hi', false));
    await page.waitForFunction(() => /ज्योतिषी सूचीबद्ध/.test(document.querySelector('.trust-panel')?.innerText || ''));
    await page.evaluate(() => window.I18n.setLanguage('en', false));

    // Images below the fold are lazy; hero images are not touched
    const lazy = await page.evaluate(() => [...document.querySelectorAll('img')].filter(i => !i.closest('#mount-hero, .site-navbar, .top-promo-bar')).every(i => i.loading === 'lazy' || i.hasAttribute('loading')));
    assert.ok(lazy);

    // Global search: astrologer + temple + product, opened from the navbar and from "/"
    await page.click('[data-global-search]');
    await page.fill('.gs-input', 'meenakshi');
    await page.waitForSelector('.gs-row');
    assert.match(await page.locator('.gs-results').innerText(), /Meenakshi/);
    await page.click('.gs-row');
    await page.waitForFunction(() => location.pathname.startsWith('/astrologers/'));
    await page.keyboard.press('/');
    await page.fill('.gs-input', 'rudraksha');
    await page.waitForSelector('.gs-row');
    assert.match(await page.locator('.gs-results h3').first().innerText(), /products|astrologers|temples/i);
    await page.fill('.gs-input', 'zzzzqq');
    await page.waitForFunction(() => /Nothing matches/.test(document.querySelector('.gs-results')?.innerText || ''));
    await page.click('[data-gs-close]');

    // Privacy: download data, delete account with password
    const email = `priv-${Date.now()}@test.in`;
    const reg = await (await page.request.post(API + '/auth/register', {data: {email, password: 'Premium-QA-123!', full_name: 'Privacy QA'}})).json();
    await page.evaluate(async t => { localStorage.setItem('astro_access_token', t); await window.App.checkUserSession(); }, reg.access_token);
    await page.evaluate(() => window.ServiceInfo ? 0 : 0);
    await page.click('[data-service-info=privacy]');
    await page.waitForSelector('[data-export-data]');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('[data-export-data]')]);
    assert.equal(download.suggestedFilename(), 'astro-jyotish-my-data.json');
    page.once('dialog', d => d.accept());
    await page.fill('[data-delete-form] input[name=password]', 'wrong-password');
    await page.click('[data-delete-form] button[type=submit]');
    await page.waitForSelector('[data-delete-error]:not([hidden])');
    page.once('dialog', d => d.accept());
    await page.fill('[data-delete-form] input[name=password]', 'Premium-QA-123!');
    await page.click('[data-delete-form] button[type=submit]');
    await page.waitForFunction(() => !localStorage.getItem('astro_access_token'));
    assert.equal((await page.request.post(API + '/auth/login', {data: {email, password: 'Premium-QA-123!'}})).ok(), false);

    assert.deepEqual(errors, [], errors.join('\n'));
    console.log('PASS premium pack: search, trust panel (EN/HI), SEO + JSON-LD, lazy images, data export/delete, PWA link');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
