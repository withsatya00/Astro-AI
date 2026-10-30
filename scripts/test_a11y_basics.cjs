// Accessibility basics on the main pages: language, headings, names for controls, image alt text, form labels.
// Needs the frontend on :3000 and a backend on :8002. Run with: npm run test:a11y
const { chromium } = require('@playwright/test');
const PAGES = ['/', '/astrologers', '/calculators', '/mandir-seva', '/astro-mall', '/gau-sewa', '/panchang'];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let problems = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(() => localStorage.setItem('astro_lang', 'en'));
    for (const route of PAGES) {
      await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const found = await page.evaluate(() => {
        const visible = el => {
          const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
          if (!(r.width > 0 && r.height > 0) || s.visibility === 'hidden' || s.display === 'none' || el.closest('[hidden],[aria-hidden="true"],dialog:not([open])')) return false;
          for (let n = el; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.opacity === '0' || cs.pointerEvents === 'none' && n.matches('[class*="modal"],[class*="overlay"],[class*="drawer"]')) return false; }
          return r.bottom > 0 && r.right > 0 && r.left < innerWidth;
        };
        const name = el => (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.textContent || el.textContent || el.getAttribute('title') || el.querySelector('img[alt]')?.alt || '').trim();
        const out = [];
        if (!document.documentElement.lang) out.push('html has no lang attribute');
        const view = [...document.querySelectorAll('.app-page-view')].find(v => v.style.display !== 'none' && visible(v)) || document.body;
        if (![...view.querySelectorAll('h1')].some(visible)) out.push('no visible <h1> in the page view');
        view.querySelectorAll('img').forEach(i => { if (visible(i) && !i.hasAttribute('alt')) out.push(`img without alt: ${(i.getAttribute('src') || '').slice(-40)}`); });
        document.querySelectorAll('button, [role="button"], a[href]').forEach(b => { if (visible(b) && !name(b)) out.push(`unnamed control: <${b.tagName.toLowerCase()}> ${b.outerHTML.slice(0, 70)}`); });
        document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea').forEach(f => {
          if (!visible(f)) return;
          const labelled = f.getAttribute('aria-label') || f.getAttribute('aria-labelledby') || f.id && document.querySelector(`label[for="${CSS.escape(f.id)}"]`) || f.closest('label');
          if (!labelled) out.push(`unlabelled field: <${f.tagName.toLowerCase()}> ${f.name || f.id || f.placeholder || ''}`);
        });
        const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
        Object.entries(ids).filter(([, n]) => n > 1).forEach(([id]) => out.push(`duplicate id: ${id}`));
        return [...new Set(out)];
      });
      console.log(found.length ? `FAIL ${route}` : `PASS ${route}`);
      found.slice(0, 8).forEach(m => console.log('   -', m));
      if (found.length > 8) console.log(`   ... ${found.length - 8} more`);
      problems += found.length;
    }
  } finally { await browser.close(); }
  if (problems) { console.log(`\n${problems} accessibility problem(s)`); process.exit(1); }
  console.log('\nAll accessibility checks passed');
})();
