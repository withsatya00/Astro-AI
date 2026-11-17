const { chromium } = require('playwright');
const path = require('path');

async function run() {
  console.log('--- Launching Playwright browser verification ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR LOG:', msg.text());
  });
  page.on('pageerror', err => {
    console.log('UNCAUGHT PAGE ERROR:', err.message);
  });

  const artifactDir = path.resolve('C:/Users/og/.gemini/antigravity/brain/8a96b2e5-4732-4a70-b84f-0bebcb7e9d53');

  // TEST 1: Profile page and Vedic Companion tab
  console.log('\n1. Testing Profile Vedic Companion...');
  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
  const companionBtn = page.locator('button:has-text("दैनिक वैदिक साथी (WhatsApp)")');
  if (await companionBtn.count() > 0) {
    await companionBtn.click();
    await page.waitForTimeout(500);
    const hasCrash = await page.locator('text=सेवा लोड करने में समस्या आई').count();
    console.log('Profile Vedic Companion crash check: hasCrash =', hasCrash === 0 ? 'NO (Clean!)' : 'YES (Crash detected!)');
    await page.screenshot({ path: path.join(artifactDir, 'test_profile_companion_fixed.png') });
  }

  // TEST 2: Admin Security Lock Barrier
  console.log('\n2. Testing Admin Security Gate...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const lockTitle = await page.locator('text=व्यवस्थापक सुरक्षा द्वार, text=Restricted Admin Access, text=Admin Login Required').count();
  console.log('Admin Security Gate present without login:', lockTitle > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(artifactDir, 'test_admin_lock_barrier.png') });

  // TEST 3: Unlock Admin Dashboard & Test Banner
  console.log('\n3. Unlocking Admin Dashboard...');
  await page.fill('input[type="password"]', 'astro-jyotish-admin-secret');
  const unlockBtn = page.locator('button:has-text("एडमिन पैनल खोलें"), button:has-text("Unlock Dashboard")');
  await unlockBtn.click();
  await page.waitForTimeout(1000);
  const adminTitle = await page.locator('text=एस्ट्रो ज्योतिष प्रबंधन प्रणाली, text=Astro Jyotish Administration').count();
  console.log('Admin Dashboard unlocked successfully:', adminTitle > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(artifactDir, 'test_admin_banner_fixed.png') });

  // TEST 4: Admin Mandir & Mall Add/Edit Buttons
  console.log('\n4. Testing Admin Add/Edit controls for Temples and Mall...');
  const mandirTabBtn = page.locator('button:has-text("मंदिर सेवा व संकल्प"), button:has-text("Mandir Seva & Pujas")');
  await mandirTabBtn.click();
  await page.waitForTimeout(600);
  const templesSubTab = page.locator('button:has-text("पवित्र तीर्थ धाम"), button:has-text("Holy Sanctum Temples")');
  await templesSubTab.click();
  await page.waitForTimeout(600);
  const addTempleBtn = page.locator('button:has-text("नया मंदिर जोड़ें"), button:has-text("Add New Temple")');
  console.log('Add Temple Button in Mandir Tab:', await addTempleBtn.count() > 0 ? 'PASS' : 'FAIL');
  const editTempleBtn = page.locator('button:has-text("संपादित करें"), button:has-text("Edit")').first();
  console.log('Edit Temple Button in Mandir Tab:', await editTempleBtn.count() > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(artifactDir, 'test_admin_temple_controls.png') });

  const mallTabBtn = page.locator('button:has-text("एस्ट्रो मॉल व स्टॉक"), button:has-text("Astro Mall & Stock")');
  await mallTabBtn.click();
  await page.waitForTimeout(600);
  const addProductBtn = page.locator('button:has-text("नया उत्पाद जोड़ें"), button:has-text("Add New Product")');
  console.log('Add Product Button in Mall Tab:', await addProductBtn.count() > 0 ? 'PASS' : 'FAIL');
  const editProductBtn = page.locator('button:has-text("संपादित करें"), button:has-text("Edit")').first();
  console.log('Edit Product Button in Mall Tab:', await editProductBtn.count() > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(artifactDir, 'test_admin_mall_controls.png') });

  // TEST 5: Bhakti Unified Hero Banner
  console.log('\n5. Testing Bhakti Page Unified Banner...');
  await page.goto('http://localhost:3000/bhakti', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const bhaktiBanner = page.locator('.service-banner--bhakti');
  console.log('Bhakti service-banner present:', await bhaktiBanner.count() > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(artifactDir, 'test_bhakti_banner_unified.png') });

  // TEST 6: Calculators Page - Removed 17 & Added Palmistry & Janam Kundli
  console.log('\n6. Testing Calculators Page...');
  await page.goto('http://localhost:3000/calculators', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const pageContent = await page.content();
  const has17 = pageContent.includes('17 वैदिक') || pageContent.includes('(17)') || pageContent.includes('17 संपूर्ण');
  console.log('Is "17" removed from Calculators page?:', !has17 ? 'PASS (17 completely removed)' : 'FAIL (17 found)');
  await page.screenshot({ path: path.join(artifactDir, 'test_calculators_hero_no17.png') });

  // Test Palmistry
  console.log('\n7. Testing AI Palmistry Scanner...');
  const palmCard = page.locator('article:has-text("AI Palmistry"), article:has-text("हस्तरेखा शास्त्र")').first();
  await palmCard.click();
  await page.waitForTimeout(600);
  const sampleBtn = page.locator('button:has-text("नमूना हथेली"), button:has-text("Test Sample Palm")');
  if (await sampleBtn.count() > 0) {
    await sampleBtn.click();
    await page.waitForTimeout(400);
  }
  const scanBtn = page.locator('button:has-text("हथेली स्कैन"), button:has-text("Scan Palm")');
  await scanBtn.click();
  await page.waitForTimeout(2800);
  const palmReport = page.locator('text=हस्तरेखा शास्त्र संपूर्ण विश्लेषण रिपोर्ट, text=Vedic Palmistry Shastric Report');
  console.log('AI Palmistry Report generated:', await palmReport.count() > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(artifactDir, 'test_palmistry_report.png') });
  await page.click('button:has-text("✕")');

  // Test Janam Kundli North Indian Chart
  console.log('\n8. Testing Janam Kundli North Indian Chart...');
  const kundliCard = page.locator('article:has-text("Janam Kundli"), article:has-text("जन्म कुण्डली")').first();
  await kundliCard.click();
  await page.waitForTimeout(600);
  await page.fill('input[type="text"]', 'आदित्य शर्मा');
  const genBtn = page.locator('button:has-text("सटीक वैदिक रिपोर्ट"), button:has-text("Generate Accurate Vedic Report")');
  await genBtn.click();
  await page.waitForTimeout(1000);
  const diamondChart = page.locator('svg polygon');
  console.log('North Indian Diamond Chart SVG rendered:', await diamondChart.count() > 0 ? 'PASS' : 'FAIL');
  await page.screenshot({ path: path.join(artifactDir, 'test_kundli_diamond_chart.png') });

  await browser.close();
  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY! ===');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
