import { loadTemplate } from '../../utils/templateLoader.js';

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

  static render(astrologer, options = {}) {
    if (!astrologer) return '';
    const esc = (v) => AstrologerCardComponent.escape(v);
    const isOnline = astrologer.availability === 'online' || astrologer.is_online === true;
    const isBusy = astrologer.availability === 'busy';
    const statusKey = isOnline ? 'online' : (isBusy ? 'busy' : 'offline');
    const statusText = isOnline ? 'Online' : (isBusy ? 'Busy' : 'Offline');

    const price = (astrologer.price_per_minute === 0 || astrologer.price_per_minute == null)
      ? 35 : Math.round(astrologer.price_per_minute);

    const portraitUrl = this.getPortraitUrl(astrologer);
    const profileSlug = astrologer.slug || astrologer.id;
    const slugArg = esc(String(profileSlug).replace(/'/g, ''));
    const nameArg = esc(String(astrologer.name || '').replace(/[\\']/g, ''));

    let specs = astrologer.specialties || ['Vedic Jyotish', 'Career', 'Marriage'];
    if (typeof specs === 'string') specs = specs.split(/[,•]+/).map(x => x.trim()).filter(Boolean);
    const chips = specs.slice(0, 3).map(x => `<li class="ac-chip">${esc(x)}</li>`).join('');

    let langs = astrologer.languages || [];
    if (typeof langs === 'string') langs = langs.split(',').map(x => x.trim()).filter(Boolean);
    const langText = langs.slice(0, 3).join(', ');
    const expText = astrologer.experience_years ? `${astrologer.experience_years} yrs exp` : '';

    const ratingVal = astrologer.rating ? Number(astrologer.rating).toFixed(1) : '4.9';
    const reviews = astrologer.review_count ? `(${this.compact(astrologer.review_count)})` : '';
    const consults = astrologer.consultations_count || 0;

    const isFemale = astrologer.gender === 'female' || /ananya|vidushi|meera|gayatri|kalpana|pallavi|priyanka|shalini|shambhavi|sunita|aradhana|meenakshi|radhika|kavita/i.test(astrologer.name || '');
    const honor = isFemale ? { cls: 'ac-badge--violet', label: 'विदुषी रत्न' } : { cls: 'ac-badge--gold', label: 'स्वर्ण पदक' };

    const svg = (d, extra = '') => `<svg class="ac-ic" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
    const icStar = svg('<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z"/>', 'fill="currentColor" stroke="none"');
    const icCheck = svg('<path d="M5 12.5l4.2 4.2L19 7"/>', 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"');
    const icChat = svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"');
    const icCall = svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"');
    const icPlay = svg('<path d="M8 5.5v13l11-6.5z"/>', 'fill="currentColor"');

    const openProfile = `window.App && window.App.openAstrologerProfile ? window.App.openAstrologerProfile('${slugArg}') : (window.location.href='/astrologer/${slugArg}')`;

    return `
      <article class="astrologer-card ac-card" id="astrologer-card-${esc(astrologer.id)}" data-astrologer-id="${esc(astrologer.id)}" data-id="${esc(astrologer.id)}" data-pm-done="1">
        <span class="ac-badge ${honor.cls}">${icStar}<span>${honor.label}</span></span>
        <span class="ac-status ac-status--${statusKey}"><i></i>${statusText}</span>

        <div class="ac-main">
          <button type="button" class="ac-photo" onclick="${openProfile}" aria-label="${esc(astrologer.name)} profile">
            <img src="${esc(portraitUrl)}" alt="${esc(astrologer.name)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='/assets/portraits/default-avatar.svg';" />
            ${astrologer.is_verified === false ? '' : `<span class="ac-verified" title="Verified by Astro Jyotish">${icCheck}</span>`}
          </button>
          <div class="ac-info">
            <h3 class="ac-name" onclick="${openProfile}" title="${esc(astrologer.name)}">${esc(astrologer.name)}</h3>
            <p class="ac-title">${esc(astrologer.title || 'Vedic Astrologer')}</p>
            <div class="ac-rating">
              <span class="ac-stars">${icStar}</span><b>${ratingVal}</b><span class="ac-muted">${reviews}</span>
              ${consults ? `<span class="ac-dot-sep"></span><span class="ac-muted">${this.compact(consults)}+ consultations</span>` : ''}
            </div>
          </div>
        </div>

        <ul class="ac-chips">${chips}</ul>
        <div class="ac-facts">
          ${expText ? `<span>${expText}</span>` : ''}
          ${langText ? `<span>${esc(langText)}</span>` : ''}
        </div>

        <div class="ac-foot">
          <div class="ac-price"><b>₹${price}</b><span>/min</span></div>
          <button type="button" class="ac-listen" title="पंडित जी का स्वर सुनें (Audio Voice Intro)"
            onclick="event.stopPropagation(); window.App && window.App.playAstrologerVoice ? window.App.playAstrologerVoice('${nameArg}') : (window.ChatController && window.ChatController.playTempleChime && window.ChatController.playTempleChime())">${icPlay}<span>सुनें</span></button>
          <div class="ac-actions">
            <button type="button" class="ac-btn ac-btn--chat" onclick="window.App && window.App.startConsultationWith ? window.App.startConsultationWith('${slugArg}') : (window.location.href='/consultation/${slugArg}')">${icChat}<span>Chat</span></button>
            <button type="button" class="ac-btn ac-btn--call" onclick="window.App && (window.App.startCallWith ? window.App.startCallWith('${slugArg}') : window.App.startConsultationWith('${slugArg}'))">${icCall}<span>Call</span></button>
          </div>
        </div>
      </article>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.AstrologerCardComponent = AstrologerCardComponent;
}

export default AstrologerCardComponent;
