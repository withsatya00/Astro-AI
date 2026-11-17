const fs = require('fs');
const { chromium } = require('@playwright/test');

const html = `<!DOCTYPE html>
<html>
<body style="background:#2a0610; color:#d5aa51; display:flex; flex-wrap:wrap; gap:20px; font-family:sans-serif; padding:20px;">
  <div style="background:#3e0b18; padding:10px; border-radius:12px;">
    <h3>sankat-mochan-temple</h3>
    <img src="http://localhost:3000/assets/img/temples/sankat-mochan-hanuman-varanasi.webp" style="height:220px;" />
  </div>
  <div style="background:#3e0b18; padding:10px; border-radius:12px;">
    <h3>sm-3</h3>
    <img src="http://localhost:3000/assets/img/seva-gallery/sankat-mochan-hanuman-varanasi-3.webp" style="height:220px;" />
  </div>
  <div style="background:#3e0b18; padding:10px; border-radius:12px;">
    <h3>sm-4</h3>
    <img src="http://localhost:3000/assets/img/seva-gallery/sankat-mochan-hanuman-varanasi-4.webp" style="height:220px;" />
  </div>
  <div style="background:#3e0b18; padding:10px; border-radius:12px;">
    <h3>sm-5</h3>
    <img src="http://localhost:3000/assets/img/seva-gallery/sankat-mochan-hanuman-varanasi-5.webp" style="height:220px;" />
  </div>
  <div style="background:#3e0b18; padding:10px; border-radius:12px;">
    <h3>ritual-4</h3>
    <img src="http://localhost:3000/assets/img/seva-gallery/ritual-hanuman-4.webp" style="height:220px;" />
  </div>
</body>
</html>`;

fs.writeFileSync('hanuman_more.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  await page.goto('http://localhost:3000/hanuman_more.html');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'hanuman_more.png' });
  await browser.close();
  console.log('Saved hanuman_more.png');
})();
