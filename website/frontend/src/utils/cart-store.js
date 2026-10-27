// Cart and wishlist shared by the Mall, product and checkout screens.
// Signed-in users: saved to their account (follows them across devices). Guests: kept in this browser only.
import { api, isSignedIn } from './shop.js';

const LS_CART = 'astro_mall_cart_v2';
const LS_OLD_CART = 'astro_mall_cart';
const LS_WISH = 'astro_mall_wishlist';

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
const norm = (o) => { const out = {}; Object.keys(o || {}).sort().forEach(k => { out[k] = o[k]; }); return out; };
export const lineKey = (productId, options) => `${productId}|${JSON.stringify(norm(options))}`;

export const CartStore = {
  items: [],      // [{ product_id, quantity, options }]
  wish: [],       // [product_id]
  _signed: null,
  _timer: null,

  _emit() { window.dispatchEvent(new CustomEvent('astro:cart')); },

  localItems() {
    const current = read(LS_CART);
    if (current.length) return current;
    // older releases stored [{ id, qty }] without options
    return read(LS_OLD_CART).map(c => ({ product_id: c.id, quantity: c.qty || 1, options: {} }));
  },

  /** Loads the cart: from the account when signed in (merging anything added while signed out), otherwise from this browser. */
  async init() {
    const signed = isSignedIn();
    this._signed = signed;
    const local = this.localItems();
    const localWish = read(LS_WISH);
    if (!signed) { this.items = local; this.wish = localWish; this._emit(); return; }
    try {
      const merged = local.length ? await api('/api/v1/cart/merge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: local }) })
        : await api('/api/v1/cart');
      const wish = localWish.length ? await api('/api/v1/wishlist/merge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_ids: localWish }) })
        : await api('/api/v1/wishlist');
      this.items = merged.items;
      this.wish = wish.product_ids;
      write(LS_CART, []); write(LS_OLD_CART, []); write(LS_WISH, []);
    } catch (e) {
      this.items = local; this.wish = localWish;
    }
    this._emit();
  },

  /** Call before showing the cart: picks up a sign-in or sign-out that happened since the last load. */
  async sync() { if (isSignedIn() !== this._signed) await this.init(); },

  _persist() {
    this._emit();
    if (!isSignedIn()) { write(LS_CART, this.items); write(LS_WISH, this.wish); return; }
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      api('/api/v1/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: this.items }) }).catch(() => {});
      api('/api/v1/wishlist', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_ids: this.wish }) }).catch(() => {});
    }, 400);
  },

  count() { return this.items.reduce((n, i) => n + i.quantity, 0); },

  add(productId, quantity = 1, options = {}, maxQty = 10) {
    const k = lineKey(productId, options);
    const line = this.items.find(i => lineKey(i.product_id, i.options) === k);
    if (line) {
      if (line.quantity >= maxQty) return false;
      line.quantity = Math.min(maxQty, line.quantity + quantity);
    } else this.items.push({ product_id: productId, quantity: Math.min(maxQty, quantity), options: norm(options) });
    this._persist();
    return true;
  },

  setQty(k, quantity) {
    const line = this.items.find(i => lineKey(i.product_id, i.options) === k);
    if (!line) return;
    line.quantity = Math.max(1, Math.min(10, quantity));
    this._persist();
  },

  remove(k) { this.items = this.items.filter(i => lineKey(i.product_id, i.options) !== k); this._persist(); },

  removeMany(keys) { const set = new Set(keys); this.items = this.items.filter(i => !set.has(lineKey(i.product_id, i.options))); this._persist(); },

  /** Drops lines for products that no longer exist and clamps quantities to what is in stock. */
  reconcile(products) {
    const byId = new Map(products.map(p => [p.id, p]));
    const before = JSON.stringify(this.items);
    this.items = this.items.filter(i => byId.has(i.product_id) && byId.get(i.product_id).in_stock)
      .map(i => ({ ...i, quantity: Math.max(1, Math.min(i.quantity, 10, byId.get(i.product_id).stock || 1)) }));
    if (JSON.stringify(this.items) !== before) this._persist();
  },

  isWished(id) { return this.wish.includes(id); },
  toggleWish(id) { this.wish = this.wish.includes(id) ? this.wish.filter(x => x !== id) : [...this.wish, id]; this._persist(); return this.wish.includes(id); }
};

if (typeof window !== 'undefined') window.CartStore = CartStore;
