const { chromium } = require('@playwright/test');

async function testPhase5() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 950 } });

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNTU3NTMzYy0xMWRmLTQ5M2ItYWIxNy1jZDhkOTM5ZGI3NmIiLCJlbWFpbCI6InRlc3RfZTRkZmZlNTZAYXN0cm9haS5jb20iLCJyb2xlIjoiY2xpZW50IiwiZXhwIjoxNzk0OTA2ODQ5fQ.0CfuCnXtwYWSoAns-Fps4oyX8yPERhLcQFsmvCkiZf4';

  await page.addInitScript((jwt) => {
    localStorage.setItem('astro_user', JSON.stringify({
      id: 'a557533c-11df-493b-ab17-cd8d939db76b',
      name: 'आदित्य शर्मा',
      full_name: 'आदित्य शर्मा',
      email: 'test_e4dffe56@astroai.com',
      role: 'client'
    }));
    localStorage.setItem('astro_access_token', jwt);
  }, token);

  // 1. Test Homepage Onboarding Wizard
  console.log('1. Testing Homepage Onboarding Wizard...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const generateBtn = page.getByRole('button', { name: /पत्रिका बनाएं|Generate Kundli/i });
  if (await generateBtn.isVisible()) {
    console.log('Clicking Generate Kundli button on Homepage...');
    await generateBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'phase5_homepage_onboarding_result.png' });
    console.log('Saved phase5_homepage_onboarding_result.png');
  }

  // 2. Test Wallet Page Transparent Ledger & Receipt Modal
  console.log('2. Testing Wallet Page & Transparent Receipt Modal...');
  await page.goto('http://localhost:3000/wallet', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const receiptBtn = page.getByRole('button', { name: /रसीद|Receipt/i }).first();
  if (await receiptBtn.isVisible()) {
    console.log('Clicking Itemized Receipt button in Wallet...');
    await receiptBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'phase5_transparent_receipt_modal.png' });
    console.log('Saved phase5_transparent_receipt_modal.png');
  } else {
    console.log('Receipt button not found on wallet');
  }

  // 3. Test Trust Center Ethical Charter
  console.log('3. Testing Trust Center Ethical Charter...');
  await page.goto('http://localhost:3000/trust-center', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'phase5_trust_center_charter.png' });
  console.log('Saved phase5_trust_center_charter.png');

  await browser.close();
  console.log('Phase 5 Testing completed successfully!');
}

testPhase5().catch(err => {
  console.error('Error in Phase 5 test:', err);
  process.exit(1);
});
