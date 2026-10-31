// Quick filter chips and recommendations for the Astrologers Directory page.
import { esc } from '../../utils/shop.js';
import { px } from '../../utils/premium-copy.js';
import { AstrologerCardComponent } from '../AstrologerCard/AstrologerCard.js';

const SPECIALTIES = ['Marriage', 'Career', 'Finance', 'Health', 'Kundli', 'Remedies', 'Business', 'Education'];
const DEFAULT = { type: 'all', specialty: '', language: '', sort: 'popular', q: '' };

export const DirectoryChips = {
  count: null,
  page: 1,
  pageSize: 12,
  observer: null,

  init() {
    this.render();
    const grid = document.getElementById('directory-page-cards-grid');
    if (grid && !this.observer) {
      this.observer = new MutationObserver(() => { this.page = 1; this.paginate(); });
      this.observer.observe(grid, { childList: true });
    }
    window.addEventListener('astro:languagechange', () => this.render());
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-dir-chip]');
      if (chip) this.apply(chip.dataset.dirChip, chip.dataset.value || '');
    });
  },

  applyPrice(value) {
    const grid = document.getElementById('directory-page-cards-grid');
    if (!grid) return;
    grid.querySelectorAll('.ac2').forEach(card => {
      const rate = Number(card.dataset.price || 0);
      card.dataset.priceHidden = String(value === 'free' ? rate !== 0 : value ? rate > Number(value) : false);
    });
    this.page = 1;
    this.paginate();
  },

  paginate() {
    const grid = document.getElementById('directory-page-cards-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.ac2')].filter(card => card.dataset.priceHidden !== 'true');
    const pages = Math.max(1, Math.ceil(cards.length / this.pageSize));
    this.page = Math.min(this.page, pages);
    cards.forEach((card, index) => {
      card.style.display = (index < (this.page - 1) * this.pageSize || index >= this.page * this.pageSize) ? 'none' : '';
    });

    let pager = document.getElementById('directory-pager');
    if (!pager) {
      pager = document.createElement('nav');
      pager.id = 'directory-pager';
      pager.className = 'directory-pager';
      pager.setAttribute('aria-label', 'Astrologer pages');
      grid.after(pager);
    }
    pager.innerHTML = `<button type="button" data-page="${Math.max(1, this.page - 1)}" ${this.page === 1 ? 'disabled' : ''}>‹</button>${Array.from({ length: pages }, (_, i) => `<button type="button" data-page="${i + 1}" class="${this.page === i + 1 ? 'is-active' : ''}">${i + 1}</button>`).join('')}<button type="button" data-page="${Math.min(pages, this.page + 1)}" ${this.page === pages ? 'disabled' : ''}>›</button>`;
    pager.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => {
      this.page = Number(button.dataset.page);
      this.paginate();
      document.querySelector('.dir-section-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  },

  isActive(kind, value) {
    const f = window.App?.directoryFilter || DEFAULT;
    if (kind === 'all') return f.type === 'all' && !f.specialty && f.sort !== 'rating';
    if (kind === 'type') return f.type === value;
    if (kind === 'sort') return f.sort === value;
    return (f.specialty || '').toLowerCase() === (value || '').toLowerCase();
  },

  render() {
    this.renderRecommendations();
    this.paint();
  },

  setCount(n) {
    this.count = n;
    this.renderRecommendations();
    queueMicrotask(() => this.paginate());
  },

  renderRecommendations() {
    const rankList = document.getElementById('dir-ranking-list');
    const experts = [...(window.App?.astrologersList || [])]
      .filter(a => Number(a.consultations_count) > 0)
      .sort((a, b) => Number(b.consultations_count) - Number(a.consultations_count)).slice(0, 5);

    if (rankList && experts.length > 0) {
      const hi = window.I18n?.currentLang === 'hi';
      rankList.innerHTML = experts.map((a, index) => {
        const slug = encodeURIComponent(a.slug || a.id);
        const name = (hi && a.name_hi) ? a.name_hi : a.name;
        const statusClass = a.availability === 'busy' ? 'dir-status-busy' : 'dir-status-online';
        const statusText = a.availability === 'busy' ? '● Busy' : '● Online';
        return `
          <a class="dir-expert-row" href="/astrologers/${slug}" data-nav-link>
            <span class="dir-rank-num">${index + 1}</span>
            <img src="${esc(AstrologerCardComponent.getPortraitUrl(a))}" alt="" class="dir-rank-img" loading="lazy" onerror="this.onerror=null;this.src='/assets/portraits/default-avatar.svg'">
            <div class="dir-rank-info">
              <strong>${esc(name)}</strong>
              <div class="dir-rank-meta">★ ${Number(a.rating || 0).toFixed(1)} &bull; ${AstrologerCardComponent.compact(Number(a.review_count || 0))}</div>
              <span class="dir-rank-status ${statusClass}">${statusText}</span>
            </div>
          </a>
        `;
      }).join('');
    }
  },

  apply(kind, value) {
    const app = window.App;
    if (!app) return;
    const f = app.directoryFilter;
    if (kind === 'all') {
      Object.assign(f, DEFAULT, { q: f.q, language: f.language });
    } else if (kind === 'type') {
      f.type = f.type === value ? 'all' : value;
    } else if (kind === 'sort') {
      f.sort = f.sort === value ? 'popular' : value;
    } else {
      f.specialty = (f.specialty || '').toLowerCase() === (value || '').toLowerCase() ? '' : value;
    }

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
    set('dir-filter-mode', f.type);
    set('dir-filter-sort', f.sort);
    set('dir-filter-specialty', f.specialty || '');

    this.paint();
    app.loadAstrologerDirectory();
  },

  paint() {
    document.querySelectorAll('[data-dir-chip]').forEach(b => {
      const on = this.isActive(b.dataset.dirChip, b.dataset.value || '');
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }
};
