// "My orders": status, tracking timeline, cancel, return request and reviews.
import { esc, money, toast, api, postJson, openModal, closeModal, ensureOverlay, mediaUrl, t, applyI18n, requireLogin, goTo, fmtDateTime } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

const TONES = { PLACED: 'warn', PAID: 'ok', ENERGIZING: 'warn', DISPATCHED: 'ok', DELIVERED: 'ok', CANCELLED: 'off', RETURN_REQUESTED: 'warn' };

const HTML = `
<div id="orders-modal" class="shop-modal" role="dialog" aria-modal="true">
  <div class="shop-modal__panel shop-modal__panel--wide">
    <div class="shop-modal__head"><h3 id="orders-title" data-i18n="or.title">My Orders & Tracking</h3><button type="button" class="shop-modal__x" data-close="orders-modal" data-i18n-aria="close" aria-label="Close">✕</button></div>
    <div class="shop-modal__body" id="orders-list"></div>
  </div>
</div>
<div id="review-modal" class="shop-modal" role="dialog" aria-modal="true">
  <div class="shop-modal__panel">
    <div class="shop-modal__head"><h3 id="review-title" data-i18n="rv.default">Rate this item</h3><button type="button" class="shop-modal__x" data-close="review-modal" data-i18n-aria="close" aria-label="Close">✕</button></div>
    <form id="review-form"><div class="shop-modal__body">
      <div class="shop-star-input" id="review-stars"></div>
      <div class="shop-field" style="margin-top:14px"><label class="shop-label" for="review-comment" data-i18n="rv.comment">Your review (optional)</label><textarea id="review-comment" class="shop-textarea" rows="3" maxlength="1000"></textarea></div>
    </div><div class="shop-modal__foot"><span class="shop-hint" style="margin:0" data-i18n="rv.note">Only delivered orders can be reviewed.</span><button type="submit" class="shop-btn shop-btn--primary" data-i18n="rv.submit">Submit review</button></div></form>
  </div>
</div>
<div id="track-modal" class="shop-modal" role="dialog" aria-modal="true">
  <div class="shop-modal__panel">
    <div class="shop-modal__head"><h3 data-i18n="or.trackTitle">Track your order</h3><button type="button" class="shop-modal__x" data-close="track-modal" data-i18n-aria="close" aria-label="Close">✕</button></div>
    <div class="shop-modal__body" id="track-body"></div>
  </div>
</div>
<div id="return-modal" class="shop-modal" role="dialog" aria-modal="true">
  <div class="shop-modal__panel">
    <div class="shop-modal__head"><h3 data-i18n="or.returnTitle">Request a return</h3><button type="button" class="shop-modal__x" data-close="return-modal" data-i18n-aria="close" aria-label="Close">✕</button></div>
    <form id="return-form"><div class="shop-modal__body">
      <p class="shop-hint" id="return-policy" style="margin-top:0"></p>
      <div class="shop-field"><label class="shop-label" for="return-reason" data-i18n="or.returnReason">What is wrong with the item? *</label><textarea id="return-reason" class="shop-textarea" rows="3" required minlength="5" maxlength="300"></textarea></div>
    </div><div class="shop-modal__foot"><span></span><button type="submit" class="shop-btn shop-btn--gold" data-i18n="or.returnSubmit">Send request</button></div></form>
  </div>
</div>`;

export const OrdersModal = {
  el: null,
  orders: [],
  reviewTarget: null,
  reviewRating: 0,
  returnTarget: null,

  $(id) { return this.el.querySelector('#' + id); },

  mount() {
    if (this.el) return;
    this.el = ensureOverlay('shop-orders', HTML);
    applyI18n(this.el);
    this.$('orders-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-order]');
      if (!b) return;
      const id = b.getAttribute('data-id');
      const kind = b.getAttribute('data-order');
      if (kind === 'cancel') this.cancel(id);
      else if (kind === 'track') this.track(id);
      else if (kind === 'review') this.openReview(b.getAttribute('data-pid'), b.getAttribute('data-title'));
      else if (kind === 'return') this.openReturn(id);
      else if (kind === 'product') { closeModal(this.$('orders-modal')); goTo(`/astro-mall/product/${b.getAttribute('data-pid')}`); }
    });
    this.$('review-stars').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-star]');
      if (b) { this.reviewRating = +b.getAttribute('data-star'); this.paintStars(); }
    });
    this.$('review-form').addEventListener('submit', (e) => this.submitReview(e));
    this.$('return-form').addEventListener('submit', (e) => this.submitReturn(e));
    window.addEventListener('astro:languagechange', () => {
      applyI18n(this.el);
      if (this.$('orders-modal').classList.contains('is-open')) this.open();
    });
    window.addEventListener('astro:orderplaced', () => { if (this.$('orders-modal').classList.contains('is-open')) this.open(); });
  },

  async open() {
    this.mount();
    if (!requireLogin('auth.neededOrders')) return;
    const list = this.$('orders-list');
    openModal(this.$('orders-modal'));
    list.innerHTML = `<div class="shop-loading"><div class="shop-spinner"></div><p>${esc(t('or.loading'))}</p></div>`;
    try { this.orders = (await api(`/api/v1/marketplace/my-orders?lang=${currentLang()}`)).orders || []; }
    catch (err) { list.innerHTML = `<div class="shop-empty"><b>${esc(t('or.loadFail'))}</b>${esc(err.message)}</div>`; return; }
    if (!this.orders.length) { list.innerHTML = `<div class="shop-empty"><b>${esc(t('or.none.title'))}</b>${esc(t('or.none.sub'))}</div>`; return; }
    list.innerHTML = this.orders.map(o => `
      <div class="shop-record">
        <div class="shop-record__top"><span class="shop-record__id">${esc(o.order_number)}</span><span class="shop-pill shop-pill--${TONES[o.status] || ''}">${esc(t('or.' + o.status))}</span></div>
        <div class="shop-record__main"><img src="${esc(mediaUrl(o.product_image))}" alt="">
          <div class="shop-record__meta"><strong><a href="#" data-order="product" data-pid="${esc(o.product_id)}">${esc(o.product_title)}</a></strong> x ${esc(o.quantity)}
          ${o.options_label ? `<br>${esc(o.options_label)}` : ''}<br>${money(o.total_price)} (${esc(o.payment_method)})${o.discount_amount ? ` - ${esc(t('or.saved', { amount: money(o.discount_amount) }))}` : ''}<br>
          ${esc(t(o.energization_status === 'ENERGIZED' ? 'or.energized' : 'or.pending'))}<br>
          ${o.tracking_id ? `${esc(t('or.tracking'))}: <strong>${esc(o.tracking_id)}</strong>` : esc(t('or.noTracking'))}</div></div>
        <div class="shop-record__actions">
          <button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-order="track" data-id="${esc(o.id)}">${esc(t('or.track'))}</button>
          ${o.status === 'DELIVERED' ? `<button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-order="review" data-pid="${esc(o.product_id)}" data-title="${esc(o.product_title)}">${esc(t(o.reviewed ? 'or.editReview' : 'or.rate'))}</button>
            <button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-order="return" data-id="${esc(o.id)}">${esc(t('or.return'))}</button>` : ''}
          ${o.status === 'PLACED' || o.status === 'PAID' ? `<button type="button" class="shop-btn shop-btn--danger shop-btn--sm" data-order="cancel" data-id="${esc(o.id)}">${esc(t('or.cancel'))}</button>` : ''}
        </div>
      </div>`).join('');
    list.querySelectorAll('a[data-order="product"]').forEach(a => a.addEventListener('click', (e) => e.preventDefault()));
  },

  async track(id) {
    const body = this.$('track-body');
    openModal(this.$('track-modal'));
    body.innerHTML = `<div class="shop-loading"><div class="shop-spinner"></div></div>`;
    try {
      const d = await api(`/api/v1/marketplace/orders/${encodeURIComponent(id)}/tracking`);
      const hi = currentLang() === 'hi';
      body.innerHTML = `
        <p class="shop-record__id">${esc(d.order_number)}</p>
        <ol class="shop-timeline">${d.steps.map(s => `<li><b>${esc(hi ? s.label_hi : s.label_en)}</b><small>${esc(fmtDateTime(s.time, currentLang()))}</small>${s.note ? `<span>${esc(s.note)}</span>` : ''}</li>`).join('')}</ol>
        ${d.tracking_id ? `<div class="shop-section"><h4>${esc(t('or.courier'))}: ${esc(d.provider || '')}</h4>
          <p style="margin:0 0 6px"><strong>${esc(d.tracking_id)}</strong></p>
          ${d.courier_scans.length ? `<ol class="shop-timeline">${d.courier_scans.map(c => `<li><b>${esc(c.status)}</b><small>${esc(c.location)} ${esc(c.time)}</small></li>`).join('')}</ol>`
            : (d.external_url ? `<a class="shop-btn shop-btn--line shop-btn--sm" href="${esc(d.external_url)}" target="_blank" rel="noopener">${esc(t('or.trackIndiaPost'))}</a><p class="shop-hint">${esc(t('or.trackHint'))}</p>` : '')}</div>` : `<p class="shop-hint">${esc(t('or.noTracking'))}</p>`}`;
    } catch (err) { body.innerHTML = `<div class="shop-empty">${esc(err.message)}</div>`; }
  },

  async cancel(id) {
    if (!confirm(t('or.cancelConfirm'))) return;
    try { await api(`/api/v1/marketplace/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' }); toast(t('or.cancelled'), 'success'); }
    catch (err) { toast(err.message, 'error'); }
    if (window.App && window.App.refreshWalletUI) window.App.refreshWalletUI();
    if (window.NotificationBell) window.NotificationBell.refresh();
    window.dispatchEvent(new CustomEvent('astro:ordersChanged'));
    this.open();
  },

  openReview(pid, title) {
    this.reviewTarget = pid;
    this.reviewRating = 0;
    this.$('review-title').textContent = t('rv.title', { name: title });
    this.$('review-comment').value = '';
    this.paintStars();
    openModal(this.$('review-modal'));
  },

  paintStars() {
    this.$('review-stars').innerHTML = [1, 2, 3, 4, 5].map(n => `<button type="button" data-star="${n}" class="${n <= this.reviewRating ? 'is-on' : ''}" aria-label="${n}">★</button>`).join('');
  },

  async submitReview(e) {
    e.preventDefault();
    if (!this.reviewRating) { toast(t('rv.chooseStars'), 'info'); return; }
    try {
      await postJson(`/api/v1/marketplace/products/${encodeURIComponent(this.reviewTarget)}/reviews`, { rating: this.reviewRating, comment: this.$('review-comment').value.trim() || null });
      toast(t('rv.thanks'), 'success');
      closeModal(this.$('review-modal'));
      window.dispatchEvent(new CustomEvent('astro:ordersChanged'));
      this.open();
    } catch (err) { toast(err.message, 'error'); }
  },

  openReturn(id) {
    this.returnTarget = id;
    const order = this.orders.find(o => o.id === id);
    this.$('return-policy').textContent = t('or.returnPolicy');
    this.$('return-reason').value = '';
    openModal(this.$('return-modal'));
  },

  async submitReturn(e) {
    e.preventDefault();
    try {
      await postJson(`/api/v1/marketplace/orders/${encodeURIComponent(this.returnTarget)}/return`, { reason: this.$('return-reason').value.trim() });
      toast(t('or.returnSent'), 'success');
      closeModal(this.$('return-modal'));
      if (window.NotificationBell) window.NotificationBell.refresh();
      this.open();
    } catch (err) { toast(err.message, 'error'); }
  }
};

if (typeof window !== 'undefined') window.OrdersModal = OrdersModal;
export default OrdersModal;
