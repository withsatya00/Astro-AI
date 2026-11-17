const { chromium } = require('@playwright/test');

async function auditAllBhaktiRoutes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const routes = [
    '/bhakti',
    '/bhakti/shankaracharya',
    '/bhakti/aarti-chalisa',
    '/bhakti/mandir-darshan',
    '/bhakti/bhajan-radio',
    '/bhakti/puja-vidhi',
    '/bhakti/festivals',
    '/bhakti/vedanta'
  ];

  for (const r of routes) {
    console.log(`\n================ Testing ${r} ================`);
    const failed = [];
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        failed.push({ status: res.status(), url: res.url() });
      }
    });

    try {
      await page.goto(`http://localhost:3000${r}`, { waitUntil: 'networkidle', timeout: 15000 });
      
      const broken = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.filter(img => img.naturalWidth === 0).map(img => ({
          src: img.src,
          alt: img.alt,
          parent: img.parentElement ? img.parentElement.className : ''
        }));
      });

      console.log(`Route: ${r} | Broken <img> count: ${broken.length} | Failed HTTP: ${failed.length}`);
      if (broken.length > 0) {
        console.log('BROKEN IMAGES:', broken);
      }
      if (failed.length > 0) {
        console.log('FAILED REQUESTS:', failed);
      }
    } catch (e) {
      console.log(`Error navigating to ${r}: ${e.message}`);
    }
  }

  await browser.close();
}

auditAllBhaktiRoutes();
