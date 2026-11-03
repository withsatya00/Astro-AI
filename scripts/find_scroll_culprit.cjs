const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  
  const culprits = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('*').forEach((el) => {
      if (el.scrollWidth > 390) {
        list.push({
          tag: el.tagName,
          id: el.id,
          class: el.className,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          parent: el.parentElement ? el.parentElement.tagName + '.' + el.parentElement.className : null
        });
      }
    });
    return list;
  });
  console.log('Found', culprits.length, 'wide elements. First 10:');
  console.log(culprits.slice(0, 10));
  await browser.close();
})();
