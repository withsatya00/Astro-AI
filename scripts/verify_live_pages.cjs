const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const brainDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Testing Astrologers Directory...');
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${brainDir}/verify_live_astrologers.png` });

  console.log('Testing Mandir Seva...');
  await page.goto('http://localhost:3000/mandir-seva', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${brainDir}/verify_live_mandir_seva.png` });

  console.log('Testing Astro Mall...');
  await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${brainDir}/verify_live_astro_mall.png` });

  console.log('Testing Consultation Room...');
  await page.goto('http://localhost:3000/consultation/pt-rameshwar-dwivedi', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${brainDir}/verify_live_consultation_room.png` });

  console.log('All live pages verified successfully!');
  await browser.close();
})();
