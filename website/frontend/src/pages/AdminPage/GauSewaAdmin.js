// Admin tab for Gau Sewa: collection status, gaushala details, seva updates and the donation list.
// There is deliberately no control here that marks a payment as paid: payments only become successful through the
// server's own check with the payment provider.
import { esc } from '../../utils/shop.js';

const STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];
const PURPOSES = { chaara: 'Chaara Seva', chikitsa: 'Chikitsa Sahayata', general: 'General Seva' };
const inr = (paise) => '₹' + (Math.round(paise || 0) / 100).toLocaleString('en-IN');
const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const flag = (on, label) => `<span class="admin-badge ${on ? 'ok' : 'warn'}">${esc(label)}: ${on ? 'yes' : 'no'}</span>`;

export class GauSewaAdmin {
  static filters = { status: '', purpose: '', q: '', date_from: '', date_to: '' };
  static bound = null;

  static async render(root, api, toast) {
    this.root = root; this.api = api; this.toast = toast;
    if (this.bound !== root) {
      this.bound = root;
      root.addEventListener('click', (e) => this.onClick(e));
      root.addEventListener('change', (e) => this.onChange(e));
    }
    root.innerHTML = '<div class="admin-empty">Loading…</div>';
    try {
      const [g, u, d] = await Promise.all([
        this.api('/api/v1/gau-sewa/admin/gaushalas'), this.api('/api/v1/gau-sewa/admin/updates'), this.fetchDonations()]);
      this.state = { g, u, d };
      this.paint();
    } catch (err) {
      root.innerHTML = `<div class="admin-empty">${esc(err.message)}</div>`;
    }
  }

  static fetchDonations() {
    const q = new URLSearchParams(Object.entries(this.filters).filter(([, v]) => v));
    return this.api('/api/v1/gau-sewa/admin/donations?' + q);
  }

  static paint() {
    const { g, u, d } = this.state;
    const gaushalas = g.gaushalas;
    this.root.innerHTML = `
      <article class="admin-card"><div class="admin-card-top"><strong>Collection status</strong>${flag(g.collection_open, 'Donations open')}</div>
        <div class="admin-meta">${flag(g.payments_configured, 'Payments configured')} ${flag(g.webhook_configured, 'Webhook secret set')} ${flag(g.email_configured, 'Receipt email set up')}<br>
        Donations stay closed until payments are configured and at least one active gaushala has a beneficiary name and donations switched on. Secrets live in server environment variables, never here.</div></article>
      <h3 class="admin-section-title">Gaushalas</h3>
      ${gaushalas.map(x => this.gaushalaForm(x)).join('')}
      ${this.gaushalaForm({ id: '', name: '', photos: [] }, true)}
      <h3 class="admin-section-title">Seva updates</h3>
      ${u.updates.map(x => this.updateForm(x, gaushalas)).join('')}
      ${this.updateForm({ id: '', title: '', photos: [] }, gaushalas, true)}
      <h3 class="admin-section-title">Donations</h3>${this.donationsHtml(d)}`;
  }

  static gaushalaForm(x, isNew = false) {
    return `<article class="admin-card" data-gs-gaushala="${esc(x.id)}">
      <div class="admin-card-top"><strong>${isNew ? 'Add a gaushala' : esc(x.name)}</strong>${isNew ? '' : flag(x.accepting_donations && x.is_active, 'Accepting')}</div>
      <div class="admin-actions">
        <input class="admin-input" data-f="name" placeholder="Gaushala name" value="${esc(x.name)}">
        <input class="admin-input" data-f="location" placeholder="Location" value="${esc(x.location || '')}">
        <input class="admin-input" data-f="beneficiary_name" placeholder="Beneficiary name (who receives the funds)" value="${esc(x.beneficiary_name || '')}">
      </div>
      <textarea class="admin-input" data-f="introduction" rows="3" placeholder="Introduction">${esc(x.introduction || '')}</textarea>
      <textarea class="admin-input" data-f="beneficiary_details" rows="2" placeholder="How the funds reach the gaushala (shown publicly; never enter bank account numbers)">${esc(x.beneficiary_details || '')}</textarea>
      <textarea class="admin-input" data-f="photos" rows="2" placeholder="Photo links, one per line (https://… or /uploads/…)">${esc((x.photos || []).join('\n'))}</textarea>
      <div class="admin-actions"><input class="admin-input" type="file" data-upload accept="image/jpeg,image/png,image/webp" aria-label="Upload a photo">
        <label><input type="checkbox" data-f="donations_enabled" ${x.donations_enabled ? 'checked' : ''}> Donations on</label>
        <label><input type="checkbox" data-f="is_active" ${isNew || x.is_active ? 'checked' : ''}> Active</label>
        <button type="button" class="admin-btn" data-gs-save-gaushala>${isNew ? 'Add' : 'Save'}</button></div></article>`;
  }

  static updateForm(x, gaushalas, isNew = false) {
    return `<article class="admin-card" data-gs-update="${esc(x.id)}">
      <div class="admin-card-top"><strong>${isNew ? 'New update' : esc(x.title)}</strong>${isNew ? '' : flag(x.is_published, 'Published')}</div>
      <input class="admin-input" data-f="title" placeholder="Title" value="${esc(x.title)}">
      <textarea class="admin-input" data-f="body" rows="3" placeholder="What happened (real, verified information only)">${esc(x.body || '')}</textarea>
      <textarea class="admin-input" data-f="photos" rows="2" placeholder="Photo links, one per line">${esc((x.photos || []).join('\n'))}</textarea>
      <div class="admin-actions"><select class="admin-input" data-f="gaushala_id" aria-label="Gaushala"><option value="">Any gaushala</option>
        ${gaushalas.map(g => `<option value="${esc(g.id)}" ${g.id === x.gaushala_id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>
        <input class="admin-input" type="file" data-upload accept="image/jpeg,image/png,image/webp" aria-label="Upload a photo">
        <label><input type="checkbox" data-f="is_published" ${x.is_published ? 'checked' : ''}> Published</label>
        <button type="button" class="admin-btn" data-gs-save-update>${isNew ? 'Add' : 'Save'}</button>
        ${isNew ? '' : '<button type="button" class="admin-btn admin-btn-danger" data-gs-delete-update>Delete</button>'}</div></article>`;
  }

  static donationsHtml(d) {
    const f = this.filters;
    const t = d.totals;
    const opts = (list, cur, all) => `<option value="">${all}</option>` + list.map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`).join('');
    return `<div class="admin-actions" data-gs-filters>
        <select class="admin-input" data-gs-filter="status" aria-label="Status">${opts(STATUSES.map(s => [s, s]), f.status, 'All statuses')}</select>
        <select class="admin-input" data-gs-filter="purpose" aria-label="Purpose">${opts(Object.entries(PURPOSES), f.purpose, 'All purposes')}</select>
        <input class="admin-input" data-gs-filter="q" placeholder="Reference, name or email" value="${esc(f.q)}" aria-label="Search">
        <input class="admin-input" type="date" data-gs-filter="date_from" value="${esc(f.date_from)}" aria-label="From date">
        <input class="admin-input" type="date" data-gs-filter="date_to" value="${esc(f.date_to)}" aria-label="To date"></div>
      <article class="admin-card"><div class="admin-meta"><strong>Collected (successful only): ${inr(t.collected_paise)}</strong> · Refunded: ${inr(t.refunded_paise)}<br>
        ${STATUSES.map(s => `${s}: ${t.by_status[s].count} (${inr(t.by_status[s].amount_paise)})`).join(' · ')}<br>
        ${Object.entries(PURPOSES).map(([k, l]) => `${l}: ${inr(t.by_purpose_paise[k])}`).join(' · ')}</div></article>
      ${d.donations.length ? d.donations.map(x => `<article class="admin-card"><div class="admin-card-top"><span class="admin-id">${esc(x.reference)}</span>
        <span class="admin-badge ${x.status === 'SUCCESS' ? 'ok' : x.status === 'PENDING' ? 'warn' : 'off'}">${esc(x.status)}</span></div>
        <div class="admin-meta"><strong>${inr(x.amount_paise)}</strong> · ${esc(PURPOSES[x.purpose] || x.purpose)} · ${esc(x.recipient_name || '—')}<br>
        ${esc(x.donor_name)} ${x.donor_email ? '· ' + esc(x.donor_email) : ''} ${x.user_id ? '· signed-in donor' : '· guest'} ${x.hide_name_public ? '· name kept out of public updates' : ''}<br>
        ${when(x.created_at)}${x.paid_at ? ' · paid ' + when(x.paid_at) : ''}${x.refunded_paise ? ' · refunded ' + inr(x.refunded_paise) : ''}${x.failure_reason ? ' · ' + esc(x.failure_reason) : ''}<br>
        <small>${esc(x.provider_order_id || '')} ${esc(x.provider_payment_id || '')}</small></div></article>`).join('')
        : '<div class="admin-empty">No donations match these filters.</div>'}`;
  }

  static values(card) {
    const out = {};
    card.querySelectorAll('[data-f]').forEach(el => { out[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; });
    if ('photos' in out) out.photos = out.photos.split('\n').map(s => s.trim()).filter(Boolean);
    if ('gaushala_id' in out) out.gaushala_id = out.gaushala_id || null;
    return out;
  }

  static async save(url, method, body) {
    await this.api(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    this.toast('Saved');
    await this.render(this.root, this.api, this.toast);
  }

  static async onClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const base = '/api/v1/gau-sewa/admin';
    btn.disabled = true;
    try {
      if (btn.matches('[data-gs-save-gaushala]')) {
        const card = btn.closest('[data-gs-gaushala]'); const id = card.dataset.gsGaushala;
        await this.save(id ? `${base}/gaushalas/${id}` : `${base}/gaushalas`, id ? 'PUT' : 'POST', this.values(card));
      } else if (btn.matches('[data-gs-save-update]')) {
        const card = btn.closest('[data-gs-update]'); const id = card.dataset.gsUpdate;
        await this.save(id ? `${base}/updates/${id}` : `${base}/updates`, id ? 'PUT' : 'POST', this.values(card));
      } else if (btn.matches('[data-gs-delete-update]')) {
        if (!window.confirm('Delete this update?')) return;
        await this.api(`${base}/updates/${btn.closest('[data-gs-update]').dataset.gsUpdate}`, { method: 'DELETE' });
        this.toast('Deleted');
        await this.render(this.root, this.api, this.toast);
      }
    } catch (err) { this.toast(err.message, 'error'); } finally { btn.disabled = false; }
  }

  static async onChange(e) {
    const el = e.target;
    if (el.matches('[data-gs-filter]')) {
      this.filters[el.dataset.gsFilter] = el.value.trim();
      try { this.state.d = await this.fetchDonations(); this.paint(); } catch (err) { this.toast(err.message, 'error'); }
      return;
    }
    if (el.matches('[data-upload]') && el.files[0]) {
      const body = new FormData(); body.append('file', el.files[0]);
      try {
        const { url } = await this.api('/api/v1/gau-sewa/admin/upload-photo', { method: 'POST', body });
        const box = el.closest('article').querySelector('[data-f="photos"]');
        box.value = (box.value.trim() ? box.value.trim() + '\n' : '') + url;
        this.toast('Photo uploaded. Press Save to attach it.');
      } catch (err) { this.toast(err.message, 'error'); }
    }
  }
}
