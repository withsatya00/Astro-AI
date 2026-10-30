import { api, esc, money, isSignedIn, mediaUrl } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { x, skeleton, empty, errorState, dateText, bookingTimeline, productTile, statusText } from '../../utils/experience.js';
import { Discovery } from '../../components/shop/Discovery.js';
import { CartStore } from '../../utils/cart-store.js';
import { OrdersModal } from '../../components/shop/OrdersModal.js';
import { MandirSevaPageComponent } from '../MandirSevaPage/MandirSevaPage.js';
import { DailyBrief } from '../../components/premium/DailyBrief.js';
import { RemedyTracker } from '../../components/premium/RemedyTracker.js';
import { px } from '../../utils/premium-copy.js';
import { nextSteps } from '../../utils/next-steps.js';
import { AdvancedWorkspace } from '../../components/premium/AdvancedWorkspace.js';
import { T as gsT, statusLabel as gsStatus, purposeLabel as gsPurpose } from '../GauSewaPage/GauSewaPage.js';

const icon = key => {
  const paths = {donations: '<path d="M12 21s-8-5.500-8-11a4.500 4.500 0 0 1 8-2.500A4.500 4.500 0 0 1 20 10c0 5.500-8 11-8 11z"/>', overview: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>', orders: '<path d="M5 7h14l1 14H4L5 7zM8 7V6a4 4 0 0 1 8 0v1"/>', pujas: '<path d="M3 21h18M5 21V10h14v11M3 10l9-7 9 7M9 21v-7h6v7"/>', profiles: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/>', consultations: '<path d="M21 11a8 8 0 0 1-8 8H6l-4 3 1-7a8 8 0 1 1 18-4zM7 10h10M7 14h6"/>', saved: '<path d="M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8 6l8 9 8-9a5 5 0 0 0 0-7z"/>', wallet: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8V5l14-3v3M16 11h5v5h-5z"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', refresh: '<path d="M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M5 16a8 8 0 0 0 13 2"/>', settings: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>', remedies: '<path d="M12 3c3 3 5 5.5 5 9a5 5 0 0 1-10 0c0-3.500 2-6 5-9zM9 21h6"/>', gifts: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18M12 8c-2-4-6-3-5 0 .6 1.500 3 1 5 0zM12 8c2-4 6-3 5 0-.6 1.500-3 1-5 0z"/>'};
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key] || paths.overview}</svg>`;
};

export class DashboardPageComponent {
  static mount(container) {
    this.root = document.querySelector(container);
    this.tab = 'overview';
    window.addEventListener('astro:languagechange', () => { if (this.root.classList.contains('active')) this.open(); });
    window.addEventListener('astro:authchange', () => { this.request = (this.request || 0) + 1; this.data = null; if (this.root.classList.contains('active')) this.open(); });
    window.addEventListener('astro:recentclear', () => { if (this.root.classList.contains('active')) this.open(); });
    window.addEventListener('astro:walletchange', e => { if (this.data && this.root.classList.contains('active') && isSignedIn()) { this.data.wallet = e.detail; this.failed.delete('wallet'); this.render(); } });
    window.addEventListener('astro:ordersChanged', () => { if (this.root.classList.contains('active')) this.open(); });
    this.root.addEventListener('click', e => {
      const tab = e.target.closest('[data-dashboard-tab]');
      if (tab) { this.tab = tab.dataset.dashboardTab; this.render(); }
      if (e.target.closest('[data-dashboard-refresh], [data-exp-retry]')) this.open();
      if (e.target.closest('[data-dashboard-login]')) window.App.openAuthModal('login');
      if (e.target.closest('[data-account-settings]')) window.App.openAccountSettings();
      if (e.target.closest('[data-dashboard-wallet]')) window.App.openWalletModal();
      if (e.target.closest('[data-dashboard-orders]')) OrdersModal.open();
      if (e.target.closest('[data-dashboard-pujas]')) MandirSevaPageComponent.openMyBookings();
      if (e.target.closest('[data-dashboard-profile]')) window.App.openBirthModal();
      if (e.target.closest('[data-dashboard-appointments]')) window.App.openAppointmentsModal();
      const imp = e.target.closest('[data-import-remedies]');
      if (imp) {
        imp.disabled = true;
        api(`/api/v1/experience/remedies/import/${encodeURIComponent(imp.dataset.importRemedies)}`, { method: 'POST' })
          .then(r => { window.Toast?.show(px('rem.imported', { n: r.added }), 'success'); if (r.added) { this.tab = 'remedies'; this.render(); } })
          .catch(() => window.Toast?.show(px('rem.importNone'), 'info')).finally(() => { imp.disabled = false; });
      }
      const wish = e.target.closest('[data-dashboard-unwish]');
      if (wish) { CartStore.toggleWish(wish.dataset.dashboardUnwish); this.render(); }
    });
  }
  static async open() {
    const request = this.request = (this.request || 0) + 1;
    this.root.innerHTML = `<div class="shop-page exp-dashboard" translate="no">${skeleton(4)}</div>`;
    if (!isSignedIn()) {
      this.root.innerHTML = `<div class="shop-page exp-dashboard" translate="no"><section class="exp-dashboard-hero"><span class="exp-eyebrow">ASTRO JYOTISH</span><h1>${esc(x('login'))}</h1><p>${esc(x('loginNote'))}</p><button class="shop-btn shop-btn--gold" data-dashboard-login>${esc(x('signin'))}</button></section></div>`;
      return;
    }
    const endpoints = {
      wallet: '/api/v1/wallet', orders: `/api/v1/marketplace/my-orders?lang=${currentLang()}`,
      pujas: `/api/v1/mandir/chadawa/my-bookings?lang=${currentLang()}`, profiles: '/api/v1/auth/profiles',
      consultations: '/api/v1/consultations', sessions: '/api/v1/wallet/bookings',
      catalog: `/api/v1/marketplace/products?lang=${currentLang()}`,
      donations: '/api/v1/gau-sewa/donations/mine'
    };
    const results = await Promise.allSettled(Object.values(endpoints).map(url => api(url)));
    if (request !== this.request) return;
    this.data = {}; this.failed = new Set();
    Object.keys(endpoints).forEach((key, i) => { if (results[i].status === 'fulfilled') this.data[key] = results[i].value; else this.failed.add(key); });
    await CartStore.sync();
    if (request !== this.request) return;
    this.render();
  }
  static render() {
    if (!this.data) return;
    const d = this.data, products = d.catalog?.products || [];
    const lists = { orders: d.orders?.orders || [], pujas: d.pujas?.bookings || [], profiles: d.profiles || [], consultations: d.consultations || [], sessions: d.sessions || [] };
    const tabs = ['overview', 'advanced', 'remedies', 'orders', 'pujas', 'donations', 'profiles', 'consultations', 'saved'];
    const tabName = key => (key === 'advanced' ? (currentLang() === 'hi' ? 'उन्नत टूल' : 'Advanced tools') : key === 'overview' ? overview : key === 'remedies' ? px('rem.tab') : key === 'donations' ? gsT('gs_my_title') : x(key));
    const overview = currentLang() === 'hi' ? 'एक नज़र में' : 'Overview';
    const section = (key, content) => `<section class="exp-panel"><div class="exp-section-head"><h2>${esc(x(key))}</h2></div>${this.failed.has(key) ? errorState() : content}</section>`;
    const records = (key, render) => lists[key].length ? `<div class="exp-records">${(this.tab === 'overview' ? lists[key].slice(0, 3) : lists[key]).map(render).join('')}</div>` : empty('empty', 'emptyNote', key === 'pujas' ? '/mandir-seva' : key === 'orders' ? '/astro-mall' : '/astrologers', key === 'pujas' ? 'temples' : key === 'orders' ? 'explore' : 'find');
    const consultationCard = c => {
      const astrologer = c.astrologer || {};
      const firstQuestion = (c.messages || []).find(m => m.role === 'user' && typeof m.content === 'string' && m.content.trim().length >= 12)?.content.trim().replace(/\s+/g, ' ');
      const generic = !c.title || /^(consultation(?: with.*)?|new consultation|vedic consultation|astrology consultation|session with.*)$/i.test(c.title);
      const title = generic ? firstQuestion || (astrologer.name ? `${x('withAstrologer')} ${astrologer.name}` : x('consultations')) : c.title;
      const avatar = /^(?:\/|https:\/\/)/.test(astrologer.avatar || '') ? `<img src="${esc(mediaUrl(astrologer.avatar))}" alt="" loading="lazy">` : `<span>${esc(Array.from(astrologer.name || 'A')[0])}</span>`;
      return `<article class="consultation-record"><div class="consultation-avatar" data-initial="${esc(Array.from(astrologer.name || 'A')[0])}">${avatar}</div><div class="consultation-content"><small>${esc(astrologer.name || x('consultations'))} · ${esc(dateText(c.started_at))}</small><h3>${esc(String(title).slice(0, 100))}${String(title).length > 100 ? '…' : ''}</h3><div class="consultation-meta"><span class="shop-pill">${esc(statusText(c.status))}</span>${c.duration_seconds ? `<span>${Math.ceil(c.duration_seconds / 60)} min</span>` : ''}${c.status === 'completed' ? `<button type="button" class="pf-link" data-import-remedies="${esc(c.id)}">${esc(px('rem.importBtn'))}</button>` : ''}</div></div><a class="shop-btn shop-btn--line shop-btn--sm" href="/consultation/${encodeURIComponent(c.id)}">${esc(x(c.status === 'active' ? 'continue' : 'resume'))}${icon('arrow')}</a></article>`;
    };
    const orders = () => section('orders', `<button class="shop-btn shop-btn--line" data-dashboard-orders>${esc(x('manage'))}</button>${records('orders', o => `<article class="exp-record"><div><small>${esc(o.order_number)} · ${esc(dateText(o.created_at))}</small><h3>${esc(o.product_title)}</h3><span>${esc(window.I18n?.t('or.' + o.status) || o.status)}</span></div><strong>${money(o.total_price)}</strong></article>`)}`);
    const pujas = () => section('pujas', `<button class="shop-btn shop-btn--line" data-dashboard-pujas>${esc(x('watch'))}</button>${records('pujas', b => `<article class="exp-booking"><small>${esc(b.booking_number)}</small><h3>${esc(b.temple_name)}</h3><p>${esc(b.offering_title)} · ${money(b.amount_paid)}</p>${bookingTimeline(b)}</article>`)}`);
    const profiles = () => section('profiles', `<button class="shop-btn shop-btn--line" data-dashboard-profile>${esc(x('newChart'))}</button>${records('profiles', p => `<article class="exp-record"><div><h3>${esc(p.name)}</h3><p>${esc(p.date_of_birth)} · ${esc(p.city || '')}</p></div>${p.is_default ? `<span class="shop-pill shop-pill--ok">${esc(x('default'))}</span>` : ''}</article>`)}`);
    const consultations = () => section('consultations', records('consultations', consultationCard)) + section('sessions', `<button type="button" class="shop-btn shop-btn--line" data-dashboard-appointments>${esc(x('manageAppointments'))}</button>` + records('sessions', b => `<article class="exp-record"><div><h3>${esc(b.astrologer_name)}</h3><p>${esc(b.scheduled_at)} · ${esc(statusText(b.status))}</p></div><strong>${money(b.total_amount)}</strong></article>`));
    const wished = products.filter(p => CartStore.isWished(p.id));
    const saved = () => section('saved', this.failed.has('catalog') ? errorState() : wished.length ? `<div class="exp-product-grid">${wished.map(p => `<div>${productTile(p)}<button class="exp-text-button" data-dashboard-unwish="${esc(p.id)}">${esc(x('remove'))}</button></div>`).join('')}</div>` : empty('wishlistEmpty', 'wishlistNote', '/astro-mall'));
    const donationList = d.donations?.donations || [];
    const donations = () => `<section class="exp-panel"><div class="exp-section-head"><h2>${esc(gsT('gs_my_title'))}</h2></div>${this.failed.has('donations') ? errorState() : donationList.length
      ? `<div class="exp-records">${donationList.map(g => `<article class="exp-record"><div><small>${esc(g.reference)} · ${esc(dateText(g.paid_at || g.created_at))}</small><h3>${money(g.amount)} · ${esc(gsPurpose(g.purpose))}</h3><p>${esc(g.recipient_name || '')}</p></div><div><span class="shop-pill">${esc(gsStatus(g.status))}</span> <a class="shop-btn shop-btn--line" href="/gau-sewa/receipt/${esc(g.receipt_token)}" data-nav-link>${esc(gsT('gs_my_receipt'))}</a></div></article>`).join('')}</div>`
      : `<p>${esc(gsT('gs_my_empty'))}</p><a class="shop-btn shop-btn--gold" href="/gau-sewa" data-nav-link>${esc(gsT('gs_my_cta'))}</a>`}</section>`;
    const steps = nextSteps({ profiles: this.failed.has('profiles') ? undefined : lists.profiles, consultations: this.failed.has('consultations') ? undefined : lists.consultations,
      orders: this.failed.has('orders') ? undefined : lists.orders, pujas: this.failed.has('pujas') ? undefined : lists.pujas, wallet: this.failed.has('wallet') ? undefined : d.wallet }, currentLang());
    const stepCard = s => { const attrs = s.action === 'wallet' ? 'data-dashboard-wallet' : s.action ? `data-dashboard-tab="${s.action}"` : ''; const body = `<strong>${esc(s.title)}</strong><span>${esc(s.text)}</span>${icon('arrow')}`; return attrs ? `<button type="button" class="ds-card exp-step" ${attrs}>${body}</button>` : `<a class="ds-card exp-step" href="${esc(s.href)}" data-nav-link>${body}</a>`; };
    const nextPanel = steps.length ? `<section class="exp-next" aria-labelledby="exp-next-h"><h2 id="exp-next-h">${currentLang() === 'hi' ? 'आगे क्या करें' : 'What to do next'}</h2><div class="exp-next-grid">${steps.map(stepCard).join('')}</div></section>` : '';
    const content = {orders, pujas, donations, profiles, consultations, saved, advanced: () => '<div data-advanced-workspace></div>'};
    const user = window.App?.currentUser || {};
    const name = user.full_name || x('account');
    const transactions = d.wallet?.transactions || [];
    const added = transactions.filter(t => t.type !== 'refund' && Number(t.amount) > 0).reduce((sum, t) => sum + Number(t.amount), 0);
    const spent = transactions.filter(t => Number(t.amount) < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    const premiumWallet = `<section class="exp-account-wallet"><div class="exp-wallet-top"><span>${icon('wallet')} ${esc(x('wallet'))}</span>${d.wallet?.is_test_mode === false ? '' : `<small>${esc(x('testMode'))}</small>`}</div>${this.failed.has('wallet') ? errorState() : `<div class="exp-wallet"><small>${esc(x('balance'))}</small><strong>${money(d.wallet?.balance || 0)}</strong></div><div class="exp-wallet-totals"><div><small>${esc(x('totalAdded'))}</small><b>+${money(added)}</b></div><div><small>${esc(x('totalSpent'))}</small><b>−${money(spent)}</b></div></div><button type="button" data-dashboard-wallet>${esc(x('viewHistory'))}${icon('arrow')}</button>`}</section>`;
    const shortcuts = `<section class="exp-account-shortcuts"><h2>${esc(x('quickAccess'))}</h2>${[['profiles','newChart','data-dashboard-profile'],['saved','saved','data-dashboard-tab="saved"'],['pujas','temples','href="/mandir-seva"'],['gifts','gifts','href="/gifts"']].map(([symbol, label, attr]) => attr.startsWith('href') ? `<a ${attr}>${icon(symbol)}<span>${esc(label === 'gifts' ? px('gf.title') : x(label))}</span>${icon('arrow')}</a>` : `<button type="button" ${attr}>${icon(symbol)}<span>${esc(label === 'gifts' ? px('gf.title') : x(label))}${symbol === 'saved' ? ` <small>(${CartStore.wish.length})</small>` : ''}</span>${icon('arrow')}</button>`).join('')}</section>`;
    this.root.innerHTML = `<div class="shop-page exp-dashboard exp-account" translate="no">
      <header class="exp-profile-header"><div class="exp-profile-identity"><span class="exp-profile-avatar">${esc(Array.from(name.trim())[0]?.toUpperCase() || 'A')}</span><div><span class="exp-profile-label">${esc(x('personalAccount'))}</span><h1>${esc(name)}</h1><p>${esc(user.email || x('intro'))}</p></div></div><div class="exp-profile-actions"><button type="button" class="shop-btn shop-btn--line" data-account-settings>${icon('settings')}${esc(x('editProfile'))}</button><button type="button" class="exp-refresh-button" data-dashboard-refresh aria-label="${esc(x('refresh'))}" title="${esc(x('refresh'))}">${icon('refresh')}</button></div></header>
      <div class="exp-account-shell"><aside class="exp-account-sidebar"><span class="exp-sidebar-caption">${esc(x('account'))}</span><nav class="exp-dashboard-tabs" aria-label="${esc(x('account'))}">${tabs.map(key => `<button type="button" data-dashboard-tab="${key}" class="${this.tab === key ? 'is-active' : ''}" aria-pressed="${this.tab === key}">${icon(key)}<span>${esc(tabName(key))}</span>${icon('arrow')}</button>`).join('')}</nav><button class="exp-sidebar-wallet" type="button" data-dashboard-wallet>${icon('wallet')}<span>${esc(x('viewHistory'))}</span></button></aside>
      <div class="exp-account-main"><div class="exp-account-heading"><div><h2>${esc(this.tab === 'overview' ? x('accountOverview') : tabName(this.tab))}</h2><p>${esc(this.tab === 'overview' ? x('accountActivity') : x('intro'))}</p></div></div>
      ${this.tab === 'overview' ? nextPanel + '<div data-daily-brief></div>' : ''}${this.tab === 'remedies' ? '<div data-remedy-tracker></div>' : ''}
      ${this.tab === 'overview' ? `<div class="exp-stat-grid">${['orders', 'pujas', 'profiles', 'consultations'].map(key => `<button type="button" class="exp-stat" data-dashboard-tab="${key}"><span class="exp-stat-icon">${icon(key)}</span><small>${esc(x(key))}</small><strong>${this.failed.has(key) ? '—' : lists[key].length}</strong>${icon('arrow')}</button>`).join('')}</div><div class="exp-account-featured">${premiumWallet}${shortcuts}</div><div class="exp-account-activity">${section('consultations', records('consultations', consultationCard))}${pujas()}</div>` : (content[this.tab] || (() => ''))()}
      <div data-recent-shelf></div></div></div></div>`;
    Discovery.shelf(this.root.querySelector('[data-recent-shelf]'), products);
    DailyBrief.mount(this.root.querySelector('[data-daily-brief]'));
    RemedyTracker.mount(this.root.querySelector('[data-remedy-tracker]'));
    AdvancedWorkspace.mount(this.root.querySelector('[data-advanced-workspace]'));
  }
}
window.DashboardPageComponent = DashboardPageComponent;
