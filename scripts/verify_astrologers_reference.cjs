const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Test (1440x1100)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 1100 }
  });
  const page = await desktopContext.newPage();
  console.log('Desktop 1440x1100...');
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(artifactDir, 'astrologers_desktop_reference_match.png'),
    fullPage: false
  });

  await page.evaluate(() => {
    window.scrollTo({ top: 380, behavior: 'instant' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(artifactDir, 'astrologers_desktop_cards_match.png'),
    fullPage: false
  });

  // 2. Mobile Test (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  console.log('Mobile 390x844...');
  await mobilePage.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  await mobilePage.screenshot({
    path: path.join(artifactDir, 'astrologers_mobile_top_match.png'),
    fullPage: false
  });

  await mobilePage.evaluate(() => {
    window.scrollTo({ top: 460, behavior: 'instant' });
  });
  await mobilePage.waitForTimeout(800);
  await mobilePage.screenshot({
    path: path.join(artifactDir, 'astrologers_mobile_cards_match.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Captured all verification snapshots!');
})();
