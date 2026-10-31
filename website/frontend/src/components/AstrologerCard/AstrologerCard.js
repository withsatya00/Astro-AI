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
    const status = astrologer.availability === 'online' || astrologer.is_online === true ? 'online' : astrologer.availability === 'busy' ? 'busy' : 'away';
    const statusLabel = status === 'online' ? 'Online' : (status === 'busy' ? 'Busy' : 'Away');

    const rate = Math.round(Number(astrologer.price_per_minute) || 0) || 51;
    const portraitUrl = this.getPortraitUrl(astrologer);
    const profileSlug = astrologer.slug || astrologer.id;
    const slugArg = esc(String(profileSlug).replace(/'/g, ''));
    const id = esc(astrologer.id);
    const name = (hi && astrologer.name_hi) || astrologer.name || '';

    let specs = astrologer.specialties || [];
    if (typeof specs === 'string') specs = specs.split(/[,•]+/).map(x => x.trim()).filter(Boolean);
    if (!specs.length) specs = ['Vedic Astrology', 'Kundli Analysis', 'Marriage', 'Career Guidance'];

    let langs = astrologer.languages || [];
    if (typeof langs === 'string') langs = langs.split(',').map(x => x.trim()).filter(Boolean);
    if (!langs.length) langs = ['Hindi', 'English'];

    const rating = Number(astrologer.rating) || 4.8;
    const reviews = Number(astrologer.review_count) || 1200;
    const years = Number(astrologer.experience_years) || 15;

    const openProfile = `window.App && window.App.openAstrologerProfile ? window.App.openAstrologerProfile('${slugArg}') : (window.location.href='/astrologers/${slugArg}')`;

    return `
      <article class="ac-card ac2 ${status === 'online' ? 'is-online' : ''}" data-astrologer-id="${id}" data-id="${id}" data-price="${rate}" data-human="${isAi ? '0' : '1'}" data-pm-done="1">
        <div class="ac-ref-top">
          <div class="ac-ref-avatar-wrap" onclick="${openProfile}">
            <img src="${esc(portraitUrl)}" alt="${esc(name)}" class="ac-ref-avatar" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='/assets/portraits/default-avatar.svg';" />
          </div>
          <div class="ac-ref-info">
            <div class="ac-ref-meta-row">
              <span class="ac-ref-status ac-ref-status--${status}">
                <span class="ac-ref-dot"></span> ${statusLabel}
              </span>
              <button type="button" class="ac-ref-heart" data-ac-fav="${id}" aria-label="Favorite" title="Save astrologer">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </button>
            </div>
            <h3 class="ac-ref-name" onclick="${openProfile}">${esc(name)}</h3>
          </div>
        </div>
        <div class="ac-ref-rating-row">
          <span class="ac-ref-rating"><span class="ac-ref-star">★</span> ${rating.toFixed(1)} <span class="ac-ref-revcount">(${this.compact(reviews)} reviews)</span></span>
          <span class="ac-ref-exp">⏱ ${years}+ Years</span>
        </div>
        <p class="ac-ref-specialties" title="${esc(specs.join(', '))}">
          ${esc(specs.slice(0, 4).join(', '))}
        </p>
        <div class="ac-ref-languages">
          ${langs.slice(0, 3).map(l => `<span class="ac-ref-lang-pill">${esc(l)}</span>`).join('')}
        </div>
        <div class="ac-ref-footer">
          <div class="ac-ref-rate">
            <strong>₹${rate}</strong><small>/min</small>
          </div>
          <div class="ac-ref-actions">
            <button type="button" class="ac-ref-btn-chat" onclick="window.App && window.App.startConsultationWith ? window.App.startConsultationWith('${slugArg}') : (window.location.href='/consultation/${slugArg}')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
              <span>Chat</span>
            </button>
            <button type="button" class="ac-ref-btn-call" title="Call" aria-label="Call" onclick="window.App && (window.App.startCallWith ? window.App.startCallWith('${slugArg}') : window.App.startConsultationWith('${slugArg}'))">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

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
