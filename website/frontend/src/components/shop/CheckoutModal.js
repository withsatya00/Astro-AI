// Checkout for Astro Mall: server-priced lines, coupon, loyalty points, member benefits, gemstone advice, COD / wallet.
import { esc, money, toast, api, postJson, openModal, closeModal, ensureOverlay, mediaUrl, t, applyI18n, requireLogin, isSignedIn, goTo } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { CartStore, lineKey } from '../../utils/cart-store.js';

const HTML = `
<div id="checkout-modal" class="shop-modal" role="dialog" aria-modal="true">
  <div class="shop-modal__panel">
    <div class="shop-modal__head"><h3 data-i18n="ml.checkout">Checkout</h3><button type="button" class="shop-modal__x" data-close="checkout-modal" data-i18n-aria="close" aria-label="Close">✕</button></div>
    <form id="checkout-form" style="display:flex;flex-direction:column;min-height:0;flex:1">
      <div class="shop-modal__body">
        <div class="shop-section"><h4 data-i18n="ml.yourItems">Your items</h4><div id="co-items"></div></div>
        <div class="shop-section shop-section--gold">
          <h4 data-i18n="ml.energizeHead">Energization details (pran-pratishtha)</h4>
          <div class="shop-row">
            <div class="shop-field"><label class="shop-label" for="co-name" data-i18n="ml.fullName">Full name *</label><input type="text" id="co-name" class="shop-input" required minlength="2" maxlength="100"></div>
            <div class="shop-field"><label class="shop-label" for="co-gotra" data-i18n="ml.gotra">Gotra *</label><input type="text" id="co-gotra" class="shop-input" required maxlength="100"></div>
          </div>
          <p class="shop-hint" style="margin:0" data-i18n="ml.energizeNote">The pandit chants mantras with this name and gotra before the items are dispatched.</p>
        </div>
        <div class="shop-section">
          <h4 data-i18n="ml.delivery">Delivery</h4>
          <div class="shop-field"><label class="shop-label" for="co-phone" data-i18n="ml.mobile">Mobile number *</label><input type="tel" id="co-phone" class="shop-input" required pattern="[0-9+ ]{10,15}" placeholder="9876543210"></div>
          <div class="shop-field" style="margin-bottom:0"><label class="shop-label" for="co-address" data-i18n="ml.address">Full address with PIN code *</label><textarea id="co-address" class="shop-textarea" rows="2" required minlength="8" maxlength="500"></textarea></div>
        </div>
        <div class="shop-section">
          <h4 data-i18n="co.offers">Offers & points</h4>
          <div class="shop-coupon"><input type="text" id="co-coupon" class="shop-input" maxlength="30" data-i18n-ph="co.couponPh" placeholder="Coupon code" style="text-transform:uppercase"><button type="button" id="co-apply" class="shop-btn shop-btn--line" data-i18n="co.apply">Apply</button></div>
          <p class="shop-hint" id="co-coupon-msg"></p>
          <label class="shop-check hidden" id="co-points-wrap" style="margin-top:6px"><input type="checkbox" id="co-points"> <span id="co-points-label"></span></label>
          <p class="shop-hint" id="co-member-msg"></p>
        </div>
        <div class="shop-section hidden" id="co-gem-box">
          <h4 data-i18n="co.gemTitle">Gemstone advice</h4>
          <p class="shop-hint" style="margin:0 0 8px" id="co-gem-policy"></p>
          <label class="shop-check" style="align-items:flex-start"><input type="checkbox" id="co-gem-ack" style="margin-top:3px"> <span data-i18n="co.gemAck">I have consulted my astrologer and I accept the return policy for gemstones.</span></label>
        </div>
        <div class="shop-section" style="margin-bottom:0">
          <h4 data-i18n="ml.payment">Payment</h4>
          <label class="shop-radio"><input type="radio" name="co-pay" value="COD" checked><span><strong data-i18n="ml.cod">Cash on delivery</strong><small data-i18n="ml.cod.sub">Pay when the parcel arrives</small></span></label>
          <label class="shop-radio" style="margin-bottom:0"><input type="radio" name="co-pay" value="WALLET"><span><strong data-i18n="ml.wallet">Astro wallet</strong><small id="co-wallet-note" data-i18n="ml.wallet.sub">Pay instantly from your wallet balance</small></span></label>
        </div>
      </div>
      <div class="shop-modal__foot" style="align-items:flex-start">
        <div class="shop-totals" id="co-totals"></div>
        <button type="submit" id="co-submit" class="shop-btn shop-btn--gold" data-i18n="ml.placeOrder">Place order</button>
      </div>
    </form>
    <div id="co-success" class="shop-success hidden">
      <div class="shop-success__icon">✓</div>
      <h3 style="margin:0;font-family:Georgia,serif" data-i18n="ml.orderPlaced">Order placed</h3>
      <p id="co-success-msg" style="margin:0;font-size:.85rem;color:#475569"></p>
      <dl id="co-success-list"></dl>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button type="button" class="shop-btn shop-btn--primary" id="co-view-orders" data-i18n="ml.viewOrders">View my orders</button>
        <button type="button" class="shop-btn shop-btn--line" data-close="checkout-modal" data-i18n="ml.continue">Continue shopping</button>
      </div>
    </div>
  </div>
</div>`;

export const CheckoutModal = {
  el: null,
  items: [],
  quote: null,
  coupon: '',
  usePoints: false,
  points: 0,
  submitting: false,

  $(id) { return this.el.querySelector('#' + id); },

  mount() {
    if (this.el) return;
    this.el = ensureOverlay('shop-checkout', HTML);
    applyI18n(this.el);
    this.$('co-apply').addEventListener('click', () => this.applyCoupon());
    this.$('co-coupon').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.applyCoupon(); } });
    this.$('co-points').addEventListener('change', (e) => { this.usePoints = e.target.checked; this.requote(); });
    this.$('checkout-form').addEventListener('submit', (e) => this.submit(e));
    this.$('co-view-orders').addEventListener('click', () => { closeModal(this.$('checkout-modal')); if (window.OrdersModal) window.OrdersModal.open(); });
    window.addEventListener('astro:languagechange', () => { applyI18n(this.el); if (this.$('checkout-modal').classList.contains('is-open')) this.requote(); });
  },

  /** `items`: [{ product_id, quantity, options }]. */
  async open(items) {
    this.mount();
    if (!items || !items.length) return;
    this.items = items;
    this.coupon = '';
    this.usePoints = false;
    this.$('checkout-form').classList.remove('hidden');
    this.$('co-success').classList.add('hidden');
    this.$('co-coupon').value = '';
    this.$('co-coupon-msg').textContent = '';
    this.$('co-points').checked = false;
    const gotra = this.$('co-gotra');
    gotra.value = currentLang() === 'hi' ? 'कश्यप' : 'Kashyap';
    this.$('co-gem-ack').checked = false;
    openModal(this.$('checkout-modal'));
    this.prefill();
    this.loadWallet();
    await this.requote(true);
  },

  async prefill() {
    if (!isSignedIn()) return;
    try {
      const charts = await api('/api/v1/charts');
      const c = (charts || []).find(x => x.is_default) || (charts || [])[0];
      if (c && !this.$('co-name').value) this.$('co-name').value = c.name || '';
    } catch (e) { /* optional */ }
  },

  async loadWallet() {
    const note = this.$('co-wallet-note');
    if (!isSignedIn()) { note.textContent = t('ml.wallet.signin'); this.points = 0; this.$('co-points-wrap').classList.add('hidden'); return; }
    try {
      const w = await api('/api/v1/wallet');
      note.textContent = t('ml.wallet.balance', { amount: money(w.balance) });
    } catch (e) { /* keep default */ }
    try {
      const r = await api('/api/v1/rewards/summary');
      this.points = r.points || 0;
      this.pointWorth = r.point_value;
    } catch (e) { this.points = 0; }
    this.paintPoints();
  },

  paintPoints() {
    const wrap = this.$('co-points-wrap');
    wrap.classList.toggle('hidden', !(this.points > 0));
    this.$('co-points-label').textContent = t('co.usePoints', { points: this.points, worth: money(this.points * (this.pointWorth || 0.5)) });
  },

  async requote(first = false) {
    try {
      const q = await postJson(`/api/v1/marketplace/quote?lang=${currentLang()}`, {
        items: this.items, coupon_code: this.coupon || null, use_points: this.usePoints ? this.points : 0
      });
      this.quote = q;
      this.paint();
    } catch (err) {
      if (this.coupon) {
        this.$('co-coupon-msg').textContent = err.message;
        this.$('co-coupon-msg').style.color = '#dc2626';
        this.coupon = '';
        return this.requote();
      }
      toast(err.message, 'error');
      if (first) closeModal(this.$('checkout-modal'));
    }
  },

  paint() {
    const q = this.quote;
    const tot = q.totals;
    this.$('co-items').innerHTML = q.lines.map(l => `
      <div class="shop-cartline" style="grid-template-columns:48px minmax(0,1fr) auto;padding:8px 0"><img src="${esc(mediaUrl(l.image_url))}" alt="" style="width:48px;height:48px">
      <div><h5 style="margin:0">${esc(l.title)}</h5>${l.options_label ? `<small style="color:#64748b;display:block">${esc(l.options_label)}</small>` : ''}<small style="color:#64748b">${esc(t('ml.qty', { n: l.quantity }))}</small></div>
      <strong>${money(l.line_total)}</strong></div>`).join('');
    this.$('co-gem-box').classList.toggle('hidden', !q.has_gemstone);
    if (q.has_gemstone) this.$('co-gem-policy').textContent = t('co.gemPolicy');
    const rows = [[t('ml.subtotal'), money(tot.subtotal)]];
    if (tot.member_discount) rows.push([t('co.memberDiscount'), '-' + money(tot.member_discount)]);
    if (tot.coupon_discount) rows.push([t('co.coupon', { code: tot.coupon_code }), '-' + money(tot.coupon_discount)]);
    if (tot.points_used) rows.push([t('co.pointsUsed', { n: tot.points_used }), '-' + money(tot.points_value)]);
    this.$('co-totals').innerHTML = rows.map(r => `<div class="shop-totals__row"><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')
      + `<div class="shop-totals__row shop-totals__row--big"><span>${esc(t('ml.total'))}</span><span id="co-total">${money(tot.total)}</span></div>`
      + (tot.earn_points ? `<div class="shop-hint" style="margin:4px 0 0">${esc(t('co.earn', { n: tot.earn_points }))}</div>` : '');
    this.$('co-member-msg').textContent = tot.is_member ? t('co.memberOn') : (isSignedIn() ? t('co.memberHint') : '');
    if (this.coupon && tot.coupon_discount) {
      this.$('co-coupon-msg').textContent = t('co.couponOk', { code: tot.coupon_code, amount: money(tot.coupon_discount) });
      this.$('co-coupon-msg').style.color = '#047857';
    }
  },

  async applyCoupon() {
    const code = this.$('co-coupon').value.trim().toUpperCase();
    if (!code) return;
    if (!requireLogin('auth.neededCoupon')) return;
    this.coupon = code;
    this.$('co-coupon-msg').textContent = '';
    await this.requote();
  },

  async submit(e) {
    e.preventDefault();
    if (this.submitting) return;
    if (!requireLogin('auth.neededOrder')) return;
    const method = (this.el.querySelector('input[name="co-pay"]:checked') || {}).value || 'COD';
    const btn = this.$('co-submit');
    this.submitting = true;
    btn.disabled = true;
    btn.textContent = t('ml.placing');
    try {
      const res = await postJson(`/api/v1/marketplace/checkout?lang=${currentLang()}`, {
        items: this.items,
        buyer_name: this.$('co-name').value.trim(),
        buyer_phone: this.$('co-phone').value.trim(),
        buyer_gotra: this.$('co-gotra').value.trim() || 'Kashyap',
        shipping_address: this.$('co-address').value.trim(),
        payment_method: method,
        coupon_code: this.coupon || null,
        use_points: this.usePoints ? this.points : 0,
        gemstone_ack: this.$('co-gem-ack').checked
      });
      CartStore.removeMany(this.items.map(i => lineKey(i.product_id, i.options)));
      this.$('checkout-form').classList.add('hidden');
      this.$('co-success').classList.remove('hidden');
      this.$('co-success-msg').textContent = t('ml.orderMsg', { count: res.orders.length, total: money(res.total) });
      this.$('co-success-list').innerHTML = res.orders.map(o =>
        `<div><dt>${esc(o.product_title)} x ${o.quantity}${o.options_label ? `<br><small style="color:#64748b">${esc(o.options_label)}</small>` : ''}<br><small style="color:#94a3b8">${esc(o.order_number)}</small></dt><dd>${money(o.total_price)}</dd></div>`).join('')
        + `<div><dt>${esc(t('ml.total'))}</dt><dd>${money(res.total)}</dd></div>`;
      toast(t('ml.orderPlaced'), 'success');
      if (window.App && window.App.refreshWalletUI) window.App.refreshWalletUI();
      if (window.NotificationBell) window.NotificationBell.refresh();
      window.dispatchEvent(new CustomEvent('astro:orderplaced'));
    } catch (err) {
      toast(err.message, 'error');
      if (err.status === 401) requireLogin('auth.neededOrder');
    } finally {
      this.submitting = false;
      btn.disabled = false;
      btn.textContent = t('ml.placeOrder');
    }
  }
};

if (typeof window !== 'undefined') window.CheckoutModal = CheckoutModal;
export default CheckoutModal;
