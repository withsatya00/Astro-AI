const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const brainDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';

  // 1. Desktop Homepage Capture
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);

  await desktopPage.screenshot({
    path: `${brainDir}/homepage_desktop_reference_match.png`,
    fullPage: false,
  });

  // 2. Mobile Homepage Capture
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  await mobilePage.screenshot({
    path: `${brainDir}/homepage_mobile_reference_match.png`,
    fullPage: false,
  });

  // 3. Mobile Scrolled to Featured Astrologers
  await mobilePage.evaluate(() => window.scrollBy(0, 480));
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({
    path: `${brainDir}/homepage_mobile_scrolled_astrologers.png`,
    fullPage: false,
  });

  console.log('Homepage reference screenshots captured successfully!');
  await browser.close();
})();
