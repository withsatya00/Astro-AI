import { loadTemplate } from '../../utils/templateLoader.js';
import { api as shopApi, mediaUrl, downloadFile } from '../../utils/shop.js';
import { GauSewaAdmin } from './GauSewaAdmin.js';

const BOOKING_STATUSES = ['PAID', 'SANKALP_SCHEDULED', 'VIDEO_UPLOADED', 'COMPLETED'];
const ORDER_STATUSES = ['PLACED', 'PAID', 'ENERGIZING', 'DISPATCHED', 'DELIVERED'];

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const PAGED_TABS = ['consultations', 'wallet', 'astrologers'];
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
    this.loadSummary();
  }

  static async loadSummary() {
    const box = document.getElementById('admin-summary');
    if (!box || this.denied) return;
    try {
      const d = await this.api('/api/v1/shop-admin/summary');
      const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
      const tiles = [
        ['Seva bookings today', d.seva_bookings_today, inr(d.seva_revenue_today)], ['Mall orders today', d.orders_today, inr(d.orders_revenue_today)],
        ['Wallet top-ups today', inr(d.wallet_credits_today), ''], ['Sevas to schedule', d.seva_to_schedule, 'tab:bookings'], ['Orders to ship', d.orders_to_ship, 'tab:orders'],
        ['Products awaiting approval', d.products_pending_approval, 'tab:products'], ['Low stock (≤5)', d.low_stock_products, ''],
      ];
      box.innerHTML = tiles.map(([label, value, extra]) => `<${extra.startsWith('tab:') ? `button type="button" data-goto="${extra.slice(4)}"` : 'div'} class="admin-tile"><strong>${esc(value)}</strong><span>${esc(label)}</span>${extra && !extra.startsWith('tab:') ? `<small>${esc(extra)}</small>` : ''}</${extra.startsWith('tab:') ? 'button' : 'div'}>`).join('')
        + '<button type="button" class="admin-btn admin-btn-ghost" data-export="seva">Download seva bookings (CSV)</button>';
      box.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => document.querySelector(`#admin-tabs [data-tab="${b.dataset.goto}"]`)?.click()));
      box.querySelector('[data-export]')?.addEventListener('click', () => downloadFile('/api/v1/shop-admin/export/seva-bookings.csv', 'seva-bookings.csv').catch(err => this.toast(err.message, 'error')));
    } catch (err) { box.innerHTML = ''; }
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
    if (this.tab === 'chadhava') {
      document.getElementById('admin-filter-wrap').hidden = true;
      document.getElementById('admin-list').innerHTML = '<p>Create dated chadhava events, assign temple staff, track fulfilment and resolve refunds.</p><button type="button" class="admin-btn" id="admin-open-chadhava">Open Chadhava Operations</button>';
      document.getElementById('admin-open-chadhava').onclick = () => window.ChadhavaExperience?.staff().catch(err => this.toast(err.message, 'error'));
      return;
    }
    if (this.tab === 'gausewa') {
      document.getElementById('admin-filter-wrap').hidden = true;
      await GauSewaAdmin.render(document.getElementById('admin-list'), (u, o) => this.api(u, o), (m, t) => this.toast(m, t));
      return;
    }
    if (PAGED_TABS.includes(this.tab)) { await this.renderPaged(); return; }
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
    if (b.chadhava_order_id) return `<article class="admin-card" data-id="${esc(b.id)}"><strong>${esc(b.booking_number)} · ${esc(b.temple_name)}</strong><p>${esc(b.devotee_name)} · ${esc(b.payment_status)} · ${esc(b.service_status)}</p><button type="button" class="admin-btn" data-action="open-chadhava">Manage in Chadhava Operations</button></article>`;
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

  // ---------------- searchable, paginated tabs (consultations, wallet ledger, astrologer availability) ----------------
  static paged = { tab: '', page: 1, q: '', filter: '' };

  static async renderPaged() {
    const root = document.getElementById('admin-list');
    document.getElementById('admin-filter-wrap').hidden = true;
    const tab = this.tab;
    if (this.paged.tab !== tab) this.paged = { tab, page: 1, q: '', filter: '' };
    const { page, q, filter } = this.paged;
    const limit = tab === 'wallet' ? 25 : 20;
    const query = new URLSearchParams({ page, limit, q });
    const filters = { consultations: ['ALL', 'confirmed', 'cancelled'], wallet: ['all', 'credit', 'debit', 'refund'], astrologers: [] }[tab];
    if (tab === 'consultations') query.set('status', filter || 'ALL');
    if (tab === 'wallet') query.set('kind', filter || 'all');
    const path = { consultations: 'consultations', wallet: 'wallet-history', astrologers: 'astrologers' }[tab];
    root.innerHTML = '<div class="admin-empty" role="status">Loading…</div>';
    let data;
    try { data = await this.api(`/api/v1/shop-admin/${path}?${query}`); }
    catch (err) { root.innerHTML = `<div class="admin-empty" role="alert">${esc(err.message)} <button type="button" class="admin-btn admin-btn-ghost" data-paged="retry">Try again</button></div>`; this.bindPaged(root); return; }
    if (tab !== this.tab) return;
    const rows = data.consultations || data.transactions || data.astrologers || [];
    const money = (n) => (n < 0 ? '-' : '') + '₹' + Math.abs(Number(n)).toLocaleString('en-IN', { maximumFractionDigits: 2 });
    const stamp = (v) => esc((v || '').slice(0, 16).replace('T', ' '));
    const card = {
      consultations: (r) => `<article class="admin-card"><div class="admin-card-top"><span class="admin-id">${esc(r.astrologer)} · ${esc(r.client)}</span>${this.badge(String(r.status).toUpperCase())}</div>
        <div class="admin-meta">${esc(r.email || 'Guest')} | ${esc(r.mode)} · ${esc(r.duration_minutes)} min | ${esc(r.scheduled_at)} | ${money(r.total_amount)}<br>Ref ${esc(r.id.slice(0, 8))} | Booked ${stamp(r.created_at)}</div></article>`,
      wallet: (r) => `<article class="admin-card"><div class="admin-card-top"><span class="admin-id">${money(r.amount)}</span><span class="admin-badge ${r.type === 'debit' ? 'warn' : 'ok'}">${esc(String(r.type).toUpperCase())}</span></div>
        <div class="admin-meta">${esc(r.email || '—')} | ${esc(r.description)}<br>Ref ${esc(r.reference_id || '—')} | ${stamp(r.created_at)}</div></article>`,
      astrologers: (r) => `<article class="admin-card" data-id="${esc(r.id)}"><div class="admin-card-top"><span class="admin-id">${esc(r.name)}</span><span class="admin-badge ${r.availability === 'online' ? 'ok' : r.availability === 'busy' ? 'warn' : 'off'}">${esc(String(r.availability).toUpperCase())}</span></div>
        <div class="admin-meta">${r.is_ai ? 'Automated guidance profile' : 'Verified astrologer'} | ${r.price_per_minute ? '₹' + r.price_per_minute + '/min' : 'Free'}</div>
        <div class="admin-actions">${['online', 'busy', 'offline'].map(st => `<button type="button" class="admin-btn ${st === r.availability ? '' : 'admin-btn-ghost'}" data-paged="availability" data-state="${st}" ${st === r.availability ? 'disabled' : ''}>${st}</button>`).join('')}</div></article>`
    }[tab];
    const pages = Math.max(1, Math.ceil(data.total / limit));
    root.innerHTML = `<form class="admin-actions" data-paged="search" role="search">
        <input class="admin-input" name="q" type="search" value="${esc(q)}" placeholder="Search…" aria-label="Search" style="flex:2 1 240px">
        ${filters.length ? `<select class="admin-input" name="filter" aria-label="Filter">${filters.map(f => `<option value="${f}" ${f === (filter || filters[0]) ? 'selected' : ''}>${f === 'ALL' ? 'All' : f}</option>`).join('')}</select>` : ''}
        <button type="submit" class="admin-btn">Search</button></form>
      <p class="admin-meta" aria-live="polite">${data.total} result${data.total === 1 ? '' : 's'}</p>
      ${rows.length ? rows.map(card).join('') : '<div class="admin-empty">Nothing matches.</div>'}
      <div class="admin-actions"><button type="button" class="admin-btn admin-btn-ghost" data-paged="prev" ${page <= 1 ? 'disabled' : ''}>Previous</button>
        <span class="admin-meta">Page ${page} of ${pages}</span>
        <button type="button" class="admin-btn admin-btn-ghost" data-paged="next" ${page >= pages ? 'disabled' : ''}>Next</button></div>`;
    this.bindPaged(root);
  }

  static bindPaged(root) {
    root.querySelector('form[data-paged="search"]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.paged.q = e.target.q.value.trim();
      this.paged.filter = e.target.filter ? e.target.filter.value : '';
      this.paged.page = 1;
      this.renderPaged();
    });
    root.querySelectorAll('button[data-paged]').forEach(btn => btn.addEventListener('click', async () => {
      const kind = btn.dataset.paged;
      if (kind === 'prev') { this.paged.page -= 1; this.renderPaged(); }
      else if (kind === 'next') { this.paged.page += 1; this.renderPaged(); }
      else if (kind === 'retry') this.renderPaged();
      else if (kind === 'availability') {
        btn.disabled = true;
        try {
          await this.api(`/api/v1/astrologers/${encodeURIComponent(btn.closest('[data-id]').dataset.id)}/availability`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ availability: btn.dataset.state }) });
          this.toast('Availability updated');
          this.renderPaged();
        } catch (err) { this.toast(err.message, 'error'); btn.disabled = false; }
      }
    }));
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
      temples: () => `<form class="admin-card" id="temple-form"><div class="admin-card-top"><span class="admin-id">Add temple</span></div>
        <div class="admin-actions"><input class="admin-input" name="name" placeholder="Temple name *" required><input class="admin-input" name="deity" placeholder="Deity *" required>
        <input class="admin-input" name="city" placeholder="City *" required><input class="admin-input" name="state" placeholder="State *" required></div>
        <div class="admin-actions"><textarea class="admin-input" name="description" rows="2" placeholder="Description *" required style="flex:1 1 100%"></textarea>
        <input class="admin-input" name="image" placeholder="Image URL (optional)" style="flex:2 1 260px"><button type="submit" class="admin-btn">Add temple</button></div></form>`
        + rows.map(t => `<article class="admin-card" data-id="${esc(t.slug)}"><div class="admin-card-top"><span class="admin-id">${esc(t.name)}</span><span class="admin-badge ${t.is_active ? 'ok' : 'off'}">${t.is_active ? 'VISIBLE' : 'HIDDEN'}</span></div>
        <div class="admin-actions"><input class="admin-input" data-field="name" value="${esc(t.name)}" placeholder="Name" aria-label="Temple name"><input class="admin-input" data-field="deity" value="${esc(t.deity)}" placeholder="Deity" aria-label="Deity">
        <input class="admin-input" data-field="city" value="${esc(t.city)}" placeholder="City" aria-label="City"><input class="admin-input" data-field="state" value="${esc(t.state)}" placeholder="State" aria-label="State"></div>
        <div class="admin-actions"><textarea class="admin-input" data-field="description" rows="2" aria-label="Description" style="flex:1 1 100%">${esc(t.description)}</textarea>
        <input class="admin-input" data-field="image" placeholder="Image URL" value="${esc(t.image_url || '')}" aria-label="Image URL" style="flex:2 1 320px"></div>
        <div class="admin-actions"><input class="admin-input" data-field="live" placeholder="Live darshan link (https://www.youtube.com/watch?v=...)" value="${esc(t.live_url || '')}" style="flex:2 1 320px"></div>
        <div class="admin-actions"><textarea class="admin-input" data-field="aarti" rows="3" placeholder="One per line: Aarti name | 05:00 AM" style="flex:1 1 100%">${esc((t.aarti_timings || []).map(a => a.name + ' | ' + a.time).join('\n'))}</textarea></div>
        <div class="admin-actions"><button type="button" class="admin-btn" data-action="temple-save">Save</button>
        <button type="button" class="admin-btn admin-btn-ghost" data-action="temple-toggle">${t.is_active ? 'Hide temple' : 'Show temple'}</button>
        <button type="button" class="admin-btn admin-btn-ghost" data-action="temple-sevas">Manage sevas</button></div>
        <div class="admin-sevas" data-sevas-for="${esc(t.slug)}" hidden></div></article>`).join(''),
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
    const tf = root.querySelector('#temple-form');
    if (tf) tf.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await this.api('/api/v1/shop-admin/temples', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          name: f.name.value, deity: f.deity.value, city: f.city.value, state: f.state.value, description: f.description.value, image_url: f.image.value || null }) });
        this.toast('Temple added'); this.render();
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

  static async handleSevaAction(btn, card, id, action, val, send) {
    const panel = (btn.closest('.admin-sevas') || card.querySelector('.admin-sevas'));
    const slug = card.closest('[data-id]') && panel ? panel.dataset.sevasFor : id;
    const reload = async () => {
      panel.hidden = false;
      panel.innerHTML = '<div class="admin-empty" role="status">Loading…</div>';
      const { offerings } = await this.api(`/api/v1/shop-admin/offerings?temple_slug=${encodeURIComponent(slug)}`);
      this.offerings = offerings;
      const cats = ['chadawa', 'sankalp_pooja', 'aarti', 'abhishek'];
      panel.innerHTML = offerings.map(o => `<div class="admin-card" data-id="${esc(o.id)}"><div class="admin-card-top"><span class="admin-id">${esc(o.title)}</span><span class="admin-badge ${o.is_active ? 'ok' : 'off'}">${o.is_active ? 'ACTIVE' : 'OFF'}</span></div>
        <div class="admin-actions"><input class="admin-input" data-field="title" value="${esc(o.title)}" aria-label="Seva name" style="flex:2 1 220px">
        <input class="admin-input" data-field="price" type="number" min="1" step="1" value="${esc(o.price)}" aria-label="Price" style="max-width:120px">
        <select class="admin-input" data-field="category" aria-label="Category">${cats.map(k => `<option ${k === o.category ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
        <div class="admin-actions"><textarea class="admin-input" data-field="description" rows="2" aria-label="Seva description" style="flex:1 1 100%">${esc(o.description)}</textarea></div>
        <div class="admin-actions"><button type="button" class="admin-btn" data-action="seva-save">Save seva</button>
        <button type="button" class="admin-btn admin-btn-ghost" data-action="seva-toggle">${o.is_active ? 'Turn off' : 'Turn on'}</button></div></div>`).join('')
        + `<div class="admin-card" data-id="new-${esc(slug)}"><div class="admin-card-top"><span class="admin-id">Add seva</span></div>
        <div class="admin-actions"><input class="admin-input" data-field="title" placeholder="Seva name *" style="flex:2 1 220px"><input class="admin-input" data-field="price" type="number" min="1" placeholder="Price ₹ *" style="max-width:130px">
        <select class="admin-input" data-field="category" aria-label="Category"><option>chadawa</option><option>sankalp_pooja</option><option>aarti</option><option>abhishek</option></select></div>
        <div class="admin-actions"><textarea class="admin-input" data-field="description" rows="2" placeholder="Description *" style="flex:1 1 100%"></textarea><button type="button" class="admin-btn" data-action="seva-add">Add seva</button></div></div>`;
    };
    if (action === 'temple-sevas') { await reload(); return; }
    const row = btn.closest('[data-id]');
    const rid = row.dataset.id;
    const field = (f) => (row.querySelector(`[data-field="${f}"]`) || {}).value;
    if (action === 'seva-save') await send('PATCH', `/api/v1/shop-admin/offerings/${encodeURIComponent(rid)}`, { title: field('title'), price: +field('price'), category: field('category'), description: field('description') });
    else if (action === 'seva-toggle') { const o = this.offerings.find(x => x.id === rid); await send('PATCH', `/api/v1/shop-admin/offerings/${encodeURIComponent(rid)}`, { is_active: !o.is_active }); }
    else if (action === 'seva-add') await send('POST', '/api/v1/shop-admin/offerings', { temple_slug: slug, title: field('title'), price: +field('price'), category: field('category'), description: field('description') });
    this.toast('Done');
    await reload();
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
    else if (action === 'temple-sevas' || action.startsWith('seva-') || action === 'seva-add') { await this.handleSevaAction(btn, card, id, action, val, send); return; }
    else if (action === 'temple-toggle') {
      const t = this.extra.find(x => x.slug === id);
      await send('PATCH', `/api/v1/shop-admin/temples/${encodeURIComponent(id)}`, { is_active: !t.is_active });
    }
    else if (action === 'temple-save') await send('PATCH', `/api/v1/shop-admin/temples/${encodeURIComponent(id)}`, {
      name: val('name'), deity: val('deity'), city: val('city'), state: val('state'), description: val('description'), image_url: val('image') || null, live_url: val('live') || null,
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
    if (btn.dataset.action === 'open-chadhava') { await window.ChadhavaExperience?.staff(); return; }
    if (PAGED_TABS.includes(this.tab)) return;
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
