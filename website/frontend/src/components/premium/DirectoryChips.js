// Quick filter chips above the astrologer grid. They drive the same App.directoryFilter as the select boxes.
import { esc } from '../../utils/shop.js';
import { px } from '../../utils/premium-copy.js';
import { AstrologerCardComponent } from '../AstrologerCard/AstrologerCard.js';

const SPECIALTIES = ['Marriage', 'Career', 'Finance', 'Health', 'Kundli', 'Remedies'];
const DEFAULT = { type: 'all', specialty: '', language: '', sort: 'popular', q: '' };

export const DirectoryChips = {
  count: null,

  init() {
    this.render();
    window.addEventListener('astro:languagechange', () => this.render());
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-dir-chip]');
      if (chip) this.apply(chip.dataset.dirChip, chip.dataset.value || '');
    });
  },

  chips() {
    return [
      ['all', '', px('dir.all')], ['type', 'online', px('dir.online')], ['type', 'human', px('dir.human')], ['type', 'ai', px('dir.ai')], ['sort', 'rating', px('dir.top')],
      ...SPECIALTIES.map(s => ['specialty', s, px('dir.' + s)]),
    ];
  },

  isActive(kind, value) {
    const f = window.App?.directoryFilter || DEFAULT;
    if (kind === 'all') return f.type === 'all' && !f.specialty && f.sort !== 'rating';
    if (kind === 'type') return f.type === value;
    if (kind === 'sort') return f.sort === value;
    return (f.specialty || '').toLowerCase() === value.toLowerCase();
  },

  render() {
    this.renderRecommendations();
    const host = document.getElementById('dir-quick-chips');
    if (!host) return;
    host.innerHTML = `<div class="dir-chip-row" role="group">${this.chips().map(([kind, value, label]) =>
      `<button type="button" class="dir-chip ${this.isActive(kind, value) ? 'is-active' : ''}" data-dir-chip="${kind}" data-value="${esc(value)}" aria-pressed="${this.isActive(kind, value)}">${esc(label)}</button>`).join('')}</div>
      <span class="dir-count" id="dir-result-count" aria-live="polite">${this.count == null ? '' : esc(px('dir.count', { n: this.count }))}</span>`;
  },

  setCount(n) {
    this.count = n;
    const el = document.getElementById('dir-result-count');
    if (el) el.textContent = px('dir.count', { n });
    this.renderRecommendations();
  },

  renderRecommendations() {
    const grid = document.getElementById('directory-page-cards-grid');
    if (!grid) return;
    let layout = grid.parentElement;
    if (!layout.classList.contains('directory-discovery-layout')) {
      layout = document.createElement('div');
      layout.className = 'directory-discovery-layout';
      grid.before(layout);
      layout.append(grid);
    }
    let aside = layout.querySelector('.directory-recommendations');
    if (!aside) {
      aside = document.createElement('aside');
      aside.className = 'directory-recommendations';
      layout.prepend(aside);
    }
    const experts = [...(window.App?.astrologersList || [])]
      .filter(a => Number(a.consultations_count) > 0)
      .sort((a, b) => Number(b.consultations_count) - Number(a.consultations_count)).slice(0, 5);
    aside.hidden = !experts.length;
    layout.classList.toggle('has-recommendations', !!experts.length);
    const hi = window.I18n?.currentLang === 'hi';
    aside.innerHTML = `<p class="directory-eyebrow">${hi ? 'विशेषज्ञ खोजें' : 'DISCOVER EXPERTS'}</p><h2>${hi ? 'सबसे अधिक परामर्श' : 'Most consulted'}</h2><p class="directory-recommendations-note">${hi ? 'कुल परामर्शों के आधार पर, वर्तमान परिणामों में से।' : 'By total consultations, from your current results.'}</p><div class="directory-recommendations-list">${experts.map(a => {
      const slug = encodeURIComponent(a.slug || a.id);
      const name = hi && a.name_hi ? a.name_hi : a.name;
      return `<a class="directory-expert-row" href="/astrologer/${slug}"><img src="${esc(AstrologerCardComponent.getPortraitUrl(a))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/assets/portraits/default-avatar.svg'"><span><strong>${esc(name)}</strong><small>${esc((a.languages || []).toString())}</small><b>${Number(a.rating) > 0 ? '★ ' + Number(a.rating).toFixed(1) + ' · ' : ''}₹${Number(a.price_per_minute) || 0}/${hi ? 'मिनट' : 'min'}</b></span><i aria-hidden="true">↗</i></a>`;
    }).join('')}</div>`;
  },

  apply(kind, value) {
    const app = window.App;
    if (!app) return;
    const f = app.directoryFilter;
    if (kind === 'all') Object.assign(f, DEFAULT, { q: f.q, language: f.language });
    else if (kind === 'type') f.type = f.type === value ? 'all' : value;
    else if (kind === 'sort') f.sort = f.sort === value ? 'popular' : value;
    else f.specialty = (f.specialty || '').toLowerCase() === value.toLowerCase() ? '' : value;
    // Keep the select boxes in step with the chips.
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('dir-filter-mode', f.type); set('dir-filter-sort', f.sort); set('dir-filter-specialty', f.specialty || '');
    this.render();
    app.loadAstrologerDirectory();
  },

  /** Called after each directory load so the chips match the current filter (e.g. after "Clear filters"). */
  paint() {
    const host = document.getElementById('dir-quick-chips');
    if (!host) return;
    host.querySelectorAll('[data-dir-chip]').forEach(b => {
      const on = this.isActive(b.dataset.dirChip, b.dataset.value || '');
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
};
