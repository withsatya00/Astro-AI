// Membership benefits (with the monthly bonus claim) and referral progress, shown inside the Rewards page.
import { api, esc, money, postJson, toast } from '../../utils/shop.js';
import { px } from '../../utils/premium-copy.js';

export const RewardsExtras = {
  /** Premium benefits block: what a member gets, what they saved, and the monthly bonus button. */
  benefitsHtml(d) {
    const r = d.rules, b = d.benefits || {};
    const list = `<div class="pf-benefits"><div class="pf-benefit"><span>🗓️</span>${esc(px('rw2.consult', { n: Math.round(r.member_consult_discount * 100) }))}</div>
      <div class="pf-benefit"><span>⚡</span>${esc(px('rw2.priority'))}</div><div class="pf-benefit"><span>💰</span>${esc(px('rw2.bonus', { amount: money(r.member_monthly_bonus) }))}</div></div>`;
    if (!b.active) return `<p class="pf-muted" style="margin:10px 0 0">${esc(px('rw2.unlock', { n: Math.round(r.member_consult_discount * 100) }))}</p>${list}`;
    const claim = b.bonus_claimed
      ? `<span class="pf-chip pf-chip--ok">✓ ${esc(px('rw2.claimed'))}</span>`
      : `<button type="button" class="shop-btn shop-btn--gold" data-claim-bonus>${esc(px('rw2.claim', { amount: money(b.bonus_amount) }))}</button>`;
    return `<h3 style="margin:14px 0 0">${esc(px('rw2.benefits'))}</h3>${list}<div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">${claim}
      <span class="pf-muted">${esc(px('rw2.saved', { amount: money(b.saved_consultations) }))}</span></div>`;
  },

  referralPlaceholder() { return '<section class="pp-section" data-referral-stats></section>'; },

  async mountReferrals(root) {
    const host = root.querySelector('[data-referral-stats]');
    if (!host) return;
    try {
      const s = await api('/api/v1/rewards/referrals');
      if (!host.isConnected) return;
      const friends = s.friends.length ? s.friends.slice(0, 8).map(f => `<div class="pf-row"><span>${esc(f.name)}</span><span class="pf-chip ${f.completed ? 'pf-chip--ok' : ''}">${esc(px(f.completed ? 'rw2.friendDone' : 'rw2.friendPending'))}</span></div>`).join('')
        : `<p class="pf-muted">${esc(px('rw2.noFriends'))}</p>`;
      host.innerHTML = `<h2>👥 ${esc(px('rw2.refTitle'))}</h2>
        <div class="pf-stats"><div class="pf-stat"><small>${esc(px('rw2.joined'))}</small><strong>${s.joined}</strong></div><div class="pf-stat"><small>${esc(px('rw2.ordered'))}</small><strong>${s.completed}</strong></div>
          <div class="pf-stat"><small>${esc(px('rw2.earned'))}</small><strong>${s.points_earned}</strong></div></div>
        <h3 style="margin:0 0 4px">${esc(px('rw2.milestones'))}</h3><div class="pf-miles">${s.milestones.map(m => `<div class="pf-mile ${m.reached ? 'is-reached' : ''}"><span>${m.reached ? '✓' : '○'} ${esc(px('rw2.milestone', { n: m.need, pts: m.points }))}</span></div>`).join('')}</div>
        <div class="pf-list" style="margin-top:14px">${friends}</div>
        <p style="margin:14px 0 0"><a class="shop-btn shop-btn--line" href="/gifts" data-nav-link>🎁 ${esc(px('rw2.giftsLink'))}</a></p>`;
    } catch (e) { host.remove(); }
  },

  /** Wires the claim button; `refresh` reloads the Rewards page afterwards. */
  bind(root, refresh) {
    root.querySelector('[data-claim-bonus]')?.addEventListener('click', async (e) => {
      e.currentTarget.disabled = true;
      try {
        const r = await postJson('/api/v1/rewards/membership/claim-bonus', {});
        toast(px('rw2.claimOk', { amount: money(r.amount) }), 'success');
        window.App?.refreshWalletUI?.();
        refresh();
      } catch (err) { toast(err.message, 'error'); e.currentTarget.disabled = false; }
    });
  }
};
