// Seller dashboard: KYC, listings (stock / price / certificate), order fulfilment, earnings and payouts.
import { esc, money, toast, api, postJson, t, requireLogin, isSignedIn, mediaUrl, goTo, fmtDate } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const patch = (body) => ({ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export class SellerPageComponent {
  static root = null;
  static me = null;
  static tab = 'products';
  static photo = null;
  static extra = [];

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    this.root = target;
    window.addEventListener('astro:languagechange', () => { if (this.root.offsetParent !== null) this.open(); });
    return target;
  }

  static get lang() { return currentLang(); }

  static async open() {
    if (!this.root) return;
    if (!isSignedIn()) {
      this.root.innerHTML = `<div class="shop-page"><div class="shop-empty"><b>${esc(t('sd.signin'))}</b><br><button type="button" class="shop-btn shop-btn--gold" id="sd-login">${esc(t('auth.signInBtn'))}</button></div></div>`;
      this.root.querySelector('#sd-login').addEventListener('click', () => requireLogin('auth.neededSeller'));
      return;
    }
    this.root.innerHTML = `<div class="shop-page"><div class="shop-loading"><div class="shop-spinner"></div></div></div>`;
    try { this.me = await api('/api/v1/seller/me'); }
    catch (err) { this.root.innerHTML = `<div class="shop-page"><div class="shop-empty">${esc(err.message)}</div></div>`; return; }
    if (!this.me.registered) { this.renderRegister(); return; }
    await this.renderDashboard();
  }

  // ---------------- registration / KYC ----------------
  static renderRegister(profile = {}) {
    this.root.innerHTML = `
    <div class="shop-page sd"><h1 class="rw-title">👳 ${esc(t('sd.title'))}</h1>
      <section class="pp-section"><h2>${esc(t('sd.registerTitle'))}</h2><p class="shop-hint" style="font-size:.85rem">${esc(t('sd.registerHint'))}</p>
        <form id="sd-reg" class="sd-form">
          <div class="shop-field"><label class="shop-label">${esc(t('sl.name'))}</label><input class="shop-input" id="sd-biz" required minlength="2" maxlength="200" value="${esc(profile.business_name || '')}"></div>
          <div class="shop-row"><div class="shop-field"><label class="shop-label">${esc(t('cd.phone'))}</label><input class="shop-input" id="sd-phone" maxlength="30" value="${esc(profile.phone || '')}"></div>
            <div class="shop-field"><label class="shop-label">UPI ID</label><input class="shop-input" id="sd-upi" maxlength="120" placeholder="name@bank" value="${esc(profile.upi_id || '')}"></div></div>
          <div class="shop-field"><label class="shop-label">${esc(t('sd.pan'))}</label><input class="shop-input" id="sd-pan" maxlength="10" placeholder="ABCDE1234F" style="text-transform:uppercase"></div>
          <button class="shop-btn shop-btn--gold" type="submit">${esc(t('sd.saveProfile'))}</button></form></section></div>`;
    this.root.querySelector('#sd-reg').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('/api/v1/seller/register', json({ business_name: this.root.querySelector('#sd-biz').value.trim(), phone: this.root.querySelector('#sd-phone').value.trim() || null,
          upi_id: this.root.querySelector('#sd-upi').value.trim() || null, pan_number: this.root.querySelector('#sd-pan').value.trim() || null }));
        toast(t('sd.saved'), 'success');
        this.open();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  static kycBanner() {
    const p = this.me.profile;
    const tone = { APPROVED: 'ok', PENDING: 'warn', REJECTED: 'off' }[p.kyc_status];
    return `<div class="shop-section ${p.kyc_status === 'APPROVED' ? '' : 'shop-section--gold'}"><span class="shop-pill shop-pill--${tone}">KYC: ${esc(t('sd.kyc.' + p.kyc_status))}</span>
      ${p.kyc_note ? `<p class="shop-hint">${esc(p.kyc_note)}</p>` : ''}
      ${p.kyc_status !== 'APPROVED' ? `<p class="shop-hint" style="font-size:.82rem">${esc(t(p.has_document ? 'sd.kycWait' : 'sd.kycNeedDoc'))}</p>
      <div class="shop-coupon"><input type="file" id="sd-kyc-file" class="shop-input" accept="application/pdf,image/jpeg,image/png" style="padding:7px"><button type="button" class="shop-btn shop-btn--line" id="sd-kyc-up">${esc(t('sd.uploadDoc'))}</button></div>` : ''}</div>`;
  }

  // ---------------- dashboard ----------------
  static async renderDashboard() {
    const p = this.me.profile;
    const tabs = [['products', 'sd.tab.products'], ['orders', 'sd.tab.orders'], ['earnings', 'sd.tab.earnings'], ['profile', 'sd.tab.profile']];
    this.root.innerHTML = `
    <div class="shop-page sd"><h1 class="rw-title">👳 ${esc(p.business_name)}</h1>
      ${this.kycBanner()}
      <div class="rw-cards"><div class="rw-card"><small>${esc(t('sd.available'))}</small><strong>${money(this.me.earnings.available)}</strong><span>${esc(t('sd.net', { amount: money(this.me.earnings.net) }))}</span></div>
        <div class="rw-card"><small>${esc(t('sd.openOrders'))}</small><strong>${this.me.open_orders}</strong><span>${esc(t('sd.toFulfil'))}</span></div>
        <div class="rw-card"><small>${esc(t('sd.listings'))}</small><strong>${this.me.products}</strong><span>${esc(t('sd.inCatalog'))}</span></div></div>
      <nav class="admin-tabs" id="sd-tabs">${tabs.map(([k, label]) => `<button type="button" class="admin-tab ${this.tab === k ? 'active' : ''}" data-tab="${k}">${esc(t(label))}</button>`).join('')}</nav>
      <div id="sd-body"></div></div>`;
    this.root.querySelector('#sd-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { this.tab = b.getAttribute('data-tab'); this.renderDashboard(); } });
    const up = this.root.querySelector('#sd-kyc-up');
    if (up) up.addEventListener('click', () => this.uploadKyc());
    await this['tab_' + this.tab]();
  }

  static async uploadKyc() {
    const file = this.root.querySelector('#sd-kyc-file').files[0];
    if (!file) { toast(t('sd.chooseFile'), 'info'); return; }
    const form = new FormData(); form.append('file', file);
    try { await api('/api/v1/seller/kyc-document', { method: 'POST', body: form }); toast(t('sd.docSent'), 'success'); this.open(); }
    catch (err) { toast(err.message, 'error'); }
  }

  // ----- products -----
  static async tab_products() {
    const body = this.root.querySelector('#sd-body');
    const approved = this.me.profile.kyc_status === 'APPROVED';
    let prods = [];
    try { prods = (await api(`/api/v1/marketplace/seller/my-products?lang=${this.lang}`)).products; } catch (e) { /* empty */ }
    body.innerHTML = `
      <section class="pp-section"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0">${esc(t('sd.tab.products'))}</h2>
        <button type="button" class="shop-btn shop-btn--gold shop-btn--sm" id="sd-new" ${approved ? '' : 'disabled'}>+ ${esc(t('sd.addProduct'))}</button></div>
        ${approved ? '' : `<p class="shop-hint">${esc(t('sd.needKyc'))}</p>`}
        <div id="sd-form-box"></div>
        ${prods.map(p => `
        <div class="shop-record sd-prod" data-id="${esc(p.id)}"><div class="shop-record__main"><img src="${esc(mediaUrl(p.image_url))}" alt="">
          <div class="shop-record__meta" style="flex:1"><strong>${esc(p.title)}</strong><br>
            <span class="shop-pill shop-pill--${p.listing_status === 'APPROVED' ? (p.is_active ? 'ok' : 'off') : (p.listing_status === 'REJECTED' ? 'off' : 'warn')}">${esc(t('sd.ls.' + (p.listing_status === 'APPROVED' && !p.is_active ? 'PAUSED' : p.listing_status)))}</span>
            <span class="shop-pill shop-pill--${p.has_lab_certificate ? 'ok' : (p.certificate_status === 'PENDING' ? 'warn' : 'off')}">${esc(t('sd.cs.' + p.certificate_status))}</span></div></div>
          <div class="sd-edit"><label>${esc(t('sl.price'))}<input type="number" class="shop-input" data-f="price" value="${p.price}" min="1"></label>
            <label>${esc(t('sl.mrp'))}<input type="number" class="shop-input" data-f="original_price" value="${p.original_price || ''}" min="1"></label>
            <label>${esc(t('sl.stock'))}<input type="number" class="shop-input" data-f="stock" value="${p.stock}" min="0"></label></div>
          <div class="shop-record__actions"><button type="button" class="shop-btn shop-btn--primary shop-btn--sm" data-save>${esc(t('sd.save'))}</button>
            ${p.listing_status === 'APPROVED' ? `<button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-pause="${p.is_active ? 1 : 0}">${esc(t(p.is_active ? 'sd.pause' : 'sd.resume'))}</button>` : ''}
            <button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-cert-toggle>📜 ${esc(t('sd.certUpload'))}</button></div>
          <form class="sd-cert hidden" data-cert-form><input class="shop-input" name="lab" required placeholder="${esc(t('sd.lab'))}" maxlength="120"><input class="shop-input" name="number" required placeholder="${esc(t('sd.certNo'))}" maxlength="80">
            <input type="file" name="file" class="shop-input" required accept="application/pdf,image/jpeg,image/png" style="padding:7px"><button class="shop-btn shop-btn--gold shop-btn--sm" type="submit">${esc(t('sd.sendCert'))}</button></form>
        </div>`).join('') || `<p class="shop-hint">${esc(t('sd.noProducts'))}</p>`}</section>`;
    body.querySelector('#sd-new').addEventListener('click', () => this.showProductForm());
    body.querySelectorAll('.sd-prod').forEach(row => {
      const id = row.getAttribute('data-id');
      row.querySelector('[data-save]').addEventListener('click', async () => {
        const val = (f) => row.querySelector(`[data-f="${f}"]`).value;
        try { await api(`/api/v1/seller/products/${id}`, patch({ price: +val('price'), original_price: val('original_price') ? +val('original_price') : null, stock: +val('stock') })); toast(t('sd.saved'), 'success'); }
        catch (err) { toast(err.message, 'error'); }
      });
      const pause = row.querySelector('[data-pause]');
      if (pause) pause.addEventListener('click', async () => {
        try { await api(`/api/v1/seller/products/${id}`, patch({ paused: pause.getAttribute('data-pause') === '1' })); this.tab_products(); }
        catch (err) { toast(err.message, 'error'); }
      });
      row.querySelector('[data-cert-toggle]').addEventListener('click', () => row.querySelector('[data-cert-form]').classList.toggle('hidden'));
      row.querySelector('[data-cert-form]').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        const form = new FormData(); form.append('lab', f.lab.value); form.append('number', f.number.value); form.append('file', f.file.files[0]);
        try { await api(`/api/v1/seller/products/${id}/certificate`, { method: 'POST', body: form }); toast(t('sd.certSent'), 'success'); this.tab_products(); }
        catch (err) { toast(err.message, 'error'); }
      });
    });
  }

  static showProductForm() {
    this.photo = null; this.extra = [];
    const box = this.root.querySelector('#sd-form-box');
    box.innerHTML = `
    <form id="sd-prod-form" class="shop-section" style="margin-top:14px"><h4>${esc(t('sd.addProduct'))}</h4>
      <div class="shop-field"><label class="shop-label">${esc(t('sl.photo'))}</label>
        <div class="shop-upload"><img id="sd-photo-prev" src="/assets/img/products/rudraksha-5.jpg" alt=""><div style="min-width:0"><input type="file" id="sd-photo" accept="image/jpeg,image/png,image/webp" class="shop-input" style="padding:7px"><p class="shop-hint">${esc(t('sl.photo.hint'))}</p></div></div>
        <div class="shop-upload" style="margin-top:8px"><div id="sd-extra-prev" class="sd-extra"></div><div style="min-width:0"><input type="file" id="sd-extra" accept="image/jpeg,image/png,image/webp" class="shop-input" style="padding:7px"><p class="shop-hint">${esc(t('sd.extraHint'))}</p></div></div></div>
      <div class="shop-field"><label class="shop-label">${esc(t('sl.name'))}</label><input class="shop-input" id="np-seller" required minlength="2" value="${esc(this.me.profile.business_name)}"></div>
      <div class="shop-field"><label class="shop-label">${esc(t('sl.itemTitle'))}</label><input class="shop-input" id="np-title" required minlength="3" maxlength="255"></div>
      <div class="shop-row"><div class="shop-field"><label class="shop-label">${esc(t('sl.category'))}</label><select class="shop-select" id="np-cat">${['rudraksha', 'mala', 'yantra', 'gemstone', 'samagri'].map(c => `<option value="${c}">${esc(t('sl.cat.' + c))}</option>`).join('')}</select></div>
        <div class="shop-field"><label class="shop-label">${esc(t('sl.stock'))}</label><input type="number" class="shop-input" id="np-stock" value="10" min="1" required></div></div>
      <div class="shop-row"><div class="shop-field"><label class="shop-label">${esc(t('sl.price'))}</label><input type="number" class="shop-input" id="np-price" min="10" required></div>
        <div class="shop-field"><label class="shop-label">${esc(t('sl.mrp'))}</label><input type="number" class="shop-input" id="np-mrp" min="10"></div></div>
      <div class="shop-row"><div class="shop-field"><label class="shop-label">${esc(t('sl.material'))}</label><input class="shop-input" id="np-material" maxlength="100"></div>
        <div class="shop-field"><label class="shop-label">${esc(t('sl.origin'))}</label><input class="shop-input" id="np-origin" maxlength="100"></div></div>
      <div class="shop-field"><label class="shop-label">${esc(t('sl.desc'))}</label><textarea class="shop-textarea" id="np-desc" rows="3" required minlength="10"></textarea></div>
      <div class="shop-field"><label class="shop-label">${esc(t('sl.energize'))}</label><input class="shop-input" id="np-energize" maxlength="255"></div>
      <button class="shop-btn shop-btn--gold" type="submit">${esc(t('sl.submit'))}</button></form>`;
    const upload = async (file) => { const f = new FormData(); f.append('file', file); return (await api('/api/v1/marketplace/seller/upload-image', { method: 'POST', body: f })).url; };
    box.querySelector('#sd-photo').addEventListener('change', async (e) => {
      if (!e.target.files[0]) return;
      try { this.photo = await upload(e.target.files[0]); box.querySelector('#sd-photo-prev').src = mediaUrl(this.photo); toast(t('sl.photoUploaded'), 'success'); }
      catch (err) { this.photo = null; e.target.value = ''; toast(err.message, 'error'); }
    });
    box.querySelector('#sd-extra').addEventListener('change', async (e) => {
      if (!e.target.files[0]) return;
      if (this.extra.length >= 5) { toast(t('sd.maxPhotos'), 'info'); e.target.value = ''; return; }
      try { this.extra.push(await upload(e.target.files[0])); box.querySelector('#sd-extra-prev').innerHTML = this.extra.map(u => `<img src="${esc(mediaUrl(u))}" alt="">`).join(''); e.target.value = ''; }
      catch (err) { e.target.value = ''; toast(err.message, 'error'); }
    });
    box.querySelector('#sd-prod-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.photo) { toast(t('sl.needPhoto'), 'info'); return; }
      const v = (id) => box.querySelector('#' + id).value.trim();
      try {
        await postJson('/api/v1/marketplace/seller/add-product', { seller_name: v('np-seller'), title: v('np-title'), category: v('np-cat'), description: v('np-desc'),
          price: +v('np-price'), original_price: v('np-mrp') ? +v('np-mrp') : null, stock: +v('np-stock') || 1, material: v('np-material') || null,
          origin: v('np-origin') || null, energized_details: v('np-energize') || null, image_url: this.photo, extra_images: this.extra });
        toast(t('sl.submitted'), 'success');
        this.open();
      } catch (err) { toast(err.message, 'error'); }
    });
  }

  // ----- orders -----
  static async tab_orders() {
    const body = this.root.querySelector('#sd-body');
    let orders = [];
    try { orders = (await api(`/api/v1/seller/orders?lang=${this.lang}`)).orders; } catch (e) { /* empty */ }
    body.innerHTML = `<section class="pp-section"><h2>${esc(t('sd.tab.orders'))}</h2>${orders.map(o => `
      <div class="shop-record" data-id="${esc(o.id)}"><div class="shop-record__top"><span class="shop-record__id">${esc(o.order_number)}</span><span class="shop-pill shop-pill--${o.status === 'DELIVERED' ? 'ok' : 'warn'}">${esc(t('or.' + o.status))}</span></div>
        <div class="shop-record__main"><img src="${esc(mediaUrl(o.product_image))}" alt=""><div class="shop-record__meta"><strong>${esc(o.product_title)}</strong> x ${o.quantity}${o.options_label ? `<br>${esc(o.options_label)}` : ''}<br>
          ${esc(t('sd.energizeFor'))}: <strong>${esc(o.buyer_name)}</strong> (${esc(t('md.gotra'))}: ${esc(o.buyer_gotra)})<br>${esc(o.buyer_phone)} · ${esc(o.shipping_address)}<br>${money(o.total_price)}${o.seller_amount ? ` · ${esc(t('sd.yourShare', { amount: money(o.seller_amount) }))}` : ''}</div></div>
        ${['PLACED', 'PAID', 'ENERGIZING'].includes(o.status) ? `<div class="shop-record__actions">
          ${o.status !== 'ENERGIZING' ? `<button class="shop-btn shop-btn--line shop-btn--sm" data-st="ENERGIZING">${esc(t('sd.startEnergize'))}</button>` : ''}
          <input class="shop-input" style="max-width:190px" data-track placeholder="${esc(t('sd.trackingId'))}"><button class="shop-btn shop-btn--gold shop-btn--sm" data-st="DISPATCHED">${esc(t('sd.dispatch'))}</button></div>` : ''}</div>`).join('') || `<p class="shop-hint">${esc(t('sd.noOrders'))}</p>`}</section>`;
    body.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', async () => {
      const row = b.closest('[data-id]');
      const st = b.getAttribute('data-st');
      const track = row.querySelector('[data-track]');
      try { await api(`/api/v1/seller/orders/${row.getAttribute('data-id')}`, patch({ status: st, tracking_id: st === 'DISPATCHED' && track ? track.value.trim() || null : null })); toast(t('sd.saved'), 'success'); this.open(); }
      catch (err) { toast(err.message, 'error'); }
    }));
  }

  // ----- earnings -----
  static async tab_earnings() {
    const body = this.root.querySelector('#sd-body');
    let data;
    try { data = await api('/api/v1/seller/earnings'); } catch (err) { body.innerHTML = `<div class="shop-empty">${esc(err.message)}</div>`; return; }
    const e = data.earnings;
    body.innerHTML = `<section class="pp-section"><h2>${esc(t('sd.tab.earnings'))}</h2>
      <div class="rw-cards">${[['sd.gross', e.gross], ['sd.commission', e.commission], ['sd.netEarn', e.net], ['sd.paidOut', e.paid_out], ['sd.pending', e.pending_payout], ['sd.available', e.available]].map(([k, v]) => `<div class="rw-card"><small>${esc(t(k))}</small><strong>${money(v)}</strong></div>`).join('')}</div>
      <p class="shop-hint">${esc(t('sd.commissionHint'))}</p>
      <form id="sd-payout" class="shop-coupon"><input type="number" class="shop-input" id="sd-amount" min="${e.min_payout}" max="${e.available}" step="1" placeholder="${esc(t('sd.amount', { min: money(e.min_payout) }))}" required><button class="shop-btn shop-btn--gold" type="submit">${esc(t('sd.requestPayout'))}</button></form>
      ${data.payouts.length ? `<table class="tp-table" style="margin-top:14px">${data.payouts.map(x => `<tr><td>${esc(fmtDate(x.requested_at, this.lang))}</td><td>${money(x.amount)}</td><td><span class="shop-pill shop-pill--${x.status === 'PAID' ? 'ok' : 'warn'}">${esc(t('sd.po.' + x.status))}</span></td><td>${esc(x.reference || '')}</td></tr>`).join('')}</table>` : ''}</section>`;
    body.querySelector('#sd-payout').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      try { await postJson('/api/v1/seller/payouts', { amount: +body.querySelector('#sd-amount').value }); toast(t('sd.payoutSent'), 'success'); this.open(); }
      catch (err) { toast(err.message, 'error'); }
    });
  }

  // ----- profile -----
  static async tab_profile() {
    const p = this.me.profile;
    const body = this.root.querySelector('#sd-body');
    body.innerHTML = `<section class="pp-section"><h2>${esc(t('sd.tab.profile'))}</h2>
      <p class="shop-hint" style="font-size:.85rem">${esc(p.business_name)} · UPI: ${esc(p.upi_id || '-')} · PAN: ${esc(p.pan_masked || '-')}</p>
      <button class="shop-btn shop-btn--line" id="sd-edit">${esc(t('sd.editProfile'))}</button></section>`;
    body.querySelector('#sd-edit').addEventListener('click', () => this.renderRegister(p));
  }
}

if (typeof window !== 'undefined') window.SellerPageComponent = SellerPageComponent;
export default SellerPageComponent;
