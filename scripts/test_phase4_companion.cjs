const { chromium } = require('@playwright/test');

async function testPhase4() {
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
    localStorage.setItem('astro_profile_rashi', 'Singh (Leo)');
  }, token);

  console.log('1. Navigating to /profile...');
  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click on the Vedic Companion tab
  console.log('2. Clicking on Daily Vedic Companion tab...');
  const companionTab = page.getByRole('button', { name: /दैनिक वैदिक साथी|Vedic Companion/i });
  await companionTab.click();
  await page.waitForTimeout(1200);

  // Take screenshot of Companion tab with Live WhatsApp Mockup
  await page.screenshot({ path: 'phase4_companion_tab.png' });
  console.log('Saved phase4_companion_tab.png');

  // Click "टेस्ट भेजें" button
  const testBtn = page.getByRole('button', { name: /टेस्ट भेजें|Send Test/i });
  if (await testBtn.isVisible()) {
    console.log('3. Clicking Send Test button...');
    await testBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'phase4_test_dispatched.png' });
    console.log('Saved phase4_test_dispatched.png');
  }

  // Navigate to /bhakti to verify the badge in Daily Ritual
  console.log('4. Navigating to /bhakti...');
  await page.goto('http://localhost:3000/bhakti', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'phase4_bhakti_companion_badge.png' });
  console.log('Saved phase4_bhakti_companion_badge.png');

  await browser.close();
  console.log('Phase 4 Vedic Companion test completed successfully!');
}

testPhase4().catch(err => {
  console.error('Error in Phase 4 test:', err);
  process.exit(1);
});
