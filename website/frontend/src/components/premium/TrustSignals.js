// Trust figures for an astrologer's profile. Every figure comes from platform records; a figure with too little data is left out.
import { api, esc } from '../../utils/shop.js';
import { px, pxLang } from '../../utils/premium-copy.js';

export const TrustSignals = {
  /** Loads the figures once; callers render the pieces they need with panel() and summary(). */
  load(astrologer) {
    return api(`/api/v1/astrologers/${encodeURIComponent(astrologer.slug || astrologer.id)}/trust`);
  },

  /** Average + bar chart shown at the top of the reviews section. */
  summary(t, rating, count) {
    const total = Object.values(t.rating_spread).reduce((a, b) => a + b, 0);
    if (!total) return '';
    const bars = [5, 4, 3, 2, 1].map(n => `<div><span>${n} ★</span><i><b style="width:${Math.round(100 * t.rating_spread[n] / total)}%"></b></i><span>${t.rating_spread[n]}</span></div>`).join('');
    return `<div class="pv-rating-sum"><div class="pv-rating-big"><strong>${Number(rating).toFixed(1)}</strong><small>${esc(px('pv.outOf'))}</small><small>${esc(px('pv.basedOn', { n: count }))}</small></div><div class="pf-spread">${bars}</div></div>`;
  },

  /** Trust card: verification, volume, repeat clients, reply time. */
  panel(t) {
    const lang = pxLang() === 'hi' ? 'hi-IN' : 'en-IN';
    const stats = [
      t.consultations > 0 && [t.consultations.toLocaleString(lang), px('tr.consults')],
      t.experience_years > 0 && [t.experience_years + '+', px('tr.experience')],
      t.repeat_client_percent != null && [t.repeat_client_percent + '%', px('tr.repeat')],
      t.median_reply_seconds != null && [t.median_reply_seconds < 90 ? px('tr.sec', { n: t.median_reply_seconds }) : px('tr.min', { n: Math.round(t.median_reply_seconds / 60) }), px('tr.reply')],
      t.avg_session_minutes != null && [px('tr.min', { n: t.avg_session_minutes }), px('tr.session')],
    ].filter(Boolean);
    return `<h3 class="profile-card-heading"><span aria-hidden="true">🛡️</span> <span>${esc(px('tr.title'))}</span></h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${t.verified ? `<span class="pf-chip pf-chip--ok">✓ ${esc(px('tr.verified'))}</span>` : ''}</div>
      ${stats.length ? `<div class="pf-trust-grid">${stats.map(([v, l]) => `<div class="pf-trust-stat"><strong>${esc(v)}</strong><small>${esc(l)}</small></div>`).join('')}</div>` : ''}
      ${t.verified_reviews > 0 ? `<p class="pf-muted" style="margin:6px 0 0">${esc(px('tr.verifiedReviews', { n: t.verified_reviews }))}</p>` : ''}
      <p class="pf-muted" style="margin:12px 0 0">${esc(px('tr.thin'))}</p>`;
  }
};
