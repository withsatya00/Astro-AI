// My Rewards: loyalty points, Premium membership, referral, coupons and birthday / anniversary reminders.
import { esc, money, toast, api, postJson, t, requireLogin, isSignedIn, goTo, fmtDate } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'];

export class RewardsPageComponent {
  static root = null;
  static data = null;
  static reminders = [];

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    this.root = target;
    window.addEventListener('astro:languagechange', () => { if (this.root.offsetParent !== null) this.open(); });
    return target;
  }

  static get lang() { return currentLang(); }

  static async open() {
    if (!this.root) return;
    if (!isSignedIn()) {
      this.root.innerHTML = `<div class="shop-page"><div class="shop-empty"><b>${esc(t('rw.signin'))}</b><br><button type="button" class="shop-btn shop-btn--gold" id="rw-login">${esc(t('auth.signInBtn'))}</button></div></div>`;
      this.root.querySelector('#rw-login').addEventListener('click', () => requireLogin('auth.neededRewards'));
      return;
    }
    this.root.innerHTML = `<div class="shop-page"><div class="shop-loading"><div class="shop-spinner"></div></div></div>`;
    try {
      const [data, rem] = await Promise.all([api(`/api/v1/rewards/summary?lang=${this.lang}`), api('/api/v1/mandir/reminders')]);
      this.data = data;
      this.reminders = rem.reminders;
      this.render();
    } catch (err) { this.root.innerHTML = `<div class="shop-page"><div class="shop-empty">${esc(err.message)}</div></div>`; }
  }

  static render() {
    const d = this.data;
    const hi = this.lang === 'hi';
    const months = hi ? MONTHS_HI : MONTHS_EN;
    const m = d.membership;
    this.root.innerHTML = `
    <div class="shop-page rw">
      <h1 class="rw-title">🎁 ${esc(t('rw.title'))}</h1>
      <div class="rw-cards">
        <div class="rw-card"><small>${esc(t('rw.points'))}</small><strong>${d.points}</strong><span>${esc(t('rw.worth', { amount: money(d.points_worth) }))}</span></div>
        <div class="rw-card ${m ? 'rw-card--gold' : ''}"><small>${esc(t('rw.membership'))}</small><strong>${m ? esc(t('rw.member')) : esc(t('rw.notMember'))}</strong><span>${m ? esc(t('rw.until', { date: fmtDate(m.expires_at, this.lang) })) : esc(t('rw.joinHint'))}</span></div>
        <div class="rw-card"><small>${esc(t('rw.referral'))}</small><strong class="rw-code">${esc(d.referral_code)}</strong><span>${esc(t('rw.referHint', { n: d.rules.referral_bonus }))}</span></div>
      </div>

      <section class="pp-section"><h2>👑 ${esc(t('rw.premium'))}</h2>
        <ul class="pp-assure"><li>✨ ${esc(t('rw.b1', { n: Math.round(d.rules.member_mall_discount * 100) }))}</li><li>📦 ${esc(t('rw.b2'))}</li><li>⭐ ${esc(t('rw.b3'))}</li></ul>
        <div class="rw-plans">${d.plans.map(p => `<div class="rw-plan"><b>${esc(t('rw.plan.' + p.plan))}</b><strong>${money(p.price)}</strong><small>${esc(t('rw.days', { n: p.days }))}</small>
          <button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-plan="${esc(p.plan)}">${esc(t(m ? 'rw.extend' : 'rw.join'))}</button></div>`).join('')}</div></section>

      <section class="pp-section"><h2>🤝 ${esc(t('rw.referTitle'))}</h2>
        <p>${esc(t('rw.referBody', { n: d.rules.referral_bonus }))}</p>
        <div class="shop-coupon"><input class="shop-input" readonly value="${esc(d.referral_code)}" id="rw-mycode"><button type="button" class="shop-btn shop-btn--line" id="rw-copy">${esc(t('rw.copy'))}</button>
          <a class="shop-btn shop-btn--primary" id="rw-share" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(t('rw.shareText', { code: d.referral_code }) + ' ' + location.origin)}">${esc(t('md.video.share'))}</a></div>
        ${d.referred ? `<p class="shop-hint">${esc(t('rw.referredOk'))}</p>` : `<div class="shop-coupon" style="margin-top:12px"><input class="shop-input" id="rw-friend" maxlength="12" placeholder="${esc(t('rw.friendPh'))}" style="text-transform:uppercase"><button type="button" class="shop-btn shop-btn--line" id="rw-apply">${esc(t('co.apply'))}</button></div><p class="shop-hint">${esc(t('rw.friendHint'))}</p>`}</section>

      <section class="pp-section"><h2>🏷️ ${esc(t('rw.coupons'))}</h2>
        ${d.coupons.length ? d.coupons.map(c => `<div class="rw-coupon"><b>${esc(c.code)}</b><span>${esc(c.description || '')}</span><small>${esc(t('rw.scope.' + c.applies_to))}</small></div>`).join('') : `<p class="shop-hint">${esc(t('rw.noCoupons'))}</p>`}</section>

      <section class="pp-section"><h2>🎂 ${esc(t('rw.reminders'))}</h2>
        <p class="shop-hint" style="font-size:.82rem">${esc(t('rw.remindersHint'))}</p>
        <form id="rw-rem-form" class="rw-rem-form">
          <input class="shop-input" id="rw-rem-name" required minlength="2" maxlength="150" placeholder="${esc(t('rw.remName'))}">
          <select class="shop-select" id="rw-rem-kind"><option value="birthday">${esc(t('rw.birthday'))}</option><option value="anniversary">${esc(t('rw.anniversary'))}</option></select>
          <select class="shop-select" id="rw-rem-day">${Array.from({ length: 31 }, (_, i) => `<option>${i + 1}</option>`).join('')}</select>
          <select class="shop-select" id="rw-rem-month">${months.map((mo, i) => `<option value="${i + 1}">${esc(mo)}</option>`).join('')}</select>
          <button type="submit" class="shop-btn shop-btn--gold">${esc(t('rw.addRem'))}</button></form>
        ${this.reminders.map(r => `<div class="rw-rem"><span>${r.kind === 'birthday' ? '🎂' : '💑'} <b>${esc(r.person_name)}</b> - ${r.day} ${esc(months[r.month - 1])}</span>
          <span><a class="shop-btn shop-btn--line shop-btn--sm" href="/mandir-seva">${esc(t('rw.bookSeva'))}</a> <button type="button" class="shop-btn shop-btn--danger shop-btn--sm" data-del="${esc(r.id)}">${esc(t('rw.remove'))}</button></span></div>`).join('')}</section>

      <section class="pp-section"><h2>${esc(t('rw.history'))}</h2>
        ${d.ledger.length ? `<table class="tp-table">${d.ledger.map(e => `<tr><td>${esc(fmtDate(e.time, this.lang))}</td><td>${esc(t('rw.reason.' + e.reason))}</td><td style="text-align:right"><b style="color:${e.points > 0 ? '#047857' : '#b45309'}">${e.points > 0 ? '+' : ''}${e.points}</b></td></tr>`).join('')}</table>` : `<p class="shop-hint">${esc(t('rw.noHistory'))}</p>`}</section>
    </div>`;
    this.bind();
  }

  static bind() {
    const r = this.root;
    r.querySelectorAll('[data-plan]').forEach(b => b.addEventListener('click', async () => {
      const plan = b.getAttribute('data-plan');
      if (!confirm(t('rw.confirmPlan', { plan: t('rw.plan.' + plan) }))) return;
      try { await postJson('/api/v1/rewards/membership', { plan }); toast(t('rw.joined'), 'success'); if (window.App && window.App.refreshWalletUI) window.App.refreshWalletUI(); this.open(); }
      catch (err) { toast(err.message, 'error'); }
    }));
    r.querySelector('#rw-copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(this.data.referral_code); toast(t('rw.copied'), 'success'); } catch (e) { r.querySelector('#rw-mycode').select(); }
    });
    const apply = r.querySelector('#rw-apply');
    if (apply) apply.addEventListener('click', async () => {
      try { await postJson('/api/v1/rewards/referral', { code: r.querySelector('#rw-friend').value.trim() }); toast(t('rw.referredOk'), 'success'); this.open(); }
      catch (err) { toast(err.message, 'error'); }
    });
    r.querySelector('#rw-rem-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await postJson('/api/v1/mandir/reminders', { person_name: r.querySelector('#rw-rem-name').value.trim(), kind: r.querySelector('#rw-rem-kind').value,
          day: +r.querySelector('#rw-rem-day').value, month: +r.querySelector('#rw-rem-month').value });
        toast(t('rw.remAdded'), 'success');
        this.open();
      } catch (err) { toast(err.message, 'error'); }
    });
    r.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      try { await api(`/api/v1/mandir/reminders/${encodeURIComponent(b.getAttribute('data-del'))}`, { method: 'DELETE' }); this.open(); }
      catch (err) { toast(err.message, 'error'); }
    }));
    r.querySelectorAll('a[href^="/"]').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); goTo(a.getAttribute('href')); }));
  }
}

if (typeof window !== 'undefined') window.RewardsPageComponent = RewardsPageComponent;
export default RewardsPageComponent;
