const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const artifactDir = 'C:\\Users\\og\\.gemini\\antigravity\\brain\\8a96b2e5-4732-4a70-b84f-0bebcb7e9d53';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop Viewport (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await desktopContext.newPage();

  console.log('Testing Desktop 1440px: Homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'theme_desktop_homepage.png'), fullPage: false });

  console.log('Testing Desktop: Astrologers Directory...');
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'theme_desktop_astrologers.png'), fullPage: false });

  console.log('Testing Desktop: Vedic Calculators & Kundli...');
  await page.goto('http://localhost:3000/calculators', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'theme_desktop_calculators.png'), fullPage: false });

  // Open Kundli Modal in Calculators
  const kundliCard = page.locator('text=Janam Kundli').first();
  if (await kundliCard.isVisible()) {
    await kundliCard.click();
    await page.waitForTimeout(600);
    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("कुंडली बनाएं")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: path.join(artifactDir, 'theme_kundli_modal_sage_gold.png'), fullPage: false });
    // Close modal
    const closeBtn = page.locator('button:has-text("✕")').first();
    if (await closeBtn.isVisible()) await closeBtn.click();
  }

  console.log('Testing Desktop: Admin Dashboard...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(artifactDir, 'theme_admin_lock_screen_sage_gold.png'), fullPage: false });
  const adminPassInput = page.locator('input[type="password"]');
  if (await adminPassInput.isVisible()) {
    await adminPassInput.fill('astro-jyotish-admin-secret');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(1500);
  }
  await page.screenshot({ path: path.join(artifactDir, 'theme_admin_dashboard_sage_gold.png'), fullPage: false });

  console.log('Testing Desktop: Consultation Room...');
  await page.goto('http://localhost:3000/consultation', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'theme_consultation_whatsapp_sage.png'), fullPage: false });

  console.log('Testing Desktop: Mandir Seva & Bhakti...');
  await page.goto('http://localhost:3000/mandir-seva', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'theme_mandir_seva_sage_gold.png'), fullPage: false });

  console.log('Testing Desktop: Astro Mall...');
  await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(artifactDir, 'theme_astro_mall_sage_gold.png'), fullPage: false });

  await desktopContext.close();

  // 2. Mobile Viewport (375x812 iPhone X)
  console.log('Testing Mobile Viewport (375x812)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(artifactDir, 'theme_mobile_homepage.png'), fullPage: false });

  // Check hamburger menu drawer
  const hamburgerBtn = mobilePage.locator('.btn-mobile-menu').first();
  if (await hamburgerBtn.isVisible()) {
    await hamburgerBtn.click();
    await mobilePage.waitForTimeout(600);
    await mobilePage.screenshot({ path: path.join(artifactDir, 'theme_mobile_nav_drawer.png'), fullPage: false });
  }

  await mobileContext.close();
  await browser.close();

  console.log('✅ ALL SCREENSHOTS SUCCESSFULLY CAPTURED!');
}

run().catch((err) => {
  console.error('Playwright Error:', err);
  process.exit(1);
});
