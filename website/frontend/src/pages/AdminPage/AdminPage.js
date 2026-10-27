import { loadTemplate } from '../../utils/templateLoader.js';
import { api as shopApi, mediaUrl, downloadFile } from '../../utils/shop.js';

const BOOKING_STATUSES = ['PAID', 'SANKALP_SCHEDULED', 'VIDEO_UPLOADED', 'COMPLETED'];
const ORDER_STATUSES = ['PLACED', 'PAID', 'ENERGIZING', 'DISPATCHED', 'DELIVERED'];

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const EXTRA_TABS = ['sellers', 'certs', 'payouts', 'priests', 'temples', 'coupons', 'packages'];

export class AdminPageComponent {
  static templatePath = '/src/pages/AdminPage/AdminPage.html';
  static tab = 'bookings';
  static data = { bookings: [], orders: [], products: [] };
  static extra = [];
  static temples = [];
  static denied = false;

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    target.innerHTML = await loadTemplate(this.templatePath);
    this.bindEvents(target);
    return target;
  }

  static bindEvents(root) {
    root.querySelector('#admin-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      this.tab = btn.getAttribute('data-tab');
      root.querySelectorAll('.admin-tab').forEach(b => b.classList.toggle('active', b === btn));
      this.render();
    });
    root.querySelector('#admin-status-filter').addEventListener('change', () => this.load());
    root.querySelector('#admin-refresh').addEventListener('click', () => this.load());
    root.querySelector('#admin-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) this.handleAction(btn);
    });
  }

  // Called by the router every time /admin is opened.
  static async open() {
    await this.load();
  }

  static toast(msg, type = 'success') {
    if (window.Toast && window.Toast.show) window.Toast.show(msg, type);
    else alert(msg);
  }

  static api(url, options) { return shopApi(url, options); }

  static statusOptions() {
    const list = this.tab === 'bookings' ? ['ALL', ...BOOKING_STATUSES, 'CANCELLED']
      : this.tab === 'orders' ? ['ALL', ...ORDER_STATUSES, 'CANCELLED'] : [];
    return list;
  }

  static async load() {
    const body = document.getElementById('admin-body');
    const denied = document.getElementById('admin-denied');
    const filterSel = document.getElementById('admin-status-filter');
    if (!body || !denied) return;
    const status = filterSel.value || 'ALL';

    try {
      const [b, o, p] = await Promise.all([
        this.api(`/api/v1/mandir/admin/bookings?lang=en&status=${this.tab === 'bookings' ? status : 'ALL'}`),
        this.api(`/api/v1/marketplace/admin/orders?lang=en&status=${this.tab === 'orders' ? status : 'ALL'}`),
        this.api('/api/v1/marketplace/admin/products?pending=true&lang=en')
      ]);
      this.data = { bookings: b.bookings, orders: o.orders, products: p.products };
      this.denied = false;
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        this.denied = true;
      } else {
        this.toast(err.message, 'error');
        return;
      }
    }
    denied.hidden = !this.denied;
    body.hidden = this.denied;
    if (!this.denied) this.render();
  }

  static async render() {
    if (EXTRA_TABS.includes(this.tab)) { await this.renderExtra(); return; }
    const root = document.getElementById('admin-list');
    if (!root) return;
    const filterSel = document.getElementById('admin-status-filter');
    const opts = this.statusOptions();
    document.getElementById('admin-filter-wrap').hidden = opts.length === 0;
    if (opts.length && filterSel.dataset.tab !== this.tab) {
      filterSel.innerHTML = opts.map(s => `<option value="${s}">${s === 'ALL' ? 'All' : s}</option>`).join('');
      filterSel.dataset.tab = this.tab;
      filterSel.value = 'ALL';
    }
    document.getElementById('count-bookings').textContent = `(${this.data.bookings.length})`;
    document.getElementById('count-orders').textContent = `(${this.data.orders.length})`;
    document.getElementById('count-products').textContent = `(${this.data.products.length})`;

    const rows = this.data[this.tab];
    if (!rows.length) {
      root.innerHTML = '<div class="admin-empty">Nothing here yet.</div>';
      return;
    }
    root.innerHTML = rows.map(r => this.tab === 'bookings' ? this.bookingCard(r)
      : this.tab === 'orders' ? this.orderCard(r) : this.productCard(r)).join('');
  }

  static badge(status) {
    const cls = status === 'COMPLETED' || status === 'DELIVERED' ? 'ok'
      : status === 'CANCELLED' ? 'off' : 'warn';
    return `<span class="admin-badge ${cls}">${esc(status)}</span>`;
  }

  static bookingCard(b) {
    const cancelled = b.status === 'CANCELLED';
    return `
    <article class="admin-card" data-id="${esc(b.id)}">
      <div class="admin-card-top"><span class="admin-id">${esc(b.booking_number)}</span>${this.badge(b.status)}</div>
      <div class="admin-meta">
        <strong>${esc(b.temple_name)}</strong> - ${esc(b.offering_title)}<br>
        Yajman: <strong>${esc(b.devotee_name)}</strong> (Gotra: ${esc(b.gotra)}${b.rashi ? ', Rashi: ' + esc(b.rashi) : ''})<br>
        Sankalp: ${esc(b.sankalp_purpose)}${b.family_members ? '<br>Family: ' + esc(b.family_members) : ''}<br>
        Phone: ${esc(b.devotee_phone || '-')} | Paid ₹${Math.round(b.amount_paid)} (${esc(b.payment_method)})
        ${b.include_prasad ? `<br>Prasad to: ${esc(b.delivery_address)}` : ''}
        ${b.video_proof_url ? `<br>Video: <a href="${esc(mediaUrl(b.video_proof_url))}" target="_blank" rel="noopener">view</a>` : ''}
      </div>
      ${cancelled ? '' : `
      <div class="admin-actions">
        <select class="admin-input" data-field="status">
          ${BOOKING_STATUSES.map(s => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <input class="admin-input" data-field="scheduled_for" placeholder="Scheduled (e.g. 2026-11-02 06:00)" value="${esc(b.scheduled_for || '')}">
        <input class="admin-input" data-field="video" type="file" accept="video/mp4,video/webm,video/quicktime">
        ${b.include_prasad ? `<input class="admin-input" data-field="tracking" placeholder="Prasad tracking ID" value="${esc(b.prasad_tracking_id || '')}">` : ''}
        <button type="button" class="admin-btn" data-action="save-booking">Save</button>
      </div>`}
    </article>`;
  }

  static orderCard(o) {
    const cancelled = o.status === 'CANCELLED';
    return `
    <article class="admin-card" data-id="${esc(o.id)}">
      <div class="admin-card-top"><span class="admin-id">${esc(o.order_number)}</span>${this.badge(o.status)}</div>
      <div class="admin-meta">
        <strong>${esc(o.product_title)}</strong> x ${esc(o.quantity)} - ₹${Math.round(o.total_price)} (${esc(o.payment_method)})<br>
        Buyer: <strong>${esc(o.buyer_name)}</strong> (Gotra: ${esc(o.buyer_gotra)}) | ${esc(o.buyer_phone)}<br>
        Ship to: ${esc(o.shipping_address)}<br>
        Energization: ${esc(o.energization_status)}
      </div>
      ${cancelled ? '' : `
      <div class="admin-actions">
        <select class="admin-input" data-field="status">
          ${ORDER_STATUSES.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <input class="admin-input" data-field="tracking" placeholder="Tracking ID (required to dispatch)" value="${esc(o.tracking_id || '')}">
        <button type="button" class="admin-btn" data-action="save-order">Save</button>
      </div>`}
    </article>`;
  }

  static productCard(p) {
    return `
    <article class="admin-card" data-id="${esc(p.id)}">
      <div class="admin-card-top"><span class="admin-id">${esc(p.title)}</span><span class="admin-badge warn">PENDING</span></div>
      <img src="${esc(mediaUrl(p.image_url))}" alt="" style="width:120px;height:90px;object-fit:cover;border-radius:10px">
      <div class="admin-meta">
        Seller: <strong>${esc(p.seller_name)}</strong> | ${esc(p.category)} | ₹${Math.round(p.price)} | Stock ${esc(p.stock)}<br>
        ${esc(p.description)}
      </div>
      <div class="admin-actions">
        <button type="button" class="admin-btn" data-action="approve">Approve</button>
        <button type="button" class="admin-btn admin-btn-danger" data-action="reject">Reject</button>
      </div>
    </article>`;
  }

  // ---------------- shop management tabs ----------------
  static async renderExtra() {
    const root = document.getElementById('admin-list');
    document.getElementById('admin-filter-wrap').hidden = true;
    const tab = this.tab;
    try {
      if (tab === 'sellers') this.extra = (await this.api('/api/v1/shop-admin/sellers')).sellers;
      else if (tab === 'certs') this.extra = (await this.api('/api/v1/shop-admin/certificates')).certificates;
      else if (tab === 'payouts') this.extra = (await this.api('/api/v1/shop-admin/payouts')).payouts;
      else if (tab === 'priests') { this.extra = (await this.api('/api/v1/shop-admin/priests')).priests; this.temples = (await this.api('/api/v1/shop-admin/temples')).temples; }
      else if (tab === 'temples') this.extra = (await this.api('/api/v1/shop-admin/temples')).temples;
      else if (tab === 'coupons') this.extra = (await this.api('/api/v1/shop-admin/coupons')).coupons;
      else if (tab === 'packages') this.extra = (await this.api('/api/v1/shop-admin/packages')).packages;
    } catch (err) { root.innerHTML = `<div class="admin-empty">${esc(err.message)}</div>`; return; }
    const rows = this.extra || [];
    const html = {
      sellers: () => rows.map(s => `<article class="admin-card" data-id="${esc(s.user_id)}"><div class="admin-card-top"><span class="admin-id">${esc(s.business_name)}</span>${this.badge(s.kyc_status)}</div>
        <div class="admin-meta">${esc(s.email)} | ${esc(s.phone || '-')} | UPI ${esc(s.upi_id || '-')} | PAN ${esc(s.pan_number || '-')}${s.kyc_note ? '<br>Note: ' + esc(s.kyc_note) : ''}</div>
        <div class="admin-actions">${s.has_document ? '<button type="button" class="admin-btn admin-btn-ghost" data-action="kyc-doc">View document</button>' : '<span class="admin-meta">No document yet</span>'}
        <input class="admin-input" data-field="note" placeholder="Note to seller (optional)"><button type="button" class="admin-btn" data-action="kyc-approve">Approve</button><button type="button" class="admin-btn admin-btn-danger" data-action="kyc-reject">Reject</button></div></article>`).join(''),
      certs: () => rows.map(c => `<article class="admin-card" data-id="${esc(c.product_id)}"><div class="admin-card-top"><span class="admin-id">${esc(c.title)}</span><span class="admin-badge warn">PENDING</span></div>
        <div class="admin-meta">Seller: ${esc(c.seller)} | Lab: <strong>${esc(c.lab)}</strong> | No. <strong>${esc(c.number)}</strong> | <a href="${esc(mediaUrl(c.file))}" target="_blank" rel="noopener">Open certificate file</a></div>
        <div class="admin-actions"><input class="admin-input" data-field="note" placeholder="Reason if rejected"><button type="button" class="admin-btn" data-action="cert-approve">Verify</button><button type="button" class="admin-btn admin-btn-danger" data-action="cert-reject">Reject</button></div></article>`).join(''),
      payouts: () => rows.map(p => `<article class="admin-card" data-id="${esc(p.id)}"><div class="admin-card-top"><span class="admin-id">${esc(p.seller)} - ₹${Math.round(p.amount)}</span>${this.badge(p.status)}</div>
        <div class="admin-meta">UPI: ${esc(p.upi_id || '-')} | Requested ${esc((p.requested_at || '').slice(0, 10))}${p.reference ? ' | Ref ' + esc(p.reference) : ''}</div>
        ${p.status === 'REQUESTED' ? '<div class="admin-actions"><input class="admin-input" data-field="ref" placeholder="UTR / reference after paying"><button type="button" class="admin-btn" data-action="payout-paid">Mark paid</button></div>' : ''}</article>`).join(''),
      priests: () => `<form class="admin-card" id="priest-form"><div class="admin-card-top"><span class="admin-id">Add priest</span></div>
        <div class="admin-actions"><input class="admin-input" name="name" placeholder="Name *" required><select class="admin-input" name="temple"><option value="">All temples</option>${(this.temples || []).map(t => `<option value="${esc(t.slug)}">${esc(t.name)}</option>`).join('')}</select>
        <input class="admin-input" name="years" type="number" min="0" placeholder="Years of experience"><input class="admin-input" name="languages" placeholder="Languages"></div>
        <div class="admin-actions"><input class="admin-input" name="bio" placeholder="Bio (Hindi)"><input class="admin-input" name="bio_en" placeholder="Bio (English)"><input class="admin-input" name="photo" type="file" accept="image/*"><label class="admin-meta"><input type="checkbox" name="verified"> Verified</label><button class="admin-btn" type="submit">Save priest</button></div></form>`
        + rows.map(p => `<article class="admin-card" data-id="${esc(p.id)}"><div class="admin-card-top"><span class="admin-id">${esc(p.name)}</span><span class="admin-badge ${p.verified ? 'ok' : 'warn'}">${p.verified ? 'VERIFIED' : 'UNVERIFIED'}</span></div>
          <div class="admin-meta">${esc(p.temple_slug || 'All temples')} | ${p.years_experience} yrs | ${esc(p.languages || '')} | ${p.is_active ? 'Active' : 'Hidden'}</div>
          <div class="admin-actions"><button type="button" class="admin-btn admin-btn-ghost" data-action="priest-toggle-verify">${p.verified ? 'Unverify' : 'Verify'}</button><button type="button" class="admin-btn admin-btn-danger" data-action="priest-hide">Hide</button></div></article>`).join(''),
      temples: () => rows.map(t => `<article class="admin-card" data-id="${esc(t.slug)}"><div class="admin-card-top"><span class="admin-id">${esc(t.name)}</span></div>
        <div class="admin-actions"><input class="admin-input" data-field="live" placeholder="Live darshan link (https://www.youtube.com/watch?v=...)" value="${esc(t.live_url || '')}" style="flex:2 1 320px"></div>
        <div class="admin-actions"><textarea class="admin-input" data-field="aarti" rows="3" placeholder="One per line: Aarti name | 05:00 AM" style="flex:1 1 100%">${esc((t.aarti_timings || []).map(a => a.name + ' | ' + a.time).join('\n'))}</textarea>
        <button type="button" class="admin-btn" data-action="temple-save">Save</button></div></article>`).join(''),
      coupons: () => `<form class="admin-card" id="coupon-form"><div class="admin-card-top"><span class="admin-id">New coupon</span></div>
        <div class="admin-actions"><input class="admin-input" name="code" placeholder="CODE *" required style="text-transform:uppercase"><select class="admin-input" name="kind"><option value="percent">Percent %</option><option value="flat">Flat ₹</option></select>
        <input class="admin-input" name="value" type="number" step="0.01" placeholder="Value *" required><input class="admin-input" name="min" type="number" placeholder="Min order ₹"><input class="admin-input" name="max" type="number" placeholder="Max discount ₹">
        <select class="admin-input" name="scope"><option value="all">Mall + Seva</option><option value="mall">Mall only</option><option value="seva">Seva only</option></select></div>
        <div class="admin-actions"><input class="admin-input" name="limit" type="number" placeholder="Total uses (blank = unlimited)"><input class="admin-input" name="desc" placeholder="Description shown to users"><label class="admin-meta"><input type="checkbox" name="first"> First order only</label><button class="admin-btn" type="submit">Create</button></div></form>`
        + rows.map(c => `<article class="admin-card" data-id="${esc(c.code)}"><div class="admin-card-top"><span class="admin-id">${esc(c.code)}</span><span class="admin-badge ${c.is_active ? 'ok' : 'off'}">${c.is_active ? 'ACTIVE' : 'OFF'}</span></div>
          <div class="admin-meta">${c.kind === 'percent' ? c.value + '%' : '₹' + c.value} | min ₹${c.min_amount} | ${esc(c.applies_to)}${c.first_order_only ? ' | first order' : ''} | ${esc(c.description || '')}</div>
          <div class="admin-actions"><button type="button" class="admin-btn admin-btn-ghost" data-action="coupon-toggle">${c.is_active ? 'Turn off' : 'Turn on'}</button></div></article>`).join(''),
      packages: () => rows.map(p => `<article class="admin-card" data-id="${esc(p.slug)}"><div class="admin-card-top"><span class="admin-id">${esc(p.title)}</span><span class="admin-badge ${p.is_active ? 'ok' : 'off'}">${p.is_active ? 'ACTIVE' : 'OFF'}</span></div>
        <div class="admin-meta">${p.sessions} sessions | ${esc(p.cadence)}</div><div class="admin-actions"><input class="admin-input" data-field="disc" type="number" min="0" max="60" value="${p.discount_percent}" style="max-width:110px"> % off
        <button type="button" class="admin-btn" data-action="package-save">Save</button><button type="button" class="admin-btn admin-btn-ghost" data-action="package-toggle">${p.is_active ? 'Turn off' : 'Turn on'}</button></div></article>`).join('')
    }[tab]();
    root.innerHTML = html || '<div class="admin-empty">Nothing here yet.</div>';
    this.bindForms(root);
  }

  static bindForms(root) {
    const pf = root.querySelector('#priest-form');
    if (pf) pf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        let photo = null;
        if (f.photo.files[0]) { const form = new FormData(); form.append('file', f.photo.files[0]); photo = (await this.api('/api/v1/shop-admin/priests/photo', { method: 'POST', body: form })).url; }
        await this.api('/api/v1/shop-admin/priests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.name.value, temple_slug: f.temple.value || null,
          years_experience: +f.years.value || 0, languages: f.languages.value || null, bio: f.bio.value || null, bio_en: f.bio_en.value || null, verified: f.verified.checked, photo_url: photo }) });
        this.toast('Priest saved'); this.render();
      } catch (err) { this.toast(err.message, 'error'); }
    });
    const cf = root.querySelector('#coupon-form');
    if (cf) cf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await this.api('/api/v1/shop-admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: f.code.value, kind: f.kind.value, value: +f.value.value,
          min_amount: +f.min.value || 0, max_discount: f.max.value ? +f.max.value : null, applies_to: f.scope.value, usage_limit: f.limit.value ? +f.limit.value : null,
          description: f.desc.value || null, first_order_only: f.first.checked }) });
        this.toast('Coupon created'); this.render();
      } catch (err) { this.toast(err.message, 'error'); }
    });
  }

  static async handleExtraAction(btn) {
    const card = btn.closest('[data-id]');
    const id = card.getAttribute('data-id');
    const val = (f) => (card.querySelector(`[data-field="${f}"]`) || {}).value;
    const action = btn.getAttribute('data-action');
    const send = (method, url, body) => this.api(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    if (action === 'kyc-doc') { await downloadFile(`/api/v1/shop-admin/sellers/${encodeURIComponent(id)}/document`, 'kyc-document'); return; }
    if (action === 'kyc-approve' || action === 'kyc-reject') await send('PATCH', `/api/v1/shop-admin/sellers/${encodeURIComponent(id)}`, { approve: action === 'kyc-approve', note: val('note') || null });
    else if (action === 'cert-approve' || action === 'cert-reject') await send('PATCH', `/api/v1/shop-admin/certificates/${encodeURIComponent(id)}`, { approve: action === 'cert-approve', note: val('note') || null });
    else if (action === 'payout-paid') await send('PATCH', `/api/v1/shop-admin/payouts/${encodeURIComponent(id)}`, { reference: val('ref') || '' });
    else if (action === 'priest-toggle-verify' || action === 'priest-hide') {
      const p = this.extra.find(x => x.id === id);
      await send('PATCH', `/api/v1/shop-admin/priests/${encodeURIComponent(id)}`, { name: p.name, temple_slug: p.temple_slug, photo_url: p.photo_url, years_experience: p.years_experience, languages: p.languages,
        bio: p.bio, bio_en: null, verified: action === 'priest-toggle-verify' ? !p.verified : p.verified, is_active: action === 'priest-hide' ? false : p.is_active });
    }
    else if (action === 'temple-save') await send('PATCH', `/api/v1/shop-admin/temples/${encodeURIComponent(id)}`, { live_url: val('live') || null,
      aarti_timings: (val('aarti') || '').split('\n').map(l => l.split('|')).filter(p => p.length >= 2).map(p => ({ name: p[0].trim(), time: p.slice(1).join('|').trim() })) });
    else if (action === 'coupon-toggle') {
      const c = this.extra.find(x => x.code === id);
      await send('PATCH', `/api/v1/shop-admin/coupons/${encodeURIComponent(id)}`, { code: c.code, kind: c.kind, value: c.value, min_amount: c.min_amount, max_discount: c.max_discount, applies_to: c.applies_to,
        first_order_only: c.first_order_only, usage_limit: c.usage_limit, per_user_limit: c.per_user_limit, description: c.description, is_active: !c.is_active });
    }
    else if (action === 'package-save' || action === 'package-toggle') {
      const p = this.extra.find(x => x.slug === id);
      const active = action === 'package-toggle' ? !p.is_active : p.is_active;
      await send('PATCH', `/api/v1/shop-admin/packages/${encodeURIComponent(id)}?is_active=${active}&discount_percent=${encodeURIComponent(val('disc') || p.discount_percent)}`);
    }
    this.toast('Done');
    this.render();
  }

  static async handleAction(btn) {
    if (EXTRA_TABS.includes(this.tab)) {
      btn.disabled = true;
      try { await this.handleExtraAction(btn); } catch (err) { this.toast(err.message, 'error'); } finally { btn.disabled = false; }
      return;
    }
    const card = btn.closest('[data-id]');
    const id = card.getAttribute('data-id');
    const val = (f) => (card.querySelector(`[data-field="${f}"]`) || {}).value;
    const action = btn.getAttribute('data-action');
    btn.disabled = true;
    try {
      if (action === 'save-booking') {
        const body = { status: val('status') };
        if (val('scheduled_for')) body.scheduled_for = val('scheduled_for').trim();
        if (val('tracking')) body.prasad_tracking_id = val('tracking').trim();
        const fileEl = card.querySelector('[data-field="video"]');
        if (fileEl && fileEl.files && fileEl.files[0]) {
          btn.textContent = 'Uploading...';
          const form = new FormData();
          form.append('file', fileEl.files[0]);
          const up = await this.api('/api/v1/mandir/admin/upload-video', { method: 'POST', body: form });
          body.video_proof_url = up.url;
        }
        await this.api(`/api/v1/mandir/admin/bookings/${encodeURIComponent(id)}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        this.toast('Booking updated');
      } else if (action === 'save-order') {
        const body = { status: val('status') };
        if (val('tracking')) body.tracking_id = val('tracking').trim();
        await this.api(`/api/v1/marketplace/admin/orders/${encodeURIComponent(id)}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        this.toast('Order updated');
      } else if (action === 'approve' || action === 'reject') {
        const approve = action === 'approve';
        await this.api(`/api/v1/marketplace/admin/products/${encodeURIComponent(id)}/approve?approve=${approve}`, { method: 'PATCH' });
        this.toast(approve ? 'Product approved and live' : 'Product kept hidden');
      }
      await this.load();
    } catch (err) {
      this.toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = action.startsWith('save') ? 'Save' : btn.textContent;
    }
  }
}

if (typeof window !== 'undefined') {
  window.AdminPageComponent = AdminPageComponent;
}

export default AdminPageComponent;
