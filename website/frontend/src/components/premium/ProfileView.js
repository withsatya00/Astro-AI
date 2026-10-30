// Premium astrologer profile: hero banner, sticky section nav, trust-first layout, sticky booking card with
// next free slots, saved/share actions, similar-astrologer carousel and a mobile booking bar.
// app.js (App.populateProfileHtml) supplies the astrologer record; booking and chat still run through the existing modals.
import { api, esc, money, isSignedIn, toast } from '../../utils/shop.js';
import { x, fmt } from '../../utils/experience.js';
import { px, pxLang } from '../../utils/premium-copy.js';
import { TrustSignals } from './TrustSignals.js';

// The five fixed appointment slots offered by the booking modal (IST), 30 minutes each.
const SLOTS = ['10:00 AM - 10:30 AM', '11:30 AM - 12:00 PM', '02:30 PM - 03:00 PM', '04:30 PM - 05:00 PM', '06:30 PM - 07:00 PM'];
const IST_MS = 5.5 * 3600 * 1000;

const compact = (n) => (n >= 1000 ? (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'k' : String(n));
const slotStart = (date, label) => {
  const m = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  const hour = Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0);
  return new Date(`${date}T${String(hour).padStart(2, '0')}:${m[2]}:00+05:30`).getTime();
};

export const ProfileView = {
  /** Pure markup; `ctx` carries the values the caller already resolved (language, portrait, similar list). */
  html(a, ctx) {
    const { hi, portraitUrl, similar, isHuman } = ctx;
    const name = (hi && a.name_hi) || a.name;
    const title = (hi && a.title_hi) || a.title || '';
    const bio = (hi && a.bio_hi) || a.bio || '';
    const rate = Number(a.price_per_minute) || 0;
    const rating = Number(a.rating) || 0;
    const reviewCount = Number(a.review_count) || 0;
    const consultations = Number(a.consultations_count) || 0;
    const years = Number(a.experience_years) || 0;
    const languages = a.languages || [];
    const specialties = a.specialties || [];
    const status = a.availability === 'online' ? 'online' : a.availability === 'busy' ? 'busy' : 'offline';
    const statusKey = { online: 'statusOnline', busy: 'statusBusy', offline: 'statusOffline' }[status];
    const rateText = rate === 0 ? px('pv.free') : '₹' + rate;
    const id = esc(a.id);

    const why = [
      years > 0 && fmt(x('yearsExp'), { n: years }),
      consultations > 0 && fmt(x('consultsDone'), { n: consultations.toLocaleString(hi ? 'hi-IN' : 'en-IN') }),
      rating > 0 && reviewCount > 0 && fmt(x('ratedBy'), { r: rating.toFixed(1), n: reviewCount }),
      languages.length > 0 && fmt(x('speaks'), { list: languages.join(', ') }),
      specialties.length > 0 && fmt(x('focusAreas'), { list: specialties.slice(0, 4).join(', ') }),
    ].filter(Boolean);

    const stats = [
      rating > 0 && reviewCount > 0 && `<div class="pv-stat"><strong>${rating.toFixed(1)}<i>★</i></strong><small>${esc(px('pv.stat.rating'))} · ${esc(compact(reviewCount))}</small></div>`,
      years > 0 && `<div class="pv-stat"><strong data-count="${years}">${years}</strong><small>${esc(px('pv.stat.exp'))}</small></div>`,
      consultations > 0 && `<div class="pv-stat"><strong data-count="${consultations}">${esc(compact(consultations))}</strong><small>${esc(px('pv.stat.consults'))}</small></div>`,
    ].filter(Boolean).join('');

    const pills = [...specialties.slice(0, 3), ...languages.slice(0, 2)].map(s => `<span class="pv-pill">${esc(s)}</span>`).join('');

    const reviews = (a.reviews || []).map(r => `<div class="exp-review"><div><strong>${esc(r.user_name || '')}${r.is_verified ? ' <span class="pf-chip pf-chip--ok" style="padding:1px 8px;font-size:.66rem">✓</span>' : ''}</strong><span aria-label="${esc(r.rating)}/5">⭐ ${esc(r.rating)}/5</span></div><p>${esc(r.comment || '')}</p></div>`).join('');

    const similarCards = similar.map(s => {
      const portrait = window.AstrologerCardComponent?.getPortraitUrl ? window.AstrologerCardComponent.getPortraitUrl(s) : (s.avatar || '/assets/portraits/default-avatar.svg');
      const r = Number(s.price_per_minute) || 0;
      return `<a class="pv-sim" href="/astrologers/${esc(s.slug || s.id)}" data-nav-link><img src="${esc(portrait)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/assets/portraits/default-avatar.svg'">
        <strong>${esc((hi && s.name_hi) || s.name)}</strong><small>${esc((hi && s.title_hi) || s.title || '')}</small>
        <span class="pv-sim-meta">${Number(s.rating) > 0 ? `<b>★ ${Number(s.rating).toFixed(1)}</b>` : ''}<em>${r ? '₹' + r + px('pv.perMin') : esc(px('pv.free'))}</em></span></a>`;
    }).join('');

    const book = `<aside class="pv-book" id="pv-book" data-pv-book>
        <div class="exp-rate"><small>${esc(x('ratePerMin'))}</small><div><strong>${esc(rateText)}</strong>${rate === 0 ? '' : `<span>${esc(x('perMin'))}</span>`}</div></div>
        ${status !== 'online' ? `<p class="exp-note" role="status">${esc(x(status === 'busy' ? 'busyNote' : 'offlineNote'))}</p>` : ''}
        <div data-pv-member></div>
        ${isHuman ? `<div class="pv-slots" data-pv-slots><small>${esc(px('pv.avail'))}</small><div class="pv-slot-row" aria-live="polite"><span class="pv-slot-skel"></span><span class="pv-slot-skel"></span><span class="pv-slot-skel"></span></div></div>` : ''}
        ${rate > 0 ? `<div class="exp-estimate" id="profile-wallet-estimate" data-rate="${rate}" aria-live="polite"></div>` : ''}
        <button type="button" class="btn-profile-chat-primary" onclick="ChatController.startConsultationWith('${id}')"><span aria-hidden="true">✨</span> <span>${esc(x('chatNow'))}</span></button>
        ${isHuman ? `<button type="button" class="btn-hero-secondary exp-book-btn" onclick="App.openAppointmentsModal('${id}')"><span aria-hidden="true">🗓️</span> <span>${esc(x('bookAppt'))}</span></button><p class="exp-muted exp-rule">${esc(x('cancelRule'))}</p>` : ''}
        <button type="button" class="btn-hero-secondary exp-book-btn" onclick="App.openBirthModal()"><span aria-hidden="true">🪐</span> <span>${esc(x('attachKundli'))}</span></button>
      </aside>`;

    return `
      <section class="pv-hero" aria-label="${esc(name)}">
        <div class="pv-hero-inner">
          <div class="pv-portrait"><img src="${esc(portraitUrl)}" alt="${esc(name)}" onerror="this.onerror=null;this.src='/assets/portraits/default-avatar.svg'"><span class="pv-dot pv-dot--${status}" title="${esc(x(statusKey))}"></span></div>
          <div class="pv-hero-copy">
            <span class="pv-eyebrow"><span class="exp-status exp-status--${status}">${esc(x(statusKey))}</span> · ${esc(x(isHuman ? 'typeHuman' : 'typeAi'))}</span>
            <h1>${esc(name)} ${a.is_verified ? `<span class="card-verified-badge" title="${esc(x('verifiedBadge'))}" aria-label="${esc(x('verifiedBadge'))}">✓</span>` : ''}</h1>
            <p class="pv-title">${esc(title)}</p>
            ${pills ? `<div class="pv-pills">${pills}</div>` : ''}
            <div class="pv-actions">
              <button type="button" class="shop-btn shop-btn--gold" onclick="ChatController.startConsultationWith('${id}')">✨ ${esc(x('chatNow'))}</button>
              ${isHuman ? `<button type="button" class="shop-btn pv-ghost" onclick="App.openAppointmentsModal('${id}')">🗓️ ${esc(x('bookAppt'))}</button>` : ''}
              <button type="button" class="shop-btn pv-ghost" data-pv-fav="${id}" aria-pressed="false"><span data-pv-fav-icon>♡</span> <span data-pv-fav-label>${esc(px('pv.save'))}</span></button>
              <button type="button" class="shop-btn pv-ghost" data-pv-share>↗ ${esc(px('pv.share'))}</button>
            </div>
          </div>
        </div>
        ${stats ? `<div class="pv-stats">${stats}</div>` : ''}
      </section>

      <nav class="pv-nav" aria-label="${esc(name)}" data-pv-nav>
        <div class="pv-nav-id" data-pv-navid><img src="${esc(portraitUrl)}" alt=""><b>${esc(name)}</b><span>${esc(rateText)}${rate === 0 ? '' : esc(px('pv.perMin'))}</span>
          <button type="button" class="shop-btn shop-btn--gold shop-btn--sm" onclick="ChatController.startConsultationWith('${id}')">${esc(x('chatNow'))}</button></div>
        ${['about', 'trust', 'reviews', 'book'].map((k, i) => `<a href="#pv-${k}" data-pv-link="${k}" class="${i === 0 ? 'is-active' : ''}">${esc(px('pv.nav.' + k))}</a>`).join('')}
      </nav>

      <div class="profile-content-layout pv-layout">
        <div class="profile-main-col pv-main">
          <div class="consultation-disclosure-banner ${isHuman ? 'human-disclosure' : 'ai-disclosure'}"><span aria-hidden="true">${isHuman ? '✓' : 'ℹ️'}</span> <div>${esc(x(isHuman ? 'humanNote' : 'aiNote'))}</div></div>

          <div class="profile-section-card pv-anchor" id="pv-trust" data-trust-panel><div class="pf-skeleton" style="height:120px" aria-hidden="true"></div></div>

          <div class="profile-section-card pv-anchor" id="pv-about">
            <h3 class="profile-card-heading"><span aria-hidden="true">✨</span> <span>${esc(x('whyConsult'))}</span></h3>
            ${why.length ? `<ul class="exp-why">${why.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : `<p class="exp-muted">${esc(x('whyNone'))}</p>`}
            ${bio ? `<h3 class="profile-card-heading" style="margin-top:22px"><span aria-hidden="true">📜</span> <span>${esc(x('aboutExpert'))}</span></h3><p class="profile-bio-text">${esc(bio)}</p>` : ''}
          </div>

          <div class="profile-section-card">
            <h3 class="profile-card-heading"><span aria-hidden="true">🔮</span> <span>${esc(x('credentials'))}</span></h3>
            <dl class="exp-facts">
              ${a.is_verified ? `<div><dt>✓</dt><dd>${esc(x('verifiedBadge'))}</dd></div>` : ''}
              ${specialties.length ? `<div><dt>${esc(x('specialisations'))}</dt><dd>${specialties.map(item => `<span class="specialty-pill">${esc(item)}</span>`).join('')}</dd></div>` : ''}
              ${languages.length ? `<div><dt>${esc(x('languagesLabel'))}</dt><dd>${languages.map(item => `<span class="specialty-pill">${esc(item)}</span>`).join('')}</dd></div>` : ''}
              ${isHuman ? `<div><dt>${esc(x('apptModes'))}</dt><dd>${['modechat', 'modecall', 'modevideo'].map(k => `<span class="specialty-pill">${esc(x(k))}</span>`).join('')}</dd></div>` : ''}
            </dl>
          </div>


          ${isHuman && rate > 0 ? `<div class="profile-section-card" id="pv-packages">
            <h3 class="profile-card-heading"><span aria-hidden="true">🎁</span> <span>${esc(px('pv.pkg.title'))}</span></h3>
            <p class="exp-muted" style="margin-top:-6px">${esc(px('pv.pkg.sub'))}</p>
            <div class="pv-pkgs">${[[15, 'quick'], [30, 'standard'], [60, 'deep']].map(([min, key]) => `<div class="pv-pkg ${min === 30 ? 'is-rec' : ''}">
              ${min === 30 ? `<span class="pv-pkg-tag">${esc(px('pv.pkg.recommended'))}</span>` : ''}<small>${esc(px('pv.pkg.min', { n: min }))}</small><strong>${esc(money(rate * min))}</strong>
              <b>${esc(px('pv.pkg.' + key))}</b><p>${esc(px('pv.pkg.' + key + 'Desc'))}</p>
              <button type="button" class="shop-btn ${min === 30 ? 'shop-btn--gold' : 'shop-btn--line'} shop-btn--sm" data-pkg="${min}">${esc(px('pv.pkg.book', { n: min }))}</button></div>`).join('')}</div>
          </div>` : ''}

          <div class="profile-section-card pv-anchor" id="pv-reviews">
            <h3 class="profile-card-heading"><span aria-hidden="true">💬</span> <span>${esc(x('clientReviews'))}</span></h3>
            <div data-review-summary></div>
            ${reviews ? `<div class="exp-reviews">${reviews}</div>` : `<p class="exp-muted">${esc(x('noReviews'))}</p>`}
            <p class="exp-muted">${esc(x('reviewRule'))}</p>
            <form class="exp-review-form" data-review-form="${id}">
              <label>${esc(x('yourRating'))}<select name="rating">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${n} ★</option>`).join('')}</select></label>
              <label>${esc(x('yourReview'))}<textarea name="comment" rows="3" minlength="3" maxlength="1000" required></textarea></label>
              <button type="submit" class="shop-btn shop-btn--line">${esc(x('postReview'))}</button>
            </form>
          </div>
        </div>
        ${book}
      </div>

      ${similarCards ? `<section class="pv-similar"><h3>${esc(px('pv.similar'))}</h3><div class="pv-carousel">${similarCards}</div></section>` : ''}

      <div class="pv-mobilebar" data-pv-mobilebar>
        <div><small>${esc(x('ratePerMin'))}</small><strong>${esc(rateText)}${rate === 0 ? '' : `<span>${esc(px('pv.perMin'))}</span>`}</strong></div>
        <button type="button" class="shop-btn shop-btn--gold" onclick="ChatController.startConsultationWith('${id}')">✨ ${esc(x('chatNow'))}</button>
        ${isHuman ? `<button type="button" class="shop-btn pv-ghost-dark" onclick="App.openAppointmentsModal('${id}')">🗓️</button>` : ''}
      </div>`;
  },

  /** Wires everything that needs the rendered DOM. Safe to call again after a re-render. */
  bind(root, a, ctx) {
    // A page-transition transform on the view would turn "fixed" into "relative to the view", so the bar lives on <body>.
    document.querySelectorAll('body > .pv-mobilebar').forEach(el => el.remove());
    const bar = root.querySelector('[data-pv-mobilebar]');
    if (bar) document.body.appendChild(bar);
    this.countUp(root);
    this.nav(root);
    this.share(root, a);
    this.favourite(root, a);
    this.trust(root, a);
    if (ctx.isHuman) { this.slots(root, a); this.packages(root, a); }
    this.stickyIdentity(root);
    this.member(root, a);
  },

  countUp(root) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('[data-count]').forEach(el => {
      const end = Number(el.dataset.count), big = end >= 1000, t0 = performance.now(), dur = 900;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        el.textContent = big ? compact(v) : String(v);
        if (p < 1 && el.isConnected) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  },

  nav(root) {
    const links = [...root.querySelectorAll('[data-pv-link]')];
    const target = (k) => root.querySelector('#pv-' + k);
    links.forEach(l => l.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const el = target(l.dataset.pvLink);
      if (el) el.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }));
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', '#pv-' + l.dataset.pvLink === '#' + en.target.id)); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    // On wide screens the booking card is always beside the content, so only the stacked layout tracks it.
    const sections = window.matchMedia('(max-width: 980px)').matches ? ['about', 'trust', 'reviews', 'book'] : ['about', 'trust', 'reviews'];
    sections.forEach(k => { const el = target(k); if (el) io.observe(el); });
  },

  share(root, a) {
    root.querySelector('[data-pv-share]')?.addEventListener('click', async () => {
      const url = `${location.origin}/astrologers/${a.slug || a.id}`;
      try {
        if (navigator.share) { await navigator.share({ title: a.name, url }); return; }
        await navigator.clipboard.writeText(url);
        toast(px('pv.linkCopied'), 'success');
      } catch (e) { /* share sheet dismissed */ }
    });
  },

  async favourite(root, a) {
    const btn = root.querySelector('[data-pv-fav]');
    if (!btn) return;
    const paint = (on) => {
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('is-on', on);
      btn.querySelector('[data-pv-fav-icon]').textContent = on ? '♥' : '♡';
      btn.querySelector('[data-pv-fav-label]').textContent = px(on ? 'pv.saved' : 'pv.save');
    };
    let on = false;
    if (isSignedIn()) { try { on = (await api('/api/v1/experience/favourites')).ids.includes(a.id); } catch (e) { /* leave unsaved */ } }
    paint(on);
    btn.addEventListener('click', async () => {
      if (!isSignedIn()) { toast(px('pv.saveLogin'), 'info'); window.App?.openAuthModal?.('login'); return; }
      btn.disabled = true;
      try {
        await api(`/api/v1/experience/favourites/${encodeURIComponent(a.id)}`, { method: on ? 'DELETE' : 'PUT' });
        on = !on; paint(on);
      } catch (err) { toast(err.message, 'error'); } finally { btn.disabled = false; }
    });
  },

  async trust(root, a) {
    const panel = root.querySelector('[data-trust-panel]');
    try {
      const t = await TrustSignals.load(a);
      if (!panel?.isConnected) return;
      panel.innerHTML = TrustSignals.panel(t);
      const sum = root.querySelector('[data-review-summary]');
      if (sum) sum.innerHTML = TrustSignals.summary(t, a.rating, t.review_count);
    } catch (e) { panel?.remove(); }
  },

  /** Seven days of free appointment times, from the five fixed slots minus the astrologer's real booked windows. */
  async availability(id) {
    const cache = this._avail || (this._avail = {});
    if (cache[id] && Date.now() - cache[id].at < 60000) return cache[id].days;
    let busy = [];
    try { busy = (await window.API.getBusySlots(id)).map(b => [new Date(b.start).getTime(), new Date(b.end).getTime()]); } catch (e) { /* treat as all free */ }
    const now = Date.now(), days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now + IST_MS + d * 864e5).toISOString().slice(0, 10);
      const slots = SLOTS.map(label => ({ label, start: slotStart(date, label) }))
        .filter(({ start }) => start > now + 30 * 60000 && !busy.some(([bs, be]) => start < be && bs < start + 30 * 60000));
      days.push({ date, offset: d, slots });
    }
    cache[id] = { at: Date.now(), days };
    return days;
  },

  dayName(day, short) {
    if (day.offset === 0) return px('pv.today');
    if (day.offset === 1) return px('pv.tomorrow');
    return new Date(day.date + 'T00:00:00').toLocaleDateString(pxLang() === 'hi' ? 'hi-IN' : 'en-IN', short ? { weekday: 'short', day: 'numeric' } : { weekday: 'short', day: 'numeric', month: 'short' });
  },

  /** "Today · 4:30 PM" for the first free time, or '' when the week is full. Used by the directory cards. */
  async nextSlotLabel(id) {
    const day = (await this.availability(id)).find(d => d.slots.length);
    return day ? `${this.dayName(day)} · ${day.slots[0].label.split(' - ')[0].replace(/^0/, '')}` : '';
  },

  /** Opens the booking modal with the chosen date (and optionally time and length) already filled in. */
  async openBooking(id, { date, label, minutes } = {}) {
    await window.App.openAppointmentsModal(id);
    const dateEl = document.getElementById('booking-date-input'), slotEl = document.getElementById('booking-slot-select'), durEl = document.getElementById('booking-duration-select');
    if (minutes && durEl) durEl.value = String(minutes);
    if (date && dateEl) { dateEl.value = date; window.App.refreshBookingSlots?.(); }
    if (label && slotEl) slotEl.value = label;
    window.App.updateBookingFeePreview?.();
  },

  /** Week strip: pick a day, then a time. Tapping a time opens the booking modal with both filled in. */
  async slots(root, a) {
    const box = root.querySelector('[data-pv-slots]');
    if (!box) return;
    const days = await this.availability(a.id);
    if (!box.isConnected) return;
    let sel = Math.max(0, days.findIndex(d => d.slots.length));
    const paint = () => {
      const day = days[sel];
      box.innerHTML = `<small>${esc(px('pv.avail'))}</small>
        <div class="pv-days" role="tablist">${days.map((d, i) => `<button type="button" role="tab" aria-selected="${i === sel}" class="pv-day ${i === sel ? 'is-active' : ''}" data-day="${i}" ${d.slots.length ? '' : 'disabled'}><b>${esc(this.dayName(d, true))}</b><span>${esc(d.slots.length ? px('pv.slotsCount', { n: d.slots.length }) : px('pv.dayFull'))}</span></button>`).join('')}</div>
        ${days.some(d => d.slots.length) ? `<div class="pv-slot-row">${day.slots.map((f, i) => `<button type="button" class="pv-slot" data-slot="${i}">${esc(f.label.split(' - ')[0].replace(/^0/, ''))}</button>`).join('')}</div>` : `<p class="exp-muted" style="margin:6px 0 0">${esc(px('pv.noSlots'))}</p>`}`;
      box.querySelectorAll('[data-day]').forEach(btn => btn.addEventListener('click', () => { sel = Number(btn.dataset.day); paint(); }));
      box.querySelectorAll('[data-slot]').forEach(btn => btn.addEventListener('click', () => {
        const f = day.slots[Number(btn.dataset.slot)];
        this.openBooking(a.id, { date: day.date, label: f.label });
      }));
    };
    paint();
  },

  /** Package cards: a length from the astrologer's own rate. They open the booking modal with that length selected. */
  packages(root, a) {
    root.querySelectorAll('[data-pkg]').forEach(btn => btn.addEventListener('click', () => this.openBooking(a.id, { minutes: Number(btn.dataset.pkg) })));
  },

  /** Name, price and a chat shortcut appear in the section nav once the hero has scrolled out of view (wide screens). */
  stickyIdentity(root) {
    const hero = root.querySelector('.pv-hero'), id = root.querySelector('[data-pv-navid]');
    if (!hero || !id || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([en]) => id.classList.toggle('is-visible', !en.isIntersecting), { rootMargin: '-60px 0px 0px 0px' }).observe(hero);
  },

  /** Premium members see their discounted 15-minute price; everyone else sees a gentle pointer to Premium. */
  async member(root, a) {
    const box = root.querySelector('[data-pv-member]');
    const rate = Number(a.price_per_minute) || 0;
    if (!box || !rate || a.is_ai) return;
    if (!isSignedIn()) return;
    try {
      const r = await api('/api/v1/rewards/summary');
      if (!box.isConnected) return;
      const pct = Math.round(r.rules.member_consult_discount * 100);
      box.innerHTML = r.membership
        ? `<p class="pv-member pv-member--on">👑 ${esc(px('pv.memberPrice', { price: money(rate * 15 * (1 - r.rules.member_consult_discount)), save: money(rate * 15 * r.rules.member_consult_discount) }))}</p>`
        : `<p class="pv-member">👑 ${esc(px('pv.memberPitch', { n: pct }))} <a href="/rewards" data-nav-link>${esc(px('pv.joinPremium'))}</a></p>`;
    } catch (e) { /* the card works without it */ }
  }
};
