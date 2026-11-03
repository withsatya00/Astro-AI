const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const brainDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Astrologers scrolled to cards
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollBy(0, 650));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${brainDir}/verify_live_astrologers_cards.png` });

  // 2. Mandir Seva scrolled to cards
  await page.goto('http://localhost:3000/mandir-seva', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollBy(0, 650));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${brainDir}/verify_live_mandir_cards.png` });

  // 3. Astro Mall scrolled to products
  await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollBy(0, 650));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${brainDir}/verify_live_mall_products.png` });

  console.log('Cards screenshots captured successfully!');
  await browser.close();
})();
