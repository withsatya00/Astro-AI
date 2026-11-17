const { chromium } = require('@playwright/test');

async function testPhase2() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. Set devotee auth session
  await page.addInitScript(() => {
    localStorage.setItem('astro_user', JSON.stringify({
      id: 'devotee-101',
      name: 'आदित्य शर्मा',
      full_name: 'आदित्य शर्मा',
      email: 'devotee@astrojyotish.com',
      role: 'client',
      phone: '9876543210'
    }));
    localStorage.setItem('astro_access_token', 'mock_token_devotee_101');
    localStorage.setItem('astro_profile_rashi', 'Singh (Leo)');
    localStorage.setItem('astro_profile_gotra', 'Kashyapa (कश्यप)');
    localStorage.setItem('astro_profile_ishta', 'भगवान शिव');
  });

  // 2. Open /profile
  await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'phase2_profile_consults.png' });
  console.log('Saved phase2_profile_consults.png');

  // 3. Switch to Vedic Kundli Profile Tab
  await page.getByRole('button', { name: /Vedic Kundli|वैदिक कुंडली/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'phase2_profile_sadhana.png' });
  console.log('Saved phase2_profile_sadhana.png');

  // 4. Switch to Mandir Seva & Orders Tab
  await page.getByRole('button', { name: /Mandir Seva & Orders|मंदिर सेवा एवं संकल्प/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'phase2_profile_sevas.png' });
  console.log('Saved phase2_profile_sevas.png');

  // 5. Click Watch Video Proof button
  const watchBtn = page.getByRole('button', { name: /संकल्प वीडियो|Watch Video/i }).first();
  if (await watchBtn.isVisible()) {
    await watchBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'phase2_video_modal.png' });
    console.log('Saved phase2_video_modal.png');
  }

  // 6. Open /bhakti to check Kundli Sadhana Sync badge
  await page.goto('http://localhost:3000/bhakti', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'phase2_bhakti_sync.png' });
  console.log('Saved phase2_bhakti_sync.png');

  await browser.close();
}

testPhase2();
