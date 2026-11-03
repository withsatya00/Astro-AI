const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const brainDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';

  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(600);

  // Scrolled to show Featured Astrologers + Astro Plus Banner
  await desktopPage.evaluate(() => window.scrollBy(0, 600));
  await desktopPage.waitForTimeout(400);

  await desktopPage.screenshot({
    path: `${brainDir}/homepage_desktop_astroplus_preview.png`,
    fullPage: false,
  });

  console.log('Astro Plus banner screenshot captured!');
  await browser.close();
})();

