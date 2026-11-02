const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });
  const page = await context.newPage();

  const outDir = path.resolve('scratch/mobile_screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const routes = [
    { url: 'http://localhost:3000/', name: '01_homepage_hero.png' },
    { url: 'http://localhost:3000/astrologers', name: '02_astrologers_mobile.png' },
    { url: 'http://localhost:3000/astro-mall', name: '03_astro_mall_mobile.png' },
    { url: 'http://localhost:3000/mandir-seva', name: '04_mandir_seva_mobile.png' },
    { url: 'http://localhost:3000/mandir-seva/mahakaleshwar-ujjain', name: '05_temple_detail_mobile.png' }
  ];

  for (const item of routes) {
    try {
      console.log(`Taking screenshot for ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'load' });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outDir, item.name), fullPage: false });
      console.log(`Saved ${item.name}`);
    } catch (e) {
      console.error(`Error on ${item.url}:`, e.message);
    }
  }

  await browser.close();
  console.log('All mobile screenshots captured successfully!');
})();
