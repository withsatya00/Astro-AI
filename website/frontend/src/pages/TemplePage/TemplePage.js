// Temple page: live darshan, aarti timings, sevas, verified priests and packages for one temple.
import { esc, money, toast, api, mediaUrl, t, requireLogin, goTo } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { proofLineHtml, reviewsSectionHtml } from '../../components/sampleProof.js';
import { skeleton, x } from '../../utils/experience.js';
import { servicePanel } from '../../components/ServiceInfo.js';
import { ChadhavaExperience } from '../../components/ChadhavaExperience.js';
import { loadSevaGalleries, sevaGallery, bindSevaGalleries } from '../../components/SevaGallery.js';

export class TemplePageComponent {
  static root = null;
  static slug = null;
  static temple = null;

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    this.root = target;
    window.addEventListener('astro:languagechange', () => { if (this.root.offsetParent !== null && this.slug) this.open(this.slug); });
    return target;
  }

  static async open(slug) {
    if (!this.root) return;
    const request = this.openRequest = (this.openRequest || 0) + 1;
    this.slug = slug;
    this.root.innerHTML = `<div class="shop-page">${skeleton(2)}</div>`;
    window.scrollTo({ top: 0 });
    try {
      const d = await api(`/api/v1/mandir/temples/${encodeURIComponent(slug)}?lang=${currentLang()}`);
      await loadSevaGalleries();
      if (request !== this.openRequest) return;
      this.temple = d;
      this.render(d);
    } catch (err) {
      if (request !== this.openRequest) return;
      this.root.innerHTML = `<div class="shop-page"><div class="shop-empty"><b>${esc(t('tp.notFound'))}</b>${esc(err.message)}<br><br><button type="button" class="shop-btn shop-btn--gold" id="tp-retry">${esc(x('retry'))}</button> <a class="shop-btn shop-btn--line" href="/mandir-seva">${esc(t('tp.back'))}</a></div></div>`;
      this.root.querySelector('#tp-retry').onclick = () => this.open(slug);
    }
  }

  static chips(d) {
    const prices = d.offerings.map(o => o.price);
    const out = [];
    if (prices.length) out.push(`${t('md.startsFrom')} ${money(Math.min(...prices))}`);
    if (d.offerings.some(o => o.includes_video_proof)) out.push(`📹 ${t('tp.videoProof')}`);
    if (d.live_url) out.push(`📺 ${t('tp.live')}`);
    if (d.offerings.length) out.push(`🪔 ${d.offerings.length} ${t('tp.sevaCount')}`);
    return out;
  }

  static bookCard(d, startFrom) {
    const points = [t('tp.videoProof'), t('pp.trust.pay')];
    return `<section class="tp-book"><small>${esc(t('md.startsFrom'))}</small><strong>${money(startFrom)}</strong>
      <a class="shop-btn shop-btn--gold" href="#tp-sevas" id="tp-jump">🪔 ${esc(t('tp.bookSeva'))}</a>
      <ul>${points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></section>`;
  }

  /** At-a-glance facts, all taken from the temple's own data. */
  static factsHtml(d) {
    const prices = d.offerings.map(o => o.price);
    const rows = [
      [t('tp.deity'), d.deity], [t('tp.location'), `${d.city}, ${d.state}`],
      [t('tp.sevaCount'), String(d.offerings.length)],
      [t('tp.priceRange'), prices.length ? (Math.min(...prices) === Math.max(...prices) ? money(prices[0]) : `${money(Math.min(...prices))} – ${money(Math.max(...prices))}`) : '—'],
      [t('tp.live'), d.live_url ? t('tp.yes') : t('tp.no')],
      [t('tp.videoProof'), d.offerings.some(o => o.includes_video_proof) ? t('tp.yes') : t('tp.no')],
    ];
    return `<section class="pp-section" id="tp-facts"><h2>${esc(t('tp.facts'))}</h2><div class="tp-facts">${rows.map(([k, v]) => `<div class="tp-fact"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div></section>`;
  }

  /** The significance text is written in Hindi, so it is only shown when the site is in Hindi (no mixed-language blocks). */
  static significanceHtml(d) {
    const text = (d.history_significance || '').trim();
    if (!text || (currentLang() === 'hi') !== /[ऀ-ॿ]/.test(text)) return '';
    return `<section class="pp-section" id="tp-significance"><h2>📜 ${esc(t('tp.significance'))}</h2><p>${esc(text)}</p></section>`;
  }

  static render(d) {
    const startFrom = Math.min(...d.offerings.map(o => o.price));
    this.root.innerHTML = `
    <div class="shop-page tp">
      <nav class="pp-crumbs"><a href="/">${esc(currentLang()==='hi'?'होम':'Home')}</a> › <a href="/mandir-seva">${esc(t('tp.mandir'))}</a> › <a href="/mandir-seva/chadhava">${esc(currentLang()==='hi'?'चढ़ावा':'Chadhava')}</a> › <span>${esc(d.name)}</span></nav>
      <section class="tp-sm-hero">
        <div class="tp-sm-hero__media">${sevaGallery(d.slug,d.image_url,d.name)}</div>
        <div class="tp-sm-hero__copy">
          <h1>${esc(d.name)}</h1>
          <p class="tp-sm-hero__meta">🕉️ ${esc(d.deity)}</p><p class="tp-sm-hero__meta">📍 ${esc(d.city)}, ${esc(d.state)}</p>
          ${proofLineHtml()}<p class="tp-sm-hero__desc">${esc(d.description)}</p>
          <div class="tp-chips">${this.chips(d).map(c => `<span class="tp-chip">${esc(c)}</span>`).join('')}</div>
          <button type="button" class="shop-btn shop-btn--gold tp-green" id="tp-jump">${esc(t('tp.bookSeva'))}</button>
        </div>
      </section>

      <section data-temple-chadhava></section>
      <section class="tp-offers" id="tp-sevas"><h2>${esc(currentLang()==='hi'?'चढ़ावा चुनें':'Choose an offering')}</h2>
        ${d.offerings.map(o => `<article class="tp-offer"><div class="tp-offer__text"><strong>${esc(o.title)}</strong><p>${esc(o.description)}</p>${o.includes_video_proof ? `<small>📹 ${esc(t('tp.video'))}</small>` : ''}<b>${money(o.price)}</b></div>
          <div class="tp-offer__buy"><img src="${esc(mediaUrl(d.image_url))}" alt="" loading="lazy"><button type="button" class="tp-add" data-book>+ ${esc(currentLang()==='hi'?'जोड़ें':'Add')}</button></div></article>`).join('')}
      </section>

      ${reviewsSectionHtml('tp-reviews') ? `<div class="tp-reviews">${reviewsSectionHtml('tp-reviews')}</div>` : ''}
      <div class="tp-grid">
        <div>
          ${this.factsHtml(d)}
          <section class="pp-section" id="tp-about"><h2>${esc(t('tp.about'))}</h2><p>${esc(d.description)}</p></section>
          ${this.significanceHtml(d)}

          <section class="pp-section ${d.live_url ? '' : 'tp-slim'}" id="tp-live"><h2>📺 ${esc(t('tp.live'))}</h2>
            ${d.live_url ? `<div class="tp-live"><iframe src="${esc(d.live_url)}" title="${esc(d.name)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
              : `<p class="tp-quiet">${esc(t('tp.noLive'))}</p>`}
          </section>

          ${servicePanel('chadhava')}
        </div>

        <aside>
          <section class="pp-section ${d.aarti_timings.length ? '' : 'tp-slim'}" id="tp-aarti"><h2>🕰️ ${esc(t('tp.aarti'))}</h2>
            ${d.aarti_timings.length ? `<table class="tp-table">${d.aarti_timings.map(a => `<tr><td>${esc(a.name)}</td><td><b>${esc(a.time)}</b></td></tr>`).join('')}</table><p class="shop-hint">${esc(t('tp.aartiHint'))}</p>`
              : `<p class="tp-quiet">${esc(t('tp.noAarti'))}</p>`}</section>

          <section class="pp-section ${d.priests.length ? '' : 'tp-slim'}" id="tp-priests"><h2>🙏 ${esc(t('tp.priests'))}</h2>
            ${d.priests.length ? d.priests.map(p => `<div class="tp-priest">${p.photo_url ? `<img src="${esc(mediaUrl(p.photo_url))}" alt="">` : '<span>🙏</span>'}
              <div><strong>${esc(p.name)}</strong> ${p.verified ? `<span class="shop-pill shop-pill--ok">✓ ${esc(t('cd.verified'))}</span>` : ''}
              <small>${esc(t('cd.years', { n: p.years_experience }))}${p.languages ? ' · ' + esc(p.languages) : ''}</small>${p.bio ? `<p>${esc(p.bio)}</p>` : ''}</div></div>`).join('')
              : `<p class="tp-quiet">${esc(t('tp.noPriests'))}</p>`}</section>

          <section class="pp-section" id="tp-how"><h2>${esc(t('tp.how'))}</h2>
            <ol class="tp-steps"><li>${esc(t('tp.step1'))}</li><li>${esc(t('tp.step2'))}</li><li>${esc(t('tp.step3'))}</li><li>${esc(t('tp.step4'))}</li></ol></section>
        </aside>
      </div>
      <div class="tp-mobilebar"><div><small>${esc(t('md.startsFrom'))}</small><b>${money(startFrom)}</b></div><button type="button" class="shop-btn shop-btn--gold" id="tp-jump-2">🪔 ${esc(t('tp.bookSeva'))}</button></div>
    </div>`;
    bindSevaGalleries(this.root);
    this.root.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => {
      ChadhavaExperience.openForTemple(this.temple).catch(err => toast(err.message, 'error'));
    }));
    ChadhavaExperience.mountTemple(this.root.querySelector('[data-temple-chadhava]'), d.id);
    this.root.querySelectorAll('[data-package]').forEach(b => b.addEventListener('click', () => {
      if (window.MandirSevaPageComponent) window.MandirSevaPageComponent.openPackage(b.getAttribute('data-package'));
    }));
    this.root.querySelectorAll('#tp-jump, #tp-jump-2').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); this.root.querySelector('#tp-sevas').scrollIntoView({ behavior: 'smooth' }); }));
    this.root.querySelectorAll('.pp-crumbs a').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); goTo(a.getAttribute('href')); }));
  }
}

if (typeof window !== 'undefined') window.TemplePageComponent = TemplePageComponent;
export default TemplePageComponent;
