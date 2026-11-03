const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const artifactDir = path.join('C:', 'Users', 'og', '.gemini', 'antigravity', 'brain', '00a78fb2-1be1-4dbe-8148-844b57e1517e');

  // 1. Mobile (390x844) Viewport Test - Directory
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  console.log('Navigating to http://localhost:3000/astrologers on mobile...');
  await mobilePage.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle', timeout: 15000 });

  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_directory_mobile_hero.png'), fullPage: false });
  console.log('Captured mobile directory hero screenshot.');

  // Scroll to search & filters
  await mobilePage.locator('.dir-search-container').scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_directory_mobile_filters.png'), fullPage: false });
  console.log('Captured mobile directory filters screenshot.');

  // Scroll to Astrologer cards grid
  await mobilePage.locator('.home-ref-astro-card').first().scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_directory_mobile_cards.png'), fullPage: false });
  console.log('Captured mobile astrologer cards screenshot.');

  // Test "Help me choose" modal
  const helpBtn = mobilePage.locator('.dir-help-choose-btn');
  if (await helpBtn.count() > 0 && await helpBtn.first().isVisible()) {
    await helpBtn.scrollIntoViewIfNeeded();
    await helpBtn.click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(artifactDir, 'react_directory_mobile_modal.png'), fullPage: false });
    console.log('Captured mobile help modal screenshot.');
    // Close modal via close button
    const closeBtn = mobilePage.locator('.help-modal-close-btn');
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      await mobilePage.keyboard.press('Escape');
    }
    await mobilePage.waitForTimeout(300);
  }

  // 2. Mobile (390x844) Viewport Test - Profile Page
  console.log('Navigating to /astrologers/pt-rameshwar-dwivedi on mobile...');
  await mobilePage.goto('http://localhost:3000/astrologers/pt-rameshwar-dwivedi', { waitUntil: 'networkidle', timeout: 15000 });
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_profile_mobile_hero.png'), fullPage: false });
  console.log('Captured mobile profile hero screenshot.');

  // Scroll to profile booking & reviews
  await mobilePage.evaluate(() => window.scrollBy(0, 500));
  await mobilePage.waitForTimeout(400);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'react_profile_mobile_details.png'), fullPage: false });
  console.log('Captured mobile profile details screenshot.');

  // 3. Desktop (1280x800) Viewport Test - Directory
  const desktopPage = await context.newPage();
  await desktopPage.setViewportSize({ width: 1280, height: 800 });
  await desktopPage.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle', timeout: 15000 });
  await desktopPage.screenshot({ path: path.join(artifactDir, 'react_directory_desktop.png'), fullPage: false });
  console.log('Captured desktop directory screenshot.');

  await browser.close();
  console.log('All Directory & Profile tests completed successfully!');
}

run().catch((err) => {
  console.error('Directory test error:', err);
  process.exit(1);
});
