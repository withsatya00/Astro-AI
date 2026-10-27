import { loadTemplate } from '../../utils/templateLoader.js';
import { esc, money, toast, api, postJson, openModal, closeModal, wireDismiss, showCredits, hoistOverlays, mediaUrl, t, applyI18n, goTo, requireLogin, downloadFile, isSignedIn } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

const CATEGORY_SLUGS = {
  shiva: ['mahakaleshwar-ujjain', 'kashi-vishwanath-varanasi', 'somnath-jyotirlinga-gujarat', 'kedarnath-dham-uttarakhand'],
  shakti: ['vaishno-devi-katra', 'kamakhya-devi-assam'],
  shani: ['shani-shingnapur'],
  ganesh: ['siddhivinayak-mumbai'],
  ram_krishna: ['ram-janmabhoomi-ayodhya', 'tirupati-balaji-andhra', 'jagannath-temple-puri']
};

const STEPS = ['PAID', 'SANKALP_SCHEDULED', 'VIDEO_UPLOADED', 'COMPLETED'];

// Panchang names arrive as "Dwitiya (द्वितीया)"; show only the part in the site's language.
const pickLang = (text, lang) => {
  const m = String(text || '').match(/^(.*?)\s*\((.*)\)\s*$/);
  if (!m) return text;
  return lang === 'hi' && /[ऀ-ॿ]/.test(m[2]) ? m[2] : m[1];
};

const longDate = (iso, lang) => {
  const d = iso ? new Date(`${iso}T00:00:00`) : null;
  return d && !isNaN(d) ? d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
};

export class MandirSevaPageComponent {
  static templatePath = '/src/pages/MandirSevaPage/MandirSevaPage.html';
  static templesData = [];
  static activeCategory = 'all';
  static searchQuery = '';
  static root = null;
  static overlay = null;
  static bookingsOpen = false;

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    target.innerHTML = await loadTemplate(this.templatePath);
    this.root = target;
    this.overlay = hoistOverlays(target, 'mandir');
    this.initEvents();
    this.applyLanguage();
    await this.loadTemples();
    this.loadExtras();
    return target;
  }

  static $(id) { return document.getElementById(id); }
  static get lang() { return currentLang(); }

  static applyLanguage() {
    applyI18n(this.root);
    applyI18n(this.overlay);
  }

  static initEvents() {
    // Everything on this page follows the site language: static text, catalog data from the API and open dialogs.
    window.addEventListener('astro:languagechange', async () => {
      this.applyLanguage();
      await this.loadTemples();
      this.loadExtras();
      if (this.bookingsOpen) this.openMyBookings();
    });
    wireDismiss(this.overlay);

    this.$('mandir-category-filters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      this.root.querySelectorAll('#mandir-category-filters .shop-chip').forEach(b => b.classList.toggle('is-active', b === btn));
      this.activeCategory = btn.getAttribute('data-filter');
      this.renderTemples();
    });
    this.$('mandir-search-input').addEventListener('input', (e) => { this.searchQuery = e.target.value.trim().toLowerCase(); this.renderTemples(); });

    this.$('temples-grid').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-book]');
      if (btn) this.openBookingModal(btn.getAttribute('data-book'));
      const more = e.target.closest('[data-temple]');
      if (more) goTo(`/mandir-seva/${more.getAttribute('data-temple')}`);
    });
    this.root.addEventListener('click', (e) => {
      const open = e.target.closest('[data-open-slug]');
      if (open) this.openBookingModal(open.getAttribute('data-open-slug'));
    });

    this.$('btn-view-my-bookings').addEventListener('click', () => { if (requireLogin('auth.neededBookings')) this.openMyBookings(); });
    this.$('btn-rewards').addEventListener('click', () => { if (requireLogin('auth.neededRewards')) goTo('/rewards'); });
    this.$('mandir-packages-list').addEventListener('click', (e) => { const b = e.target.closest('[data-package]'); if (b) this.openPackage(b.getAttribute('data-package')); });
    this.overlay.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', () => closeModal(this.$(b.getAttribute('data-close-modal')))));
    this.$('package-form').addEventListener('submit', (e) => this.buyPackage(e));
    this.$('pk-apply').addEventListener('click', () => this.previewPackage(true));
    this.$('pk-points').addEventListener('change', () => this.previewPackage());
    this.$('pk-start').addEventListener('change', () => this.previewPackage());
    this.$('btn-close-bookings-modal').addEventListener('click', () => { this.bookingsOpen = false; closeModal(this.$('devotee-bookings-modal')); });
    this.$('btn-close-video-modal').addEventListener('click', () => {
      const v = this.$('video-proof-player'); if (v) v.pause();
      closeModal(this.$('video-proof-modal'));
    });
    this.root.querySelectorAll('[data-open-credits]').forEach(b => b.addEventListener('click',
      () => showCredits(this.$('mandir-credits-modal'), this.$('mandir-credits-list'), 'temples')));
    this.overlay.querySelectorAll('[data-close-credits]').forEach(b => b.addEventListener('click', () => closeModal(this.$('mandir-credits-modal'))));
  }

  // ---------------- catalog ----------------
  static async loadTemples() {
    const loading = this.$('mandir-loading-state');
    try {
      const res = await api(`/api/v1/mandir/temples?lang=${this.lang}`);
      this.templesData = res.temples || [];
      this.renderTemples();
    } catch (err) {
      loading.style.display = '';
      loading.innerHTML = `<p>${esc(err.message)}</p><button type="button" class="shop-btn shop-btn--line shop-btn--sm" id="mandir-retry">${esc(t('retry'))}</button>`;
      this.$('mandir-retry').addEventListener('click', () => { loading.innerHTML = '<div class="shop-spinner"></div>'; this.loadTemples(); });
    }
  }

  static loadExtras() {
    this.renderToday();
    this.renderSuggestion();
    this.loadPackages();
  }

  // ---------------- packages ----------------
  static async loadPackages() {
    const box = this.$('mandir-packages');
    try {
      const d = await api(`/api/v1/mandir/packages?lang=${this.lang}`);
      this.packages = d.packages;
      if (!d.packages.length) { box.hidden = true; return; }
      this.$('mandir-packages-list').innerHTML = d.packages.map(p => `
        <article class="mp-card">
          <img src="${esc(p.image_url)}" alt="" loading="lazy">
          <div class="mp-body"><span class="shop-card__eyebrow">${esc(p.temple_name)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>
            <div class="shop-card__foot"><div class="shop-price"><small>${esc(t('pk.sessions', { n: p.sessions }))}</small>${money(p.price)}${p.discount_percent ? `<s>${money(p.list_price)}</s><span class="shop-off">${esc(t('ml.off', { n: p.discount_percent }))}</span>` : ''}</div>
              <button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-package="${esc(p.slug)}">${esc(t('pk.select'))}</button></div></div>
        </article>`).join('');
      box.hidden = false;
    } catch (e) { box.hidden = true; }
  }

  static openPackage(slug) {
    if (!requireLogin('auth.neededBooking')) return;
    const p = (this.packages || []).find(x => x.slug === slug);
    if (!p) return;
    this.pkg = p;
    this.pkgCoupon = '';
    this.$('pk-title').textContent = p.title;
    this.$('pk-sub').textContent = `${p.temple_name} - ${t('pk.sessions', { n: p.sessions })}`;
    this.$('pk-desc').textContent = p.description;
    this.$('pk-coupon').value = '';
    this.$('pk-coupon-msg').textContent = '';
    this.$('pk-points').checked = false;
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    this.$('pk-start').min = tomorrow;
    this.$('pk-start').value = tomorrow;
    this.$('pk-gotra').value = this.lang === 'hi' ? 'कश्यप' : 'Kashyap';
    openModal(this.$('package-modal'));
    api('/api/v1/rewards/summary').then(r => { this.pkgPoints = r.points || 0; this.$('pk-points-wrap').classList.toggle('hidden', !(this.pkgPoints > 0)); this.$('pk-points-label').textContent = t('co.usePoints', { points: this.pkgPoints, worth: money(this.pkgPoints * r.point_value) }); }).catch(() => {});
    api('/api/v1/charts').then(c => { const ch = (c || []).find(x => x.is_default) || (c || [])[0]; if (ch && !this.$('pk-name').value) this.$('pk-name').value = ch.name || ''; }).catch(() => {});
    this.previewPackage();
  }

  static packageDates() {
    const p = this.pkg;
    const start = this.$('pk-start').value;
    if (!start) return [];
    const d0 = new Date(start + 'T00:00:00');
    const out = [];
    if (p.cadence === 'weekly') {
      const first = new Date(d0); first.setDate(first.getDate() + (((p.weekday ?? 0) - ((d0.getDay() + 6) % 7)) + 7) % 7);
      for (let i = 0; i < p.sessions; i++) { const d = new Date(first); d.setDate(d.getDate() + 7 * i); out.push(d); }
    } else if (p.cadence === 'monthly') {
      for (let i = 0; i < p.sessions; i++) { const d = new Date(d0); d.setMonth(d.getMonth() + i); out.push(d); }
    } else for (let i = 0; i < p.sessions; i++) { const d = new Date(d0); d.setDate(d.getDate() + i); out.push(d); }
    return out;
  }

  static async previewPackage(applyCoupon = false) {
    const p = this.pkg;
    const dates = this.packageDates();
    const fmt = (d) => d.toLocaleDateString(this.lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    this.$('pk-dates').innerHTML = `<h4>${esc(t('pk.dates'))}</h4><div class="shop-chips" style="flex-wrap:wrap">${dates.map(d => `<span class="shop-pill">${esc(fmt(d))}</span>`).join('')}</div>`;
    let discount = 0;
    if (applyCoupon) {
      const code = this.$('pk-coupon').value.trim().toUpperCase();
      this.pkgCoupon = '';
      if (code) {
        try {
          const r = await postJson('/api/v1/rewards/coupons/validate', { code, scope: 'seva', amount: p.price });
          this.pkgCoupon = r.code;
          this.$('pk-coupon-msg').textContent = t('co.couponOk', { code: r.code, amount: money(r.discount) });
          this.$('pk-coupon-msg').style.color = '#047857';
        } catch (err) { this.$('pk-coupon-msg').textContent = err.message; this.$('pk-coupon-msg').style.color = '#dc2626'; }
      }
    }
    if (this.pkgCoupon) {
      try { discount = (await postJson('/api/v1/rewards/coupons/validate', { code: this.pkgCoupon, scope: 'seva', amount: p.price })).discount; } catch (e) { this.pkgCoupon = ''; }
    }
    this.$('pk-totals').innerHTML = `${p.discount_percent ? `<div class="shop-totals__row"><span>${esc(t('pk.listPrice'))}</span><span><s>${money(p.list_price)}</s></span></div>` : ''}`
      + (discount ? `<div class="shop-totals__row"><span>${esc(t('co.coupon', { code: this.pkgCoupon }))}</span><span>-${money(discount)}</span></div>` : '')
      + `<div class="shop-totals__row shop-totals__row--big"><span>${esc(t('ml.total'))}</span><span>${money(p.price - discount)}</span></div>`;
  }

  static async buyPackage(e) {
    e.preventDefault();
    if (!requireLogin('auth.neededBooking')) return;
    const btn = this.$('pk-submit');
    btn.disabled = true;
    btn.textContent = t('cd.submitting');
    try {
      const res = await postJson(`/api/v1/mandir/packages/${encodeURIComponent(this.pkg.slug)}/buy?lang=${this.lang}`, {
        devotee_name: this.$('pk-name').value.trim(), devotee_phone: this.$('pk-phone').value.trim(), gotra: this.$('pk-gotra').value.trim() || 'Kashyap',
        family_members: this.$('pk-family').value.trim() || null, start_date: this.$('pk-start').value,
        coupon_code: this.pkgCoupon || null, use_points: this.$('pk-points').checked ? (this.pkgPoints || 0) : 0
      });
      closeModal(this.$('package-modal'));
      toast(t('pk.bought', { n: res.bookings.length }), 'success');
      if (window.App && window.App.refreshWalletUI) window.App.refreshWalletUI();
      if (window.NotificationBell) window.NotificationBell.refresh();
      this.openMyBookings();
    } catch (err) { toast(err.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = t('pk.buy'); }
  }

  static async renderToday() {
    const box = this.$('mandir-today');
    try {
      const d = await api(`/api/v1/mandir/today?lang=${this.lang}`);
      const items = [];
      if (d.special && d.special.temple) items.push({ temple: d.special.temple, label: `${d.special.name}: ${d.special.note}` });
      if (d.weekday_temple) items.push({ temple: d.weekday_temple, label: `${t('md.deityOfDay')}: ${d.weekday_deity}` });
      box.innerHTML = `
        <h3>${esc(t('md.today'))}${d.date_iso ? ' - ' + esc(longDate(d.date_iso, this.lang)) : ''}</h3>
        ${d.tithi && d.tithi.name ? `<p>${esc(t('md.tithi'))}: <strong>${esc(pickLang(d.tithi.name, this.lang))}</strong>${d.tithi.paksha ? ' (' + esc(pickLang(d.tithi.paksha, this.lang)) + ')' : ''}</p>` : ''}
        <div class="shop-suggest__items">${items.map(i => `
          <button type="button" class="shop-suggest__item" data-open-slug="${esc(i.temple.slug)}">
            <img src="${esc(i.temple.image_url)}" alt="" loading="lazy"><span>${esc(i.label)}<br><small>${esc(i.temple.name)}</small></span>
          </button>`).join('')}</div>`;
      box.hidden = false;
    } catch (e) { box.hidden = true; }
  }

  static async renderSuggestion() {
    const box = this.$('mandir-suggest');
    try {
      const d = await api(`/api/v1/mandir/suggestions?lang=${this.lang}`);
      if (!d.has_chart || !d.temple) { box.hidden = true; return; }
      const s = d.suggestion;
      const hi = this.lang === 'hi';
      box.innerHTML = `
        <h3>${esc(t('md.forKundli'))} (${esc(d.chart_name)})</h3>
        <p>${esc(t('md.suggest', { sign: hi ? s.sign_hi : s.sign, lord: hi ? s.hi : s.lord, deity: hi ? s.deity : s.deity_en }))}</p>
        <div class="shop-suggest__items"><button type="button" class="shop-suggest__item" data-open-slug="${esc(d.temple.slug)}">
          <img src="${esc(d.temple.image_url)}" alt="" loading="lazy"><span>${esc(d.temple.name)}</span></button></div>
        <p class="shop-hint">${esc(t('md.disclaimer'))}</p>`;
      box.hidden = false;
    } catch (e) { box.hidden = true; }
  }

  static matches(temple) {
    if (this.activeCategory !== 'all' && !(CATEGORY_SLUGS[this.activeCategory] || []).includes(temple.slug)) return false;
    const q = this.searchQuery;
    return !q || [temple.name, temple.deity, temple.city, temple.state].some(v => String(v || '').toLowerCase().includes(q));
  }

  static renderTemples() {
    const grid = this.$('temples-grid');
    const empty = this.$('mandir-empty-state');
    this.$('mandir-loading-state').style.display = 'none';
    const list = this.templesData.filter(x => this.matches(x));
    empty.style.display = list.length || !this.templesData.length ? 'none' : 'block';
    grid.style.display = list.length ? 'grid' : 'none';
    grid.innerHTML = list.map(x => this.card(x)).join('');
  }

  static card(temple) {
    const offers = (temple.offerings || []).slice(0, 3);
    return `
    <article class="shop-card">
      <div class="shop-card__media">
        <img src="${esc(temple.image_url)}" alt="${esc(temple.name)}" loading="lazy">
        <span class="shop-card__tag shop-card__tag--tl">${esc(temple.has_live ? t('md.liveDarshan') : t('md.bookingOpen'))}</span>
        <span class="shop-card__tag shop-card__tag--bl">📍 ${esc(temple.city)}, ${esc(temple.state)}</span>
      </div>
      <div class="shop-card__body">
        <span class="shop-card__eyebrow">🕉️ ${esc(temple.deity)}</span>
        <h3 class="shop-card__title"><a href="/mandir-seva/${esc(temple.slug)}">${esc(temple.name)}</a></h3>
        <p class="shop-card__text">${esc(temple.description)}</p>
        <ul class="shop-card__list">
          ${offers.map(o => `<li><span>${esc(o.title)}</span><b>${money(o.price)}</b></li>`).join('')}
        </ul>
        <div class="shop-card__foot">
          <div class="shop-price"><small>${esc(t('md.startsFrom'))}</small>${money(temple.starting_price)}</div>
          <div style="display:flex;gap:6px"><button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-temple="${esc(temple.slug)}">${esc(t('ml.details'))}</button>
          <button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-book="${esc(temple.slug)}">🪔 ${esc(t('md.book'))}</button></div>
        </div>
      </div>
    </article>`;
  }

  static openBookingModal(slug) {
    if (!requireLogin('auth.neededBooking')) return;
    const temple = this.templesData.find(x => x.slug === slug || x.id === slug);
    if (temple && window.ChadawaModal && window.ChadawaModal.open) window.ChadawaModal.open(temple);
  }

  // ---------------- bookings ----------------
  static async openMyBookings() {
    const list = this.$('devotee-bookings-list');
    this.bookingsOpen = true;
    openModal(this.$('devotee-bookings-modal'));
    list.innerHTML = `<div class="shop-loading"><div class="shop-spinner"></div><p>${esc(t('md.loadingBookings'))}</p></div>`;
    let bookings;
    try {
      bookings = (await api(`/api/v1/mandir/chadawa/my-bookings?lang=${this.lang}`)).bookings || [];
    } catch (err) {
      list.innerHTML = `<div class="shop-empty"><b>${esc(t('md.loadFail'))}</b>${esc(err.message)}</div>`;
      return;
    }
    if (!bookings.length) {
      list.innerHTML = `<div class="shop-empty"><b>${esc(t('md.noBookings.title'))}</b>${esc(t('md.noBookings.sub'))}</div>`;
      return;
    }
    list.innerHTML = bookings.map(b => this.bookingCard(b)).join('');
    list.querySelectorAll('[data-play]').forEach(btn => btn.addEventListener('click',
      () => this.playVideoProof(btn.getAttribute('data-title'), btn.getAttribute('data-play'))));
    list.querySelectorAll('[data-cancel]').forEach(btn => btn.addEventListener('click', () => this.cancelBooking(btn.getAttribute('data-cancel'))));
    list.querySelectorAll('[data-cert]').forEach(btn => btn.addEventListener('click', async () => {
      try { await downloadFile(`/api/v1/mandir/chadawa/${encodeURIComponent(btn.getAttribute('data-cert'))}/certificate?lang=${this.lang}`, `${btn.getAttribute('data-num')}-certificate.pdf`); }
      catch (err) { toast(err.message, 'error'); }
    }));
  }

  static bookingCard(b) {
    const cancelled = b.status === 'CANCELLED';
    const reached = STEPS.indexOf(b.status);
    const steps = cancelled
      ? `<span class="shop-pill shop-pill--off">${esc(t('md.cancelledRefunded'))}</span>`
      : `<div class="shop-steps">${STEPS.map((s, i) => `<span class="shop-pill ${i <= reached ? 'shop-pill--ok' : ''}">${i <= reached ? '✓ ' : ''}${esc(t('step.' + s))}</span>`).join('')}</div>`;
    return `
    <div class="shop-record">
      <div class="shop-record__top"><span class="shop-record__id">${esc(b.booking_number)}</span><span class="shop-pill">${esc(t('md.paidAmount', { amount: money(b.amount_paid) }))}</span></div>
      <div class="shop-record__meta">
        <strong>${esc(b.temple_name)}</strong><br>${esc(b.offering_title)}<br>
        ${esc(t('md.yajman'))}: <strong>${esc(b.devotee_name)}</strong> (${esc(t('md.gotra'))}: ${esc(b.gotra || '-')})
        ${b.family_members ? `<br>${esc(t('md.alsoIncluded'))}: ${esc(b.family_members)}` : ''}
        ${b.scheduled_for ? `<br>${esc(t('md.scheduled'))}: ${esc(b.scheduled_for)}` : ''}
        ${b.prasad_tracking_id ? `<br>${esc(t('md.prasadTrack'))}: <strong>${esc(b.prasad_tracking_id)}</strong>` : ''}
        ${b.priest ? `<br>${esc(t('md.priest'))}: <strong>${esc(b.priest.name)}</strong>${b.priest.verified ? ' ✓' : ''}` : ''}
        ${b.package_ref ? `<br><span class="shop-pill shop-pill--warn">${esc(t('pk.part'))}</span>` : ''}
        ${b.discount_amount ? `<br>${esc(t('or.saved', { amount: money(b.discount_amount) }))}` : ''}
      </div>
      ${steps}
      <div class="shop-record__actions">
        ${b.video_proof_url ? `<button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-play="${esc(b.video_proof_url)}" data-title="${esc(b.temple_name)}">📹 ${esc(t('md.watch'))}</button>`
          : (cancelled ? '' : `<span class="shop-hint" style="margin:0">${esc(t('md.videoLater'))}</span>`)}
        ${b.certificate_available ? `<button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-cert="${esc(b.id)}" data-num="${esc(b.booking_number)}">📜 ${esc(t('md.certificate'))}</button>` : ''}
        ${b.status === 'PAID' ? `<button type="button" class="shop-btn shop-btn--danger shop-btn--sm" data-cancel="${esc(b.id)}">${esc(t('md.cancel'))}</button>` : ''}
      </div>
    </div>`;
  }

  static async cancelBooking(id) {
    if (!confirm(t('md.cancelConfirm'))) return;
    try {
      await api(`/api/v1/mandir/chadawa/${encodeURIComponent(id)}/cancel?lang=${this.lang}`, { method: 'POST' });
      toast(t('md.cancelled'), 'success');
    } catch (err) { toast(err.message, 'error'); }
    if (window.App && window.App.refreshWalletUI) window.App.refreshWalletUI();
    if (window.NotificationBell) window.NotificationBell.refresh();
    this.openMyBookings();
  }

  static playVideoProof(title, url) {
    if (!url) return;
    const player = this.$('video-proof-player');
    this.$('video-proof-title').textContent = title || t('md.video.title');
    const full = mediaUrl(url);
    player.src = full;
    const abs = new URL(full, location.origin).href;
    this.$('video-proof-share').href = `https://wa.me/?text=${encodeURIComponent(t('md.share.text') + ' ' + abs)}`;
    openModal(this.$('video-proof-modal'));
    player.play().catch(() => {});
  }
}

if (typeof window !== 'undefined') window.MandirSevaPageComponent = MandirSevaPageComponent;
export default MandirSevaPageComponent;
