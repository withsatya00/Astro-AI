const { chromium } = require('@playwright/test');

async function debugConsultation() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));

  await page.addInitScript(() => {
    localStorage.setItem('astro_user', JSON.stringify({
      id: 'devotee-101',
      name: 'आदित्य शर्मा',
      full_name: 'आदित्य शर्मा',
      email: 'devotee@astrojyotish.com',
      role: 'client',
      phone: '9876543210'
    }));
    localStorage.setItem('astro_access_token', 'mock_token_devotee_101');
  });

  await page.goto('http://localhost:3000/consultation/acharya-shastri');
  await page.waitForTimeout(2000);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT SAMPLE:\n', text.slice(0, 500));

  const hasGate = await page.locator('.cr-gate-card').isVisible();
  console.log('Has Gate Card:', hasGate);

  await browser.close();
}

debugConsultation();
