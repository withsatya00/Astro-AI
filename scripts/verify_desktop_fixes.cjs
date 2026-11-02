const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const artifactDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('1. Testing Home Hero...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_desktop_home_hero.png'), fullPage: false });

  console.log('2. Testing Astrologers Directory...');
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_desktop_directory.png'), fullPage: false });

  console.log('3. Testing Gau Sewa Layout...');
  await page.goto('http://localhost:3000/gau-sewa', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_desktop_gausewa.png'), fullPage: false });

  console.log('4. Testing Astro Mall Products Grid...');
  await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_desktop_mall.png'), fullPage: false });

  console.log('All screenshots captured successfully!');
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
