// Gau Sewa: one-time donations to a gaushala, the confirmation / receipt view and published seva updates.
// Payment success is never decided here: the browser only hands the Razorpay result to the server, which checks it with
// Razorpay itself. This page shows whatever status the server reports.
import { api, esc, toast, mediaUrl, downloadFile, isSignedIn, t as shopT } from '../../utils/shop.js';

const PURPOSES = ['chaara', 'chikitsa', 'general'];
const lineIcon = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const PURPOSE_ICON = {
  chaara: lineIcon('<path d="M12 21V4m0 6C7 10 5 7 5 4c4 0 7 2 7 6Zm0 5c5 0 7-3 7-6-4 0-7 2-7 6Zm0 4c-5 0-7-3-7-6 4 0 7 2 7 6Z"/>'),
  chikitsa: lineIcon('<path d="M8 3H6a2 2 0 0 0-2 2v4a5 5 0 0 0 10 0V5a2 2 0 0 0-2-2h-2m-1 11v2a5 5 0 0 0 10 0v-2"/><circle cx="19" cy="11" r="3"/>'),
  general: lineIcon('<path d="M3 13h4l3 3h5a2 2 0 0 1 0 4H9l-6-4m12 0 5-3a2 2 0 0 1 2 3l-5 4M12 5c-4-5-10 1 0 7 10-6 4-12 0-7Z"/>'),
};
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Looks a string up in the site's translation tables (English/Hindi) and fills {placeholders}. */
export const T = (key, vars = {}) => {
  const base = window.I18n?.t ? window.I18n.t(key) : key;
  const text = base === key ? shopT(key) : base;
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
};
const lang = () => (window.I18n?.currentLang === 'hi' ? 'hi-IN' : 'en-IN');
const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const dateText = (iso) => { const d = iso ? new Date(iso) : null; return d && !isNaN(d) ? d.toLocaleDateString(lang(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—'; };
export const statusLabel = (s) => T('gs_status_' + String(s || '').toLowerCase());
export const purposeLabel = (p) => T('gs_purpose_' + p);

export class GauSewaPageComponent {
  static root = null;
  static config = null;
  static gaushalas = [];
  static updates = [];
  static form = { amount: 501, custom: '', purpose: 'chaara', name: '', email: '', hide: false, gaushalaId: null };
  static errors = {};
  static busy = false;
  static notice = null;     // { type: 'error' | 'info', text }
  static view = 'home';
  static receipt = null;
  static receiptToken = null;
  static pollTimer = null;
  static loadFailed = false;
  static updatesFailed = false;
  static lastChecked = null;
  static receiptRequest = 0;

  static mount(container) {
    this.root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.root) return;
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('input', (e) => this.onInput(e));
    this.root.addEventListener('submit', (e) => { e.preventDefault(); this.donate(); });
    window.addEventListener('astro:languagechange', () => { if (this.root.offsetParent !== null) this.render(); });
    window.addEventListener('astro:authchange', () => { if (this.root.offsetParent !== null) this.prefillName(); });
  }

  // ------------------------------------------------------------------ routing entry points
  static async open() {
    this.view = 'home';
    this.stopPolling();
    this.notice = null;
    this.prefillName();
    this.root.innerHTML = this.frame(`<p class="gs-state" role="status">${esc(T('gs_loading'))}</p>`);
    await this.load();
  }

  static async openReceipt(token) {
    this.view = 'receipt';
    this.receiptToken = token;
    this.receipt = null;
    this.root.innerHTML = this.frame(`<p class="gs-state" role="status">${esc(T('gs_loading'))}</p>`);
    await this.loadReceipt(true);
  }

  static prefillName() {
    const user = window.App?.currentUser;
    if (user && !this.form.name) this.form.name = user.full_name || '';
  }

  static async load() {
    this.loadFailed = false;
    try {
      const [config, gaushalas, updates] = await Promise.allSettled([
        api('/api/v1/gau-sewa/config'), api('/api/v1/gau-sewa/gaushalas'), api('/api/v1/gau-sewa/updates')]);
      if(config.status==='rejected'||gaushalas.status==='rejected')throw new Error('Essential seva data unavailable');
      this.config = config.value;
      this.gaushalas = gaushalas.value.gaushalas || [];
      this.updatesFailed = updates.status==='rejected';
      this.updates = updates.status==='fulfilled' ? updates.value.updates || [] : [];
    } catch (err) {
      this.loadFailed = true;
    }
    if (this.view === 'home') this.render();
  }

  // ------------------------------------------------------------------ rendering
  static frame(inner) {
    return `<div class="gs-page" translate="no">${inner}</div>`;
  }

  static render() {
    if (!this.root) return;
    if (this.view === 'receipt') { this.renderReceipt(); return; }
    if (this.loadFailed || !this.config) {
      this.root.innerHTML = this.frame(`<section class="gs-card gs-center" role="alert"><h1>${esc(T('gs_hero_title'))}</h1><p>${esc(T('gs_load_error'))}</p><button type="button" class="gs-btn" data-gs-reload>${esc(T('gs_retry'))}</button></section>`);
      return;
    }
    const focus = document.activeElement?.id;
    this.root.innerHTML = this.frame(`${this.heroHtml()}<div class="gs-content-grid"><div class="gs-purpose-section">${this.purposeHtml()}</div><aside class="gs-donation-column">${this.formHtml()}</aside><div class="gs-main-column">${this.stepsHtml()}${this.gaushalaHtml()}${this.updatesHtml()}${this.faqHtml()}</div></div>`);
    if (focus && this.root.querySelector('#' + focus)) this.root.querySelector('#' + focus).focus();
  }

  static primary() { return this.gaushalas.find(g => g.id===this.form.gaushalaId&&g.accepting_donations) || this.gaushalas.find(g => g.accepting_donations) || null; }

  static heroHtml() {
    const g = this.primary();
    const photo = g?.photos?.[0];
    const art = photo ? `<img src="${esc(mediaUrl(photo))}" alt="${esc(g.name)}" loading="eager">` : `<figure class="gs-illustration"><img src="/assets/img/gau-sewa-hero-v2.webp" alt="${esc(T('gs_hero_alt'))}" fetchpriority="high"><figcaption>${esc(T('gs_illustrative'))}</figcaption></figure>`;
    return `<header class="gs-hero service-banner service-banner--gau"><div class="gs-hero-copy service-banner__copy"><span class="gs-eyebrow"><span aria-hidden="true">✦</span> ${esc(T('gs_eyebrow'))}</span>
      <span class="gs-hero-name">${esc(T('gs_hero_title'))}</span><h1><span>${esc(T('gs_hero_line_one'))}</span><em>${esc(T('gs_hero_line_two'))}</em></h1><p>${esc(T('gs_hero_sub'))}</p>
      <a class="gs-btn" href="#gs-donate" data-gs-scroll>${esc(T('gs_hero_cta'))}<span aria-hidden="true">↗</span></a><div class="gs-hero-caption"><span aria-hidden="true">✧</span> ${esc(T('gs_hero_caption'))}</div></div>
      <div class="gs-hero-art" ${photo ? '' : `title="${esc(T('gs_hero_alt'))}"`}>${art}</div></header>`;
  }

  static purposeHtml() {
    return `<section class="gs-section" aria-labelledby="gs-purpose-h"><span class="gs-section-kicker">${esc(T('gs_section_kicker'))}</span><h2 id="gs-purpose-h">${esc(T('gs_purpose_heading'))}</h2><p class="gs-section-intro">${esc(T('gs_purpose_intro'))}</p>
      <div class="gs-purposes">${PURPOSES.map((p, i) => `<button type="button" class="gs-purpose ${this.form.purpose === p ? 'is-on' : ''}" data-gs-purpose="${p}" aria-pressed="${this.form.purpose === p}">
        <span class="gs-purpose-icon" aria-hidden="true">${PURPOSE_ICON[p]}</span><span class="gs-purpose-copy"><span class="gs-purpose-number">0${i + 1}</span><strong>${esc(purposeLabel(p))}</strong><small>${esc(T('gs_purpose_' + p + '_desc'))}</small></span></button>`).join('')}</div></section>`;
  }

  static stepsHtml() {
    return `<section class="gs-section gs-journey" aria-labelledby="gs-steps-h"><h2 id="gs-steps-h">${esc(T('gs_steps_heading'))}</h2><ol class="gs-steps">${['one', 'two', 'three'].map((step, i) => `<li><span aria-hidden="true">0${i + 1}</span><div><h3>${esc(T('gs_step_' + step))}</h3><p>${esc(T('gs_step_' + step + '_desc'))}</p></div></li>`).join('')}</ol></section>`;
  }

  static gaushalaHtml() {
    const list = this.gaushalas;
    if (!list.length) {
      return `<section class="gs-section"><h2>${esc(T('gs_gaushala_heading'))}</h2><div class="gs-card gs-empty"><span class="gs-empty-symbol" aria-hidden="true">${lineIcon('<path d="m3 10 9-7 9 7v10H3V10Zm6 10v-7h6v7M2 10h20"/>')}</span><div><strong>${esc(T('gs_gaushala_empty_title'))}</strong><p>${esc(T('gs_gaushala_empty_text'))}</p></div></div></section>`;
    }
    return `<section class="gs-section" aria-labelledby="gs-gaushala-h"><h2 id="gs-gaushala-h">${esc(T('gs_gaushala_heading'))}</h2>${list.map(g => `
      <article class="gs-card gs-gaushala"><h3>${esc(g.name)}</h3>
        ${g.location ? `<p class="gs-meta">📍 ${esc(T('gs_location'))}: ${esc(g.location)}</p>` : ''}
        ${g.introduction ? `<p>${esc(g.introduction)}</p>` : ''}
        ${g.photos?.length ? `<div class="gs-photos">${g.photos.map(u => `<img src="${esc(mediaUrl(u))}" alt="${esc(g.name)}" loading="lazy">`).join('')}</div>` : ''}</article>`).join('')}</section>`;
  }

  static formHtml() {
    const cfg = this.config;
    const e = this.errors;
    const g = this.primary();
    const recipients=this.gaushalas.filter(g=>g.accepting_donations);
    const canDonate=cfg.available&&!!g;
    let unavailable = '';
    if (!canDonate) {
      const text = !g || cfg.reason === 'recipient_not_configured' ? T('gs_unavailable_recipient') : T('gs_unavailable_payments');
      unavailable = `<div class="gs-notice gs-notice--info" role="status"><strong>${esc(T('gs_unavailable_title'))}</strong><p>${esc(text)}</p></div>`;
    }
    const amount = this.amount();
    const presetOn = (n) => this.form.custom === '' && this.form.amount === n;
    const field = (id, label, input, error) => `<div class="gs-field"><label for="${id}">${esc(label)}</label>${input}${error ? `<p class="gs-error" id="${id}-err" role="alert">${esc(error)}</p>` : ''}</div>`;
    return `<section class="gs-section" id="gs-donate" aria-labelledby="gs-form-h"><form class="gs-card gs-form" novalidate>
      <div class="gs-form-heading"><span class="gs-section-kicker">${esc(T('gs_form_kicker'))}</span><h2 id="gs-form-h">${esc(T('gs_form_heading'))}</h2><p>${esc(T('gs_form_intro'))}</p></div>${unavailable}<fieldset class="gs-form-fields" ${this.busy ? 'disabled' : ''}>
      ${this.notice ? `<p class="gs-notice gs-notice--${this.notice.type}" role="${this.notice.type === 'error' ? 'alert' : 'status'}">${esc(this.notice.text)}</p>` : ''}
      <fieldset class="gs-fieldset"><legend>${esc(T('gs_amount_label'))}</legend>
        ${field('gs-custom', T('gs_amount_custom'), `<div class="gs-amount-input"><span aria-hidden="true">₹</span><input id="gs-custom" name="custom" inputmode="numeric" autocomplete="off" pattern="[0-9]*" placeholder="${esc(String(this.form.amount))}" value="${esc(this.form.custom)}" aria-describedby="gs-amount-hint${e.amount ? ' gs-custom-err' : ''}" ${e.amount ? 'aria-invalid="true"' : ''}></div>`, e.amount)}
        <p class="gs-hint" id="gs-amount-hint">${esc(T('gs_amount_hint', { min: Number(cfg.min_amount).toLocaleString('en-IN'), max: Number(cfg.max_amount).toLocaleString('en-IN') }))}</p>
        <p class="gs-suggested">${esc(T('gs_suggested'))}</p>
        <div class="gs-amounts">${(cfg.presets || [101, 501, 1100]).map(n => `<button type="button" class="gs-chip ${presetOn(n) ? 'is-on' : ''}" data-gs-amount="${n}" aria-pressed="${presetOn(n)}">${rupees(n)}</button>`).join('')}</div>
      </fieldset>
      ${field('gs-name', T('gs_name_label'), `<input id="gs-name" name="name" autocomplete="name" maxlength="120" placeholder="${esc(T('gs_name_ph'))}" value="${esc(this.form.name)}" required ${e.name ? 'aria-invalid="true" aria-describedby="gs-name-err"' : ''}>`, e.name)}
      ${field('gs-email', T('gs_email_label'), `<input id="gs-email" name="email" type="email" autocomplete="email" maxlength="255" value="${esc(this.form.email)}" aria-describedby="gs-email-hint${e.email ? ' gs-email-err' : ''}" ${e.email ? 'aria-invalid="true"' : ''}>`, e.email)}
      <p class="gs-hint" id="gs-email-hint">${esc(T('gs_email_hint'))}</p>
      <label class="gs-check"><input type="checkbox" id="gs-hide" name="hide" ${this.form.hide ? 'checked' : ''}><span>${esc(T('gs_hide_name'))}</span></label>
      ${recipients.length>1?field('gs-recipient',T('gs_choose_recipient'),`<select id="gs-recipient" name="gaushala">${recipients.map(r=>`<option value="${esc(r.id)}" ${r.id===g?.id?'selected':''}>${esc(r.name)}${r.location?' · '+esc(r.location):''}</option>`).join('')}</select>`):''}<div class="gs-recipient"><h3>${esc(T('gs_recipient_heading'))}</h3>
        <p><strong>${esc(g?.beneficiary_name ? T('gs_recipient_line', { name: g.beneficiary_name }) : T('gs_gaushala_empty_title'))}</strong></p>
        ${g?.beneficiary_details ? `<p>${esc(g.beneficiary_details)}</p>` : ''}
        <p class="gs-hint">${esc(T('gs_recipient_note'))}</p></div>
      <div class="gs-donation-summary"><div><span>${esc(T('gs_purpose'))}</span><strong>${esc(purposeLabel(this.form.purpose))}</strong></div><div><span>${esc(T('gs_amount_label'))}</span><strong id="gs-summary-amount" aria-live="polite">${rupees(amount)}</strong></div></div>
      <button type="submit" class="gs-btn gs-btn--block" ${this.busy ? 'disabled aria-busy="true"' : !canDonate ? 'disabled' : ''}>${esc(this.busy ? T('gs_starting') : (amount ? T('gs_donate_amount_btn', { amount: amount.toLocaleString('en-IN') }) : T('gs_donate_btn')))}</button>
      </fieldset><p class="gs-hint gs-receipt-note">${esc(T('gs_payment_receipt_hint'))}</p>
    </form></section>`;
  }

  static updatesHtml() {
    const items = this.updates.filter(u=>!u.gaushala_id||u.gaushala_id===this.primary()?.id);
    if(this.updatesFailed)return `<section class="gs-section"><h2>${esc(T('gs_updates_heading'))}</h2><div class="gs-card"><p role="status">${esc(T('gs_updates_error'))}</p><button type="button" class="gs-btn gs-btn--line" data-gs-updates-retry>${esc(T('gs_retry'))}</button></div></section>`;
    return `<section class="gs-section" aria-labelledby="gs-updates-h"><h2 id="gs-updates-h">${esc(T('gs_updates_heading'))}</h2>${items.length ? items.map(u => `
      <article class="gs-card gs-update"><small>${esc(dateText(u.published_at))}</small><h3>${esc(u.title)}</h3>${u.body ? `<p>${esc(u.body).replace(/\n/g, '<br>')}</p>` : ''}
      ${u.photos?.length ? `<div class="gs-photos">${u.photos.map(p => `<img src="${esc(mediaUrl(p))}" alt="${esc(u.title)}" loading="lazy">`).join('')}</div>` : ''}</article>`).join('')
      : `<div class="gs-card gs-empty"><p>${esc(T('gs_updates_empty'))}</p></div>`}</section>`;
  }

  static faqHtml(){
    return `<section class="gs-section gs-faq"><h2>${esc(T('gs_faq_title'))}</h2>${['recipient','receipt','updates'].map(k=>`<details><summary>${esc(T('gs_faq_'+k+'_q'))}</summary><p>${esc(T('gs_faq_'+k+'_a'))}</p></details>`).join('')}</section>`;
  }

  // ------------------------------------------------------------------ form handling
  static amount() {
    if (this.form.custom !== '') return /^\d+$/.test(this.form.custom) ? Number(this.form.custom) : 0;
    return this.form.amount;
  }

  static onClick(e) {
    if(e.target.closest('[data-gs-updates-retry]')){this.load();return;}
    if(e.target.closest('[data-gs-check]')){this.loadReceipt(true);return;}
    if(e.target.closest('[data-gs-print]')){window.print();return;}
    if (e.target.closest('[data-gs-reload]')) { this.view === 'receipt' ? this.openReceipt(this.receiptToken) : this.open(); return; }
    const scroll = e.target.closest('[data-gs-scroll]');
    if (scroll) { e.preventDefault(); this.root.querySelector('#gs-donate')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const purpose = e.target.closest('[data-gs-purpose]');
    if (purpose) { if(this.busy)return; this.form.purpose = purpose.dataset.gsPurpose; this.render(); return; }
    const chip = e.target.closest('[data-gs-amount]');
    if (chip) { this.form.amount = Number(chip.dataset.gsAmount); this.form.custom = ''; delete this.errors.amount; this.render(); return; }
    if (e.target.closest('[data-gs-download]')) { this.download(); return; }
    if (e.target.closest('[data-gs-again]')) { window.Router?.navigate('/gau-sewa'); }
  }

  static onInput(e) {
    const t = e.target;
    if(t.id==='gs-recipient'){this.form.gaushalaId=t.value;this.render();return;}
    if (t.id === 'gs-custom') {
      this.form.custom = t.value.trim();
      delete this.errors.amount;
      const summary = this.root.querySelector('#gs-summary-amount');
      if (summary) summary.textContent = rupees(this.amount());
      const btn = this.root.querySelector('.gs-form [type="submit"]');
      if (btn && !this.busy) { const a = this.amount(); btn.textContent = a ? T('gs_donate_amount_btn', { amount: a.toLocaleString('en-IN') }) : T('gs_donate_btn'); }
      this.root.querySelectorAll('[data-gs-amount]').forEach(c => { c.classList.toggle('is-on', false); c.setAttribute('aria-pressed', 'false'); });
    } else if (t.id === 'gs-name') this.form.name = t.value;
    else if (t.id === 'gs-email') this.form.email = t.value;
    else if (t.id === 'gs-hide') this.form.hide = t.checked;
  }

  static validate() {
    const cfg = this.config, errors = {};
    const raw = this.form.custom !== '' ? this.form.custom : String(this.form.amount);
    const n = Number(raw);
    if (!/^\d+$/.test(raw)) errors.amount = T('gs_err_amount_whole');
    else if (n < cfg.min_amount || n > cfg.max_amount) errors.amount = T('gs_err_amount', { min: cfg.min_amount.toLocaleString('en-IN'), max: cfg.max_amount.toLocaleString('en-IN') });
    if (this.form.name.trim().length < 2) errors.name = T('gs_err_name');
    const email = this.form.email.trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = T('gs_err_email');
    this.errors = errors;
    return !Object.keys(errors).length;
  }

  static async donate() {
    if (this.busy || !this.config?.available || !this.primary()) return;
    this.notice = null;
    if (!this.validate()) {
      this.render();
      this.root.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    this.busy = true;
    this.render();
    let order;
    try {
      order = await api('/api/v1/gau-sewa/donations/order', {
        method: 'POST', headers: JSON_HEADERS,
        body: JSON.stringify({ amount: this.amount(), purpose: this.form.purpose, donor_name: this.form.name.trim(), donor_email: this.form.email.trim() || null,
          hide_name_public: this.form.hide, gaushala_id: this.primary()?.id || null }),
      });
      await this.loadCheckout();
    } catch (err) {
      this.busy = false;
      if (err.status === 503) await this.load();
      this.notice = { type: 'error', text: err.status === 503 ? T('gs_unavailable_payments') : err.message };
      this.render();
      return;
    }
    const finish = () => { this.busy = false; };
    const checkout = new window.Razorpay({
      key: order.key_id, order_id: order.order_id, amount: order.amount, currency: order.currency, name: 'Astro Jyotish', description: T('gs_hero_title'),
      prefill: { name: this.form.name.trim(), email: this.form.email.trim() },
      handler: (response) => { finish(); this.confirm(order, response); },
      modal: { ondismiss: () => { finish(); this.notice = { type: 'info', text: T('gs_cancelled') }; this.render(); } },
    });
    checkout.on?.('payment.failed', () => { finish(); this.notice = { type: 'error', text: T('gs_failed_text') }; this.render(); });
    checkout.open();
  }

  static async loadCheckout() {
    if (window.Razorpay) return;
    await new Promise((resolve, reject) => {
      const el = Object.assign(document.createElement('script'), { src: 'https://checkout.razorpay.com/v1/checkout.js', onload: resolve, onerror: () => reject(new Error('Payment window could not load. Check your connection.')) });
      document.head.appendChild(el);
    });
  }

  /** Hands the Razorpay result to the server. Whatever the server decides is what the donor is shown. */
  static async confirm(order, response) {
    this.view = 'receipt';
    this.receiptToken = order.receipt_token;
    this.receipt = null;
    this.root.innerHTML = this.frame(`<p class="gs-state" role="status">${esc(T('gs_verifying'))}</p>`);
    window.history.pushState({}, '', '/gau-sewa/receipt/' + order.receipt_token);
    try {
      await api('/api/v1/gau-sewa/donations/verify', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(response) });
    } catch (err) {
      /* the receipt page below shows the real status; it keeps checking while the donation is pending */
    }
    this.form.custom = '';
    await this.loadReceipt(true);
  }

  // ------------------------------------------------------------------ confirmation / receipt
  static stopPolling() { clearTimeout(this.pollTimer); this.pollTimer = null; this.receiptRequest++; }

  static async loadReceipt(first, attempt = 0) {
    this.stopPolling();
    const request=this.receiptRequest,token=this.receiptToken;
    try {
      const receipt = await api('/api/v1/gau-sewa/donations/receipt/' + encodeURIComponent(token));
      if(request!==this.receiptRequest||this.view!=='receipt')return;
      this.receipt=receipt;this.lastChecked=new Date();
      this.loadFailed = false;
    } catch (err) {
      if(request!==this.receiptRequest||this.view!=='receipt')return;
      if(!first&&this.receipt){this.renderReceipt();return;}
      this.receipt = null;
      this.loadFailed = err.status === 404 ? 'notfound' : true;
    }
    if (this.view !== 'receipt') return;
    this.renderReceipt();
    if (this.receipt?.status === 'PENDING' && attempt < 12) {
      this.pollTimer = setTimeout(() => this.loadReceipt(false, attempt + 1), 5000);
    }
  }

  static renderReceipt() {
    const r = this.receipt;
    if (!r) {
      const missing = this.loadFailed === 'notfound';
      this.root.innerHTML = this.frame(`<section class="gs-card gs-center" role="alert"><h1>${esc(T('gs_hero_title'))}</h1><p>${esc(missing ? T('gs_receipt_not_found') : T('gs_load_error'))}</p>
        ${missing ? '' : `<button type="button" class="gs-btn" data-gs-reload>${esc(T('gs_retry'))}</button>`} <a class="gs-btn gs-btn--line" href="/gau-sewa" data-nav-link>${esc(T('gs_back'))}</a></section>`);
      return;
    }
    const map = {
      SUCCESS: ['gs-ok', '🙏', T('gs_success_title'), T('gs_success_text')],
      PENDING: ['gs-wait', '⏳', T('gs_pending_title'), T('gs_pending_text')],
      FAILED: ['gs-bad', '⚠️', T('gs_failed_title'), T('gs_failed_text')],
      REFUNDED: ['gs-wait', '↩️', T('gs_refunded_title'), ''],
    };
    const [cls, icon, title, text] = map[r.status] || map.PENDING;
    const rows = [[T('gs_ref'), r.reference], [T('gs_amount'), rupees(r.amount)], [T('gs_purpose'), purposeLabel(r.purpose)],
      [T('gs_date'), dateText(r.paid_at || r.created_at)], [T('gs_recipient'), r.recipient_name || '—'], [T('gs_status'), statusLabel(r.status)]];
    this.root.innerHTML = this.frame(`<section class="gs-card gs-receipt ${cls}" aria-live="polite"><div class="gs-receipt-icon" aria-hidden="true">${icon}</div>
      <h1>${esc(title)}</h1>${text ? `<p>${esc(text)}</p>` : ''}
      <dl class="gs-details">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${r.status==='PENDING'?`<p class="gs-notice">${esc(T('gs_pending_safety'))}</p><button type="button" class="gs-btn" data-gs-check>${esc(T('gs_check_status'))}</button>`:''}${this.lastChecked?`<p class="gs-hint">${esc(T('gs_last_checked'))}: ${esc(this.lastChecked.toLocaleTimeString(lang(),{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'}))} IST</p>`:''}<p><button type="button" class="gs-support-link" data-service-info="contact">${esc(T('gs_receipt_support'))}</button></p>${r.receipt_available ? `<button type="button" class="gs-btn" data-gs-download>${esc(T('gs_receipt_html_download'))}</button><button type="button" class="gs-btn gs-btn--line" data-gs-print>${esc(T('gs_print_receipt'))}</button>` : ''}
      <p class="gs-hint">${esc(T('gs_receipt_note'))}</p>${isSignedIn() ? '' : `<p class="gs-hint">${esc(T('gs_receipt_keep'))}</p>`}
      <p><a class="gs-btn gs-btn--line" href="/gau-sewa" data-nav-link>${esc(r.status === 'SUCCESS' ? T('gs_donate_again') : T('gs_back'))}</a></p></section>`);
  }

  static async download() {
    try { await downloadFile(`/api/v1/gau-sewa/donations/receipt/${encodeURIComponent(this.receiptToken)}/download`, `gau-sewa-receipt-${this.receipt?.reference || 'donation'}.html`); }
    catch (err) { toast(err.message, 'error'); }
  }
}

window.GauSewaPageComponent = GauSewaPageComponent;
