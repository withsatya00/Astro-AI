const { chromium } = require('@playwright/test');

async function testAdminTabs() {
  console.log('Testing Admin Tabs Navigation...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', (err) => {
    console.error('PAGE ERROR:', err.message);
    errors.push(err.message);
  });

  try {
    // 1. Load Admin page
    console.log('Navigating to http://localhost:3000/admin ...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Admin Page Title:', await page.title());

    // 2. Click Mandir Seva Tab
    console.log('Clicking Mandir Seva tab...');
    await page.click('button:has-text("Mandir Seva"), button:has-text("मंदिर सेवा")');
    await page.waitForTimeout(1000);
    const mandirHeading = await page.textContent('h2');
    console.log('Mandir Tab Loaded:', mandirHeading);

    // 3. Click Astro Mall Tab
    console.log('Clicking Astro Mall tab...');
    await page.click('button:has-text("Astro Mall"), button:has-text("एस्ट्रो मॉल")');
    await page.waitForTimeout(1000);
    const mallHeading = await page.textContent('h2');
    console.log('Astro Mall Tab Loaded:', mallHeading);

    // 4. Click Astrologers Tab
    console.log('Clicking Astrologers tab...');
    await page.click('button:has-text("Astrologers"), button:has-text("ज्योतिषी")');
    await page.waitForTimeout(1000);
    const astroHeading = await page.textContent('h2');
    console.log('Astrologers Tab Loaded:', astroHeading);

    // 5. Click Bhakti Tab
    console.log('Clicking Bhakti Audio tab...');
    await page.click('button:has-text("Bhakti Audio"), button:has-text("भक्ति व भजन")');
    await page.waitForTimeout(1000);
    const bhaktiHeading = await page.textContent('h2');
    console.log('Bhakti Tab Loaded:', bhaktiHeading);

    // 6. Click Users / Wallet Tab
    console.log('Clicking Users / Wallet tab...');
    await page.click('button:has-text("Wallet Ledger"), button:has-text("वॉलेट लेजर")');
    await page.waitForTimeout(1000);
    const walletHeading = await page.textContent('h2');
    console.log('Wallet Tab Loaded:', walletHeading);

    // Take screenshot of admin page
    await page.screenshot({ path: 'admin_verified.png' });
    console.log('Saved admin_verified.png');

    if (errors.length > 0) {
      console.error('Encountered errors during test:', errors);
      process.exit(1);
    } else {
      console.log('SUCCESS: All Admin Tabs open and render flawlessly with ZERO errors!');
    }
  } catch (err) {
    console.error('Test failed with exception:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testAdminTabs();
