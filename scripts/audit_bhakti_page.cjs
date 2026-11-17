const { chromium } = require('@playwright/test');

async function auditBhaktiPage() {
  console.log('Auditing Bhakti Page http://localhost:3000/bhakti ...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const failedRequests = [];
  const consoleErrors = [];

  page.on('response', (res) => {
    if (res.status() >= 400) {
      failedRequests.push({ url: res.url(), status: res.status() });
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  try {
    await page.goto('http://localhost:3000/bhakti', { waitUntil: 'networkidle', timeout: 15000 });
    console.log('Page Title:', await page.title());

    // Check all image elements on page
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map((img) => ({
        src: img.src,
        alt: img.alt,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        visible: img.offsetWidth > 0 && img.offsetHeight > 0,
        classes: img.className,
        parentClass: img.parentElement ? img.parentElement.className : ''
      }));
    });

    console.log(`Found ${images.length} <img> elements on /bhakti:`);
    const brokenImages = images.filter(img => img.naturalWidth === 0);
    console.log(`Broken Images (naturalWidth === 0): ${brokenImages.length}`);
    brokenImages.forEach((img, i) => {
      console.log(`[BROKEN ${i+1}] src: ${img.src}, alt: ${img.alt}, parent: ${img.parentClass}`);
    });

    images.filter(img => img.naturalWidth > 0).forEach((img, i) => {
      console.log(`[LOADED ${i+1}] src: ${img.src.split('/').slice(-2).join('/')}, size: ${img.naturalWidth}x${img.naturalHeight}`);
    });

    // Check hero banner specifically
    const heroInfo = await page.evaluate(() => {
      const hero = document.querySelector('.bh-hero');
      if (!hero) return null;
      const copy = hero.querySelector('.bh-hero-copy');
      const art = hero.querySelector('.bh-hero-art');
      const artImg = art ? art.querySelector('img') : null;
      return {
        heroBox: hero.getBoundingClientRect(),
        artBox: art ? art.getBoundingClientRect() : null,
        artImgSrc: artImg ? artImg.src : null,
        artImgNatural: artImg ? `${artImg.naturalWidth}x${artImg.naturalHeight}` : null,
        h1Text: hero.querySelector('h1')?.innerText,
      };
    });

    console.log('\n--- HERO BANNER DETAILS ---');
    console.log(JSON.stringify(heroInfo, null, 2));

    await page.screenshot({ path: 'bhakti_page_audit.png', fullPage: true });
    console.log('Saved full page screenshot to bhakti_page_audit.png');

    console.log('\nFailed HTTP Requests:', failedRequests.length);
    failedRequests.forEach(r => console.log(`  ${r.status} -> ${r.url}`));

    console.log('Console Errors:', consoleErrors.length);
    consoleErrors.forEach(e => console.log(`  ${e}`));

  } catch (err) {
    console.error('Audit exception:', err);
  } finally {
    await browser.close();
  }
}

auditBhaktiPage();
