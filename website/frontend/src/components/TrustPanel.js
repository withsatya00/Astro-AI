import { esc, api } from '../utils/shop.js';
import { x, fmt } from '../utils/experience.js';

// "How we work" panel on the home page. Numbers come from the live astrologer directory; everything else describes behaviour that exists in the product.
export const TrustPanel = {
  async init() {
    const mount = document.getElementById('mount-transparency');
    if (!mount) return;
    this.mount = mount;
    window.addEventListener('astro:languagechange', () => this.paint());
    try {
      const [all, human] = await Promise.all([api('/api/v1/astrologers?limit=1'), api('/api/v1/astrologers?is_ai=false&limit=1')]);
      this.counts = { all: all.total, human: human.total };
    } catch (e) { this.counts = null; }
    this.paint();
  },
  paint() {
    const c = this.counts;
    const points = [
      c && c.all > 0 && fmt(x('trustCounts'), { all: c.all, human: c.human, ai: c.all - c.human }),
      x('trustAiLabel'), x('trustRefund'), x('trustReviews'), x('trustData'),
    ].filter(Boolean);
    this.mount.innerHTML = `<section class="trust-panel" aria-labelledby="trust-panel-title"><div class="trust-panel__inner">
      <h2 id="trust-panel-title">${esc(x('trustTitle'))}</h2><p>${esc(x('trustIntro'))}</p>
      <ul>${points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div></section>`;
  },
};
