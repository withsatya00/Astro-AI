const { chromium } = require('playwright');
const path = require('path');

async function testAdmin() {
  const browser = await chromium.launch({ headless: true });
  // Start with clean context (no cookies, no localStorage)
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating directly to /admin in clean context...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('--- Screen text preview ---\n', bodyText.slice(0, 300));

  const hasLockText = bodyText.includes('Restricted Admin Access') || bodyText.includes('व्यवस्थापक सुरक्षा द्वार') || bodyText.includes('Admin Login Required');
  console.log('\nIs Admin Lock Gate displayed?:', hasLockText ? 'YES (PASS!)' : 'NO (FAIL!)');

  const artifactDir = path.resolve('C:/Users/og/.gemini/antigravity/brain/8a96b2e5-4732-4a70-b84f-0bebcb7e9d53');
  await page.screenshot({ path: path.join(artifactDir, 'test_clean_admin_gate.png') });

  if (hasLockText) {
    console.log('\nEntering secret passkey to unlock...');
    await page.fill('input[type="password"]', 'astro-jyotish-admin-secret');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const postUnlockText = await page.evaluate(() => document.body.innerText);
    const isUnlocked = postUnlockText.includes('Astro Jyotish Administration') || postUnlockText.includes('एस्ट्रो ज्योतिष प्रबंधन');
    console.log('Is Admin Dashboard unlocked after key?:', isUnlocked ? 'YES (PASS!)' : 'NO (FAIL!)');
    await page.screenshot({ path: path.join(artifactDir, 'test_unlocked_admin_dashboard.png') });
  }

  await browser.close();
}

testAdmin().catch(console.error);
