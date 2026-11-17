const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await mobileContext.newPage();
  const artifactDir = 'C:\\Users\\og\\.gemini\\antigravity\\brain\\8a96b2e5-4732-4a70-b84f-0bebcb7e9d53';

  // 1. Mobile Homepage Top / Hero
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'theme_mobile_homepage_v2.png'), fullPage: false });

  // 2. Mobile Nav Drawer
  const hamburger = page.locator('button[aria-label*="menu" i], .navbar-hamburger, .nav-hamburger, button:has-text("☰")').first();
  if (await hamburger.isVisible()) {
    await hamburger.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, 'theme_mobile_nav_drawer_v2.png'), fullPage: false });
    // Close drawer
    const closeBtn = page.locator('.mobile-drawer-close, button:has-text("✕")').first();
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  // 3. Mobile Astrologers Directory
  await page.goto('http://127.0.0.1:3000/astrologers', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'theme_mobile_astrologers_v2.png'), fullPage: false });

  console.log('Mobile screenshots captured successfully!');
  await browser.close();
})();
