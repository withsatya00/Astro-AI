// Responsive sweep for signed-in pages and modals: dashboard tabs, rewards, login, wallet and booking modals.
// Needs the frontend on :3000 and a DEV backend on :8012 on a throwaway database (the test registers a user).
// Run with: npm run test:responsive-account
const { chromium } = require('@playwright/test');
const API = 'http://127.0.0.1:8012/api/v1';
const WIDTHS = [360, 390, 768, 1280];

const pageProblems = () => {
  const vw = window.innerWidth, out = [];
  if (document.documentElement.scrollWidth > vw + 1) out.push(`page scrolls sideways (${document.documentElement.scrollWidth} > ${vw})`);
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
  const view = [...document.querySelectorAll('.app-page-view')].find(v => v.style.display !== 'none' && v.getBoundingClientRect().height > 0) || document.body;
  const edge = [];
  view.querySelectorAll('*').forEach(el => { if (!vis(el)) return; for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (/(auto|scroll)/.test(s.overflowX) && n.scrollWidth > n.clientWidth) return; } const r = el.getBoundingClientRect(); if (r.right > vw + 2 && getComputedStyle(el).position !== 'fixed') edge.push(el.tagName.toLowerCase() + '.' + el.className.toString().split(/\s+/)[0]); });
  if (edge.length) out.push('sticks out: ' + [...new Set(edge)].slice(0, 3).join(', '));
  if (vw <= 768) {
    const small = [];
    view.querySelectorAll('a[href], button, select, input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea').forEach(c => { if (!vis(c)) return; if (c.tagName === 'A' && c.closest('p, li, small') && !/btn|button|card/.test(c.className)) return; const r = c.getBoundingClientRect(); if (r.height < 34 || r.width < 34) small.push(`${c.tagName.toLowerCase()}.${c.className.toString().split(/\s+/)[0]} ${Math.round(r.width)}x${Math.round(r.height)}`); });
    if (small.length) out.push('tap targets under 34px: ' + [...new Set(small)].slice(0, 3).join(' | '));
  }
  return out;
};

const modalProblems = (rootSel) => {
  const vw = innerWidth, vh = innerHeight, out = [];
  const open = [...document.querySelectorAll(rootSel)].filter(m => { const r = m.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(m).visibility !== 'hidden'; });
  if (!open.length) return ['no modal opened'];
  const card = open[0].querySelector('.modal-card, .modal-content, .modal-box, [class*="card"], [class*="content"]') || open[0];
  const r = card.getBoundingClientRect();
  if (r.right > vw + 1 || r.left < -1) out.push(`modal card off screen horizontally (${Math.round(r.left)}-${Math.round(r.right)} of ${vw})`);
  const scrollable = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (/(auto|scroll)/.test(s.overflowY) && n.scrollHeight > n.clientHeight) return true; } return false; };
  if (r.height > vh + 2 && !scrollable(card)) out.push(`modal taller than screen (${Math.round(r.height)} > ${vh}) and not scrollable`);
  const close = open[0].querySelector('.modal-close, [class*="close"], [aria-label*="lose"], button[data-close]');
  if (!close) out.push('no close control found');
  else { const cr = close.getBoundingClientRect(); if (cr.top < -1 || cr.right > vw + 1 || cr.width < 30 || cr.height < 30) out.push(`close control hard to reach (${Math.round(cr.width)}x${Math.round(cr.height)} at y=${Math.round(cr.top)})`); }
  return out;
};

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0, total = 0;
  const report = (name, problems) => { total++; if (problems.length) { failed++; console.log('FAIL', name); problems.forEach(p => console.log('   -', p)); } else console.log('PASS', name); };
  try {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: 800 }, hasTouch: width <= 768 });
      page.setDefaultTimeout(20000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => { window.__API_BASE__ = 'http://127.0.0.1:8012/api/v1'; localStorage.setItem('astro_lang', 'en'); localStorage.setItem('pwa_dismissed', '1'); });
      const res = await page.request.post(`${API}/auth/register`, { data: { email: `resp-${width}-${Date.now()}@test.in`, password: 'Resp-QA-123!', full_name: 'Responsive QA' } });
      const { access_token } = await res.json();

      // signed-out login modal
      await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(2500);
      await page.evaluate(() => window.App.openAuthModal('login')); await page.waitForTimeout(700);
      report(`${width}px login modal`, await page.evaluate(modalProblems, '#modal-auth.active, .modal-overlay.active'));
      await page.keyboard.press('Escape'); await page.evaluate(() => window.App.closeAuthModal?.()); await page.waitForTimeout(300);

      // signed in
      await page.evaluate(async t => { localStorage.setItem('astro_access_token', t); await window.App.checkUserSession(); }, access_token);
      for (const tab of ['overview', 'orders', 'pujas', 'donations', 'profiles', 'consultations', 'saved', 'remedies']) {
        await page.evaluate(() => window.Router.navigate('/dashboard')); await page.waitForTimeout(1800);
        await page.evaluate(t => document.querySelector(`[data-dashboard-tab="${t}"]`)?.click(), tab); await page.waitForTimeout(500);
        report(`${width}px dashboard / ${tab}`, await page.evaluate(pageProblems));
      }
      for (const route of ['/rewards', '/gifts']) {
        await page.evaluate(r => window.Router.navigate(r), route); await page.waitForTimeout(2000);
        report(`${width}px ${route} (signed in)`, await page.evaluate(pageProblems));
      }
      await page.evaluate(() => window.App.openWalletModal()); await page.waitForTimeout(900);
      report(`${width}px wallet modal`, await page.evaluate(modalProblems, '#modal-wallet-bookings.active'));
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await page.evaluate(() => window.Router.navigate('/mandir-seva/mahakaleshwar-ujjain')); await page.waitForTimeout(2500);
      await page.evaluate(() => document.querySelector('.tp-seva [data-book]')?.click()); await page.waitForTimeout(1200);
      report(`${width}px booking modal`, await page.evaluate(modalProblems, '#chadawa-booking-modal.is-open'));
      if (errors.length) { failed++; total++; console.log('FAIL', `${width}px runtime errors`, '\n   -', errors[0].slice(0, 100)); }
      await page.close();
    }
  } finally { await browser.close(); }
  console.log(`\n${total - failed}/${total} checks clean`);
  if (failed) process.exit(1);
})();
