const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const html = `<!DOCTYPE html>
<html>
<body style="background:#2a0610; color:#d5aa51; display:flex; flex-wrap:wrap; gap:20px; font-family:sans-serif; padding:20px;">
  <div style="background:#3e0b18; padding:15px; border-radius:12px; border:1px solid #d5aa51;">
    <h3>ritual-hanuman-1 (Current)</h3>
    <img src="http://localhost:3000/assets/img/seva-gallery/ritual-hanuman-1.webp" style="height:260px; object-fit:contain; border-radius:8px;" />
  </div>
  <div style="background:#3e0b18; padding:15px; border-radius:12px; border:1px solid #d5aa51;">
    <h3>sankat-mochan-1</h3>
    <img src="http://localhost:3000/assets/img/seva-gallery/sankat-mochan-hanuman-varanasi-1.webp" style="height:260px; object-fit:contain; border-radius:8px;" />
  </div>
  <div style="background:#3e0b18; padding:15px; border-radius:12px; border:1px solid #d5aa51;">
    <h3>sankat-mochan-2</h3>
    <img src="http://localhost:3000/assets/img/seva-gallery/sankat-mochan-hanuman-varanasi-2.webp" style="height:260px; object-fit:contain; border-radius:8px;" />
  </div>
  <div style="background:#3e0b18; padding:15px; border-radius:12px; border:1px solid #d5aa51;">
    <h3>ritual-hanuman-3</h3>
    <img src="http://localhost:3000/assets/img/seva-gallery/ritual-hanuman-3.webp" style="height:260px; object-fit:contain; border-radius:8px;" />
  </div>
</body>
</html>`;

fs.writeFileSync('hanuman_preview.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 750 } });
  await page.goto('http://localhost:3000/hanuman_preview.html');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'hanuman_preview.png' });
  await browser.close();
  console.log('Saved hanuman_preview.png');
})();
