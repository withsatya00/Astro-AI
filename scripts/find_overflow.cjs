const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const overflowElements = await page.evaluate(() => {
    const wideElements = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.offsetWidth > 400) {
        wideElements.push({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          width: el.offsetWidth
        });
      }
    }
    return wideElements.slice(0, 15);
  });
  console.log('Overflow Elements:', JSON.stringify(overflowElements, null, 2));
  await browser.close();
})();
