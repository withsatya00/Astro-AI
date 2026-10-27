import { esc, api, t } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

const POLL_MS = 60000;

/** Bell in the navbar showing booking, order and listing updates for the current visitor. */
export class NotificationBell {
  static btn = null;
  static panel = null;
  static timer = null;
  static items = [];
  static unread = 0;

  static mount() {
    if (this.btn || document.getElementById('nb-bell')) return;
    const anchor = document.getElementById('btn-nav-wallet');
    if (!anchor) return;

    const wrap = document.createElement('div');
    wrap.className = 'nb-wrap';
    wrap.setAttribute('translate', 'no');
    wrap.innerHTML = `
      <button type="button" id="nb-bell" class="nb-bell" aria-haspopup="true" aria-expanded="false">
        <span aria-hidden="true">🔔</span><span id="nb-count" class="nb-count" hidden>0</span>
      </button>
      <div id="nb-panel" class="nb-panel" hidden>
        <div class="nb-head"><strong id="nb-title"></strong><button type="button" id="nb-readall" class="nb-link"></button></div>
        <div id="nb-list" class="nb-list"></div>
      </div>`;
    anchor.parentElement.insertBefore(wrap, anchor);

    this.btn = wrap.querySelector('#nb-bell');
    this.panel = wrap.querySelector('#nb-panel');
    this.btn.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });
    wrap.querySelector('#nb-readall').addEventListener('click', () => this.readAll());
    wrap.querySelector('#nb-list').addEventListener('click', (e) => {
      const item = e.target.closest('[data-nid]');
      if (item) this.open(item.getAttribute('data-nid'), item.getAttribute('data-link'));
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) this.close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });

    this.labels();
    window.addEventListener('astro:languagechange', () => { this.labels(); this.refresh(); });
    this.refresh();
    this.timer = setInterval(() => { if (!document.hidden) this.refresh(); }, POLL_MS);
  }

  static async refresh() {
    if (!this.btn) return;
    try {
      const d = await api(`/api/v1/notifications?lang=${currentLang()}`);
      this.items = d.notifications || [];
      this.unread = d.unread || 0;
      this.paint();
    } catch (e) { /* the bell is optional; stay quiet */ }
  }

  static labels() {
    document.getElementById('nb-title').textContent = t('nb.title');
    document.getElementById('nb-readall').textContent = t('nb.readAll');
    this.btn.setAttribute('aria-label', t('nb.aria'));
  }

  static paint() {
    const count = document.getElementById('nb-count');
    count.textContent = this.unread > 9 ? '9+' : this.unread;
    count.hidden = !this.unread;
    document.getElementById('nb-list').innerHTML = this.items.length ? this.items.map(n => `
      <button type="button" class="nb-item ${n.is_read ? '' : 'is-unread'}" data-nid="${esc(n.id)}" data-link="${esc(n.link || '')}">
        <strong>${esc(n.title)}</strong><span>${esc(n.body)}</span><small>${n.created_at ? new Date(n.created_at).toLocaleString(currentLang() === 'hi' ? 'hi-IN' : 'en-IN') : ''}</small>
      </button>`).join('') : `<p class="nb-empty">${esc(t('nb.empty'))}</p>`;
  }

  static toggle() { this.panel.hidden ? this.openPanel() : this.close(); }

  static openPanel() {
    this.panel.hidden = false;
    this.btn.setAttribute('aria-expanded', 'true');
    this.refresh();
  }

  static close() {
    if (!this.panel) return;
    this.panel.hidden = true;
    this.btn.setAttribute('aria-expanded', 'false');
  }

  static async open(id, link) {
    try { await api(`/api/v1/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' }); } catch (e) { /* ignore */ }
    this.close();
    this.refresh();
    if (link && window.Router && window.Router.navigate) window.Router.navigate(link);
  }

  static async readAll() {
    try { await api('/api/v1/notifications/read-all', { method: 'POST' }); } catch (e) { /* ignore */ }
    this.refresh();
  }
}

if (typeof window !== 'undefined') window.NotificationBell = NotificationBell;
export default NotificationBell;
