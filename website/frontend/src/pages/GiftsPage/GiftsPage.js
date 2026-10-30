// Gifts & Festival Packs: send wallet credit as a gift card, redeem one, and buy a ready festival set.
import { api, esc, money, postJson, toast, isSignedIn, requireLogin, mediaUrl, fmtDate } from '../../utils/shop.js';
import { px, pxLang } from '../../utils/premium-copy.js';
import { CartStore } from '../../utils/cart-store.js';

const THEME_ICON = { diwali: '🪔', blessing: '🕉️', birthday: '🎂', wedding: '💍' };

export class GiftsPageComponent {
  static root = null;
  static tab = 'cards';
  static gifts = null;
  static packs = null;
  static form = { amount: 501, theme: 'blessing', recipient_name: '', message: '' };
  static created = null;

  static mount(container) {
    this.root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.root) return;
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('submit', (e) => this.onSubmit(e));
    this.root.addEventListener('input', (e) => this.onInput(e));
    window.addEventListener('astro:languagechange', () => { if (this.root.offsetParent !== null) this.open(); });
    window.addEventListener('astro:authchange', () => { this.gifts = null; if (this.root.offsetParent !== null) this.open(); });
  }

  static async open(tab) {
    if (!this.root) return;
    if (tab) this.tab = tab;
    this.created = null;
    this.frame('<div class="pf-skeleton"></div>');
    try {
      const jobs = [api(`/api/v1/experience/festival-packs?lang=${pxLang()}`)];
      if (isSignedIn()) jobs.push(api('/api/v1/experience/gifts'));
      const [packs, gifts] = await Promise.all(jobs);
      this.packs = packs.packs;
      this.gifts = gifts || null;
      if (this.gifts && !this.gifts.amounts.includes(this.form.amount)) this.form.amount = this.gifts.amounts[1] || this.gifts.amounts[0];
      this.render();
    } catch (err) { this.frame(`<div class="pf-card"><p>${esc(err.message)}</p></div>`); }
  }

  static frame(inner) {
    this.root.innerHTML = `<div class="pf-page" translate="no"><header class="pf-hero"><span class="pf-eyebrow">${esc(px('gf.tab.cards'))} · ${esc(px('gf.tab.packs'))}</span>
      <h1>${esc(px('gf.title'))}</h1><p>${esc(px('gf.sub'))}</p></header>
      <div class="pf-tabs" role="tablist">${['cards', 'packs'].map(k => `<button type="button" role="tab" aria-selected="${this.tab === k}" class="${this.tab === k ? 'is-active' : ''}" data-gift-tab="${k}">${esc(px('gf.tab.' + k))}</button>`).join('')}</div>
      <div data-gift-body>${inner}</div></div>`;
  }

  static render() {
    this.frame(this.tab === 'cards' ? this.cardsHtml() : this.packsHtml());
  }

  // ------------------------------------------------------------------ gift cards
  static preview(f) {
    const to = f.recipient_name ? px('gf.to2', { name: f.recipient_name }) : px('gf.cardFrom');
    return `<div class="pf-gift-card" data-theme="${esc(f.theme)}" data-gift-preview><span class="pf-gift-icon" aria-hidden="true">${THEME_ICON[f.theme]}</span>
      <div><small>${esc(px('gf.cardBrand'))}</small><div style="margin-top:6px;font-size:.9rem;font-weight:700">${esc(to)}</div></div>
      <div><div class="pf-gift-amount">${money(f.amount)}</div><p class="pf-gift-msg">${esc(f.message || px('gf.defaultMsg'))}</p></div></div>`;
  }

  static cardsHtml() {
    if (!this.gifts) {
      return `<div class="pf-card" style="text-align:center"><h3>${esc(px('gf.signin'))}</h3><button class="shop-btn shop-btn--gold" data-gift-login>${esc(px('gf.signinBtn'))}</button></div>`;
    }
    const f = this.form, g = this.gifts;
    if (this.created) return this.readyHtml(this.created);
    const sent = g.sent.length ? g.sent.map(c => `<div class="pf-row"><span><b>${money(c.amount)}</b> · ${esc(c.recipient_name || '—')}<br><code>${esc(c.code)}</code></span>
        <span class="pf-chip ${c.status === 'REDEEMED' ? 'pf-chip--ok' : ''}">${esc(px(c.status === 'REDEEMED' ? 'gf.statusRedeemed' : 'gf.statusIssued'))}</span></div>`).join('') : `<p class="pf-muted">${esc(px('gf.noSent'))}</p>`;
    const got = g.received.map(c => `<div class="pf-row"><span><b>${money(c.amount)}</b></span><span class="pf-muted">${esc(fmtDate(c.redeemed_at, pxLang()))}</span></div>`).join('');
    return `<div class="pf-gift-layout"><div class="pf-form-col"><div class="pf-card">${this.preview(f)}</div>
        <div class="pf-card"><h3 style="margin:0 0 12px">${esc(px('gf.redeemTitle'))}</h3><form data-gift-redeem style="display:flex;gap:10px;flex-wrap:wrap">
          <input class="pf-input" name="code" required minlength="6" maxlength="24" placeholder="${esc(px('gf.redeemPh'))}" style="flex:1;min-width:180px;text-transform:uppercase" autocomplete="off">
          <button class="shop-btn shop-btn--line" type="submit">${esc(px('gf.redeem'))}</button></form></div></div>
      <div class="pf-form-col"><form class="pf-card pf-form-col" data-gift-buy>
        <div><h3 style="margin:0 0 10px">${esc(px('gf.pickAmount'))}</h3><div class="pf-amounts">${g.amounts.map(a => `<button type="button" class="${a === f.amount ? 'is-active' : ''}" data-gift-amount="${a}">${money(a)}</button>`).join('')}</div></div>
        <div><h3 style="margin:0 0 10px">${esc(px('gf.pickTheme'))}</h3><div class="pf-themes">${g.themes.map(t => `<button type="button" class="${t === f.theme ? 'is-active' : ''}" data-gift-theme="${t}">${THEME_ICON[t]} ${esc(px('gf.theme.' + t))}</button>`).join('')}</div></div>
        <label class="pf-field">${esc(px('gf.to'))}<input class="pf-input" name="recipient_name" maxlength="120" value="${esc(f.recipient_name)}" placeholder="${esc(px('gf.toPh'))}"></label>
        <label class="pf-field">${esc(px('gf.msg'))}<textarea class="pf-textarea" name="message" rows="3" maxlength="300" placeholder="${esc(px('gf.msgPh'))}">${esc(f.message)}</textarea></label>
        <button class="shop-btn shop-btn--gold shop-btn--block" type="submit">${esc(px('gf.buy', { amount: money(f.amount) }))}</button><p class="pf-muted" style="margin:0">${esc(px('gf.walletNote'))}</p></form>
        <div class="pf-card"><h3 style="margin:0 0 12px">${esc(px('gf.history'))}</h3><div class="pf-list">${sent}</div>${got ? `<h3 style="margin:20px 0 12px">${esc(px('gf.received'))}</h3><div class="pf-list">${got}</div>` : ''}</div></div></div>`;
  }

  static readyHtml(c) {
    const text = px('gf.shareText', { amount: money(c.amount), code: c.code, url: location.origin });
    return `<div class="pf-card pf-ready" style="max-width:520px;margin:0 auto"><h2 style="margin:0">${esc(px('gf.readyTitle'))}</h2>
      ${this.preview({ amount: c.amount, theme: c.theme, recipient_name: c.recipient_name, message: c.message })}
      <div class="pf-code"><code>${esc(c.code)}</code><button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-gift-copy="${esc(c.code)}">${esc(px('gf.copy'))}</button></div>
      <a class="shop-btn shop-btn--gold" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(text)}">${esc(px('gf.share'))}</a>
      <button type="button" class="shop-btn shop-btn--line" data-gift-again>${esc(px('gf.another'))}</button></div>`;
  }

  // ------------------------------------------------------------------ festival packs
  static packsHtml() {
    if (!this.packs.length) return `<div class="pf-card" style="text-align:center"><p>${esc(px('fp.empty'))}</p></div>`;
    return `<div class="pf-pack-grid">${this.packs.map(p => {
      const when = p.days_left == null ? px('fp.evergreen') : p.days_left === 0 ? px('fp.today') : px('fp.daysLeft', { n: p.days_left });
      return `<article class="pf-pack"><div class="pf-pack-top"><div><span class="pf-pack-emoji" aria-hidden="true">${esc(p.emoji)}</span><h3>${esc(p.title)}</h3><p>${esc(p.blurb)}</p></div>
          <span class="pf-countdown">${esc(when)}</span></div>
        <div><small class="pf-muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em">${esc(px('fp.includes'))}</small>
          <div class="pf-pack-items" style="margin-top:8px">${p.products.map(m => `<div class="pf-pack-item">${m.image_url ? `<img src="${esc(mediaUrl(m.image_url))}" alt="" loading="lazy">` : '<img alt="">'}<span>${esc(m.title)}</span><b>${money(m.price)}</b></div>`).join('')}</div></div>
        <div class="pf-pack-foot"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b>${esc(px('fp.total', { amount: money(p.total) }))}</b>
            <span class="pf-save">${esc(px('fp.save', { amount: money(p.save), code: p.coupon }))}</span></div>
          <button type="button" class="shop-btn shop-btn--gold" data-pack-add="${esc(p.id)}">${esc(px('fp.addAll'))}</button>
          ${p.temple ? `<a class="shop-btn shop-btn--line" href="/mandir-seva/${esc(p.temple.slug)}" data-nav-link>${esc(px('fp.seva', { name: p.temple.name }))}</a>` : ''}</div></article>`;
    }).join('')}</div>`;
  }

  // ------------------------------------------------------------------ events
  static onInput(e) {
    const n = e.target.name;
    if (n === 'recipient_name' || n === 'message') {
      this.form[n] = e.target.value;
      const holder = this.root.querySelector('[data-gift-preview]');
      if (holder) holder.outerHTML = this.preview(this.form);
    }
  }

  static async onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.giftTab) { this.tab = b.dataset.giftTab; this.render(); }
    else if (b.hasAttribute('data-gift-login')) requireLogin('auth.needed');
    else if (b.dataset.giftAmount) { this.form.amount = Number(b.dataset.giftAmount); this.keepTyped(); this.render(); }
    else if (b.dataset.giftTheme) { this.form.theme = b.dataset.giftTheme; this.keepTyped(); this.render(); }
    else if (b.dataset.giftCopy) { try { await navigator.clipboard.writeText(b.dataset.giftCopy); toast(px('gf.copied'), 'success'); } catch (err) { toast(b.dataset.giftCopy, 'info'); } }
    else if (b.hasAttribute('data-gift-again')) { this.created = null; this.render(); }
    else if (b.dataset.packAdd) this.addPack(b);
  }

  static keepTyped() {
    const form = this.root.querySelector('[data-gift-buy]');
    if (form) { this.form.recipient_name = form.recipient_name.value; this.form.message = form.message.value; }
  }

  static async onSubmit(e) {
    if (e.target.matches('[data-gift-buy]')) {
      e.preventDefault();
      this.keepTyped();
      const btn = e.target.querySelector('[type=submit]');
      btn.disabled = true; btn.textContent = px('gf.buying');
      try {
        this.created = await postJson('/api/v1/experience/gifts/buy', this.form);
        this.gifts = await api('/api/v1/experience/gifts');
        this.form.message = ''; this.form.recipient_name = '';
        window.App?.refreshWalletUI?.();
        this.render();
      } catch (err) { toast(err.message, 'error'); this.render(); }
    } else if (e.target.matches('[data-gift-redeem]')) {
      e.preventDefault();
      const code = e.target.code.value;
      try {
        const r = await postJson('/api/v1/experience/gifts/redeem', { code });
        toast(px('gf.redeemed', { amount: money(r.amount) }), 'success');
        window.App?.refreshWalletUI?.();
        this.gifts = await api('/api/v1/experience/gifts');
        this.render();
      } catch (err) { toast(err.message, 'error'); }
    }
  }

  static async addPack(btn) {
    const pack = this.packs.find(p => p.id === btn.dataset.packAdd);
    if (!pack) return;
    pack.products.forEach(m => CartStore.add(m.id, 1, m.options || {}));
    toast(px('fp.added', { code: pack.coupon }), 'success');
    try { await navigator.clipboard.writeText(pack.coupon); } catch (err) { /* clipboard is optional */ }
  }
}

window.GiftsPageComponent = GiftsPageComponent;
