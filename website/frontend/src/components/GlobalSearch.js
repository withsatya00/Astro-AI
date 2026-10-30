import { esc, api, money, mediaUrl } from '../utils/shop.js';
import { x } from '../utils/experience.js';
import { currentLang } from '../utils/shop-i18n.js';

// One search box for astrologers, temples and products. Opens from the navbar icon or the "/" key.
export const GlobalSearch = {
  init() {
    const actions = document.querySelector('.site-nav-actions');
    if (!actions || document.querySelector('[data-global-search]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.globalSearch = '';
    button.className = 'gs-trigger';
    button.innerHTML = '<span aria-hidden="true">🔍</span>';
    actions.prepend(button);
    this.button = button;
    this.label();
    button.addEventListener('click', () => this.open());
    window.addEventListener('astro:languagechange', () => { this.label(); if (this.dialog?.open) this.paint(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) { e.preventDefault(); this.open(); }
    });
  },
  label() { this.button?.setAttribute('aria-label', x('searchTitle')); this.button?.setAttribute('title', x('searchTitle')); },
  open() {
    if (!this.dialog) {
      this.dialog = document.createElement('dialog');
      this.dialog.className = 'exp-dialog gs-dialog';
      this.dialog.setAttribute('aria-labelledby', 'gs-title');
      document.body.append(this.dialog);
      this.dialog.addEventListener('click', (e) => {
        if (e.target === this.dialog || e.target.closest('[data-gs-close]')) { this.dialog.close(); return; }
        const link = e.target.closest('[data-gs-go]');
        if (link) { this.dialog.close(); window.Router.navigate(link.dataset.gsGo); }
      });
    }
    this.results = null;
    this.paint();
    if (!this.dialog.open) this.dialog.showModal();
    this.dialog.querySelector('input').focus();
  },
  paint() {
    const value = this.dialog.querySelector('input')?.value || '';
    this.dialog.innerHTML = `<header><h2 id="gs-title">${esc(x('searchTitle'))}</h2><button type="button" class="shop-btn shop-btn--line" data-gs-close aria-label="${esc(x('close'))}">✕</button></header>
      <input type="search" class="gs-input" value="${esc(value)}" placeholder="${esc(x('searchPlaceholder'))}" aria-label="${esc(x('searchTitle'))}" autocomplete="off">
      <div class="gs-results" aria-live="polite"></div>`;
    const input = this.dialog.querySelector('input');
    input.addEventListener('input', () => { clearTimeout(this.timer); this.timer = setTimeout(() => this.run(input.value.trim()), 250); });
    this.show();
  },
  async run(query) {
    const ticket = this.ticket = (this.ticket || 0) + 1;
    if (query.length < 2) { this.results = null; this.show(); return; }
    this.results = 'loading'; this.show();
    const lang = currentLang();
    const q = encodeURIComponent(query);
    const [astro, products, temples] = await Promise.all([
      api(`/api/v1/astrologers?search=${q}&limit=5`).then(r => r.items || []).catch(() => null),
      api(`/api/v1/marketplace/products?search=${q}&lang=${lang}`).then(r => (r.products || []).slice(0, 5)).catch(() => null),
      this.temples(lang).then(list => list.filter(t => `${t.name} ${t.deity} ${t.city} ${t.state}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5)).catch(() => null),
    ]);
    if (ticket !== this.ticket) return;
    this.results = { astro, products, temples };
    this.show();
  },
  async temples(lang) {
    if (!this.templeCache || this.templeCache.lang !== lang) this.templeCache = { lang, list: (await api(`/api/v1/mandir/temples?lang=${lang}`)).temples || [] };
    return this.templeCache.list;
  },
  show() {
    const box = this.dialog?.querySelector('.gs-results');
    if (!box) return;
    const r = this.results;
    if (!r) { box.innerHTML = `<p class="exp-muted">${esc(x('searchHint'))}</p>`; return; }
    if (r === 'loading') { box.innerHTML = `<p class="exp-muted" role="status">${esc(x('loading'))}</p>`; return; }
    const hi = currentLang() === 'hi';
    const group = (titleKey, items, row) => items === null ? `<p class="exp-warn" role="alert">${esc(x('failed'))}</p>`
      : items.length ? `<section><h3>${esc(x(titleKey))}</h3>${items.map(row).join('')}</section>` : '';
    const html = group('searchAstrologers', r.astro, a => `<button type="button" class="gs-row" data-gs-go="/astrologers/${esc(a.slug)}"><strong>${esc((hi && a.name_hi) || a.name)}</strong><small>${esc((hi && a.title_hi) || a.title || '')}</small></button>`)
      + group('searchTemples', r.temples, t => `<button type="button" class="gs-row" data-gs-go="/mandir-seva/${esc(t.slug)}"><strong>${esc(t.name)}</strong><small>${esc([t.city, t.state].filter(Boolean).join(', '))}</small></button>`)
      + group('searchProducts', r.products, p => `<button type="button" class="gs-row" data-gs-go="/astro-mall/product/${esc(p.id)}"><strong>${esc(p.title)}</strong><small>${esc(money(p.price))}</small></button>`);
    box.innerHTML = html || `<p class="exp-muted">${esc(x('searchNone'))}</p>`;
  },
};
