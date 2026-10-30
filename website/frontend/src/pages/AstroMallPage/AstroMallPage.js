import { loadTemplate } from '../../utils/templateLoader.js';
import { esc, money, toast, api, closeModal, wireDismiss, showCredits, stars, hoistOverlays, mediaUrl, t, applyI18n, goTo, requireLogin } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { CartStore } from '../../utils/cart-store.js';
import { CartDrawer } from '../../components/shop/CartDrawer.js';
import { OrdersModal } from '../../components/shop/OrdersModal.js';
import { Discovery } from '../../components/shop/Discovery.js';
import { skeleton } from '../../utils/experience.js';

export class AstroMallPageComponent {
  static templatePath = '/src/pages/AstroMallPage/AstroMallPage.html';
  static root = null;
  static overlay = null;
  static productsData = [];
  static activeCategory = 'all';
  static searchQuery = '';
  static sortBy = 'popular';
  static priceRange = '';
  static inStockOnly = false;

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    target.innerHTML = await loadTemplate(this.templatePath);
    this.root = target;
    this.overlay = hoistOverlays(target, 'mall');
    CartDrawer.mount();
    this.initEvents();
    this.applyLanguage();
    await CartStore.init();
    await this.loadProducts();
    this.renderSuggestion();
    return target;
  }

  static $(id) { return document.getElementById(id); }
  static get lang() { return currentLang(); }

  static applyLanguage() {
    applyI18n(this.root);
    applyI18n(this.overlay);
  }

  /** Router entry: refresh the cart/wishlist (sign-in may have changed) and the catalog. */
  static async loadProducts() {
    const loading = this.$('mall-loading-state');
    const request = this.catalogRequest = (this.catalogRequest || 0) + 1;
    loading.style.display = '';
    loading.innerHTML = skeleton(4);
    this.$('products-grid').style.display = 'none';
    this.$('mall-empty-state').style.display = 'none';
    this.$('products-grid').setAttribute('aria-busy', 'true');
    try {
      const res = await api(`/api/v1/marketplace/products?sort_by=${encodeURIComponent(this.sortBy)}&lang=${this.lang}`);
      if (request !== this.catalogRequest) return;
      this.productsData = res.products || [];
      Discovery.catalog = this.productsData;
      CartStore.reconcile(this.productsData);
      this.render();
      Discovery.shelf(this.$('mall-recent-shelf'), this.productsData);
      Discovery.paintButtons();
    } catch (err) {
      if (request !== this.catalogRequest) return;
      loading.style.display = '';
      loading.innerHTML = `<p>${esc(err.message)}</p><button type="button" class="shop-btn shop-btn--line shop-btn--sm" id="mall-retry">${esc(t('retry'))}</button>`;
      this.$('mall-retry').addEventListener('click', () => { loading.innerHTML = '<div class="shop-spinner"></div>'; this.loadProducts(); });
    } finally {
      if (request === this.catalogRequest) this.$('products-grid').setAttribute('aria-busy', 'false');
    }
  }

  static showCategory(cat) {
    const btn = this.root.querySelector(`#mall-category-filters [data-cat="${cat}"]`);
    if (btn) btn.click();
  }

  static initEvents() {
    window.addEventListener('astro:languagechange', async () => { this.applyLanguage(); await this.loadProducts(); this.renderSuggestion(); });
    window.addEventListener('astro:cart', () => { if (this.root.offsetParent !== null) this.render(); });
    wireDismiss(this.overlay);
    this.overlay.addEventListener('click', (e) => {
      const close = e.target.closest('[data-close]');
      if (close) closeModal(this.$(close.getAttribute('data-close')));
    });

    this.$('mall-category-filters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      this.root.querySelectorAll('#mall-category-filters .shop-chip').forEach(b => b.classList.toggle('is-active', b === btn));
      this.activeCategory = btn.getAttribute('data-cat');
      this.render();
    });
    this.$('mall-search-input').addEventListener('input', (e) => { this.searchQuery = e.target.value.trim().toLowerCase(); this.render(); });
    this.$('mall-price-select').addEventListener('change', (e) => { this.priceRange = e.target.value; this.render(); });
    this.$('mall-instock').addEventListener('change', (e) => { this.inStockOnly = e.target.checked; this.render(); });
    this.$('mall-sort-select').addEventListener('change', (e) => { this.sortBy = e.target.value; this.loadProducts(); });

    this.$('products-grid').addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) {
        // The whole card opens the product page; links and buttons keep their own behaviour.
        const card = e.target.closest('[data-card-href]');
        if (card && !e.target.closest('a, button')) goTo(card.getAttribute('data-card-href'));
        return;
      }
      const id = act.getAttribute('data-id');
      const kind = act.getAttribute('data-act');
      if (kind === 'wish') { CartStore.toggleWish(id); this.render(); }
      else if (kind === 'add') this.addToCart(id);
      else if (kind === 'details') goTo(`/astro-mall/product/${id}`);
    });
    this.$('btn-view-mall-orders').addEventListener('click', () => OrdersModal.open());
    this.$('mall-btn-rewards').addEventListener('click', () => { if (requireLogin('auth.neededRewards')) goTo('/rewards'); });
    this.$('btn-pandit-sell-item').addEventListener('click', () => { if (requireLogin('auth.neededSeller')) goTo('/seller'); });
    this.root.querySelectorAll('[data-open-credits]').forEach(b => b.addEventListener('click',
      () => showCredits(this.$('mall-credits-modal'), this.$('mall-credits-list'), 'products')));
  }

  static addToCart(id) {
    const p = this.productsData.find(x => x.id === id);
    if (!p || !p.in_stock) return;
    if (p.has_options) { goTo(`/astro-mall/product/${id}`); toast(t('ml.chooseOptions'), 'info'); return; } // variants are picked on the product page
    const ok = CartStore.add(id, 1, {}, Math.min(10, p.stock));
    toast(ok ? t('ml.addedToCart') : t('ml.onlyAvail', { n: p.stock }), ok ? 'success' : 'info');
  }

  // ---------------- catalog ----------------
  static filtered() {
    const [min, max] = this.priceRange ? this.priceRange.split('-').map(Number) : [0, Infinity];
    return this.productsData.filter(p => {
      if (this.activeCategory === 'wishlist') { if (!CartStore.isWished(p.id)) return false; }
      else if (this.activeCategory !== 'all' && p.category !== this.activeCategory) return false;
      if (this.inStockOnly && !p.in_stock) return false;
      if (p.price < min || p.price > max) return false;
      const q = this.searchQuery;
      return !q || [p.title, p.description, p.seller_name].some(v => String(v || '').toLowerCase().includes(q));
    });
  }

  static render() {
    const grid = this.$('products-grid');
    this.$('mall-loading-state').style.display = 'none';
    const list = this.filtered();
    const badge = this.$('mall-count-badge');
    if (badge) { badge.textContent = t('ml.count', { n: this.productsData.length }); badge.hidden = !this.productsData.length; }
    this.$('mall-empty-state').style.display = list.length ? 'none' : 'block';
    grid.style.display = list.length ? 'grid' : 'none';
    grid.innerHTML = list.map(p => this.card(p)).join('');
    this.$('wishlist-count').textContent = CartStore.wish.length ? `(${CartStore.wish.length})` : '';
  }

  static ratingHtml(p) {
    return p.review_count
      ? `<div class="shop-stars"><b>${stars(p.rating)}</b><span>${p.rating} (${p.review_count})</span></div>`
      : `<div class="shop-stars"><span>${esc(t('ml.new'))}</span></div>`;
  }

  static priceHtml(p) {
    return `${p.has_options ? `<small style="display:block">${esc(t('ml.from'))}</small>` : ''}${money(p.price)}${p.original_price && p.original_price > p.price ? `<s>${money(p.original_price)}</s>` : ''}${p.discount_percent ? `<span class="shop-off">${esc(t('ml.off', { n: p.discount_percent }))}</span>` : ''}`;
  }

  static card(p) {
    const wished = CartStore.isWished(p.id);
    const url = `/astro-mall/product/${esc(p.id)}`;
    const stock = !p.in_stock ? `<span class="shop-pill shop-pill--off">${esc(t('ml.outOfStock'))}</span>`
      : (p.stock <= 5 ? `<span class="shop-pill shop-pill--warn">${esc(t('ml.onlyLeft', { n: p.stock }))}</span>` : '');
    return `
    <article class="shop-card ml-card" data-card-href="${url}">
      <a class="shop-card__media" href="${url}">
        <img src="${esc(mediaUrl(p.image_url))}" alt="${esc(p.title)}" loading="lazy">
        ${p.is_energized ? `<span class="shop-card__tag shop-card__tag--tl">✨ ${esc(t('ml.energized'))}</span>` : ''}
        ${p.has_lab_certificate ? `<span class="shop-card__tag shop-card__tag--bl">✓ ${esc(t('ml.certificate'))}</span>` : ''}
      </a>
      <button type="button" class="shop-card__heart ${wished ? 'is-on' : ''}" data-act="wish" data-id="${esc(p.id)}" aria-label="${esc(t('ml.cat.wishlist'))}">${wished ? '♥' : '♡'}</button>
      <div class="shop-card__body">
        <span class="shop-card__eyebrow">👳 ${esc(p.seller_name)}</span>
        <h3 class="shop-card__title" title="${esc(p.title)}"><a href="${url}">${esc(p.title)}</a></h3>
        ${this.ratingHtml(p)}
        <div class="shop-card__foot"><div class="shop-price">${this.priceHtml(p)}</div>${stock}</div>
        <div class="shop-card__actions">
          <button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-act="add" data-id="${esc(p.id)}" ${p.in_stock ? '' : 'disabled'}>🛒 ${esc(t(p.has_options ? 'ml.chooseOpts' : 'ml.addToCart'))}</button>
        </div>
        ${Discovery.button(p.id)}
      </div>
    </article>`;
  }

  // ---------------- kundli suggestion ----------------
  static async renderSuggestion() {
    const box = this.$('mall-suggest');
    try {
      const d = await api(`/api/v1/marketplace/suggestions?lang=${this.lang}`);
      if (!d.has_chart || !d.suggestion) { box.hidden = true; return; }
      const s = d.suggestion;
      const hi = this.lang === 'hi';
      box.innerHTML = `
        <h3>${esc(t('ml.forKundli'))} (${esc(d.chart_name)})</h3>
        <p>${esc(t('ml.suggest', { sign: hi ? s.sign_hi : s.sign, lord: hi ? s.hi : s.lord, gem: hi ? s.gem : s.gem_en }))}</p>
        ${d.products.length ? `<div class="shop-suggest__items">${d.products.map(p => `
          <a class="shop-suggest__item" href="/astro-mall/product/${esc(p.id)}"><img src="${esc(mediaUrl(p.image_url))}" alt="" loading="lazy"><span>${esc(p.title)}</span></a>`).join('')}</div>` : ''}
        <p class="shop-hint">${esc(t('ml.disclaimer'))}</p>`;
      box.hidden = false;
    } catch (e) { box.hidden = true; }
  }
}

if (typeof window !== 'undefined') window.AstroMallPageComponent = AstroMallPageComponent;
export default AstroMallPageComponent;
