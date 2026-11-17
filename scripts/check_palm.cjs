const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/calculators', { waitUntil: 'networkidle' });
  await page.locator('article:has-text("Palmistry")').click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("Sample")').click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("Scan")').click();
  await page.waitForTimeout(3000);
  const text = await page.evaluate(() => document.querySelector('.fixed.inset-0').innerText);
  console.log('--- MODAL TEXT ---\n', text);
  await browser.close();
})();
