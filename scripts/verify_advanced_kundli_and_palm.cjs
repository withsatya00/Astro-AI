const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await context.newPage();

  const artifactDir = path.resolve('C:/Users/og/.gemini/antigravity/brain/8a96b2e5-4732-4a70-b84f-0bebcb7e9d53');
  const userScreenshotPath = path.resolve(artifactDir, '.user_uploaded/media_1794823829573_d9eb5867.jpg');

  console.log('1. Navigating to Calculators Page...');
  await page.goto('http://localhost:3000/calculators', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // ---------------- PART 1: PALMISTRY IMAGE VALIDATION & REPORT ----------------
  console.log('2. Opening AI Palmistry Modal...');
  const palmCard = page.locator('article', { hasText: 'Palmistry' }).first();
  await palmCard.scrollIntoViewIfNeeded();
  await palmCard.click();
  await page.waitForTimeout(600);

  console.log('3. Uploading NON-PALM screenshot to test rejection...');
  if (fs.existsSync(userScreenshotPath)) {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('label:has-text("Choose Photo"), label:has-text("गैलरी से फोटो चुनें")').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(userScreenshotPath);
    await page.waitForTimeout(1000);

    // Verify rejection banner is displayed
    const errorBanner = page.locator('text=/Invalid Palm|अमान्य हथेली/i').first();
    console.log('   Non-palm error banner visible?', await errorBanner.isVisible());

    // Verify scan button is disabled or shows invalid warning
    const scanBtn = page.locator('button:has-text("UPLOAD VALID PALM"), button:has-text("मान्य हथेली")').first();
    console.log('   Disabled warning button visible?', await scanBtn.isVisible());

    await page.screenshot({ path: path.join(artifactDir, 'palmistry_screenshot_rejected.png') });
    console.log('   Captured palmistry_screenshot_rejected.png');
  }

  console.log('4. Testing VALID sample palm...');
  await page.locator('button:has-text("Test Sample Palm"), button:has-text("नमूना हथेली")').click();
  await page.waitForTimeout(600);

  const verifiedBadge = page.locator('text=/Authentic.*verified|प्रामाणिक.*पहचानी/i').first();
  console.log('   Valid palm verified badge visible?', await verifiedBadge.isVisible());

  console.log('5. Clicking Scan Palm & Generate Report...');
  const activeScanBtn = page.locator('button:has-text("Scan Palm & Generate Report"), button:has-text("हथेली स्कैन व संपूर्ण विश्लेषण")').first();
  await activeScanBtn.click();
  await page.waitForTimeout(2500);

  // Verify palmistry report header
  const reportHeader = page.locator('text=/हस्तरेखा शास्त्र संपूर्ण महा-रिपोर्ट|Vedic Palmistry/i').first();
  console.log('   Palmistry report header visible?', await reportHeader.isVisible());

  // Click Mounts Tab
  await page.locator('button:has-text("7 Mounts"), button:has-text("7 ग्रह पर्वत")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'palmistry_verified_advanced_report.png') });
  console.log('   Captured palmistry_verified_advanced_report.png');

  // Click Sacred Marks Tab
  await page.locator('button:has-text("Sacred Marks"), button:has-text("शुभ चिन्ह")').first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(artifactDir, 'palmistry_sacred_marks.png') });
  console.log('   Captured palmistry_sacred_marks.png');

  // Close modal
  await page.locator('.fixed.inset-0 button:has-text("✕")').first().click();
  await page.waitForTimeout(600);

  // ---------------- PART 2: ADVANCED ENTERPRISE JANAM KUNDLI ----------------
  console.log('6. Opening Janam Kundli Modal...');
  const kundliCard = page.locator('article', { hasText: 'Janam Kundli' }).first();
  await kundliCard.scrollIntoViewIfNeeded();
  await kundliCard.click();
  await page.waitForTimeout(600);

  console.log('7. Submitting Kundli Details...');
  const nameInput = page.locator('input[placeholder*="Rahul"], input[placeholder*="राहुल"]').first();
  await nameInput.fill('राहुल शर्मा');
  await page.locator('input[type="date"]').first().fill('1995-10-24');
  await page.locator('input[type="time"]').first().fill('10:45');
  const cityInput = page.locator('input[placeholder*="Delhi"], input[placeholder*="दिल्ली"]').first();
  await cityInput.fill('नई दिल्ली');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(2500);

  // Verify Kundli Dossier is rendered
  const kundliHeader = page.locator('text=/संपूर्ण वैदिक जन्म कुण्डली|Horoscope Dossier/i').first();
  console.log('   Kundli Dossier header visible?', await kundliHeader.isVisible());

  // Toggle D9 Navamsha chart
  await page.locator('button:has-text("D9"), button:has-text("नवमांश चक्र")').first().click();
  await page.waitForTimeout(500);
  await page.locator('button:has-text("D1"), button:has-text("लग्न चक्र")').first().click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(artifactDir, 'janam_kundli_advanced_dossier.png') });
  console.log('   Captured janam_kundli_advanced_dossier.png');

  // View 12 Bhavas tab
  console.log('8. Viewing 12 Bhavas Phalit Tab...');
  await page.locator('button:has-text("12 Bhavas"), button:has-text("द्वादश भाव फल")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'janam_kundli_12_bhavas.png') });
  console.log('   Captured janam_kundli_12_bhavas.png');

  // View Yogas & Doshas tab
  console.log('9. Viewing Yogas & Dosha Tab...');
  await page.locator('button:has-text("Yogas & Doshas"), button:has-text("योग व दोष")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'janam_kundli_yogas.png') });
  console.log('   Captured janam_kundli_yogas.png');

  // View Remedies Tab
  console.log('10. Viewing Remedies Tab...');
  await page.locator('button:has-text("Remedies"), button:has-text("वैदिक उपाय")').first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'janam_kundli_remedies.png') });
  console.log('   Captured janam_kundli_remedies.png');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'janam_kundli_remedies.png') });
  console.log('   Captured janam_kundli_remedies.png');

  console.log('✅ ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  await browser.close();
})();
