// Responsive sweep: every main page at phone, tablet and desktop widths.
// Checks: no horizontal scroll, nothing sticking out past the right edge, readable text, tappable controls on touch
// widths, images inside their box, fixed bars on screen, no runtime errors. Run with: npm run test:responsive
// Needs the frontend on :3000 and a backend on :8002.
const { chromium } = require('@playwright/test');

const LANG = process.env.RESP_LANG === 'hi' ? 'hi' : 'en'; // RESP_LANG=hi checks the longer Hindi copy
const WIDTHS = (process.env.RESP_WIDTHS || '360,390,768,1024,1280,1536').split(',').map(Number);
const PAGES = ['/', '/astrologers', '/calculators', '/panchang', '/rashiphal', '/mandir-seva', '/mandir-seva/mahakaleshwar-ujjain', '/astro-mall', '/gau-sewa', '/gifts', '/verify/none', '/no-such-page'];

const measure = () => {
  const vw = window.innerWidth;
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0' && !el.closest('[hidden],[aria-hidden="true"],dialog:not([open]),#modals-container,.mobile-nav-drawer,#toast-container,.pm-ptr,.sr-only'); };
  // elements inside a horizontal scroller are allowed to extend past the edge
  const inScroller = el => { for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (/(auto|scroll)/.test(s.overflowX) && n.scrollWidth > n.clientWidth) return true; if (s.overflowX === 'hidden' && n.getBoundingClientRect().right <= vw + 1) return true; } return false; };
  const view = [...document.querySelectorAll('.app-page-view')].find(v => v.style.display !== 'none' && v.getBoundingClientRect().height > 0) || document.body;
  const problems = [];
  const tag = el => el.tagName.toLowerCase() + (el.className && el.className.toString ? '.' + el.className.toString().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '');

  if (document.documentElement.scrollWidth > vw + 1) problems.push(`page scrolls sideways (${document.documentElement.scrollWidth} > ${vw})`);

  const out = [];
  document.querySelectorAll('#app-root *').forEach(el => {
    if (!visible(el) || inScroller(el)) return;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 2 && r.width < vw * 3 && getComputedStyle(el).position !== 'fixed') out.push(`${tag(el)} right=${Math.round(r.right)}`);
  });
  if (out.length) problems.push(`sticks out right edge: ${[...new Set(out)].slice(0, 4).join(' | ')}`);

  const imgs = [];
  view.querySelectorAll('img').forEach(i => { if (!visible(i) || inScroller(i)) return; const r = i.getBoundingClientRect(); if (r.right > vw + 2 || (i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:'))) imgs.push((i.getAttribute('src') || '').slice(-32)); });
  if (imgs.length) problems.push(`images broken or overflowing: ${[...new Set(imgs)].slice(0, 3).join(', ')}`);

  if (vw <= 768) {
    const small = [];
    view.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button]').forEach(c => {
      if (!visible(c) || inScroller(c) && c.closest('.hero-trending, .trending-tags')) return;
      if (c.matches('input[type=checkbox], input[type=radio]') && (c.closest('label') || (c.id && document.querySelector('label[for="' + c.id + '"]')))) return; // the label is the tap target
      const r = c.getBoundingClientRect(); const text = (c.textContent || '').trim();
      // inline text links inside paragraphs are exempt; standalone controls need a 36px target
      if (c.tagName === 'A' && c.closest('p, li, .prose, small') && !c.className.toString().match(/btn|button|card/)) return;
      if (r.height < 34 || r.width < 34) small.push(`${tag(c)} < ${c.parentElement ? tag(c.parentElement) : ''} ${Math.round(r.width)}x${Math.round(r.height)} "${text.slice(0, 14)}"`);
    });
    if (small.length) problems.push(`tap targets under 34px: ${[...new Set(small)].slice(0, 4).join(' | ')}`);
  }

  const tiny = [];
  const w = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) { const t = n.textContent.trim(); const el = n.parentElement; if (t.length < 3 || !/\p{L}/u.test(t) || !visible(el) || el.closest('script,style,svg,option')) continue; if (parseFloat(getComputedStyle(el).fontSize) < 11.5) tiny.push(tag(el)); }
  if (tiny.length) problems.push(`text under 11.5px: ${[...new Set(tiny)].slice(0, 3).join(', ')}`);

  // fixed bars must be fully inside the viewport
  const bars = [];
  document.querySelectorAll('.pm-tabbar, .tp-mobilebar, .pp-buybar').forEach(b => { if (!visible(b)) return; const r = b.getBoundingClientRect(); if (r.bottom > innerHeight + 1 || r.top < 0 || r.right > vw + 1) bars.push(`${tag(b)} y=${Math.round(r.top)}-${Math.round(r.bottom)} vh=${innerHeight}`); });
  if (bars.length) problems.push(`fixed bar off screen: ${bars.join(' | ')}`);

  // a fixed bar must not hide the last content: page bottom padding is enough for the tallest bar
  const lastEl = view.lastElementChild; void lastEl;
  return problems;
};

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0, total = 0;
  try {
    for (const width of WIDTHS) {
      const page = await browser.newPage({ viewport: { width, height: Number(process.env.RESP_HEIGHT) || (width <= 768 ? 800 : 900) }, hasTouch: width <= 768 });
      page.setDefaultTimeout(20000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(lang => { localStorage.setItem('astro_lang', lang); localStorage.setItem('pwa_dismissed', '1'); }, LANG);
      for (const route of PAGES) {
        total++;
        try {
          await page.goto('http://localhost:3000' + route, { waitUntil: 'load' });
          await page.waitForTimeout(2600);
          const problems = await page.evaluate(measure);
          if (route === '/') {
            // the install / "new version" prompt must sit clear of the bottom tab bar and keep tappable buttons
            const prompt = await page.evaluate(async () => {
              const { PwaInstall } = await import('/src/components/premium/PwaInstall.js');
              PwaInstall.hide(); PwaInstall.show('update'); await new Promise(r => setTimeout(r, 400));
              const el = document.querySelector('.pf-install'); const bar = document.querySelector('.pm-tabbar'); const out = [];
              if (!el) return ['prompt did not render'];
              const r = el.getBoundingClientRect(); const bv = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null;
              if (r.left < -1 || r.right > innerWidth + 1 || r.top < 0 || r.bottom > innerHeight + 1) out.push(`prompt off screen (${Math.round(r.left)}-${Math.round(r.right)}, y ${Math.round(r.top)}-${Math.round(r.bottom)} of ${innerHeight})`);
              if (bv && r.bottom > bv.top + 1) out.push(`prompt hidden behind the tab bar (bottom ${Math.round(r.bottom)} > bar top ${Math.round(bv.top)})`);
              el.querySelectorAll('button').forEach(b => { const q = b.getBoundingClientRect(); if (q.height < 34) out.push(`prompt button only ${Math.round(q.height)}px tall`); });
              PwaInstall.hide(); return out;
            });
            problems.push(...prompt);
          }
          if (errors.length) problems.push('runtime error: ' + errors.splice(0)[0].slice(0, 80));
          if (problems.length) { failed++; console.log(`FAIL ${width}px ${route}`); problems.forEach(p => console.log('   -', p)); } else console.log(`PASS ${width}px ${route}`);
        } catch (e) { failed++; console.log(`FAIL ${width}px ${route}\n   - ${String(e.message).split('\n')[0]}`); }
      }
      await page.close();
    }
  } finally { await browser.close(); }
  console.log(`\n${total - failed}/${total} page-width combinations clean`);
  if (failed) process.exit(1);
})();
