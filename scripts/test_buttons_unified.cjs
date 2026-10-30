// One button system: every filled button is the logo purple (flat, no gradient), hover darkens it, and on dark
// banners buttons are light. Buy now, Chat, Book and Contribute must look identical. Run with: npm run test:buttons
// Needs the frontend on :3000 and a backend on :8002.
const { chromium } = require('@playwright/test');

const PAGES = ['/', '/astrologers', '/mandir-seva', '/astro-mall', '/gau-sewa', '/mandir-seva/mahakaleshwar-ujjain', '/calculators'];

const collect = () => {
  const rgb = s => { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const hexRgb = h => { h = h.trim().replace('#', ''); const n = parseInt(h, 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 }; };
  const root = getComputedStyle(document.documentElement);
  const primary = hexRgb(root.getPropertyValue('--brand-primary'));
  const near = (c, t, tol = 6) => c && Math.abs(c.r - t.r) <= tol && Math.abs(c.g - t.g) <= tol && Math.abs(c.b - t.b) <= tol;
  const lum = ({ r, g, b }) => { const f = c => { c /= 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0' && !el.closest('[hidden],[aria-hidden="true"],dialog:not([open]),#modals-container,.mobile-nav-drawer,.pm-tabbar'); };
  const surfaceOf = el => { for (let n = el.parentElement; n; n = n.parentElement) { const cs = getComputedStyle(n); const c = rgb(cs.backgroundColor); if (c && c.a > .6) return c; const g = cs.backgroundImage.match(/rgba?\([^)]+\)/); if (g) return rgb(g[0]); } return { r: 255, g: 255, b: 255 }; };
  const view = [...document.querySelectorAll('.app-page-view')].find(v => v.style.display !== 'none' && v.getBoundingClientRect().height > 0) || document.body;
  const nameRe = /btn|button|cta|gold|chat|tab/i;
  const out = [];
  [...view.querySelectorAll('a, button')].filter(visible).forEach(el => {
    const cls = el.className.toString();
    if (!nameRe.test(cls) && !/bg-\[#|bg-gradient/.test(cls)) return;
    const cs = getComputedStyle(el);
    const solid = rgb(cs.backgroundColor); const grad = cs.backgroundImage !== 'none';
    const fill = solid && solid.a > .5 ? solid : (grad ? rgb((cs.backgroundImage.match(/rgba?\([^)]+\)/) || [''])[0]) : null);
    if (!fill || lum(fill) > .6) return;                      // outline / light buttons are secondary
    if (el.closest('footer,#site-global-footer,.pm-tabbar,.faq-tab-btn')) return;
    const surface = surfaceOf(el); const onDark = lum(surface) < .12;
    const ratio = (Math.max(lum(fill), lum(surface)) + .05) / (Math.min(lum(fill), lum(surface)) + .05);
    if (onDark && ratio < 3) out.push(`${(cls || el.tagName).split(' ').slice(0, 2).join('.')} [weak contrast ${ratio.toFixed(1)}:1 on dark banner]`);
    const bad = [];
    if (grad) bad.push('gradient');
    if (!near(fill, primary)) bad.push(`fill ${Math.round(fill.r)},${Math.round(fill.g)},${Math.round(fill.b)}`);
    if (bad.length) out.push(`${(cls || el.tagName).split(' ').slice(0, 2).join('.')} [${bad.join(', ')}]${onDark ? ' on dark' : ''}`);
  });
  return { primary: [primary.r, primary.g, primary.b], offenders: [...new Set(out)].slice(0, 6) };
};

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  let failed = 0;
  const report = (ok, name, detail) => { if (!ok) failed++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : '- ' + detail); };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    page.setDefaultTimeout(15000);
    await page.addInitScript(() => { localStorage.setItem('astro_lang', 'en'); localStorage.setItem('pwa_dismissed', '1'); });
    for (const route of PAGES) {
      await page.goto('http://localhost:3000' + route, { waitUntil: 'load' });
      await page.waitForTimeout(2800);
      const r = await page.evaluate(collect);
      report(r.offenders.length === 0, `${route}: filled buttons are flat logo purple`, r.offenders.join(' | '));
    }

    // identical look for the main actions
    const fillOf = (sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const cs = getComputedStyle(el); return cs.backgroundColor + '|' + (cs.backgroundImage === 'none' ? 'flat' : 'gradient'); }, sel);
    await page.goto('http://localhost:3000/astrologers', { waitUntil: 'load' }); await page.waitForTimeout(2500);
    const chat = await fillOf('.ac2-btn--chat');
    await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'load' }); await page.waitForTimeout(2500);
    await page.locator('.ml-card .shop-price').first().click(); await page.locator('#pp-buy').waitFor();
    const buy = await fillOf('#pp-buy');
    await page.goto('http://localhost:3000/mandir-seva', { waitUntil: 'load' }); await page.waitForTimeout(2500);
    const book = await fillOf('.mt-card .shop-btn--gold');
    await page.goto('http://localhost:3000/', { waitUntil: 'load' }); await page.waitForTimeout(2500);
    const hero = await fillOf('.btn-hero-find');
    report(chat && chat === buy && buy === book && book === hero, 'Chat, Buy now, Book and Find an Astrologer look identical', JSON.stringify({ chat, buy, book, hero }));

    // hover darkens, never changes hue
    await page.goto('http://localhost:3000/astro-mall', { waitUntil: 'load' }); await page.waitForTimeout(2500);
    await page.locator('.ml-card .shop-price').first().click(); await page.locator('#pp-buy').waitFor();
    const before = await page.locator('#pp-buy').evaluate(e => getComputedStyle(e).backgroundColor);
    await page.locator('#pp-buy').hover(); await page.waitForTimeout(400);
    const after = await page.locator('#pp-buy').evaluate(e => getComputedStyle(e).backgroundColor);
    const hoverToken = await page.evaluate(() => { const h = getComputedStyle(document.documentElement).getPropertyValue('--brand-hover').trim().replace('#', ''); const n = parseInt(h, 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; });
    report(before !== after && after === hoverToken, 'hover uses the brand hover colour', `${before} -> ${after} (expected ${hoverToken})`);

    // disabled keeps the brand hue but is visibly inactive
    const disabled = await page.evaluate(() => { const b = document.createElement('button'); b.className = 'shop-btn shop-btn--gold'; b.disabled = true; b.textContent = 'x'; document.querySelector('#view-product').appendChild(b); const cs = getComputedStyle(b); const r = { opacity: parseFloat(cs.opacity), cursor: cs.cursor }; b.remove(); return r; });
    report(disabled.opacity <= .6 && disabled.cursor === 'not-allowed', 'disabled buttons look inactive', JSON.stringify(disabled));

    // dark banners: buttons stay readable (light fill or brand purple with white text)
    await page.goto('http://localhost:3000/mandir-seva', { waitUntil: 'load' }); await page.waitForTimeout(2800);
    const banner = await page.evaluate(() => {
      const b = document.querySelector('#view-mandir .service-banner .shop-btn, #view-mandir [class*="banner"] .shop-btn'); if (!b) return { skipped: true };
      const cs = getComputedStyle(b); return { bg: cs.backgroundColor, color: cs.color };
    });
    report(banner.skipped || banner.bg !== banner.color, 'banner buttons have text/fill contrast', JSON.stringify(banner));
  } finally { await browser.close(); }
  if (failed) { console.log(`\n${failed} check(s) failed`); process.exit(1); }
  console.log('\nAll unified-button checks passed');
})();
