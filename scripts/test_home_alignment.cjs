// Home page alignment: every content block sits on the same left/right rails and cards in a row are equal.
// Needs the frontend on :3000 and a backend on :8002. Run with: npm run test:align
const { chromium } = require('@playwright/test');

// Blocks that must share the page rail (their outer container), and card rows that must be even.
const RAIL_BLOCKS = ['.hero-container', '.trust-stats-container', '.journey-inner', '.gs-home-banner', '.service-categories-container',
  '.featured-astrologers-container', '.feature-shortcuts-container', '.panchang-horoscope-section .max-w-7xl', '.why-choose-container',
  '.trust-panel__inner', '.testimonials-container'];
const CARD_ROWS = ['.journey-steps > li', '.feature-shortcuts-container a', '.service-categories-container a, .service-categories-container .category-card',
  '.why-choose-container > div > div, .why-choose-card', '.testimonials-container .testimonial-card, .testimonials-container article',
  '.featured-astrologers-container .ac2'];
const TOL = 2;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0;
  const report = (ok, name, detail) => { if (!ok) failed++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : '- ' + detail); };
  try {
    for (const width of [1440, 1280, 1024, 768, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      page.setDefaultTimeout(15000);
      await page.addInitScript(() => { localStorage.setItem('astro_lang', 'en'); localStorage.setItem('pwa_dismissed', '1'); });
      await page.goto('http://localhost:3000/', { waitUntil: 'load' });
      await page.waitForTimeout(3500);
      const data = await page.evaluate(({ rail, rows }) => {
        const edges = {};
        rail.forEach(sel => { const el = document.querySelector('#view-home ' + sel); if (el && el.getBoundingClientRect().height > 0) { const r = el.getBoundingClientRect(); edges[sel] = [Math.round(r.left), Math.round(r.right)]; } });
        const uneven = [];
        rows.forEach(sel => {
          const els = [...document.querySelectorAll('#view-home ' + sel)].filter(e => e.getBoundingClientRect().height > 40);
          const byRow = {}; els.forEach(e => { const r = e.getBoundingClientRect(); (byRow[Math.round(r.top / 10)] = byRow[Math.round(r.top / 10)] || []).push(r); });
          Object.values(byRow).forEach(row => { if (row.length < 2) return; const hs = row.map(r => Math.round(r.height)), ts = row.map(r => Math.round(r.top)), ws = row.map(r => Math.round(r.width));
            if (Math.max(...hs) - Math.min(...hs) > 2 || Math.max(...ts) - Math.min(...ts) > 2 || Math.max(...ws) - Math.min(...ws) > 2) uneven.push(`${sel.slice(0, 40)} h=${hs} t=${ts} w=${ws}`); });
        });
        // inside each astrologer card, the action row must line up across cards of the same row
        const actions = {}; document.querySelectorAll('#view-home .featured-astrologers-container .ac2').forEach(c => { const b = c.querySelector('.ac2-btn--chat'); if (b) { const r = b.getBoundingClientRect(); const k = Math.round(c.getBoundingClientRect().top / 10); (actions[k] = actions[k] || []).push(Math.round(r.top - c.getBoundingClientRect().top)); } });
        const actionOff = Object.values(actions).filter(a => a.length > 1 && Math.max(...a) - Math.min(...a) > 2).map(a => a.join(','));
        return { edges, uneven, actionOff, overflow: document.documentElement.scrollWidth > innerWidth };
      }, { rail: RAIL_BLOCKS, rows: CARD_ROWS });
      // The rail: 1180px wide and centred on wide screens, a 16px gutter on narrow ones.
      const left = Math.max(16, Math.round((width - 1180) / 2));
      const ref = [left, width - left];
      const off = Object.entries(data.edges).filter(([, [l, r]]) => Math.abs(l - ref[0]) > TOL || Math.abs(r - ref[1]) > TOL + (width > 1240 ? 0 : 0)).map(([k, [l, r]]) => `${k} ${l}-${r}`);
      report(off.length === 0, `${width}px: all home blocks share the page rail ${ref[0]}-${ref[1]}`, off.join(' | '));
      report(data.uneven.length === 0, `${width}px: cards in a row have equal size and top`, data.uneven.slice(0, 3).join(' | '));
      report(data.actionOff.length === 0, `${width}px: astrologer card actions line up across a row`, data.actionOff.join(' | '));
      report(!data.overflow, `${width}px: no horizontal scroll`, 'page overflows');
      await page.close();
    }
  } finally { await browser.close(); }
  if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
  console.log('\nAll home-alignment checks passed');
})();
