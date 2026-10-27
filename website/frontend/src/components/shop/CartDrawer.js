// Cart drawer + floating cart button. Lines are priced by the server so options and price changes are always right.
import { esc, money, toast, api, postJson, openModal, closeModal, ensureOverlay, mediaUrl, t, applyI18n, goTo } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { CartStore, lineKey } from '../../utils/cart-store.js';
import { CheckoutModal } from './CheckoutModal.js';

const HTML = `
<button type="button" id="cart-fab" class="shop-btn shop-btn--primary shop-fab">🛒 <span data-i18n="ml.cart">Cart</span> <b id="cart-fab-count">0</b></button>
<div id="cart-drawer" class="shop-drawer" role="dialog" aria-modal="true">
  <div class="shop-drawer__panel">
    <div class="shop-modal__head"><h3 data-i18n="ml.cartTitle">Your cart</h3><button type="button" class="shop-modal__x" data-close="cart-drawer" data-i18n-aria="close" aria-label="Close">✕</button></div>
    <div class="shop-modal__body" id="cart-lines"></div>
    <div class="shop-modal__foot">
      <div><small style="display:block;color:#64748b;font-size:.7rem;font-weight:600" data-i18n="ml.subtotal">Subtotal</small><span class="shop-total" id="cart-subtotal">₹0</span></div>
      <button type="button" class="shop-btn shop-btn--gold" id="cart-checkout" data-i18n="ml.checkout">Checkout</button>
    </div>
  </div>
</div>`;

export const CartDrawer = {
  el: null,
  quote: null,
  _mounted: false,

  mount() {
    if (this._mounted) return;
    this._mounted = true;
    this.el = ensureOverlay('shop-cart', HTML);
    applyI18n(this.el);
    this.$('cart-fab').addEventListener('click', () => this.open());
    this.$('cart-checkout').addEventListener('click', () => {
      if (!CartStore.items.length) return;
      closeModal(this.$('cart-drawer'));
      CheckoutModal.open(CartStore.items.map(i => ({ ...i })));
    });
    this.$('cart-lines').addEventListener('click', (e) => {
      const b = e.target.closest('[data-cart]');
      if (!b) return;
      const key = b.getAttribute('data-key');
      const line = CartStore.items.find(i => lineKey(i.product_id, i.options) === key);
      const kind = b.getAttribute('data-cart');
      if (kind === 'rm') CartStore.remove(key);
      else if (line) CartStore.setQty(key, line.quantity + (kind === 'inc' ? 1 : -1));
      this.render();
    });
    window.addEventListener('astro:cart', () => this.badge());
    window.addEventListener('astro:languagechange', () => { applyI18n(this.el); if (this.$('cart-drawer').classList.contains('is-open')) this.render(); });
    // the button belongs to the shop pages only
    ['view-mall', 'view-product'].forEach(id => { const v = document.getElementById(id); if (v) new ResizeObserver(() => this.badge()).observe(v); });
    this.badge();
  },

  $(id) { return this.el.querySelector('#' + id); },

  onShopPage() {
    return ['view-mall', 'view-product'].some(id => { const v = document.getElementById(id); return v && v.offsetParent !== null; });
  },

  badge() {
    if (!this.el) return;
    const n = CartStore.count();
    this.$('cart-fab-count').textContent = n;
    this.$('cart-fab').classList.toggle('is-visible', n > 0 && this.onShopPage());
  },

  async open() {
    await CartStore.sync();
    openModal(this.$('cart-drawer'));
    await this.render();
  },

  async render() {
    const box = this.$('cart-lines');
    if (!CartStore.items.length) {
      box.innerHTML = `<div class="shop-empty"><b>${esc(t('ml.cartEmpty.title'))}</b>${esc(t('ml.cartEmpty.sub'))}</div>`;
      this.$('cart-subtotal').textContent = money(0);
      this.$('cart-checkout').disabled = true;
      this.badge();
      return;
    }
    try {
      this.quote = await postJson(`/api/v1/marketplace/quote?lang=${currentLang()}`,
        { items: CartStore.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, options: i.options })) });
    } catch (err) {
      if (err.status === 404 || err.status === 400) {
        // a product disappeared or an option no longer exists: keep only what can still be bought
        const products = (await api(`/api/v1/marketplace/products?lang=${currentLang()}`)).products;
        CartStore.reconcile(products);
        if (CartStore.items.length) return this.render();
      }
      box.innerHTML = `<div class="shop-empty">${esc(err.message)}</div>`;
      return;
    }
    box.innerHTML = this.quote.lines.map((l, idx) => {
      const item = CartStore.items[idx];
      const key = item ? lineKey(item.product_id, item.options) : '';
      return `<div class="shop-cartline"><img src="${esc(mediaUrl(l.image_url))}" alt="">
        <div><h5><a href="/astro-mall/product/${esc(l.product_id)}" data-goto>${esc(l.title)}</a></h5>
        ${l.options_label ? `<small style="color:#64748b">${esc(l.options_label)}</small>` : ''}
        <div class="shop-qty" style="margin-top:6px"><button type="button" data-cart="dec" data-key="${esc(key)}">-</button><span>${l.quantity}</span><button type="button" data-cart="inc" data-key="${esc(key)}">+</button></div>
        ${l.in_stock ? '' : `<small style="color:#dc2626;display:block">${esc(t('ml.outOfStock'))}</small>`}</div>
        <div style="text-align:right"><strong>${money(l.line_total)}</strong><br><button type="button" class="shop-btn shop-btn--sm shop-btn--danger" style="margin-top:6px" data-cart="rm" data-key="${esc(key)}">${esc(t('ml.remove'))}</button></div></div>`;
    }).join('');
    box.querySelectorAll('[data-goto]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); closeModal(this.$('cart-drawer')); goTo(a.getAttribute('href')); }));
    this.$('cart-subtotal').textContent = money(this.quote.totals.subtotal);
    this.$('cart-checkout').disabled = this.quote.lines.some(l => !l.in_stock);
    this.badge();
  }
};

if (typeof window !== 'undefined') window.CartDrawer = CartDrawer;
export default CartDrawer;
