import { api, esc, money, toast, mediaUrl } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { x, productTile, errorState, skeleton } from '../../utils/experience.js';

const read = key => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value.filter(v => typeof v === 'string').slice(0, 12) : []; } catch { return []; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

export const Discovery = {
  compare: read('astro_compare_v1').slice(0, 3), catalog: [],
  recent() { return read('astro_recent_v1'); },
  visit(id) { save('astro_recent_v1', [id, ...this.recent().filter(v => v !== id)].slice(0, 12)); },
  toggle(id) {
    if (this.compare.includes(id)) this.compare = this.compare.filter(v => v !== id);
    else if (this.compare.length < 3) this.compare.push(id);
    else { toast(x('compareLimit'), 'info'); return; }
    save('astro_compare_v1', this.compare);
    this.paintButtons();
    if (document.getElementById('exp-comparison')?.open) this.openCompare();
    window.dispatchEvent(new CustomEvent('astro:comparison'));
  },
  button(id) { return `<button type="button" class="exp-compare-toggle" data-compare="${esc(id)}" aria-pressed="${this.compare.includes(id)}">⇄ ${esc(x(this.compare.includes(id) ? 'comparing' : 'compare'))}</button>`; },
  init() {
    document.addEventListener('click', e => {
      const toggle = e.target.closest('[data-compare]');
      if (toggle) this.toggle(toggle.dataset.compare);
      if (e.target.closest('[data-open-compare]')) this.openCompare();
      if (e.target.closest('[data-clear-recent]')) {
        save('astro_recent_v1', []);
        document.querySelectorAll('[data-recent-shelf]').forEach(el => { el.innerHTML = ''; });
        window.dispatchEvent(new CustomEvent('astro:recentclear'));
      }
    });
    window.addEventListener('astro:languagechange', () => {
      this.paintButtons();
      if (document.getElementById('exp-comparison')?.open) this.openCompare();
    });
    window.addEventListener('storage', e => {
      if (e.key === 'astro_compare_v1') { this.compare = read(e.key).slice(0, 3); this.paintButtons(); }
    });
  },
  paintButtons() {
    document.querySelectorAll('[data-compare]').forEach(b => {
      const selected = this.compare.includes(b.dataset.compare);
      b.setAttribute('aria-pressed', String(selected));
      b.textContent = `⇄ ${x(selected ? 'comparing' : 'compare')}`;
    });
    document.querySelectorAll('[data-open-compare]').forEach(b => { b.textContent = `${x('compare')} (${this.compare.length}/3)`; });
  },
  async shelf(root, products, exclude = '') {
    const ids = this.recent().filter(id => id !== exclude);
    const list = ids.map(id => products.find(p => p.id === id)).filter(Boolean);
    root.innerHTML = list.length ? `<section class="exp-shelf" translate="no"><div class="exp-section-head"><div><h2>${esc(x('recent'))}</h2><p>${esc(x('recentNote'))}</p></div><button class="shop-btn shop-btn--line shop-btn--sm" type="button" data-clear-recent>${esc(x('clear'))}</button></div><div class="exp-product-grid">${list.map(productTile).join('')}</div></section>` : '';
  },
  async openCompare() {
    let dialog = document.getElementById('exp-comparison');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'exp-comparison'; dialog.className = 'exp-dialog';
      dialog.setAttribute('translate', 'no'); dialog.setAttribute('aria-labelledby', 'exp-compare-title');
      document.body.append(dialog);
      dialog.addEventListener('click', e => { if (e.target === dialog || e.target.closest('[data-exp-close]')) dialog.close(); });
    }
    const request = this.compare.join('|') + currentLang();
    this.compareRequest = request;
    dialog.innerHTML = `<header><div><h2 id="exp-compare-title">${esc(x('compareTitle'))}</h2><p>${esc(x('compareNote'))}</p></div><button type="button" class="shop-btn shop-btn--line" data-exp-close aria-label="${esc(x('close'))}">✕</button></header><div id="exp-compare-body">${skeleton()}</div>`;
    if (!dialog.open) dialog.showModal();
    const body = dialog.querySelector('#exp-compare-body');
    if (!this.compare.length) { body.innerHTML = `<p class="exp-empty">${esc(x('compareNote'))}</p>`; return; }
    try {
      const products = await Promise.all(this.compare.map(id => api(`/api/v1/marketplace/products/${encodeURIComponent(id)}?lang=${currentLang()}`)));
      if (this.compareRequest !== request) return;
      const rows = [['price', p => money(p.price)], ['material', p => p.material || '—'], ['origin', p => p.origin || '—'], ['certified', p => x(p.has_lab_certificate ? 'yes' : 'no')], ['energized', p => x(p.is_energized ? 'yes' : 'no')], ['stock', p => x(p.in_stock ? 'inStock' : 'outStock')]];
      body.innerHTML = `<div class="exp-table-scroll"><table class="exp-compare-table"><thead><tr><th scope="col">${esc(x('compare'))}</th>${products.map(p => `<th scope="col"><img src="${esc(mediaUrl(p.image_url))}" alt=""><a href="/astro-mall/product/${encodeURIComponent(p.id)}">${esc(p.title)}</a><button type="button" class="exp-text-button" data-remove-compare="${esc(p.id)}">${esc(x('remove'))}</button></th>`).join('')}</tr></thead><tbody>${rows.map(([key, fn]) => `<tr><th scope="row">${esc(x(key))}</th>${products.map(p => `<td>${esc(fn(p))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      body.querySelectorAll('[data-remove-compare]').forEach(b => b.addEventListener('click', () => this.toggle(b.dataset.removeCompare)));
      body.querySelectorAll('a').forEach(a => a.addEventListener('click', () => dialog.close()));
    } catch { if (this.compareRequest !== request) return; body.innerHTML = errorState(); body.querySelector('[data-exp-retry]').onclick = () => this.openCompare(); }
  }
};
