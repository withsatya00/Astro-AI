const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  fs.mkdirSync('scratch/compact-premium', { recursive: true });
  try {
    const page = await browser.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForFunction(() => window.I18n && window.App);
    // Exercise the real components and CSS without any live payment or account mutations.
    await page.evaluate(async () => {
      const { AstrologerCardComponent: Card } = await import('/src/components/AstrologerCard/AstrologerCard.js');
      const { GauSewaPageComponent: Gau } = await import('/src/pages/GauSewaPage/GauSewaPage.js');
      window.testCard = Card;
      window.testGau = Gau;
      window.testExpert = { id: 'layout-test', slug: 'layout-test', name: 'Acharya Dev Sharma', title: 'Vedic Astrologer', languages: ['Hindi', 'English'], experience_years: 12, rating: 4.8, review_count: 1200, specialties: ['Career', 'Marriage'], availability: 'online', price_per_minute: 25, is_ai: false, is_verified: true };
      document.body.innerHTML = '<main id="qa-root"></main>';
      window.renderCards = () => {
        document.querySelector('#qa-root').innerHTML = '<section style="max-width:1184px;margin:24px auto;padding:0 16px"><div id="directory-page-cards-grid">' + Array.from({ length: 6 }, (_, i) => Card.render({ ...window.testExpert, id: 'layout-' + i })).join('') + '</div></section>';
      };
      window.renderGau = (available) => {
        document.querySelector('#qa-root').innerHTML = '<div id="view-gau-sewa"></div>';
        Gau.mount('#view-gau-sewa');
        Gau.view = 'home'; Gau.loadFailed = false; Gau.gaushalas = []; Gau.updates = [];
        Gau.config = { available, reason: 'recipient_not_configured', presets: [101, 501, 1100], min_amount: 1, max_amount: 100000 };
        Gau.render();
      };
    });
    for (const width of [1440, 1024, 768, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => window.renderCards());
      const box = await page.locator('.ac2').first().boundingBox();
      const chatColor = await page.locator('.ac2-btn--chat').first().evaluate(el => {
        const css = getComputedStyle(el);
        return innerWidth <= 640 ? css.color : css.backgroundColor;
      });
      assert.equal(chatColor, 'rgb(61, 40, 81)', 'Chat action must use the brand plum');
      assert(box.height < (width <= 640 ? 180 : 330), `Card too tall at ${width}: ${box.height}`);
      if (width <= 640) {
        const photo = await page.locator('.ac2-photo').first().boundingBox();
        const chat = await page.locator('.ac2-btn--chat').first().boundingBox();
        assert(chat.x > photo.x + photo.width, 'Mobile action should sit beside portrait');
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Cards overflow at ${width}`);
      await page.screenshot({ path: `scratch/compact-premium/cards-${width}.png`, fullPage: true });
      await page.evaluate(() => window.renderGau(true));
      assert.equal(await page.locator('.gs-hero').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(43, 29, 60)');
      await page.locator('[data-gs-amount="1100"]').click();
      assert.equal(await page.evaluate(() => window.testGau.amount()), 1100);
      await page.locator('[data-gs-purpose="chikitsa"]').click();
      assert.equal(await page.evaluate(() => window.testGau.form.purpose), 'chikitsa');
      const columns = await page.locator('.gs-content-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      assert.equal(columns, width > 850 ? 2 : 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Gau page overflow at ${width}`);
      await page.screenshot({ path: `scratch/compact-premium/gau-${width}.png`, fullPage: true });
      await page.evaluate(() => window.renderGau(false));
      assert(await page.locator('.gs-form button[type="submit"]').isDisabled());
    }
    await page.evaluate(() => { window.I18n.setLanguage('hi', false); window.testGau.render(); });
    assert(!await page.locator('#qa-root').innerText().then(s => /gs_illustrative|gs_payment_receipt_hint/.test(s)));
    assert(await page.locator('.gs-illustration figcaption').innerText().then(s => /[\u0900-\u097f]/.test(s)));
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.screenshot({ path: 'scratch/compact-premium/gau-mobile-hindi-dark.png', fullPage: true });
    await page.evaluate(async () => {
      window.renderCards();
      const { DirectoryChips } = await import('/src/components/premium/DirectoryChips.js');
      window.App.astrologersList = [window.testExpert, { ...window.testExpert, id: 'popular', consultations_count: 2300 }];
      DirectoryChips.renderRecommendations();
      window.testChips = DirectoryChips;
    });
    assert.equal(await page.locator('.directory-expert-row').count(), 1, 'Do not invent rankings without consultation counts');
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Sidebar overflow at ${width}`);
      assert(await page.evaluate(() => {
        const experts = document.querySelector('.directory-recommendations');
        const grid = document.querySelector('#directory-page-cards-grid');
        const a = experts.getBoundingClientRect(), g = grid.getBoundingClientRect();
        return innerWidth > 1000
          ? a.left >= g.right && a.top >= g.top
          : !!(experts.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING) && a.bottom <= g.top;
      }), `Expert recommendations must appear beside desktop cards and above mobile cards at ${width}`);
    }
    await page.evaluate(() => { window.App.astrologersList = []; window.testChips.renderRecommendations(); });
    assert(await page.locator('.directory-recommendations').isHidden());
    console.log('PASS compact cards and Gau Sewa: 5 viewport sizes, purpose/amount selection, disabled checkout, Hindi and dark theme.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
