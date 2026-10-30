// Service worker registration, the "install app" banner, the "new version" prompt and the offline strip.
import { px } from '../../utils/premium-copy.js';
import { esc } from '../../utils/shop.js';

const DISMISS_KEY = 'astro_install_dismissed_at';
const DISMISS_DAYS = 14;

const dismissedRecently = () => {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_DAYS * 864e5; } catch (e) { return false; }
};
const remember = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* storage unavailable */ } };
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const PwaInstall = {
  deferred: null,
  banner: null,

  init() {
    this.registerWorker();
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e;
      if (!dismissedRecently() && !standalone()) setTimeout(() => this.show('install'), 20000);
    });
    window.addEventListener('appinstalled', () => { this.deferred = null; this.hide(); });
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone();
    if (isIos && !dismissedRecently()) setTimeout(() => this.show('ios'), 25000);
    window.addEventListener('offline', () => this.offline(true));
    window.addEventListener('online', () => this.offline(false));
    if (!navigator.onLine) this.offline(true);
  },

  registerWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    const start = () => navigator.serviceWorker.register('/sw.js').then((reg) => {
      const waiting = () => { if (reg.waiting && navigator.serviceWorker.controller) this.show('update', reg.waiting); };
      waiting();
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed') waiting(); });
      });
    }).catch(() => {});
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
  },

  show(kind, worker) {
    if (this.banner || (kind !== 'update' && (dismissedRecently() || standalone()))) return;
    const el = document.createElement('div');
    el.className = 'pf-install';
    el.setAttribute('role', 'dialog');
    const body = kind === 'update' ? `<b>${esc(px('pwa.update'))}</b>` : `<b>${esc(px('pwa.installTitle'))}</b><span>${esc(px(kind === 'ios' ? 'pwa.iosBody' : 'pwa.installBody'))}</span>`;
    const primary = kind === 'ios' ? '' : `<button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-pwa-go>${esc(px(kind === 'update' ? 'pwa.refresh' : 'pwa.install'))}</button>`;
    el.innerHTML = `<div>${body}</div><div class="pf-install-actions">${primary}<button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-pwa-close>${esc(px('pwa.later'))}</button></div>`;
    el.querySelector('[data-pwa-close]').addEventListener('click', () => { if (kind !== 'update') remember(); this.hide(); });
    el.querySelector('[data-pwa-go]')?.addEventListener('click', async () => {
      if (kind === 'update') {
        navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
        worker?.postMessage({ type: 'SKIP_WAITING' });
      } else if (this.deferred) {
        this.deferred.prompt();
        await this.deferred.userChoice.catch(() => {});
        this.deferred = null;
      }
      this.hide();
    });
    if (kind === 'update') el.classList.add('pf-install--update');
    document.body.appendChild(el);
    this.banner = el;
    // An update notice should not sit over the page: tuck it away after a while, it returns on the next visit.
    if (kind === 'update') setTimeout(() => { if (this.banner === el) this.hide(); }, 15000);
  },

  hide() { this.banner?.remove(); this.banner = null; },

  offline(isOffline) {
    let bar = document.getElementById('pf-offline');
    if (isOffline && !bar) {
      bar = document.createElement('div');
      bar.id = 'pf-offline';
      bar.className = 'pf-offline';
      bar.setAttribute('role', 'status');
      bar.textContent = px('pwa.offline');
      document.body.appendChild(bar);
    } else if (!isOffline && bar) {
      bar.textContent = px('pwa.online');
      bar.style.background = '#047857';
      setTimeout(() => bar.remove(), 2200);
    }
  }
};
