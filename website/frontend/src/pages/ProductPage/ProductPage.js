// Product page: gallery (zoom, swipe, lightbox), variants, price, delivery estimate, trust cards, tabs, reviews and related items.
import { esc, money, toast, api, mediaUrl, t, applyI18n, requireLogin, goTo, stars, qrUrl, fmtDate } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { CartStore } from '../../utils/cart-store.js';
import { CartDrawer } from '../../components/shop/CartDrawer.js';
import { CheckoutModal } from '../../components/shop/CheckoutModal.js';
import { Discovery } from '../../components/shop/Discovery.js';
import { x } from '../../utils/experience.js';
import { servicePanel } from '../../components/ServiceInfo.js';

const svg = (d, extra = '') => `<svg class="ic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const IC = {
  chev: `<span class="pp-sep">${svg('<path d="M9 6l6 6-6 6"/>', 'width="12" height="12"')}</span>`,
  shield: svg('<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>'),
  check: svg('<path d="M5 12l5 5 9-10"/>', 'width="12" height="12"'),
  store: svg('<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>', 'width="15" height="15"'),
  share: svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
  left: svg('<path d="M15 5l-7 7 7 7"/>'),
  right: svg('<path d="M9 5l7 7-7 7"/>'),
  zoom: svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5"/>', 'width="14" height="14"'),
  cart: svg('<path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>', 'width="17" height="17"'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', 'width="20" height="20"'),
  heartOn: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>', 'width="20" height="20"'),
  truck: svg('<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  undo: svg('<path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="M8 5L4 9l4 4"/>'),
  om: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M8.5 10.5h7M9.5 14.5c1 1.2 4.5 1.2 5-.8"/>')
};

export class ProductPageComponent {
  static root = null;
  static id = null;
  static product = null;
  static chosen = {};
  static qty = 1;
  static image = 0;
  static images = [];

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    this.root = target;
    CartDrawer.mount();
    window.addEventListener('astro:languagechange', () => { if (this.root.offsetParent !== null && this.id) this.open(this.id, true); });
    window.addEventListener('astro:cart', () => this.paintWish());
    window.addEventListener('astro:ordersChanged', () => { if (this.root.offsetParent !== null && this.id) this.open(this.id, true); });
    document.addEventListener('keydown', (e) => {
      const lb = this.root && this.root.querySelector('#pp-lb');
      if (!lb || lb.hidden) return;
      if (e.key === 'Escape') { lb.hidden = true; document.body.style.overflow = ''; }
      if (e.key === 'ArrowRight') this.showImage(this.image + 1);
      if (e.key === 'ArrowLeft') this.showImage(this.image - 1);
    });
    return target;
  }

  static get lang() { return currentLang(); }

  static async open(id, keepState = false) {
    if (!this.root) return;
    const request = this.openRequest = (this.openRequest || 0) + 1;
    this.id = id;
    if (!keepState) { this.chosen = {}; this.qty = 1; this.image = 0; }
    this.root.innerHTML = `<div class="shop-page pp"><div class="pp-skel"><div class="pp-skel__img"></div><div class="pp-skel__txt"><i></i><i></i><i></i><i></i></div></div></div>`;
    window.scrollTo({ top: 0 });
    try {
      const [product, reviews, related, catalog] = await Promise.all([
        api(`/api/v1/marketplace/products/${encodeURIComponent(id)}?lang=${this.lang}`),
        api(`/api/v1/marketplace/products/${encodeURIComponent(id)}/reviews`).catch(() => ({ reviews: [] })),
        api(`/api/v1/marketplace/products/${encodeURIComponent(id)}/related?lang=${this.lang}`).catch(() => ({ products: [] })),
        api(`/api/v1/marketplace/products?lang=${this.lang}`).catch(() => ({ products: [] }))
      ]);
      if (request !== this.openRequest) return;
      this.product = product;
      (product.options || []).forEach(g => { if (!this.chosen[g.key]) this.chosen[g.key] = (g.values.find(v => !v.price_delta) || g.values[0]).value; });
      await CartStore.init();
      if (request !== this.openRequest) return;
      Discovery.visit(id);
      window.Seo?.entity({
        title: `${product.title} | Astro Mall`, description: String(product.description || '').slice(0, 155),
        data: { '@context': 'https://schema.org', '@type': 'Product', name: product.title, description: product.description || undefined,
          image: product.image_url ? [mediaUrl(product.image_url)] : undefined,
          offers: { '@type': 'Offer', priceCurrency: 'INR', price: product.price, availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
          ...(product.review_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.review_count } } : {}) }
      });
      this.render(product, reviews.reviews, related.products);
      Discovery.shelf(this.root.querySelector('[data-recent-shelf]'), catalog.products, id);
    } catch (err) {
      if (request !== this.openRequest) return;
      this.root.innerHTML = `<div class="shop-page"><div class="shop-empty"><b>${esc(t('pp.notFound'))}</b>${esc(err.message)}<br><br><button type="button" class="shop-btn shop-btn--gold" id="pp-retry">${esc(x('retry'))}</button> <a class="shop-btn shop-btn--line" href="/astro-mall">${esc(t('pp.backToMall'))}</a></div></div>`;
      this.root.querySelector('#pp-retry').onclick = () => this.open(id, true);
    }
  }

  static unitPrice() {
    const p = this.product;
    let price = p.price;
    (p.options || []).forEach(g => { const v = g.values.find(x => x.value === this.chosen[g.key]); if (v) price += v.price_delta || 0; });
    return price;
  }

  static render(p, reviews, related) {
    const cats = { rudraksha: 'ml.cat.rudraksha', mala: 'ml.cat.mala', yantra: 'ml.cat.yantra', gemstone: 'ml.cat.gemstone', samagri: 'ml.cat.samagri' };
    const catName = t(cats[p.category] || 'ml.cat.all').replace(/^[^\wऀ-ॿ]+/, '');
    const images = p.images && p.images.length ? p.images : [p.image_url];
    const total = Object.values(p.rating_breakdown || {}).reduce((a, b) => a + b, 0);
    const cert = p.certificate;
    const specs = [['ml.seller', p.seller_name], ['ml.material', p.material], ['ml.origin', p.origin], ['ml.energization', p.energized_details]].filter(r => r[1]);
    const tabs = [['details', 'pp.tab.details'], ['specs', 'pp.tab.specs'], ['certificate', 'pp.tab.certificate'], ['returns', 'pp.tab.returns'], ['reviews', 'pp.tab.reviews']];
    this.images = images;
    this.root.innerHTML = `
    <div class="shop-page pp">
      <nav class="pp-crumbs" aria-label="breadcrumb"><a href="/astro-mall">${esc(t('pp.mall'))}</a>${IC.chev}<a href="/astro-mall" data-cat="${esc(p.category)}">${esc(catName)}</a>${IC.chev}<span>${esc(p.title)}</span></nav>
      <div class="pp-main">
        <div class="pp-gallery">
          <div class="pp-stage" id="pp-stage" tabindex="0">
            <img id="pp-main-img" src="${esc(mediaUrl(images[this.image] || images[0]))}" alt="${esc(p.title)}" decoding="async">
            ${p.has_lab_certificate ? `<span class="pp-badge">${IC.shield} ${esc(t('ml.certificate'))}</span>` : ''}
            <button type="button" class="pp-round pp-share" id="pp-share" aria-label="${esc(t('pp.share'))}">${IC.share}</button>
            ${images.length > 1 ? `<button type="button" class="pp-nav pp-nav--prev" data-step="-1" aria-label="${esc(x('previous'))}">${IC.left}</button><button type="button" class="pp-nav pp-nav--next" data-step="1" aria-label="${esc(x('next'))}">${IC.right}</button>
            <div class="pp-dots">${images.map((_, i) => `<i class="${i === this.image ? 'is-on' : ''}"></i>`).join('')}</div>` : ''}
            <span class="pp-zoomhint">${IC.zoom} ${esc(t('pp.zoom'))}</span>
          </div>
          ${images.length > 1 ? `<div class="pp-thumbs">${images.map((u, i) => `<button type="button" class="${i === this.image ? 'is-on' : ''}" data-thumb="${i}" aria-pressed="${i === this.image}" aria-label="${esc(x('photo'))} ${i + 1}"><img src="${esc(mediaUrl(u))}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
          <p class="exp-photo-count" id="pp-photo-count" translate="no">${esc(x('photo'))} ${this.image + 1} / ${images.length}</p>
        </div>

        <div class="pp-info">
          <div class="pp-eyebrow">${esc(catName)}</div>
          <h1 class="pp-title">${esc(p.title)}</h1>
          <div class="exp-product-tools" translate="no">${Discovery.button(p.id)}<button class="exp-text-button" type="button" data-open-compare>${esc(x('compare'))} (${Discovery.compare.length}/3)</button></div>
          <div class="pp-meta">
            <a href="#pp-reviews" class="pp-rating">${p.review_count ? `<b>${stars(p.rating)}</b> <span>${p.rating}</span> <small>(${p.review_count})</small>` : `<span class="pp-new">${esc(t('ml.new'))}</span>`}</a>
            <span class="pp-seller">${IC.store} ${esc(p.seller.name)} ${p.seller.verified ? `<span class="shop-pill shop-pill--ok">${IC.check} ${esc(t('pp.verifiedSeller'))}</span>` : ''}</span>
          </div>
          <div class="pp-pricebox"><div class="pp-price" id="pp-price"></div><div class="pp-pricenote" id="pp-pricenote"></div></div>
          <p class="pp-stock ${p.in_stock ? (p.stock <= 5 ? 'is-low' : 'is-ok') : 'is-out'}"><i></i>${p.in_stock ? (p.stock <= 5 ? esc(t('ml.onlyLeft', { n: p.stock })) : esc(t('pp.inStock'))) : esc(t('ml.outOfStock'))}</p>

          ${(p.options || []).map(g => `
            <div class="pp-opt"><div class="shop-label">${esc(g.label)}</div>
              <div class="pp-chips">${g.values.map(v => `<button type="button" class="shop-chip ${this.chosen[g.key] === v.value ? 'is-active' : ''}" data-opt="${esc(g.key)}" data-val="${esc(v.value)}">${esc(v.label)}${v.price_delta ? ` <small>(${v.price_delta > 0 ? '+' : '-'}${money(Math.abs(v.price_delta))})</small>` : ''}</button>`).join('')}</div></div>`).join('')}
          ${p.finger_note ? `<p class="shop-hint">${esc(p.finger_note)}</p>` : ''}
          ${p.return_policy.gemstone_notice ? `<div class="shop-section shop-section--gold" style="margin:12px 0"><h4>${esc(t('co.gemTitle'))}</h4><p class="shop-hint" style="margin:0">${esc(t('co.gemPolicy'))}</p></div>` : ''}

          <div class="pp-buy">
            <div class="pp-qtywrap"><div class="shop-label">${esc(t('pp.qty'))}</div><div class="shop-qty pp-qty"><button type="button" data-qty="-1" aria-label="-">&minus;</button><span id="pp-qty">${this.qty}</span><button type="button" data-qty="1" aria-label="+">+</button></div></div>
            <div class="pp-cta">
              <button type="button" class="shop-btn shop-btn--gold pp-btn" id="pp-buy" ${p.in_stock ? '' : 'disabled'}>${esc(t('ml.buyNow'))}</button>
              <button type="button" class="shop-btn shop-btn--line pp-btn" id="pp-add" ${p.in_stock ? '' : 'disabled'}>${IC.cart} ${esc(t('ml.addToCart'))}</button>
              <button type="button" class="shop-btn shop-btn--line pp-btn pp-wish" id="pp-wish" aria-label="${esc(t('ml.cat.wishlist'))}"></button>
            </div>
          </div>

          <div class="pp-pin">
            <div class="pp-pin__t">${IC.truck} ${esc(t('pp.pin.title'))}</div>
            <form class="pp-pin__f" id="pp-pin-form" novalidate><input class="shop-input" id="pp-pin" inputmode="numeric" maxlength="6" autocomplete="postal-code" placeholder="${esc(t('pp.pin.ph'))}"><button type="submit" class="shop-btn shop-btn--line">${esc(t('pp.pin.btn'))}</button></form>
            <p class="pp-pin__r" id="pp-pin-res" aria-live="polite"></p>
          </div>
          <details class="exp-policy" translate="no"><summary>${esc(x('returns'))}</summary><p>${esc(p.return_policy.text)}</p><strong>${esc(x('delivery'))}</strong><p>${esc(x('deliveryNote'))}</p></details>

          <div class="pp-trust">
            ${p.has_lab_certificate ? `<div>${IC.shield}<b>${esc(p.has_lab_certificate ? t('pp.trust.cert') : x('certified'))}</b><small>${esc(p.has_lab_certificate ? t('pp.trust.certSub') : x('no'))}</small></div>` : ''}
            ${p.is_energized ? `<div>${IC.om}<b>${esc(p.is_energized ? t('pp.trust.energ') : x('energized'))}</b><small>${esc(p.is_energized ? t('pp.trust.energSub') : x('no'))}</small></div>` : ''}
            <div>${IC.lock}<b>${esc(t('pp.trust.pay'))}</b><small>${esc(t('pp.trust.paySub'))}</small></div>
            <div>${IC.undo}<b>${esc(t('pp.trust.ret'))}</b><small>${esc(t('pp.trust.retSub', { days: p.return_policy.days }))}</small></div>
          </div>
        </div>
      </div>

      <section class="pp-tabs" id="pp-reviews">
        <div class="pp-tabbar" role="tablist">${tabs.map(([k, key], i) => `<button type="button" role="tab" class="${i === 0 ? 'is-on' : ''}" data-tab="${k}">${esc(t(key))}${k === 'reviews' && p.review_count ? ` <small>(${p.review_count})</small>` : ''}</button>`).join('')}</div>

        <div class="pp-panel is-on" data-panel="details"><p>${esc(p.description)}</p>
          ${p.energized_details ? `<div class="pp-callout">${IC.om}<span>${esc(p.energized_details)}</span></div>` : ''}</div>

        <div class="pp-panel" data-panel="specs">${specs.length ? `<dl class="shop-meta">${specs.map(r => `<div><dt>${esc(t(r[0]))}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>` : `<p class="shop-hint">${esc(t('pp.nospec'))}</p>`}</div>

        <div class="pp-panel" data-panel="certificate">
          ${cert ? `<div class="pp-cert"><div class="pp-cert__seal">${IC.shield}<span>${esc(t('pp.sealed'))}</span></div><img src="${esc(qrUrl(cert.code))}" alt="QR" width="120" height="120" loading="lazy">
            <div class="pp-cert__body"><span class="shop-pill shop-pill--ok">${IC.check} ${esc(t('pp.verifiedCert'))}</span>
            <dl class="shop-meta"><div><dt>${esc(t('pp.lab'))}</dt><dd>${esc(cert.lab)}</dd></div><div><dt>${esc(t('pp.certNo'))}</dt><dd>${esc(cert.number)}</dd></div><div><dt>${esc(t('pp.certCode'))}</dt><dd><span class="pp-code">${esc(cert.code)}</span> <button type="button" class="pp-copy" data-copy="${esc(cert.code)}">${esc(t('pp.copy'))}</button></dd></div></dl>
            <div class="pp-cert__act"><a class="shop-btn shop-btn--line shop-btn--sm" href="/verify/${esc(cert.code)}">${esc(t('pp.verifyOnline'))}</a>
            ${cert.file ? `<a class="shop-btn shop-btn--line shop-btn--sm" href="${esc(mediaUrl(cert.file))}" target="_blank" rel="noopener">${esc(t('ml.viewCert'))}</a>` : ''}</div></div></div>`
            : `<p class="shop-hint" style="font-size:.85rem">${esc(t('pp.noCert'))}</p>`}</div>

        <div class="pp-panel" data-panel="returns"><p>${esc(p.return_policy.text)}</p></div>

        <div class="pp-panel" data-panel="reviews">
          ${p.review_count ? `<div class="pp-summary"><div class="pp-big">${p.rating}<small>/5</small><div class="shop-stars"><b>${stars(p.rating)}</b></div><small>${esc(t('pp.basedOn', { n: p.review_count }))}</small></div>
            <div class="pp-bars">${[5, 4, 3, 2, 1].map(n => { const c = (p.rating_breakdown || {})[String(n)] || 0; return `<div><span>${n}★</span><i><b style="width:${total ? Math.round(c / total * 100) : 0}%"></b></i><span>${c}</span></div>`; }).join('')}</div></div>` : ''}
          ${reviews.length ? reviews.map(v => `<div class="pp-review"><div class="shop-record__top"><strong>${esc(v.reviewer_name)}</strong><span class="shop-stars"><b>${stars(v.rating)}</b></span></div>${v.comment ? `<p>${esc(v.comment)}</p>` : ''}<div class="pp-review__foot"><span class="shop-pill shop-pill--ok">${IC.check} ${esc(t('ml.verified'))}</span><small>${esc(fmtDate(v.created_at, this.lang))}</small></div></div>`).join('')
            : `<p class="shop-hint" style="font-size:.85rem">${esc(t('ml.noReviews'))}</p>`}</div>
      </section>

      ${servicePanel('product')}
      <div data-recent-shelf></div>
      ${related.length ? `<section class="pp-related"><h2>${esc(t('pp.related'))}</h2><div class="shop-grid">${related.map(r => `
        <article class="shop-card"><a class="shop-card__media" href="/astro-mall/product/${esc(r.id)}"><img src="${esc(mediaUrl(r.image_url))}" alt="${esc(r.title)}" loading="lazy"></a>
        <div class="shop-card__body"><h3 class="shop-card__title"><a href="/astro-mall/product/${esc(r.id)}">${esc(r.title)}</a></h3><div class="shop-card__foot"><div class="shop-price">${money(r.price)}</div></div></div></article>`).join('')}</div></section>` : ''}
    </div>
    <div class="pp-buybar"><div class="pp-buybar__p"><div class="shop-price" id="pp-bar-price"></div></div><button type="button" class="shop-btn shop-btn--line" id="pp-add-2" ${p.in_stock ? '' : 'disabled'}>${IC.cart} ${esc(t('pp.bar.add'))}</button><button type="button" class="shop-btn shop-btn--gold" id="pp-buy-2" ${p.in_stock ? '' : 'disabled'}>${esc(t('ml.buyNow'))}</button></div>
    <div class="pp-lightbox" id="pp-lb" hidden><button type="button" class="pp-lb__x" aria-label="${esc(t('close'))}">&times;</button><button type="button" class="pp-nav pp-nav--prev" data-lbstep="-1" aria-label="${esc(x('previous'))}">${IC.left}</button><img alt=""><button type="button" class="pp-nav pp-nav--next" data-lbstep="1" aria-label="${esc(x('next'))}">${IC.right}</button></div>`;

    this.bind();
    this.paintPrice();
    this.paintWish();
  }

  static showImage(i) {
    const imgs = this.images || [];
    if (!imgs.length) return;
    this.image = (i + imgs.length) % imgs.length;
    const r = this.root;
    const main = r.querySelector('#pp-main-img');
    if (main) main.src = mediaUrl(imgs[this.image]);
    r.querySelectorAll('[data-thumb]').forEach(button => { const selected = +button.dataset.thumb === this.image; button.classList.toggle('is-on', selected); button.setAttribute('aria-pressed', String(selected)); });
    const count = r.querySelector('#pp-photo-count');
    if (count) count.textContent = `${x('photo')} ${this.image + 1} / ${imgs.length}`;
    r.querySelectorAll('.pp-dots i').forEach((d, n) => d.classList.toggle('is-on', n === this.image));
    const lb = r.querySelector('#pp-lb img');
    if (lb) lb.src = mediaUrl(imgs[this.image]);
  }

  static showTab(name) {
    const r = this.root;
    r.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-tab') === name));
    r.querySelectorAll('[data-panel]').forEach(p => p.classList.toggle('is-on', p.getAttribute('data-panel') === name));
  }

  static paintPrice() {
    const p = this.product;
    const price = this.unitPrice();
    const hasOpts = (p.options || []).length;
    const mrp = !hasOpts && p.original_price && p.original_price > p.price ? p.original_price : 0;
    const html = `${money(price)}${mrp ? `<s>${money(mrp)}</s>` : ''}${p.discount_percent && !hasOpts ? `<span class="shop-off">${esc(t('ml.off', { n: p.discount_percent }))}</span>` : ''}`;
    const a = this.root.querySelector('#pp-price');
    const b = this.root.querySelector('#pp-bar-price');
    const n = this.root.querySelector('#pp-pricenote');
    if (a) a.innerHTML = html;
    if (b) b.innerHTML = money(price * this.qty);
    if (n) n.innerHTML = `${mrp ? `<span class="pp-save">${esc(t('pp.save', { amt: money(mrp - price) }))}</span>` : ''}<span>${esc(t('pp.taxes'))}</span>`;
  }

  static paintWish() {
    const b = this.root.querySelector('#pp-wish');
    if (!b || !this.id) return;
    const on = CartStore.isWished(this.id);
    b.innerHTML = on ? IC.heartOn : IC.heart;
    b.classList.toggle('is-on', on);
  }

  static bind() {
    const r = this.root;
    const swipe = (el, onStep) => {
      let x0 = null;
      el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      el.addEventListener('touchend', (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 40) { onStep(dx < 0 ? 1 : -1); el.dataset.swiped = '1'; setTimeout(() => { delete el.dataset.swiped; }, 350); }
      }, { passive: true });
    };
    const stage = r.querySelector('#pp-stage');
    const lb = r.querySelector('#pp-lb');
    r.querySelectorAll('[data-thumb]').forEach(b => b.addEventListener('click', () => this.showImage(+b.getAttribute('data-thumb'))));
    r.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.showImage(this.image + (+b.getAttribute('data-step'))); }));
    r.querySelectorAll('[data-lbstep]').forEach(b => b.addEventListener('click', (e) => { e.stopPropagation(); this.showImage(this.image + (+b.getAttribute('data-lbstep'))); }));
    swipe(stage, (d) => this.showImage(this.image + d));
    swipe(lb, (d) => this.showImage(this.image + d));
    const img = stage.querySelector('#pp-main-img');
    stage.addEventListener('mousemove', (e) => {
      if (!window.matchMedia('(hover: hover)').matches) return;
      const b = stage.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - b.left) / b.width) * 100}% ${((e.clientY - b.top) / b.height) * 100}%`;
      img.classList.add('is-zoom');
    });
    stage.addEventListener('mouseleave', () => img.classList.remove('is-zoom'));
    let galleryFocus;
    const openLb = () => { galleryFocus = document.activeElement; lb.querySelector('img').src = mediaUrl(this.images[this.image]); lb.querySelector('img').alt = this.product.title; lb.hidden = false; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', this.product.title); document.body.style.overflow = 'hidden'; lb.querySelector('button').focus(); };
    const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; galleryFocus?.focus(); };
    lb.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.stopPropagation(); closeLb(); }
      if (e.key === 'Tab') {
        const buttons = [...lb.querySelectorAll('button')];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    stage.addEventListener('click', (e) => { if (stage.dataset.swiped || e.target.closest('button')) return; openLb(); });
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') openLb();
      if (e.key === 'ArrowRight') this.showImage(this.image + 1);
      if (e.key === 'ArrowLeft') this.showImage(this.image - 1);
    });
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.pp-lb__x')) closeLb(); });

    r.querySelector('#pp-share').addEventListener('click', async (e) => {
      e.stopPropagation();
      try { if (navigator.share) { await navigator.share({ title: this.product.title, url: location.href }); return; } } catch (err) { return; }
      try { await navigator.clipboard.writeText(location.href); toast(t('pp.shared'), 'success'); } catch (err) { toast(location.href, 'info'); }
    });

    r.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => {
      this.chosen[b.getAttribute('data-opt')] = b.getAttribute('data-val');
      r.querySelectorAll(`[data-opt="${b.getAttribute('data-opt')}"]`).forEach(x => x.classList.toggle('is-active', x === b));
      this.paintPrice();
    }));
    r.querySelectorAll('[data-qty]').forEach(b => b.addEventListener('click', () => {
      this.qty = Math.max(1, Math.min(Math.min(10, this.product.stock), this.qty + (+b.getAttribute('data-qty'))));
      r.querySelector('#pp-qty').textContent = this.qty;
      this.paintPrice();
    }));
    const add = () => {
      const ok = CartStore.add(this.id, this.qty, { ...this.chosen }, Math.min(10, this.product.stock));
      toast(ok ? t('ml.addedToCart') : t('ml.onlyAvail', { n: this.product.stock }), ok ? 'success' : 'info');
      if (ok) [r.querySelector('#pp-add'), r.querySelector('#pp-add-2')].forEach(b => { if (b) { b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); } });
    };
    r.querySelector('#pp-add').addEventListener('click', add);
    const add2 = r.querySelector('#pp-add-2');
    if (add2) add2.addEventListener('click', add);
    const buy = () => { if (requireLogin('auth.neededOrder')) CheckoutModal.open([{ product_id: this.id, quantity: this.qty, options: { ...this.chosen } }]); };
    r.querySelector('#pp-buy').addEventListener('click', buy);
    const bar = r.querySelector('#pp-buy-2');
    if (bar) bar.addEventListener('click', buy);
    r.querySelector('#pp-wish').addEventListener('click', () => { CartStore.toggleWish(this.id); this.paintWish(); });

    r.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => this.showTab(b.getAttribute('data-tab'))));
    r.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(b.getAttribute('data-copy'));
        b.textContent = t('pp.copied');
        setTimeout(() => { b.textContent = t('pp.copy'); }, 1500);
      } catch (err) { /* clipboard unavailable */ }
    }));

    r.querySelector('#pp-pin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const pin = r.querySelector('#pp-pin').value.trim();
      const res = r.querySelector('#pp-pin-res');
      if (!/^[1-9]\d{5}$/.test(pin)) { res.className = 'pp-pin__r is-bad'; res.textContent = t('pp.pin.bad'); return; }
      const d = new Date();
      d.setDate(d.getDate() + 6);
      const date = d.toLocaleDateString(this.lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      res.className = 'pp-pin__r is-ok';
      res.textContent = `${t('pp.pin.ok', { date, pin })} ${t('pp.pin.note')}`;
    });

    r.querySelectorAll('.pp-crumbs a').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault();
      goTo(a.getAttribute('href'));
      const cat = a.getAttribute('data-cat');
      if (cat && window.AstroMallPageComponent) setTimeout(() => window.AstroMallPageComponent.showCategory(cat), 80);
    }));
    r.querySelectorAll('a[href^="/"]').forEach(a => { if (!a.closest('.pp-crumbs')) a.addEventListener('click', (e) => { e.preventDefault(); goTo(a.getAttribute('href')); }); });
    const rating = r.querySelector('.pp-rating');
    if (rating) rating.addEventListener('click', (e) => { e.preventDefault(); this.showTab('reviews'); r.querySelector('#pp-reviews').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
}

if (typeof window !== 'undefined') window.ProductPageComponent = ProductPageComponent;
export default ProductPageComponent;
