const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const artifactDir = 'C:\\Users\\og\\.gemini\\antigravity\\brain\\8a96b2e5-4732-4a70-b84f-0bebcb7e9d53';
  
  await page.goto('http://127.0.0.1:3000/calculators', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // Click Janam Kundli card
  const articles = page.locator('#calc-grid article');
  await articles.nth(2).click();
  await page.waitForTimeout(800);
  
  // Fill Full Name
  const nameInput = page.locator('input[placeholder*="Rahul Sharma"], input[type="text"]').first();
  if (await nameInput.isVisible()) {
    await nameInput.fill('Rahul Sharma');
  }

  // Click Generate Accurate Vedic Report
  const genBtn = page.locator('button:has-text("GENERATE ACCURATE VEDIC REPORT")');
  if (await genBtn.isVisible()) {
    await genBtn.click();
    await page.waitForTimeout(3000);
  }
  
  await page.screenshot({ path: path.join(artifactDir, 'theme_kundli_generated_report.png'), fullPage: false });
  console.log('Kundli generated report screenshot taken!');
  await browser.close();
})();
