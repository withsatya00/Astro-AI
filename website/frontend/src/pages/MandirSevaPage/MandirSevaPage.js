import { loadTemplate } from '../../utils/templateLoader.js';
import { esc, money, toast, api, postJson, openModal, closeModal, wireDismiss, showCredits, hoistOverlays, mediaUrl, t, applyI18n, goTo, requireLogin, downloadFile, isSignedIn } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { bookingTimeline, skeleton } from '../../utils/experience.js';
import { ChadhavaExperience } from '../../components/ChadhavaExperience.js';

const CATEGORY_SLUGS = {
  shiva: ['mahakaleshwar-ujjain', 'kashi-vishwanath-varanasi', 'somnath-jyotirlinga-gujarat', 'kedarnath-dham-uttarakhand', 'trimbakeshwar-nashik',
    'baidyanath-deoghar', 'mallikarjuna-srisailam', 'omkareshwar-madhya-pradesh', 'bhimashankar-maharashtra', 'ramanathaswamy-rameswaram', 'brihadeeswara-thanjavur'],
  shakti: ['vaishno-devi-katra', 'kamakhya-devi-assam', 'meenakshi-amman-madurai', 'mahalakshmi-kolhapur', 'kalighat-kali-kolkata', 'mansa-devi-haridwar'],
  shani: ['shani-shingnapur', 'sankat-mochan-hanuman-varanasi'],
  ganesh: ['siddhivinayak-mumbai'],
  ram_krishna: ['ram-janmabhoomi-ayodhya', 'tirupati-balaji-andhra', 'jagannath-temple-puri', 'badrinath-dham-uttarakhand', 'dwarkadhish-dwarka',
    'banke-bihari-vrindavan', 'krishna-janmabhoomi-mathura', 'khatu-shyam-rajasthan', 'padmanabhaswamy-thiruvananthapuram']
};

// Short [English, Hindi] label shown on each temple card, by category.
const CATEGORY_LABEL = {
  shiva: ['Jyotirlinga / Shiva', 'ज्योतिर्लिंग / शिव'], shakti: ['Shakti Peeth', 'शक्तिपीठ'], shani: ['Shani / Hanuman', 'शनि / हनुमान'],
  ganesh: ['Ganesh', 'गणेश'], ram_krishna: ['Ram / Krishna / Vishnu', 'राम / कृष्ण / विष्णु']
};

// What a devotee can offer on each weekday: [emoji, English, Hindi] items for that day's deity.
const WEEKDAY_OFFER = {
  Monday: { icon: '🔱', items: [['💧', 'Jal & raw milk', 'जल व कच्चा दूध'], ['🍃', 'Belpatra', 'बेलपत्र'], ['🌼', 'Dhatura & white flowers', 'धतूरा व सफेद पुष्प'], ['🕉️', 'Bhasma', 'भस्म']] },
  Tuesday: { icon: '🚩', items: [['🔴', 'Sindoor & chola', 'सिंदूर व चोला'], ['🟠', 'Boondi laddu', 'बूंदी के लड्डू'], ['🌺', 'Red flowers', 'लाल पुष्प'], ['🍯', 'Gud & chana', 'गुड़ व चना']] },
  Wednesday: { icon: '🐘', items: [['🌿', 'Durva grass (21)', 'दूर्वा (21)'], ['🟡', 'Modak & laddu', 'मोदक व लड्डू'], ['🫛', 'Green moong', 'हरी मूंग'], ['🌺', 'Red hibiscus', 'लाल गुड़हल']] },
  Thursday: { icon: '🪷', items: [['🌼', 'Yellow flowers', 'पीले पुष्प'], ['🟡', 'Chana dal & haldi', 'चना दाल व हल्दी'], ['🍌', 'Banana', 'केला'], ['🌿', 'Tulsi dal', 'तुलसी दल']] },
  Friday: { icon: '🪔', items: [['🍚', 'Kheer & mishri', 'खीर व मिश्री'], ['🌸', 'White flowers', 'सफेद पुष्प'], ['🧣', 'Red chunari', 'लाल चुनरी'], ['🔴', 'Kumkum', 'कुमकुम']] },
  Saturday: { icon: '🪐', items: [['🛢️', 'Mustard oil', 'सरसों का तेल'], ['⚫', 'Black sesame (til)', 'काले तिल'], ['🪔', 'Sesame oil lamp', 'तिल के तेल का दीप'], ['🖤', 'Black cloth', 'काला वस्त्र']] },
  Sunday: { icon: '🏹', items: [['💧', 'Jal to Surya (arghya)', 'सूर्य को अर्घ्य जल'], ['🌺', 'Red flowers', 'लाल पुष्प'], ['🌾', 'Wheat & gud', 'गेहूं व गुड़'], ['🌿', 'Tulsi dal', 'तुलसी दल']] }
};

const WEEKDAY_HI = { Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार', Sunday: 'रविवार' };
const WEEKDAY_EN = Object.keys(WEEKDAY_HI);


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
    // DashboardPage imports this module by a different URL, which creates a second, never-mounted copy of the class;
    // the router and other pages must talk to the copy that actually owns the page.
    window.MandirSevaPageComponent = this;
    this.overlay = hoistOverlays(target, 'mandir');
    this.initEvents();
    this.applyLanguage();
    await this.loadTemples();
    this.loadExtras();
    this.applyMode();
    ChadhavaExperience.mount(target.querySelector('[data-puja-hub]'), 'puja').then(() => {this.renderHome();this.applyMode();});
    return target;
  }

  static $(id) { return document.getElementById(id); }
  static get lang() { return currentLang(); }

  static applyLanguage() {
    applyI18n(this.root);
    applyI18n(this.overlay);
    this.renderHome();
    this.renderHeads();
  }

  // ---------------- Chadhava / Puja entry ----------------
  // /mandir-seva = choose Chadhava or Puja, /mandir-seva/chadhava = all temples, /mandir-seva/puja = puja listing.
  static modeFromPath() {
    const path = location.pathname.replace(/\/+$/, '');
    return path === '/mandir-seva/chadhava' ? 'chadhava' : path === '/mandir-seva/puja' ? 'puja' : 'home';
  }

  static setMode(mode) { this.mode = mode; this.applyMode(); }

  static applyMode() {
    if (!this.root) return;
    const mode = this.mode || this.modeFromPath();
    this.mode = mode;
    this.root.querySelectorAll('[data-mode]').forEach(el => { el.hidden = el.dataset.mode !== mode; });
    if(ChadhavaExperience.events&&['puja','chadhava'].includes(mode)){
      const hub=this.root.querySelector(mode==='puja'?'[data-puja-hub]':'[data-chadhava-hub]');
      ChadhavaExperience.root=hub;ChadhavaExperience.fixedKind=mode;ChadhavaExperience.tab=mode;
      if(mode==='chadhava'&&!hub.dataset.wired){hub.dataset.wired='true';hub.addEventListener('click',event=>ChadhavaExperience.click(event));}
      ChadhavaExperience.hub(ChadhavaExperience.access||{});
    }
    this.renderHeads();
    this.renderHome();
    window.scrollTo({ top: 0 });
  }

  static renderHome() {
    const box = this.$('mandir-choose');
    if (!box) return;
    const hi = this.lang === 'hi';
    const pujas = (ChadhavaExperience.events || []).filter(e => e.kind === 'puja').length;
    const temples = this.templesData.length;
    const card = (go, img, tag, title, sub, meta, cta) => `<a class="mandir-choice" href="${go}" data-go="${go}" style="--bg:url('${img}')"><span class="mandir-choice__tag">${esc(tag)}</span><span class="mandir-choice__body"><h2>${esc(title)}</h2><p>${esc(sub)}</p><span class="mandir-choice__foot"><small>${esc(meta)}</small><span class="mandir-choice__cta">${esc(cta)} <i aria-hidden="true">→</i></span></span></span></a>`;
    box.innerHTML = `<p class="mandir-eyebrow">${esc(hi ? 'अपनी सेवा चुनें' : 'Choose your seva')}</p><h2 class="mandir-choose__title">${esc(hi ? 'आप क्या करना चाहते हैं?' : 'What would you like to do?')}</h2><div class="mandir-choose__grid">`
      + card('/mandir-seva/puja', '/assets/img/temples/mahakaleshwar-ujjain.jpg', hi ? 'संकल्प सहित' : 'With sankalp', hi ? 'पूजा' : 'Puja', hi ? 'मंदिर के पुजारियों से अपने और परिवार के नाम व गोत्र से पूजा कराएं, और पूजा का वीडियो पाएं।' : 'Have a puja performed by temple priests in your and your family’s name and gotra, and receive its video.',
        pujas ? (hi ? `${pujas} आगामी पूजा` : `${pujas} upcoming pujas`) : '', hi ? 'पूजा देखें' : 'View pujas')
      + card('/mandir-seva/chadhava', '/assets/img/mandir-banner.webp', hi ? 'अपनी श्रद्धा से' : 'An offering from the heart', hi ? 'चढ़ावा' : 'Chadhava', hi ? 'फूल, दीपक या भोग अपने नाम से अर्पित करें। उपलब्ध कार्यक्रम और कीमत देखकर अपनी सेवा चुनें।' : 'Offer flowers, a diya or bhog in your name. Explore confirmed temple events and choose an offering at its listed price.',
        temples ? (hi ? `${temples} मंदिर` : `${temples} temples`) : '', hi ? 'मंदिर चुनें' : 'Choose a temple')
      + '</div>';
  }

  static renderHeads() {
    const hi = this.lang === 'hi';
    // Same photographic banner as the Astrologers, Gau Sewa and Astro Mall pages (service-banners.css).
    const tr = [['📹', 'Video proof', 'वीडियो प्रमाण', 'Video of your sankalp, with name & gotra', 'नाम और गोत्र के साथ संकल्प का वीडियो'], ['🪔', 'Temple priests', 'मंदिर के पुजारी', 'Performed by temple priests', 'मंदिर के पुरोहितों द्वारा संकल्प'], ['📦', 'Booking updates', 'बुकिंग अपडेट', 'Payment, seva and video tracking', 'भुगतान, सेवा और वीडियो ट्रैकिंग']];
    const trust = `<div class="shop-trust service-benefits">${tr.map(r => `<div><span>${r[0]}</span><p><b>${esc(hi ? r[2] : r[1])}</b><small>${esc(hi ? r[4] : r[3])}</small></p></div>`).join('')}</div>`;
    const banner = (id, img, eyebrow, title, sub, actions) => {
      const el = this.$(id);
      if (el) el.innerHTML = `<div class="service-banner service-banner--mandir"><figure class="service-banner__art"><img src="${img}" alt="" fetchpriority="high"><figcaption>${esc(hi ? 'प्रतीकात्मक चित्र' : 'Illustrative image')}</figcaption></figure><div class="mandir-hero__copy service-banner__copy"><p class="mandir-hero__eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(sub)}</p>${actions || ''}</div>${trust}</div>`;
    };
    banner('mandir-chadhava-head', '/assets/img/mandir-banner.webp', hi ? 'चढ़ावा सेवा' : 'Chadhava seva', hi ? 'चढ़ावा: मंदिर चुनें' : 'Chadhava offerings & temple sevas',
      hi ? 'देश के प्रसिद्ध मंदिर। मंदिर चुनें, अपनी श्रद्धा से चढ़ावा चुनें और अपने नाम से अर्पित करें।' : 'Famous temples across India. Pick a temple, choose what to offer and it is placed there in your name.',
      `<div class="shop-hero__actions"><a class="shop-btn shop-btn--gold ch-green" href="#temples-head" data-scroll="#temples-head">${esc(hi ? 'अभी देखें' : 'View now')}</a><a class="shop-btn shop-btn--ghost" href="#" data-scroll=".ch-how">${esc(hi ? 'यह कैसे काम करता है?' : 'How it works?')}</a></div>`);
    banner('mandir-puja-head', '/assets/img/temples/kashi-vishwanath-varanasi.jpg', hi ? 'पूजा सेवा' : 'Puja seva', hi ? 'पूजा बुक करें' : 'Book a puja',
      hi ? 'मंदिर की आगामी पूजा चुनें, पैकेज लें और अपने परिवार के नाम से संकल्प कराएं।' : 'Pick an upcoming temple puja, choose a package and have the sankalp made in your family’s names.',
      `<div class="shop-hero__actions"><a class="shop-btn shop-btn--gold ch-green" href="#puja-list" data-scroll=".ch-puja-catalogue">${esc(hi ? 'अभी देखें' : 'View pujas')}</a></div>`);
    const thead = this.$('temples-head');
    if (thead) thead.innerHTML = `<h2>${esc(hi ? 'श्रद्धा से चढ़ावा अर्पित करें' : 'Upcoming Chadhava Offerings')}</h2><p>${esc(hi ? 'देशभर के प्रसिद्ध मंदिरों में अपने नाम और गोत्र से चढ़ावा अर्पित करें। सेवा का वीडियो आपकी बुकिंग में मिलेगा।' : 'Experience the divine through chadhava at renowned temples across India. Offer in your name and gotra, and receive the seva video in your bookings.')}</p>`;
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
      // The whole card opens the temple page (links and the button handle themselves).
      const card = e.target.closest('[data-card-href]');
      if (card && !more && !e.target.closest('a, button')) goTo(card.getAttribute('data-card-href'));
    });
    this.root.addEventListener('click', (e) => {
      if (e.target.closest('[data-orders]')) { ChadhavaExperience.orders(); return; }
      const scroll = e.target.closest('[data-scroll]');
      if (scroll) { e.preventDefault(); this.root.querySelector(scroll.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const go = e.target.closest('[data-go]');
      if (go && !e.metaKey && !e.ctrlKey) { e.preventDefault(); goTo(go.dataset.go); return; }
      const open = e.target.closest('[data-open-slug]');
      if (open) this.openBookingModal(open.getAttribute('data-open-slug'));
    });

    this.$('btn-view-my-bookings').addEventListener('click', () => ChadhavaExperience.orders());
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
    const request = this.catalogRequest = (this.catalogRequest || 0) + 1;
    loading.style.display = '';
    loading.innerHTML = skeleton(3);
    this.$('temples-grid').style.display = 'none';
    this.$('mandir-empty-state').style.display = 'none';
    try {
      const res = await api(`/api/v1/mandir/temples?lang=${this.lang}`);
      if (request !== this.catalogRequest) return;
      this.templesData = res.temples || [];
      this.renderTemples();
      this.renderHome();
    } catch (err) {
      if (request !== this.catalogRequest) return;
      loading.style.display = '';
      loading.innerHTML = `<p>${esc(err.message)}</p><button type="button" class="shop-btn shop-btn--line shop-btn--sm" id="mandir-retry">${esc(t('retry'))}</button>`;
      this.$('mandir-retry').addEventListener('click', () => { loading.innerHTML = '<div class="shop-spinner"></div>'; this.loadTemples(); });
    }
  }

  static loadExtras() {
    this.$('mandir-today').hidden = true;
    this.$('mandir-suggest').hidden = true;
    // New bookings use confirmed dated events; retain legacy package APIs/history.
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
      const hi = this.lang === 'hi';
      const temple = d.weekday_temple;
      if (!temple) { box.hidden = true; return; }
      const day = WEEKDAY_EN.includes(d.weekday) ? d.weekday : WEEKDAY_EN[(new Date().getDay() + 6) % 7];
      const offer = WEEKDAY_OFFER[day];
      const special = d.special && d.special.temple ? d.special : null;
      box.innerHTML = `
        <div class="mt-today__media"><img src="${esc(temple.image_url)}" alt="${esc(temple.name)}" loading="lazy"></div>
        <div class="mt-today__body">
          <span class="mt-today__badge"><i></i>${esc(t('md.todayBadge'))}</span>
          <h2 class="mt-today__title"><span>${offer.icon}</span> ${esc(hi ? WEEKDAY_HI[day] : day)} <em>${esc(d.weekday_deity)}</em></h2>
          <p class="mt-today__meta">${d.date_iso ? esc(longDate(d.date_iso, this.lang)) : ''}${d.tithi && d.tithi.name ? ` · ${esc(t('md.tithi'))}: <strong>${esc(pickLang(d.tithi.name, this.lang))}</strong>${d.tithi.paksha ? ' (' + esc(pickLang(d.tithi.paksha, this.lang)) + ')' : ''}` : ''}</p>
          <p class="mt-today__lead">${esc(t('md.todayLead'))}: <b>${esc(temple.name)}</b></p>
          <p class="mt-today__label">${esc(t('md.canOffer'))}</p>
          <ul class="mt-today__items">${offer.items.map(i => `<li><span>${i[0]}</span>${esc(hi ? i[2] : i[1])}</li>`).join('')}</ul>
          <div class="mt-today__cta">
            <button type="button" class="shop-btn shop-btn--gold" data-open-slug="${esc(temple.slug)}">🪔 ${esc(t('md.offerNow'))}${temple.starting_price ? ` · ${esc(t('md.startsFrom'))} ${money(temple.starting_price)}` : ''}</button>
            ${special ? `<button type="button" class="mt-today__special" data-open-slug="${esc(special.temple.slug)}"><img src="${esc(special.temple.image_url)}" alt="" loading="lazy"><span>${esc(special.name)}<small>${esc(special.temple.name)}</small></span></button>` : ''}
          </div>
        </div>`;
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
    const badge = this.$('mandir-count-badge');
    if (badge) { badge.textContent = t('md.count', { n: this.templesData.length }); badge.hidden = !this.templesData.length; }
    empty.style.display = list.length ? 'none' : 'block';
    grid.style.display = list.length ? 'grid' : 'none';
    grid.innerHTML = list.map(x => this.card(x)).join('');
  }

  static card(temple) {
    const cat = Object.keys(CATEGORY_SLUGS).find(k => CATEGORY_SLUGS[k].includes(temple.slug));
    const label = cat ? CATEGORY_LABEL[cat][this.lang === 'hi' ? 1 : 0] : '';
    const url = `/mandir-seva/${esc(temple.slug)}`;
    // Essentials only: where, who, from what price. Everything else is on the temple page.
    return `
    <article class="shop-card mt-card" data-card-href="${url}">
      <a class="shop-card__media" href="${url}">
        <img src="${esc(temple.image_url)}" alt="${esc(temple.name)}" loading="lazy">
        <span class="shop-card__tag shop-card__tag--tl">${esc(temple.has_live ? t('md.liveDarshan') : t('md.bookingOpen'))}</span>
        ${label ? `<span class="mt-card__cat">${esc(label)}</span>` : ''}
      </a>
      <div class="shop-card__body">
        <span class="shop-card__eyebrow">🕉️ ${esc(temple.deity)}</span>
        <h3 class="shop-card__title"><a href="${url}">${esc(temple.name)}</a></h3>
        <p class="shop-card__location">📍 ${esc(temple.city)}, ${esc(temple.state)}</p>
        <div class="shop-card__foot">
          <div class="shop-price"><small>${esc(t('md.startsFrom'))}</small>${money(temple.starting_price)}</div>
          <span class="mt-card__actions"><button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-temple="${esc(temple.slug)}">${esc(t('ml.details'))}</button><button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-book="${esc(temple.slug)}">${esc(this.lang === 'hi' ? 'चढ़ावा चढ़ाएं' : 'Offer chadhava')}</button></span>
        </div>
      </div>
    </article>`;
  }

  static openBookingModal(slug) {
    const temple = this.templesData.find(x => x.slug === slug || x.id === slug);
    if (temple) ChadhavaExperience.openForTemple(temple).catch(err => toast(err.message, 'error'));
  }

  // ---------------- bookings ----------------
  static async openMyBookings() {
    const list = this.$('devotee-bookings-list');
    this.bookingsOpen = true;
    openModal(this.$('devotee-bookings-modal'));
    list.innerHTML = skeleton(2);
    let bookings;
    try {
      bookings = (await api(`/api/v1/mandir/chadawa/my-bookings?lang=${this.lang}`)).bookings || [];
    } catch (err) {
      list.innerHTML = `<div class="shop-empty"><b>${esc(t('md.loadFail'))}</b>${esc(err.message)}<br><button type="button" class="shop-btn shop-btn--line" id="mandir-bookings-retry">${esc(t('retry'))}</button></div>`;
      this.$('mandir-bookings-retry').onclick = () => this.openMyBookings();
      return;
    }
    if (!bookings.length) {
      list.innerHTML = `<div class="shop-empty"><b>${esc(t('md.noBookings.title'))}</b>${esc(t('md.noBookings.sub'))}</div>`;
      return;
    }
    list.innerHTML = bookings.map(b => this.bookingCard(b)).join('');
    list.querySelectorAll('[data-chadhava-order]').forEach(btn => btn.addEventListener('click', async () => {
      closeModal(this.$('devotee-bookings-modal'));
      try { ChadhavaExperience.showOrder(await api('/api/v1/mandir/chadhava/orders/' + encodeURIComponent(btn.dataset.chadhavaOrder))); }
      catch (err) { toast(err.message, 'error'); }
    }));
    list.querySelectorAll('[data-play]').forEach(btn => btn.addEventListener('click',
      () => this.playVideoProof(btn.getAttribute('data-title'), btn.getAttribute('data-play'))));
    list.querySelectorAll('[data-cancel]').forEach(btn => btn.addEventListener('click', () => this.cancelBooking(btn.getAttribute('data-cancel'))));
    list.querySelectorAll('[data-cert]').forEach(btn => btn.addEventListener('click', async () => {
      try { await downloadFile(`/api/v1/mandir/chadawa/${encodeURIComponent(btn.getAttribute('data-cert'))}/certificate?lang=${this.lang}`, `${btn.getAttribute('data-num')}-certificate.pdf`); }
      catch (err) { toast(err.message, 'error'); }
    }));
  }

  static bookingCard(b) {
    if (b.chadhava_order_id) return `<article class="shop-record"><strong>${esc(b.temple_name)}</strong><p>${esc(b.booking_number)} · ${esc(b.devotee_name)}</p><p>${(b.offering_items || []).map(i => `${esc(i.title)} × ${i.quantity}`).join(' · ')}</p><p>${esc(b.payment_status)} · ${esc(b.service_status)}</p><button type="button" class="shop-btn shop-btn--gold" data-chadhava-order="${esc(b.chadhava_order_id)}">${esc(currentLang() === 'hi' ? 'स्थिति और वीडियो देखें' : 'View tracking & video')}</button></article>`;
    const cancelled = b.status === 'CANCELLED';
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
      ${bookingTimeline(b)}
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
