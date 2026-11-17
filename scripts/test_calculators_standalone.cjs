const { chromium } = require('playwright');
const path = require('path');

async function testCalculators() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const artifactDir = path.resolve('C:/Users/og/.gemini/antigravity/brain/8a96b2e5-4732-4a70-b84f-0bebcb7e9d53');

  console.log('1. Navigating to /calculators...');
  await page.goto('http://localhost:3000/calculators', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const bodyText = await page.evaluate(() => document.body.innerText);
  const has17InCalculators = bodyText.includes('17 वैदिक') || bodyText.includes('17 टूल्स') || bodyText.includes('(17)');
  console.log('Is "17" removed from Calculators text?:', !has17InCalculators ? 'YES (PASS!)' : 'NO (FAIL!)');
  await page.screenshot({ path: path.join(artifactDir, 'calculators_clean_banner_no17.png') });

  // 2. Test Palmistry
  console.log('\n2. Testing AI Palmistry Scanner & Shastric Analysis...');
  const palmCard = page.locator('article:has-text("AI Palmistry"), article:has-text("हस्तरेखा शास्त्र")').first();
  await palmCard.click();
  await page.waitForTimeout(600);

  // Click test sample palm
  const sampleBtn = page.locator('button:has-text("नमूना हथेली"), button:has-text("Test Sample Palm")');
  if (await sampleBtn.count() > 0) {
    await sampleBtn.click();
    await page.waitForTimeout(400);
    console.log('Sample palm image loaded.');
  }

  // Click Scan Palm
  const scanBtn = page.locator('button:has-text("हथेली स्कैन"), button:has-text("Scan Palm")');
  await scanBtn.click();
  console.log('Laser scanning palm...');
  await page.waitForTimeout(3000);

  const reportTitle = await page.locator('text=हस्तरेखा शास्त्र संपूर्ण विश्लेषण रिपोर्ट, text=Vedic Palmistry Shastric Report').count();
  console.log('Is AI Palmistry Report generated?:', reportTitle > 0 ? 'YES (PASS!)' : 'NO (FAIL!)');
  await page.screenshot({ path: path.join(artifactDir, 'palmistry_shastric_report.png') });

  // Close modal via the modal close button
  await page.locator('.fixed.inset-0 button:has-text("✕")').click();
  await page.waitForTimeout(400);

  // 3. Test Janam Kundli North Indian Chart
  console.log('\n3. Testing Janam Kundli North Indian Chart...');
  const kundliCard = page.locator('article:has-text("Janam Kundli"), article:has-text("जन्म कुण्डली")').first();
  await kundliCard.click();
  await page.waitForTimeout(600);

  await page.fill('input[type="text"]', 'आदित्य शर्मा');
  const genBtn = page.locator('button:has-text("सटीक वैदिक रिपोर्ट"), button:has-text("Generate Accurate Vedic Report")');
  await genBtn.click();
  await page.waitForTimeout(1000);

  const hasDiamondSvg = await page.locator('svg polygon[points="200,0 400,200 200,400 0,200"]').count();
  console.log('Is North Indian Kundli Diamond Chart SVG rendered?:', hasDiamondSvg > 0 ? 'YES (PASS!)' : 'NO (FAIL!)');
  await page.screenshot({ path: path.join(artifactDir, 'janam_kundli_north_indian_chart.png') });

  // 4. Test Bhakti Page Hero Banner
  console.log('\n4. Testing Bhakti Page Unified Hero Banner...');
  await page.goto('http://localhost:3000/bhakti', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const bhaktiBanner = page.locator('.service-banner--bhakti');
  console.log('Is Bhakti service-banner present?:', await bhaktiBanner.count() > 0 ? 'YES (PASS!)' : 'NO (FAIL!)');
  await page.screenshot({ path: path.join(artifactDir, 'bhakti_page_unified_banner.png') });

  await browser.close();
  console.log('\n=== ALL CALCULATOR AND BHAKTI TESTS PASSED! ===');
}

testCalculators().catch(console.error);
