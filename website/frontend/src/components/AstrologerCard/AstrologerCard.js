import { loadTemplate } from '../../utils/templateLoader.js';
import { px, pxLang } from '../../utils/premium-copy.js';

export class AstrologerCardComponent {
  static templatePath = '/src/components/AstrologerCard/AstrologerCard.html';

  static async loadTemplate() {
    return await loadTemplate(AstrologerCardComponent.templatePath);
  }

  static getPortraitUrl(astrologer) {
    if (!astrologer) return '/assets/portraits/default-avatar.svg';
    
    // Explicit avatar if provided and ends with jpg/png/webp
    if (astrologer.avatar_url && !astrologer.avatar_url.endsWith('.svg')) return astrologer.avatar_url;
    if (astrologer.avatar && !astrologer.avatar.endsWith('.svg')) return astrologer.avatar;

    const slug = (astrologer.slug || astrologer.id || '').toLowerCase().trim();

    // 1-to-1 unique mapping for all 37 platform astrologers
    const SLUG_PORTRAIT_MAP = {
      'pt-rameshwar-dwivedi': 'assets/portraits/pt-rameshwar-dwivedi.jpg',
      'acharya-kn-rao': 'assets/portraits/acharya-kn-rao.jpg',
      'pandit-ji-maharaj': 'assets/portraits/pandit-ji-maharaj.jpg',
      'dr-radhika-nair': 'assets/portraits/dr-radhika-nair.jpg',
      'acharya-venkatesh-dikshitar': 'assets/portraits/acharya-venkatesh-dikshitar.jpg',
      'acharya-shastri': 'assets/portraits/acharya-shastri.jpg',
      'pt-devavrata': 'assets/portraits/pt-devavrata.jpg',
      'acharya-raghavendra': 'assets/portraits/acharya-raghavendra.jpg',
      'vidushi-sunita-sharma': 'assets/portraits/vidushi-sunita-sharma.jpg',
      'pt-janardan-shastri': 'assets/portraits/pt-janardan-shastri.jpg',
      'pt-harinarayan-mishra': 'assets/portraits/pt-harinarayan-mishra.jpg',
      'acharya-vishwanath': 'assets/portraits/acharya-vishwanath.jpg',
      'vidushi-ananya-joshi': 'assets/portraits/vidushi-ananya-joshi.jpg',
      'pt-govind-shastri': 'assets/portraits/pt-govind-shastri.jpg',
      'pt-vidyadhar': 'assets/portraits/pt-vidyadhar.jpg',
      'acharya-anand-joshi': 'assets/portraits/acharya-anand-joshi.jpg',
      'vidushi-meera-devi': 'assets/portraits/vidushi-meera-devi.jpg',
      'dr-meenakshi-iyer': 'assets/portraits/dr-meenakshi-iyer.jpg',
      'vidushi-tarot-aradhana': 'assets/portraits/vidushi-tarot-aradhana.jpg',
      'acharya-hariprasad': 'assets/portraits/acharya-hariprasad.jpg',
      'acharya-mukund': 'assets/portraits/acharya-mukund.jpg',
      'vidushi-shambhavi': 'assets/portraits/vidushi-shambhavi.jpg',
      'vidushi-kalpana-trivedi': 'assets/portraits/vidushi-kalpana-trivedi.jpg',
      'vidushi-priyanka-sen': 'assets/portraits/vidushi-priyanka-sen.jpg',
      'vidushi-gayatri-bhatt': 'assets/portraits/vidushi-gayatri-bhatt.jpg',
      'vidushi-shalini-kapoor': 'assets/portraits/vidushi-shalini-kapoor.jpg',
      'vidushi-pallavi-deshmukh': 'assets/portraits/vidushi-pallavi-deshmukh.jpg',
      'jyotishi-kavita-devi': 'assets/portraits/jyotishi-kavita-devi.jpg',
      'dr-krishna-murthy': 'assets/portraits/dr-krishna-murthy.jpg',
      'pt-devesh-jha': 'assets/portraits/pt-devesh-jha.jpg',
      'acharya-samudrika-ramesh': 'assets/portraits/acharya-samudrika-ramesh.jpg',
      'pt-anand-swaroop': 'assets/portraits/pt-anand-swaroop.jpg',
      'pt-brijesh-pandey': 'assets/portraits/pt-brijesh-pandey.jpg',
      'acharya-somnath': 'assets/portraits/acharya-somnath.jpg',
      'jyotishi-devendra': 'assets/portraits/jyotishi-devendra.jpg',
      'dr-arvind-mohan': 'assets/portraits/dr-arvind-mohan.jpg',
      'pt-tribhuvan': 'assets/portraits/pt-tribhuvan.jpg'
    };

    if (slug && SLUG_PORTRAIT_MAP[slug]) {
      return SLUG_PORTRAIT_MAP[slug];
    }

    // Direct check for existing image file with slug
    if (slug) {
      return `assets/portraits/${slug}.jpg`;
    }

    return '/assets/portraits/default-avatar.svg';
  }

  static escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  static compact(n) {
    n = Number(n) || 0;
    return n >= 1000 ? (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'k' : String(n);
  }

  /** Badges come from the astrologer's own numbers; nothing is shown that the data does not support. */
  static badges(a) {
    const out = [];
    if (Number(a.rating) >= 4.97 && Number(a.review_count) >= 1000) out.push(['gold', px('ac.topRated')]);
    if (Number(a.consultations_count) >= 60000) out.push(['violet', px('ac.mostConsulted')]);
    if (a.is_featured) out.push(['gold', px('ac.featured')]);
    if (Number(a.review_count) < 5 && Number(a.consultations_count) < 100) out.push(['green', px('ac.new')]);
    return out.slice(0, 2);
  }

  static render(astrologer, options = {}) {
    if (!astrologer) return '';
    const esc = (v) => AstrologerCardComponent.escape(v);
    const hi = pxLang() === 'hi';
    const isAi = astrologer.is_ai === true;
    const status = astrologer.availability === 'online' || astrologer.is_online === true ? 'online' : astrologer.availability === 'busy' ? 'busy' : 'offline';
    const statusText = status === 'online' ? px(isAi ? 'ac.onlineAi' : 'ac.onlineHuman') : px(status === 'busy' ? 'ac.busy' : 'ac.offline');

    const rate = Math.round(Number(astrologer.price_per_minute) || 0);
    const free = rate === 0;
    const portraitUrl = this.getPortraitUrl(astrologer);
    const profileSlug = astrologer.slug || astrologer.id;
    const slugArg = esc(String(profileSlug).replace(/'/g, ''));
    const nameArg = esc(String(astrologer.name || '').replace(/[\\']/g, ''));
    const id = esc(astrologer.id);
    const name = (hi && astrologer.name_hi) || astrologer.name || '';
    const title = (hi && astrologer.title_hi) || astrologer.title || 'Vedic Astrologer';

    let specs = astrologer.specialties || [];
    if (typeof specs === 'string') specs = specs.split(/[,•]+/).map(x => x.trim()).filter(Boolean);
    const chips = specs.slice(0, 2).map(x => `<li class="ac2-chip">${esc(x)}</li>`).join('') + (specs.length > 2 ? `<li class="ac2-chip ac2-chip--more">+${specs.length - 2}</li>` : '');

    let langs = astrologer.languages || [];
    if (typeof langs === 'string') langs = langs.split(',').map(x => x.trim()).filter(Boolean);

    const rating = Number(astrologer.rating) || 0;
    const reviews = Number(astrologer.review_count) || 0;
    const consults = Number(astrologer.consultations_count) || 0;
    const years = Number(astrologer.experience_years) || 0;
    const facts = [langs.length && langs.slice(0, 3).join(', '), years > 0 && px('ac.exp', { n: years })].filter(Boolean).map(esc).join('<br>');

    const typeBadge = `<span class="ac2-badge ac2-badge--${isAi ? 'ai' : 'human'}">${isAi ? '✦ ' : '✓ '}${esc(px(isAi ? 'ac.ai' : 'ac.human'))}</span>`;
    const extra = this.badges(astrologer).map(([tone, label]) => `<span class="ac2-badge ac2-badge--${tone}">${esc(label)}</span>`).join('');

    const svg = (d, extra = '') => `<svg class="ac2-ic" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
    const icStar = svg('<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z"/>', 'fill="currentColor"');
    const icCheck = svg('<path d="M5 12.5l4.2 4.2L19 7"/>', 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"');
    const icChat = svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"');
    const icCall = svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"');
    const icPlay = svg('<path d="M8 5.5v13l11-6.5z"/>', 'fill="currentColor"');

    const openProfile = `window.App && window.App.openAstrologerProfile ? window.App.openAstrologerProfile('${slugArg}') : (window.location.href='/astrologer/${slugArg}')`;
    const ratingRow = rating > 0
      ? `<span class="ac2-star">${icStar}</span><b>${rating.toFixed(2)}</b>${reviews ? `<span class="ac2-muted">(${this.compact(reviews)})</span>` : ''}`
      : `<span class="ac2-muted">${esc(px('ac.new.reviews'))}</span>`;

    return `
      <article class="ac-card ac2 ${status === 'online' ? 'is-online' : ''}" data-astrologer-id="${id}" data-id="${id}" data-human="${isAi ? '0' : '1'}" data-pm-done="1">
        <button type="button" class="ac2-heart" data-ac-fav="${id}" aria-pressed="false" aria-label="${esc(px('ac.save'))}" title="${esc(px('ac.save'))}"><span aria-hidden="true">♡</span></button>
        <div class="ac2-top">
          <button type="button" class="ac2-photo" onclick="${openProfile}" aria-label="${esc(name)}">
            <img src="${esc(portraitUrl)}" alt="${esc(name)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='/assets/portraits/default-avatar.svg';" />
            <span class="ac2-dot ac2-dot--${status}" aria-hidden="true"></span>
          </button>
          <div class="ac2-id">
            <h3 class="ac2-name" onclick="${openProfile}" title="${esc(name)}">${esc(name)}${astrologer.is_verified !== true ? '' : `<span class="ac2-verified" title="Verified by Astro Jyotish">${icCheck}</span>`}</h3>
            <p class="ac2-title">${esc(title)}</p>
            <div class="ac2-rating">${ratingRow}${consults ? `<span class="ac2-sep"></span><span class="ac2-muted">${esc(px('ac.consults', { n: this.compact(consults) }))}</span>` : ''}</div>
          </div>
        </div>
        <div class="ac2-badges">${typeBadge}${extra}</div>
        ${chips ? `<ul class="ac2-chips">${chips}</ul>` : ''}
        ${facts ? `<p class="ac2-facts">${facts}</p>` : ''}
        <p class="ac2-status ac2-status--${status}"><i></i><span>${esc(statusText)}</span>${isAi ? '' : '<em data-ac-next></em>'}</p>
        <div class="ac2-foot">
          <div class="ac2-price">${free ? `<b>${esc(px('ac.free'))}</b>` : `<b>₹${rate}</b><span>${esc(px('ac.perMin'))}</span>`}</div>
          <div class="ac2-actions">
            <button type="button" class="ac2-btn ac2-btn--chat" onclick="window.App && window.App.startConsultationWith ? window.App.startConsultationWith('${slugArg}') : (window.location.href='/consultation/${slugArg}')">${icChat}<span>${esc(px('ac.chat'))}</span></button>
            <button type="button" class="ac2-btn ac2-btn--icon" title="${esc(px('ac.call'))}" aria-label="${esc(px('ac.call'))}" onclick="window.App && (window.App.startCallWith ? window.App.startCallWith('${slugArg}') : window.App.startConsultationWith('${slugArg}'))">${icCall}</button>
            <button type="button" class="ac2-btn ac2-btn--icon" title="${esc(px('ac.listen'))}" aria-label="${esc(px('ac.listen'))}" onclick="event.stopPropagation(); window.App && window.App.playAstrologerVoice ? window.App.playAstrologerVoice('${nameArg}') : (window.ChatController && window.ChatController.playTempleChime && window.ChatController.playTempleChime())">${icPlay}</button>
          </div>
        </div>
      </article>
    `;
  }

  /** After cards are in the page: hearts reflect saved astrologers, and human cards show their next free slot. */
  static async enhance(root = document) {
    const [{ Favourites }, { ProfileView }] = await Promise.all([import('../premium/Favourites.js?v=r1'), import('../premium/ProfileView.js?v=r28')]);
    Favourites.sync(root);
    root.querySelectorAll('.ac2[data-human="1"] [data-ac-next]').forEach(async (el) => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      try {
        const when = await ProfileView.nextSlotLabel(el.closest('.ac2').dataset.astrologerId);
        if (when) el.textContent = px('ac.next', { when });
      } catch (e) { /* the card is complete without it */ }
    });
  }
}

if (typeof window !== 'undefined') {
  window.AstrologerCardComponent = AstrologerCardComponent;
}

export default AstrologerCardComponent;
