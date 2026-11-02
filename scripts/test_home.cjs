const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const artifactDir = path.join('C:', 'Users', 'og', '.gemini', 'antigravity', 'brain', '00a78fb2-1be1-4dbe-8148-844b57e1517e');

  // 1. Mobile (390x844) Viewport Test
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  console.log('Navigating to http://localhost:3000/ on mobile...');
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });

  // Mobile Screenshot: Top Hero & Journey
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_home_mobile_hero.png'), fullPage: false });
  console.log('Captured mobile hero screenshot.');

  // Scroll to Gau Seva & Quick Services
  await mobilePage.locator('.home-ref-gausewa-banner').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_home_mobile_gausewa.png'), fullPage: false });
  console.log('Captured mobile Gau Seva screenshot.');

  // Scroll to Featured Astrologers
  await mobilePage.locator('#featured-astrologers-section').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_home_mobile_astrologers.png'), fullPage: false });
  console.log('Captured mobile Featured Astrologers screenshot.');

  // Scroll to Panchang & Horoscope
  await mobilePage.locator('#daily-horoscope-component').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_home_mobile_panchang_horoscope.png'), fullPage: false });
  console.log('Captured mobile Panchang & Horoscope screenshot.');

  // Scroll to FAQs & Footer
  await mobilePage.locator('#faq-section').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_home_mobile_faq.png'), fullPage: false });
  console.log('Captured mobile FAQ screenshot.');

  // 2. Desktop (1280x800) Viewport Test
  const desktopPage = await context.newPage();
  await desktopPage.setViewportSize({ width: 1280, height: 800 });
  await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
  await desktopPage.screenshot({ path: path.join(artifactDir, 'react_home_desktop_hero.png'), fullPage: false });
  console.log('Captured desktop hero screenshot.');

  await desktopPage.locator('#featured-astrologers-section').scrollIntoViewIfNeeded();
  await desktopPage.waitForTimeout(400);
  await desktopPage.screenshot({ path: path.join(artifactDir, 'react_home_desktop_astrologers.png'), fullPage: false });
  console.log('Captured desktop astrologers screenshot.');

  await browser.close();
  console.log('All Home Page tests completed successfully!');
}

run().catch((err) => {
  console.error('Home Page test error:', err);
  process.exit(1);
});
