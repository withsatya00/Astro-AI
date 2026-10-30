// Expert profile, consultation booking, home journey and admin tabs against the isolated test stack
// (static frontend on :3100, test-database backend on :8012; see docs/PREMIUM_EXPERIENCE.md).
const {chromium} = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');

const API = 'http://127.0.0.1:8012/api/v1';
const SITE = 'http://localhost:3100';
const testDb = process.env.QA_DB;
// A random far-future day keeps reruns independent of earlier appointments left in the test database.
const DAY = `2033-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`;

(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  try {
    fs.mkdirSync('scratch/expert-booking', {recursive: true});
    const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { window.__API_BASE__ = 'http://127.0.0.1:8012/api/v1'; });

    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    // ---- Home: journey section below the Hero ----
    await page.goto(SITE + '/', {waitUntil: 'networkidle'});
    await page.waitForSelector('.journey-card');
    assert.equal(await page.locator('.journey-card').count(), 4);
    const order = await page.evaluate(() => {
      const hero = document.querySelector('#mount-hero'); const journey = document.querySelector('.journey-section');
      return !!(hero.compareDocumentPosition(journey) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    assert.ok(order, 'journey must come after the hero');
    const hrefs = await page.locator('.journey-card').evaluateAll(a => a.map(x => x.getAttribute('href')));
    assert.deepEqual(hrefs, ['/astrologers', '/calculators', '/mandir-seva', '/astro-mall']);

    // ---- New account: ₹0 wallet, then expert profile ----
    const email = `expert-${Date.now()}@test.in`;
    const register = await page.request.post(API + '/auth/register', {data: {email, password: 'Premium-QA-123!', full_name: 'Expert QA'}});
    assert.equal(register.status(), 201);
    const session = await register.json();
    const auth = {Authorization: 'Bearer ' + session.access_token};
    assert.equal((await (await page.request.get(API + '/wallet', {headers: auth})).json()).balance, 0);

    await page.evaluate(async token => { localStorage.setItem('astro_access_token', token); await window.App.checkUserSession(); }, session.access_token);
    await page.evaluate(() => window.Router.navigate('/astrologers/dr-meenakshi-iyer'));
    await page.waitForSelector('#profile-wallet-estimate .exp-warn');
    const profileText = await page.locator('#profile-page-content').innerText();
    assert.match(profileText, /Why consult this expert\?/);
    const expert = await (await page.request.get(API + '/astrologers/dr-meenakshi-iyer')).json();
    assert.match(profileText, new RegExp(`${expert.experience_years} years of experience`));
    assert.match(profileText, /human astrologer/i);
    assert.doesNotMatch(profileText, /Verified Seeker Reviews/);
    assert.match(await page.locator('.exp-warn').innerText(), /₹600 short for a 15-minute/);

    // Hindi: complete Hindi in the new blocks, no English leftovers from our copy.
    await page.evaluate(() => window.I18n.setLanguage('hi', false));
    await page.evaluate(() => window.App.populateProfileHtml(window.App.profileAstrologer));
    await page.waitForSelector('#profile-wallet-estimate .exp-warn');
    const hindi = await page.locator('#profile-page-content').innerText();
    assert.match(hindi, /इन विशेषज्ञ से परामर्श क्यों लें\?/);
    assert.doesNotMatch(hindi, /Why consult|Book an appointment|Rate per minute|Client reviews/);
    await page.evaluate(() => { window.I18n.setLanguage('en', false); });
    await page.evaluate(() => window.App.populateProfileHtml(window.App.profileAstrologer));
    await page.waitForSelector('#profile-wallet-estimate');

    // ---- Booking: low balance blocks, recharge clears it ----
    await page.click('text=Book an appointment');
    await page.waitForSelector('#modal-appointments.active, #modal-appointments[style*="block"], #modal-appointments:not([hidden])');
    await page.waitForSelector('#booking-wallet-note.exp-booking-note--warn');
    assert.equal(await page.locator('#booking-astrologer-select').inputValue(), (await (await page.request.get(API + '/astrologers/dr-meenakshi-iyer')).json()).id);
    assert.equal(await page.locator('#btn-submit-appointment').isDisabled(), true, 'cannot confirm with an empty wallet');
    const direct = await page.request.post(API + '/wallet/bookings', {headers: auth, data: {astrologer_id: 'dr-meenakshi-iyer', user_name: 'x', scheduled_at: '2032-02-02 10:30', duration_minutes: 30, mode: 'chat'}});
    assert.equal(direct.status(), 402, 'backend enforces the balance too');

    await page.evaluate(() => window.App.rechargeWallet(2000));
    await page.waitForSelector('#booking-wallet-note.exp-booking-note--ok', {timeout: 8000}).catch(async () => {
      await page.evaluate(() => window.App.updateBookingFeePreview());
      await page.waitForSelector('#booking-wallet-note.exp-booking-note--ok');
    });
    assert.equal(await page.locator('#btn-submit-appointment').isDisabled(), false);

    // Pick a far-future date so the slot is unambiguously in the future.
    await page.fill('#booking-date-input', DAY);
    await page.dispatchEvent('#booking-date-input', 'change');
    await page.evaluate(() => { const s = document.querySelector('#booking-slot-select'); s.selectedIndex = 0; });
    await page.selectOption('#booking-duration-select', '30');
    await page.selectOption('#booking-mode-select', 'video');
    await page.click('#btn-submit-appointment');
    await page.waitForSelector('.appointment-record [data-cancel-appointment]');
    let wallet = await (await page.request.get(API + '/wallet', {headers: auth})).json();
    assert.equal(wallet.balance, 2000 - 40 * 30);
    assert.equal(wallet.transactions[0].type, 'debit');
    const notes = await (await page.request.get(API + '/notifications', {headers: auth})).json();
    assert.ok(notes.notifications.some(n => n.title === 'Consultation confirmed'));
    assert.ok(notes.notifications.some(n => n.title === 'Wallet topped up'));

    // The booked slot is now disabled for everyone.
    await page.selectOption('#booking-astrologer-select', expert.id);
    await page.fill('#booking-date-input', DAY);
    await page.dispatchEvent('#booking-date-input', 'change');
    await page.waitForFunction(() => /booked/.test(document.querySelector('#booking-slot-select option')?.textContent || ''));
    assert.match(await page.locator('#booking-slot-select option').first().innerText(), /booked/);

    // Cancellation: full refund, ledger shows the refund.
    page.once('dialog', d => d.accept());
    await page.click('[data-cancel-appointment]');
    await page.waitForFunction(() => !document.querySelector('[data-cancel-appointment]'));
    wallet = await (await page.request.get(API + '/wallet', {headers: auth})).json();
    assert.equal(wallet.balance, 2000);
    assert.equal(wallet.transactions[0].type, 'refund');

    // ---- Layout: no horizontal scroll, light/dark, EN/HI, three widths ----
    await page.evaluate(() => window.Router.navigate('/astrologers/dr-meenakshi-iyer'));
    await page.waitForSelector('#profile-wallet-estimate .exp-ok');
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({width, height: 1000});
      for (const lang of ['en', 'hi']) for (const theme of ['light', 'dark']) {
        await page.evaluate(async ({lang, theme}) => {
          window.I18n.setLanguage(lang, false); document.documentElement.dataset.theme = theme;
          await window.App.populateProfileHtml(window.App.profileAstrologer);
        }, {lang, theme});
        assert.ok(await overflow() <= 0, `profile overflows at ${width}px ${lang} ${theme}`);
        const tooSmall = await page.locator('#profile-page-content button').evaluateAll(bs => bs.filter(b => b.offsetParent && b.getBoundingClientRect().height < 43.5).length);
        assert.equal(tooSmall, 0, `profile buttons under 44px at ${width}px`);
        await page.screenshot({path: `scratch/expert-booking/profile-${width}-${lang}-${theme}.png`, fullPage: true});
      }
      await page.evaluate(() => { window.I18n.setLanguage('en', false); document.documentElement.dataset.theme = 'light'; });
      await page.goto(SITE + '/', {waitUntil: 'networkidle'});
      await page.waitForSelector('.journey-card');
      assert.ok(await overflow() <= 0, `home overflows at ${width}px`);
      for (const theme of ['light', 'dark']) {
        await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
        await page.locator('.journey-section').screenshot({path: `scratch/expert-booking/journey-${width}-${theme}.png`});
      }
      await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
      await page.evaluate(token => { localStorage.setItem('astro_access_token', token); }, session.access_token);
      await page.evaluate(() => window.Router.navigate('/astrologers/dr-meenakshi-iyer'));
      await page.waitForSelector('#profile-wallet-estimate');
    }

    // ---- Admin: new tabs are admin-only and searchable ----
    assert.equal((await page.request.get(API + '/shop-admin/wallet-history', {headers: auth})).status(), 403);
    if (testDb) {
      execFileSync('python', ['-c', `import sqlite3,sys;c=sqlite3.connect(sys.argv[1]);c.execute("update users set role='admin' where email=?",(sys.argv[2],));c.commit()`, testDb, email]);
      await page.setViewportSize({width: 1440, height: 1000});
      await page.evaluate(() => window.Router.navigate('/admin'));
      await page.waitForSelector('#admin-tabs [data-tab="consultations"]');
      for (const [tab, needle] of [['consultations', 'Dr. Meenakshi Iyer'], ['wallet', 'Wallet Recharge'], ['astrologers', 'Dr. Meenakshi Iyer']]) {
        await page.click(`#admin-tabs [data-tab="${tab}"]`);
        await page.waitForSelector('#admin-list form[data-paged="search"]');
        assert.match(await page.locator('#admin-list').innerText(), new RegExp(needle));
      }
      await page.fill('#admin-list input[name="q"]', 'zzz-no-such-record');
      await page.click('#admin-list button[type="submit"]');
      await page.waitForSelector('#admin-list .admin-empty');
      assert.ok(await overflow() <= 0, 'admin overflows');
    }

    assert.deepEqual(errors, [], 'page errors: ' + errors.join('\n'));
    console.log('PASS expert profile, booking (low balance, slots, cancel/refund), journey, locales, themes, widths, admin tabs');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
