const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const brainDir = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e';
  
  const pages = [
    { url: 'http://localhost:3000/astrologers', name: 'astrologers' },
    { url: 'http://localhost:3000/mandir-seva', name: 'mandir_seva' },
    { url: 'http://localhost:3000/gau-sewa', name: 'gau_sewa' },
    { url: 'http://localhost:3000/astro-mall', name: 'astro_mall' },
  ];

  for (const p of pages) {
    await page.goto(p.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${brainDir}/check_${p.name}.png` });
    console.log(`Page ${p.name} rendered cleanly.`);
  }

  await browser.close();
})();

