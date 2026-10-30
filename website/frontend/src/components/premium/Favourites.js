// Saved astrologers: the heart on every astrologer card, and the hook that fills each new card with live details.
import { api, isSignedIn, toast } from '../../utils/shop.js';
import { px } from '../../utils/premium-copy.js';

export const Favourites = {
  ids: null,

  async load() {
    if (!isSignedIn()) return (this.ids = new Set());
    if (this.ids) return this.ids;
    try { this.ids = new Set((await api('/api/v1/experience/favourites')).ids); } catch (e) { this.ids = new Set(); }
    return this.ids;
  },

  paint(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('is-on', on);
    btn.firstElementChild.textContent = on ? '♥' : '♡';
    btn.title = btn.ariaLabel = px(on ? 'ac.saved' : 'ac.save');
  },

  async sync(root = document) {
    const ids = await this.load();
    root.querySelectorAll('[data-ac-fav]').forEach(b => this.paint(b, ids.has(b.dataset.acFav)));
  },

  init() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-ac-fav]');
      if (!btn) return;
      e.stopPropagation();
      if (!isSignedIn()) { toast(px('pv.saveLogin'), 'info'); window.App?.openAuthModal?.('login'); return; }
      const id = btn.dataset.acFav, ids = await this.load(), on = !ids.has(id);
      btn.disabled = true;
      try {
        await api(`/api/v1/experience/favourites/${encodeURIComponent(id)}`, { method: on ? 'PUT' : 'DELETE' });
        on ? ids.add(id) : ids.delete(id);
        document.querySelectorAll(`[data-ac-fav="${CSS.escape(id)}"]`).forEach(b => this.paint(b, on));
      } catch (err) { toast(err.message, 'error'); } finally { btn.disabled = false; }
    }, true);
    window.addEventListener('astro:authchange', () => { this.ids = null; this.sync(document); });

    // Cards are rendered in many places (directory, home, modals); enhance whichever ones appear.
    let timer = null;
    new MutationObserver((mutations) => {
      const added = mutations.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches?.('.ac2') || n.querySelector?.('.ac2'))));
      if (added) { clearTimeout(timer); timer = setTimeout(() => window.AstrologerCardComponent?.enhance?.(document), 60); }
    }).observe(document.body, { childList: true, subtree: true });
  }
};
