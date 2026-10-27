// Temple page: live darshan, aarti timings, sevas, verified priests and packages for one temple.
import { esc, money, toast, api, mediaUrl, t, requireLogin, goTo } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

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
    this.slug = slug;
    this.root.innerHTML = `<div class="shop-page"><div class="shop-loading"><div class="shop-spinner"></div><p>${esc(t('loading'))}</p></div></div>`;
    window.scrollTo({ top: 0 });
    try {
      const d = await api(`/api/v1/mandir/temples/${encodeURIComponent(slug)}?lang=${currentLang()}`);
      this.temple = d;
      this.render(d);
    } catch (err) {
      this.root.innerHTML = `<div class="shop-page"><div class="shop-empty"><b>${esc(t('tp.notFound'))}</b>${esc(err.message)}<br><br><a class="shop-btn shop-btn--line" href="/mandir-seva">${esc(t('tp.back'))}</a></div></div>`;
    }
  }

  static render(d) {
    const startFrom = Math.min(...d.offerings.map(o => o.price));
    this.root.innerHTML = `
    <div class="shop-page tp">
      <nav class="pp-crumbs"><a href="/mandir-seva">${esc(t('tp.mandir'))}</a> › <span>${esc(d.name)}</span></nav>
      <section class="tp-hero" style="background-image:linear-gradient(to top, rgba(15,10,40,.85), rgba(15,10,40,.15)), url('${esc(mediaUrl(d.banner_url || d.image_url))}')">
        <div><span class="shop-hero__badge">📍 ${esc(d.city)}, ${esc(d.state)}</span><h1>${esc(d.name)}</h1><p>🕉️ ${esc(d.deity)}</p></div>
        <div class="tp-cta"><small>${esc(t('md.startsFrom'))}</small><strong>${money(startFrom)}</strong>
          <a class="shop-btn shop-btn--gold" href="#tp-sevas" id="tp-jump">🪔 ${esc(t('tp.bookSeva'))}</a></div>
      </section>

      <div class="tp-grid">
        <div>
          <section class="pp-section"><h2>${esc(t('tp.about'))}</h2><p>${esc(d.description)}</p></section>

          <section class="pp-section"><h2>📺 ${esc(t('tp.live'))}</h2>
            ${d.live_url ? `<div class="tp-live"><iframe src="${esc(d.live_url)}" title="${esc(d.name)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
              : `<p class="shop-hint" style="font-size:.85rem">${esc(t('tp.noLive'))}</p>`}
          </section>

          <section class="pp-section" id="tp-sevas"><h2>🪔 ${esc(t('tp.sevas'))}</h2>
            ${d.offerings.map(o => `<div class="tp-seva"><div><strong>${esc(o.title)}</strong><p>${esc(o.description)}</p>
              <small>${o.includes_video_proof ? '📹 ' + esc(t('tp.video')) : ''} ${o.has_prasad_delivery ? ' · 📦 ' + esc(t('tp.prasad', { fee: money(o.delivery_fee) })) : ''}</small></div>
              <div class="tp-seva__buy"><b>${money(o.price)}</b><button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-book>${esc(t('md.book'))}</button></div></div>`).join('')}
          </section>

          ${d.packages.length ? `<section class="pp-section"><h2>🗓️ ${esc(t('pk.title'))}</h2><div class="mp-scroll" style="padding:0">${d.packages.map(p => `
            <article class="mp-card"><div class="mp-body"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><div class="shop-card__foot"><div class="shop-price"><small>${esc(t('pk.sessions', { n: p.sessions }))}</small>${money(p.price)}${p.discount_percent ? `<s>${money(p.list_price)}</s>` : ''}</div>
            <button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-package="${esc(p.slug)}">${esc(t('pk.select'))}</button></div></div></article>`).join('')}</div></section>` : ''}
        </div>

        <aside>
          <section class="pp-section"><h2>🕰️ ${esc(t('tp.aarti'))}</h2>
            ${d.aarti_timings.length ? `<table class="tp-table">${d.aarti_timings.map(a => `<tr><td>${esc(a.name)}</td><td><b>${esc(a.time)}</b></td></tr>`).join('')}</table><p class="shop-hint">${esc(t('tp.aartiHint'))}</p>`
              : `<p class="shop-hint" style="font-size:.85rem">${esc(t('tp.noAarti'))}</p>`}</section>

          <section class="pp-section"><h2>🙏 ${esc(t('tp.priests'))}</h2>
            ${d.priests.length ? d.priests.map(p => `<div class="tp-priest">${p.photo_url ? `<img src="${esc(mediaUrl(p.photo_url))}" alt="">` : '<span>🙏</span>'}
              <div><strong>${esc(p.name)}</strong> ${p.verified ? `<span class="shop-pill shop-pill--ok">✓ ${esc(t('cd.verified'))}</span>` : ''}
              <small>${esc(t('cd.years', { n: p.years_experience }))}${p.languages ? ' · ' + esc(p.languages) : ''}</small>${p.bio ? `<p>${esc(p.bio)}</p>` : ''}</div></div>`).join('')
              : `<p class="shop-hint" style="font-size:.85rem">${esc(t('tp.noPriests'))}</p>`}</section>

          <section class="pp-section"><h2>${esc(t('tp.how'))}</h2>
            <ol class="tp-steps"><li>${esc(t('tp.step1'))}</li><li>${esc(t('tp.step2'))}</li><li>${esc(t('tp.step3'))}</li><li>${esc(t('tp.step4'))}</li></ol></section>
        </aside>
      </div>
    </div>`;
    this.root.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => {
      if (requireLogin('auth.neededBooking') && window.ChadawaModal) window.ChadawaModal.open(this.temple);
    }));
    this.root.querySelectorAll('[data-package]').forEach(b => b.addEventListener('click', () => {
      if (window.MandirSevaPageComponent) window.MandirSevaPageComponent.openPackage(b.getAttribute('data-package'));
    }));
    this.root.querySelector('#tp-jump').addEventListener('click', (e) => { e.preventDefault(); this.root.querySelector('#tp-sevas').scrollIntoView({ behavior: 'smooth' }); });
    this.root.querySelectorAll('.pp-crumbs a').forEach(a => a.addEventListener('click', (e) => { e.preventDefault(); goTo(a.getAttribute('href')); }));
  }
}

if (typeof window !== 'undefined') window.TemplePageComponent = TemplePageComponent;
export default TemplePageComponent;
