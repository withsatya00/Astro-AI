const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const artifactDir = path.join('C:', 'Users', 'og', '.gemini', 'antigravity', 'brain', '00a78fb2-1be1-4dbe-8148-844b57e1517e');

  // 1. Mobile (390x844) Viewport Tests
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });

  // 1.1 Mandir Seva Page
  console.log('Testing /mandir-seva on mobile...');
  await mobilePage.goto('http://localhost:3000/mandir-seva', { waitUntil: 'networkidle', timeout: 15000 });
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_mandir_mobile_hero.png'), fullPage: false });

  await mobilePage.evaluate(() => window.scrollBy(0, 480));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_mandir_mobile_cards.png'), fullPage: false });
  console.log('Captured /mandir-seva mobile screenshots.');

  // 1.2 Temple Details & Interactive Gallery Page (Mahakaleshwar)
  console.log('Testing /mandir-seva/temple/mahakaleshwar-ujjain on mobile...');
  await mobilePage.goto('http://localhost:3000/mandir-seva/temple/mahakaleshwar-ujjain', { waitUntil: 'networkidle', timeout: 15000 });
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_temple_mobile_gallery.png'), fullPage: false });

  // Test slider next photo button
  const nextBtn = mobilePage.locator('button[aria-label="Next image"]');
  if (await nextBtn.count() > 0) {
    await nextBtn.click({ force: true });
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(artifactDir, 'react_temple_mobile_slider_next.png'), fullPage: false });
  }

  await mobilePage.evaluate(() => window.scrollBy(0, 600));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_temple_mobile_offerings.png'), fullPage: false });
  console.log('Captured Temple Detail & Gallery mobile screenshots.');

  // 1.3 Gau Sewa Page
  console.log('Testing /gau-sewa on mobile...');
  await mobilePage.goto('http://localhost:3000/gau-sewa', { waitUntil: 'networkidle', timeout: 15000 });
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_gausewa_mobile_hero.png'), fullPage: false });

  await mobilePage.evaluate(() => window.scrollBy(0, 550));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_gausewa_mobile_form.png'), fullPage: false });
  console.log('Captured Gau Sewa mobile screenshots.');

  // 1.4 Vedic Astro Mall Page
  console.log('Testing /mall on mobile...');
  await mobilePage.goto('http://localhost:3000/mall', { waitUntil: 'networkidle', timeout: 15000 });
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_mall_mobile_hero.png'), fullPage: false });

  await mobilePage.evaluate(() => window.scrollBy(0, 500));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_mall_mobile_grid.png'), fullPage: false });
  console.log('Captured Astro Mall mobile screenshots.');

  // 1.5 Calculators Suite Page
  console.log('Testing /calculators on mobile...');
  await mobilePage.goto('http://localhost:3000/calculators', { waitUntil: 'networkidle', timeout: 15000 });
  await mobilePage.evaluate(() => window.scrollBy(0, 400));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_calculators_mobile_grid.png'), fullPage: false });
  console.log('Captured Calculators mobile screenshots.');

  // 2. Desktop (1280x800) Viewport Tests
  const desktopPage = await context.newPage();
  await desktopPage.setViewportSize({ width: 1280, height: 800 });

  await desktopPage.goto('http://localhost:3000/mandir-seva', { waitUntil: 'networkidle', timeout: 15000 });
  await desktopPage.screenshot({ path: path.join(artifactDir, 'react_mandir_desktop.png'), fullPage: false });

  await desktopPage.goto('http://localhost:3000/mall', { waitUntil: 'networkidle', timeout: 15000 });
  await desktopPage.screenshot({ path: path.join(artifactDir, 'react_mall_desktop.png'), fullPage: false });
  console.log('Captured Desktop screenshots.');

  await browser.close();
  console.log('Step 5 Playwright visual verification completed successfully!');
}

run().catch((err) => {
  console.error('Step 5 test error:', err);
  process.exit(1);
});
