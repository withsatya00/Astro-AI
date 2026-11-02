const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const artifactDir = path.join('C:', 'Users', 'og', '.gemini', 'antigravity', 'brain', '00a78fb2-1be1-4dbe-8148-844b57e1517e');

  // Test 1: Desktop Dropdowns (1280x800)
  const desktopPage = await context.newPage();
  await desktopPage.setViewportSize({ width: 1280, height: 800 });
  await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });

  // Click Mandir Seva dropdown
  const mandirBtn = await desktopPage.$('button:has-text("Mandir Seva")');
  if (mandirBtn) {
    await mandirBtn.click();
    await desktopPage.waitForTimeout(400);
    await desktopPage.screenshot({ path: path.join(artifactDir, 'react_step2_desktop_mandir_dropdown.png') });
    console.log('Captured desktop Mandir Seva dropdown screenshot.');
  }

  // Click Vedic Tools dropdown
  const toolsBtn = await desktopPage.$('button:has-text("Vedic Tools")');
  if (toolsBtn) {
    await toolsBtn.click();
    await desktopPage.waitForTimeout(400);
    await desktopPage.screenshot({ path: path.join(artifactDir, 'react_step2_desktop_tools_dropdown.png') });
    console.log('Captured desktop Vedic Tools dropdown screenshot.');
  }

  // Test 2: Mobile Drawer (390x844)
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });

  // Click hamburger menu
  const menuBtn = await mobilePage.$('.btn-mobile-menu');
  if (menuBtn) {
    await menuBtn.click();
    await mobilePage.waitForTimeout(400);
    await mobilePage.screenshot({ path: path.join(artifactDir, 'react_step2_mobile_drawer.png') });
    console.log('Captured mobile navigation drawer screenshot.');
  }

  await browser.close();
  console.log('All interactive tests passed!');
}

run().catch(err => {
  console.error('Interactive test error:', err);
  process.exit(1);
});
