const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const brainDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';

  console.log('Starting verification of fixes...');

  // 1. Gau Sewa Page
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://localhost:3000/gau-sewa', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const brokenGau = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.src);
  });
  console.log(`[Gau Sewa] Broken images found: ${brokenGau.length}`, brokenGau);

  await page.screenshot({ path: `${brainDir}/fixed_gausewa_verified.png` });

  // Scroll down to cards & updates
  await page.evaluate(() => window.scrollBy(0, 520));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${brainDir}/fixed_gausewa_updates_verified.png` });

  // 2. Mandir Seva Page
  console.log('Checking Mandir Seva Page...');
  await page.goto('http://localhost:3000/mandir-seva', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const totalCardsAll = await page.$$eval('.ch-event', (els) => els.length);
  console.log(`[Mandir Seva] Total cards in 'All Seva Events': ${totalCardsAll}`);
  await page.screenshot({ path: `${brainDir}/fixed_mandir_all_verified.png` });

  // Click 'Special Sankalp Puja' tab
  const pujaTab = await page.getByRole('button', { name: /Special Sankalp Puja/i });
  if (pujaTab) {
    await pujaTab.click();
    await page.waitForTimeout(500);
    const totalPujaCards = await page.$$eval('.ch-event', (els) => els.length);
    console.log(`[Mandir Seva] Cards in 'Special Sankalp Puja': ${totalPujaCards}`);
    await page.screenshot({ path: `${brainDir}/fixed_mandir_puja_tab_verified.png` });
  }

  // Click 'Daily Chadhava' tab
  const chadhavaTab = await page.getByRole('button', { name: /Daily Chadhava/i });
  if (chadhavaTab) {
    await chadhavaTab.click();
    await page.waitForTimeout(500);
    const totalChadhavaCards = await page.$$eval('.ch-event', (els) => els.length);
    console.log(`[Mandir Seva] Cards in 'Daily Chadhava': ${totalChadhavaCards}`);
  }

  // Click 'All Seva Events' back
  const allTab = await page.getByRole('button', { name: /All Seva Events/i });
  if (allTab) {
    await allTab.click();
    await page.waitForTimeout(400);
  }

  // Click Shani & Hanuman filter
  const shaniBtn = await page.getByRole('button', { name: /Shani & Hanuman/i });
  if (shaniBtn) {
    await shaniBtn.click();
    await page.waitForTimeout(400);
    const shaniCards = await page.$$eval('.ch-event', (els) => els.length);
    console.log(`[Mandir Seva] Cards under 'Shani & Hanuman' filter: ${shaniCards}`);
  }

  // 3. Test Clicking a Puja Card directly
  console.log('Testing clicking on a Puja card to open Puja Detail Page...');
  await page.goto('http://localhost:3000/mandir-seva/puja', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Click the first puja card title or CTA button
  const firstPujaCard = await page.$('.ch-event button');
  if (firstPujaCard) {
    await firstPujaCard.click();
    await page.waitForTimeout(800);
    console.log(`[Navigated URL]: ${page.url()}`);
    await page.screenshot({ path: `${brainDir}/fixed_puja_detail_from_click.png` });
  }

  // 4. Test Puja Booking Form Interaction
  console.log('Testing Puja Booking form on Somnath Puja...');
  await page.goto('http://localhost:3000/mandir-seva/puja/somnath-jyotirlinga-gujarat', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(600);

  const nameInput = await page.$("input[placeholder*='Suresh']");
  if (nameInput) await nameInput.fill('Pt. Alok Nath Sharma');
  const gotraInput = await page.$("input[placeholder*='Kashyap']");
  if (gotraInput) await gotraInput.fill('Vashishtha');
  const phoneInput = await page.$("input[placeholder*='10-digit']");
  if (phoneInput) await phoneInput.fill('9876543210');

  const bookBtn = await page.$("button[type='submit']");
  if (bookBtn) {
    await bookBtn.click();
    await page.waitForTimeout(600);
    console.log('Clicked booking submit, capturing receipt modal...');
    await page.screenshot({ path: `${brainDir}/fixed_puja_receipt_modal.png` });
  }

  // 5. Test Temple Detail Page
  console.log('Testing Temple Detail Page on Kedarnath...');
  await page.goto('http://localhost:3000/mandir-seva/temple/kedarnath-dham-uttarakhand', {
    waitUntil: 'networkidle',
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${brainDir}/fixed_temple_detail_kedarnath.png` });

  // 6. Astro Mall Broken Images Check
  console.log('Testing Astro Mall...');
  await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const brokenMall = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.src);
  });
  console.log(`[Astro Mall] Broken images: ${brokenMall.length}`, brokenMall);
  await page.screenshot({ path: `${brainDir}/fixed_astromall_verified.png` });

  await browser.close();
  console.log('All verifications completed successfully!');
})();

