const { chromium } = require('@playwright/test');

(async () => {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const logs = [];
    page.on('console', msg => logs.push('[' + msg.type() + '] ' + msg.text()));
    page.on('pageerror', err => logs.push('[PAGE ERROR] ' + err.message));

    console.log('--- Visiting /mandir-seva ---');
    await page.goto('http://localhost:8002/mandir-seva', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const mandirHtml = await page.$eval('#view-mandir', el => ({
      display: el.style.display,
      height: el.offsetHeight,
      cardCount: el.querySelectorAll('.mandir-card').length,
      htmlLength: el.innerHTML.length
    }));
    console.log('Mandir View:', mandirHtml);

    console.log('--- Visiting /astro-mall ---');
    await page.goto('http://localhost:8002/astro-mall', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    const mallHtml = await page.$eval('#view-mall', el => ({
      display: el.style.display,
      height: el.offsetHeight,
      prodCount: el.querySelectorAll('.product-card').length,
      htmlLength: el.innerHTML.length
    }));
    console.log('Mall View:', mallHtml);

    console.log('\n--- Logs Captured ---');
    logs.slice(0, 25).forEach(l => console.log(l));

    // Take screenshot of both
    await page.goto('http://localhost:8002/mandir-seva');
    await page.screenshot({ path: 'previews/mandir_seva.png', fullPage: false });
    console.log('Saved previews/mandir_seva.png');

    await page.goto('http://localhost:8002/astro-mall');
    await page.screenshot({ path: 'previews/astro_mall.png', fullPage: false });
    console.log('Saved previews/astro_mall.png');

    await browser.close();
  } catch (err) {
    console.error('Test script error:', err);
  }
})();

