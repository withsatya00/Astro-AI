// Brand palette contract measured on the live pages: one primary action colour, no stray orange headings,
// a small set of surfaces, readable small text, light and dark theme. Run with: npm run test:brand
// Needs the frontend on :3000 and a backend on :8002.
const { chromium } = require('@playwright/test');

const PURPLE = [116, 57, 234];
const PAGES = ['/', '/astrologers', '/mandir-seva', '/astro-mall', '/gau-sewa', '/mandir-seva/mahakaleshwar-ujjain', '/calculators'];
const MIN_FONT_PX = 11.5;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0;
  const report = (ok, name, detail) => { if (!ok) failed++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : '- ' + detail); };

  // Everything is measured in the page: colours are resolved to rgb, backgrounds are taken from the nearest opaque ancestor.
  const measure = () => {
    const hexRgb = h => { h = h.trim().replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); const n = parseInt(h, 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 }; };
    const root = getComputedStyle(document.documentElement);
    const family = ['--brand-primary', '--brand-hover', '--brand-deep', '--brand-highlight'].map(k => root.getPropertyValue(k)).filter(v => /^\s*#/.test(v)).map(hexRgb);
    const inFamily = c => family.some(f => Math.abs(f.r - c.r) <= 12 && Math.abs(f.g - c.g) <= 12 && Math.abs(f.b - c.b) <= 12);
    const rgb = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(v => parseFloat(v)); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = ({ r, g, b }) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
    const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
    const hsl = ({ r, g, b }) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; const d = mx - mn; if (!d) return { h: 0, s: 0, l }; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return { h, s, l }; };
    // Gradients count as a background (their first stop is used), so white text on a plum gradient is judged correctly.
    const bgOf = el => { for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); const c = rgb(cs.backgroundColor); if (c && c.a > .6) return c; const g = cs.backgroundImage.match(/rgba?\([^)]+\)/); if (g) { const x = rgb(g[0]); if (x && x.a > .5) return x; } } return { r: 255, g: 255, b: 255, a: 1 }; };
    const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0' && !el.closest('[hidden],[aria-hidden="true"],dialog:not([open]),.pm-tabbar,#toast-container,.marquee,[class*="ticker"],[class*="announce"],#modals-container,.mobile-nav-drawer'); };
    const view = [...document.querySelectorAll('.app-page-view')].find(v => v.style.display !== 'none' && v.getBoundingClientRect().height > 0) || document.body;

    // 1. primary actions: any dark/saturated filled button (solid or gradient) must be the brand purple
    const fillOf = el => { const cs = getComputedStyle(el); const c = rgb(cs.backgroundColor); if (c && c.a > .5) return c; const g = cs.backgroundImage.match(/rgba?\([^)]+\)/); return g ? rgb(g[0]) : null; };
    const candidates = [...view.querySelectorAll('a, button')].filter(visible).filter(el => /btn|button|cta|gold|chat|tab/i.test(el.className.toString()) || /bg-\[#|bg-gradient/.test(el.className.toString()));
    const offButtons = candidates.map(el => ({ el, c: fillOf(el) })).filter(({ c }) => c && hsl(c).l < .62 && hsl(c).s > .05 || c && hsl(c).l < .3)
      .filter(({ c }) => !inFamily(c))
      .filter(({ el }) => !el.closest('.pm-tabbar,footer,#site-global-footer,.footer-col'))
      .slice(0, 3).map(({ el, c }) => `${(el.className || el.tagName).toString().slice(0, 28)}:${c.r},${c.g},${c.b}`);

    // 2. orange headings: hue 15-48deg, saturated, not dark brown
    const orange = [...view.querySelectorAll('h1,h2,h3,h4,h1 *,h2 *,h3 *,[class*="title"],[class*="heading"]')].filter(visible).filter(el => { const c = rgb(getComputedStyle(el).color); if (!c) return false; const x = hsl(c); return x.s > .55 && x.h >= 15 && x.h <= 48 && x.l > .3 && x.l < .75; }).slice(0, 3).map(e => (e.innerText || '').trim().slice(0, 28));

    // 3. surfaces: distinct large-section backgrounds
    const surfaces = new Set();
    [...view.querySelectorAll('section, .home-page-container > div')].filter(visible).forEach(s => { const r = s.getBoundingClientRect(); if (r.width < innerWidth * .7 || r.height < 120) return; const c = rgb(getComputedStyle(s).backgroundColor); if (c && c.a > .5) surfaces.add([c.r, c.g, c.b].map(v => Math.round(v / 16) * 16).join(',')); });

    // 3b. large yellow / peach slabs: gold is a highlight, never a banner or section surface
    const goldSlabs = [...view.querySelectorAll('section, div, article')].filter(visible).filter(el => { const r = el.getBoundingClientRect(); if (r.width < innerWidth * .4 || r.height < 90) return false;
      const cs = getComputedStyle(el); const grad = cs.backgroundImage.match(/rgba?\([^)]+\)/g) || []; const colours = [rgb(cs.backgroundColor), ...grad.map(rgb)].filter(c => c && c.a > .5);
      return colours.some(c => { const x = hsl(c); return x.h >= 28 && x.h <= 58 && x.s > .6 && x.l > .55 && x.l < .95; }); }).slice(0, 3).map(e => (e.className.toString().split(' ')[0] || e.tagName));

    // 4. small / low-contrast text
    const small = new Map(), faint = new Map();
    const walker = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
    for (let n; (n = walker.nextNode());) {
      const t = n.textContent.trim(); const el = n.parentElement;
      if (t.length < 3 || !/\p{L}/u.test(t) || !visible(el) || el.closest('script,style,svg,option,input,textarea')) continue;
      const cs = getComputedStyle(el); const px = parseFloat(cs.fontSize);
      const key = (el.className || el.tagName).toString().split(' ')[0] || el.tagName;
      if (px < 11.5) small.set(key, (small.get(key) || 0) + 1);
      const fg = rgb(cs.color); const bg = bgOf(el);
      if (fg && fg.a > .5 && px < 18 && contrast(fg, bg) < 4.5) faint.set(key, (faint.get(key) || 0) + 1);
    }
    return { offButtons, orange, goldSlabs, surfaces: surfaces.size, small: [...small.entries()].slice(0, 14), faint: [...faint.entries()].slice(0, 14), faintCount: [...faint.values()].reduce((a, b) => a + b, 0), smallCount: [...small.values()].reduce((a, b) => a + b, 0) };
  };

  try {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      page.setDefaultTimeout(15000);
      await page.addInitScript(t => { localStorage.setItem('astro_lang', 'en'); localStorage.setItem('pwa_dismissed', '1'); localStorage.setItem('astro_theme', t); }, theme);
      for (const route of PAGES) {
        await page.goto('http://localhost:3000' + route, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1800);
        await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
        await page.waitForTimeout(300);
        const m = await page.evaluate(measure);
        const tag = `${theme} ${route}`;
        if (theme === 'light') {
          report(m.offButtons.length === 0, `${tag}: filled buttons use the brand colour`, m.offButtons.join(' | '));
          report(m.orange.length === 0, `${tag}: no orange headings`, m.orange.join(' | '));
          report(m.goldSlabs.length === 0, `${tag}: no yellow/peach banner or section surfaces`, m.goldSlabs.join(' | '));
          report(m.surfaces <= 4, `${tag}: at most 4 section surface colours`, `${m.surfaces} surfaces`);
        }
        report(m.smallCount === 0, `${tag}: no text under ${MIN_FONT_PX}px`, `${m.smallCount} nodes: ${m.small.map(([k, n]) => `${k}×${n}`).join(', ')}`);
        report(m.faintCount === 0, `${tag}: small text meets 4.5:1 contrast`, `${m.faintCount} nodes: ${m.faint.map(([k, n]) => `${k}×${n}`).join(', ')}`);
      }
      await page.close();
    }
  } finally { await browser.close(); }
  if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
  console.log('\nAll brand-palette checks passed');
})();
