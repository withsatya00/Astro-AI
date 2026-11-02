const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const artifactDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  console.log('Mobile 1. Home...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_mobile_home.png') });

  console.log('Mobile 2. Directory...');
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_mobile_directory.png') });

  console.log('Mobile 3. Gau Sewa...');
  await page.goto('http://localhost:3000/gau-sewa', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_mobile_gausewa.png') });

  console.log('Mobile 4. Mall...');
  await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_mobile_mall.png') });

  console.log('All mobile screenshots captured!');
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
