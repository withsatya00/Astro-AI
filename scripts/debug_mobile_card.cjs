const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/astrologers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const cardInfo = await page.evaluate(() => {
    const card = document.querySelector('article[data-id="pt-rameshwar-dwivedi"]');
    if (!card) return { error: 'Card not found' };
    const buttons = card.querySelectorAll('button');
    const bTexts = Array.from(buttons).map(b => b.innerText.trim());
    const rect = card.getBoundingClientRect();
    const chatBtn = Array.from(buttons).find(b => b.innerText.includes('Chat'));
    const chatRect = chatBtn ? chatBtn.getBoundingClientRect() : null;
    return {
      cardRect: { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom },
      buttonTexts: bTexts,
      chatRect
    };
  });
  console.log('Mobile Card Info:', JSON.stringify(cardInfo, null, 2));
  await browser.close();
})();
