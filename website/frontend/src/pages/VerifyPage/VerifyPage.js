// Public certificate check: what the QR codes on seva and lab certificates open.
import { esc, api, t, qrUrl, mediaUrl, goTo } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

export class VerifyPageComponent {
  static root = null;
  static code = null;

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    this.root = target;
    window.addEventListener('astro:languagechange', () => { if (this.root.offsetParent !== null && this.code) this.open(this.code); });
    return target;
  }

  static async open(rawCode) {
    if (!this.root) return;
    const code = String(rawCode || '').toUpperCase();   // the router lower-cases paths
    this.code = code;
    this.root.innerHTML = `<div class="shop-page"><div class="shop-loading"><div class="shop-spinner"></div></div></div>`;
    let body;
    try {
      const d = await api(`/api/v1/verify/${encodeURIComponent(code)}?lang=${currentLang()}`);
      const rows = d.kind === 'seva'
        ? [['vf.yajman', d.yajman], ['md.gotra', d.gotra], ['cd.step1', ''], ['cd.seva', d.seva], ['vf.temple', d.temple], ['vf.date', d.date], ['cd.bookingId', d.booking_number]].filter(r => r[1])
        : [['vf.product', d.product], ['pp.lab', d.lab], ['pp.certNo', d.certificate_number], ['ml.seller', d.seller]].filter(r => r[1]);
      body = `<div class="vf-card vf-ok"><div class="shop-success__icon">✓</div><h1>${esc(t(d.kind === 'seva' ? 'vf.sevaOk' : 'vf.productOk'))}</h1>
        <p class="vf-code">${esc(d.code)}</p>
        <dl class="shop-meta" style="text-align:left">${rows.map(r => `<div><dt>${esc(t(r[0]))}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>
        ${d.kind === 'product' ? `<p>${d.file ? `<a class="shop-btn shop-btn--line shop-btn--sm" href="${esc(mediaUrl(d.file))}" target="_blank" rel="noopener">${esc(t('ml.viewCert'))}</a> ` : ''}<a class="shop-btn shop-btn--gold shop-btn--sm" href="/astro-mall/product/${esc(d.product_id)}">${esc(t('vf.viewProduct'))}</a></p>` : ''}
        <img src="${esc(qrUrl(d.code))}" alt="QR" width="140" height="140"></div>`;
    } catch (err) {
      body = `<div class="vf-card vf-bad"><div class="shop-success__icon" style="background:#fee2e2;color:#dc2626">✕</div><h1>${esc(t('vf.bad'))}</h1><p>${esc(t('vf.badHint'))}</p><p class="vf-code">${esc(code)}</p></div>`;
    }
    this.root.innerHTML = `<div class="shop-page"><div class="vf-wrap">${body}<p style="text-align:center"><a class="shop-btn shop-btn--line" href="/">${esc(t('vf.home'))}</a></p></div></div>`;
    this.root.querySelectorAll('a[href^="/"]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); goTo(a.getAttribute('href')); }));
  }
}

if (typeof window !== 'undefined') window.VerifyPageComponent = VerifyPageComponent;
export default VerifyPageComponent;
