const { chromium } = require('playwright');
const path = require('path');

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1800 },
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to /mandir-seva/chadhava...');
  try {
    await page.goto('http://localhost:3000/mandir-seva/chadhava', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.log('Direct 3000 failed, trying 127.0.0.1:3000:', e.message);
    await page.goto('http://127.0.0.1:3000/mandir-seva/chadhava', { waitUntil: 'networkidle', timeout: 15000 });
  }

  await page.waitForTimeout(1000);

  // Take Desktop Screenshot
  const desktopPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/chadhava_desktop_view.png');
  await page.screenshot({ path: desktopPath, fullPage: false });
  console.log('Desktop screenshot saved:', desktopPath);

  // Scroll down to offerings section
  const catalog = page.locator('#offerings-catalog');
  if (await catalog.count() > 0) {
    await catalog.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const catalogPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/chadhava_offerings_catalog.png');
    await page.screenshot({ path: catalogPath, fullPage: false });
    console.log('Offerings catalog screenshot saved:', catalogPath);
  }

  // Click '+ Add' on the first offering (Sindoor Arpan) and second (Combo)
  const addButtons = page.locator('button:has-text("+ Add")');
  const count = await addButtons.count();
  console.log('Add buttons found:', count);
  if (count > 0) {
    await addButtons.nth(0).click();
    console.log('Clicked first Add button');
    await page.waitForTimeout(300);
    if (count > 1) {
      await addButtons.nth(1).click();
      console.log('Clicked second Add button');
      await page.waitForTimeout(300);
    }
  }

  // Screenshot with Sticky Cart bar visible
  const cartPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/chadhava_sticky_cart.png');
  await page.screenshot({ path: cartPath, fullPage: false });
  console.log('Sticky cart screenshot saved:', cartPath);

  // Click 'Proceed to Sankalp'
  const proceedBtn = page.locator('button:has-text("Proceed to Sankalp")');
  if (await proceedBtn.count() > 0) {
    await proceedBtn.first().click();
    await page.waitForTimeout(500);
    const modalPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/chadhava_sankalp_modal.png');
    await page.screenshot({ path: modalPath, fullPage: false });
    console.log('Sankalp modal screenshot saved:', modalPath);
  }

  // Mobile Viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/mandir-seva/chadhava', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(800);

  const mobilePath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/chadhava_mobile_view.png');
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log('Mobile screenshot saved:', mobilePath);

  await browser.close();
  console.log('Verification script completed!');
}

verify().catch(err => {
  console.error('Verify failed:', err);
  process.exit(1);
});
