const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const artifactDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Testing Astrologers Directory Cards scroll...');
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Scroll to cards
  await page.evaluate(() => {
    const el = document.getElementById('directory-page-cards-grid');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'fixed_desktop_directory_cards.png'), fullPage: false });

  console.log('Cards screenshot captured!');
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
