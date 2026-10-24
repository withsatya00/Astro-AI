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

  static render(astrologer, options = {}) {
    if (!astrologer) return '';
    const isOnline = astrologer.availability === 'online' || astrologer.is_online === true;
    const isBusy = astrologer.availability === 'busy';
    const statusText = isOnline ? 'Online' : (isBusy ? 'Busy' : 'Offline');
    const statusDotClass = isOnline ? 'bg-emerald-500' : (isBusy ? 'bg-amber-500' : 'bg-slate-400');
    const statusBadgeClass = isOnline 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : (isBusy ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200');

    const priceText = (astrologer.price_per_minute === 0 || astrologer.price_per_minute == null)
      ? '<span class="font-bold text-[#1E1B4B] text-base">₹35</span><span class="text-xs text-slate-500 font-medium"> /min</span>'
      : `<span class="font-bold text-[#1E1B4B] text-base">₹${Math.round(astrologer.price_per_minute)}</span><span class="text-xs text-slate-500 font-medium"> /min</span>`;

    const portraitUrl = this.getPortraitUrl(astrologer);
    const profileSlug = astrologer.slug || astrologer.id;

    // Format specialties nicely
    let specs = astrologer.specialties || ['Vedic Jyotish', 'Career', 'Marriage', 'Dhan Yog'];
    if (typeof specs === 'string') {
      specs = specs.split(/[,•\s]+/).filter(Boolean).slice(0, 4);
    }
    const specsLine1 = specs.slice(0, 2).join(' • ');
    const specsLine2 = specs.slice(2, 4).join(' • ') || (astrologer.languages ? (Array.isArray(astrologer.languages) ? astrologer.languages.slice(0, 2).join(', ') : astrologer.languages) : 'Vedic Guidance');

    const ratingVal = astrologer.rating ? Number(astrologer.rating).toFixed(1) : '4.9';
    const reviewCount = astrologer.review_count || astrologer.consultations_count ? `(${astrologer.review_count ? (astrologer.review_count > 1000 ? (astrologer.review_count/1000).toFixed(1) + 'k' : astrologer.review_count) : '1.2k'})` : '(1.2k)';

    const isFemale = astrologer.gender === 'female' || /ananya|vidushi|meera|gayatri|kalpana|pallavi|priyanka|shalini|shambhavi|sunita|aradhana|meenakshi|radhika|kavita/i.test(astrologer.name || '');
    const honorBadgeHtml = isFemale
      ? `<div class="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#7439EA] to-[#9333EA] text-white shadow-xs border border-[#DDD6FE]"><span>★</span><span>विदुषी रत्न</span></div>`
      : `<div class="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#D97706] to-[#E8AD35] text-[#1E1B4B] shadow-xs border border-[#FDE68A]"><span>★</span><span>स्वर्ण पदक</span></div>`;

    return `
      <article class="astrologer-card bg-white rounded-2xl border border-[#E7E2D8] hover:border-[#FCD34D] hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs group" id="astrologer-card-${astrologer.id}" data-astrologer-id="${astrologer.id}">
        <!-- Top Image Section with Overlaid Status Badge & Honor Badge -->
        <div class="relative w-full aspect-square bg-[#FAF8F2] overflow-hidden cursor-pointer" onclick="window.App && window.App.openAstrologerProfile('${profileSlug}')">
          <img 
            src="${portraitUrl}" 
            alt="${astrologer.name}" 
            class="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" 
            loading="lazy" decoding="async" 
            onerror="this.onerror=null; this.src='/assets/portraits/default-avatar.svg';" 
          />
          <!-- Honor Badge (Top Left) -->
          ${honorBadgeHtml}

          <!-- Status Badge in Top Right -->
          <div class="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md shadow-xs ${statusBadgeClass}">
            <span class="w-1.5 h-1.5 rounded-full ${statusDotClass}"></span>
            <span>${statusText}</span>
          </div>
        </div>

        <!-- Content Body -->
        <div class="p-4 flex flex-col flex-1 justify-between">
          <div>
            <!-- Astrologer Name with Verified Mark -->
            <h3 
              class="font-serif font-bold text-base text-[#1E1B4B] hover:text-[#7439EA] transition-colors truncate cursor-pointer mb-1 flex items-center gap-1.5" 
              onclick="window.App && window.App.openAstrologerProfile('${profileSlug}')"
              title="${astrologer.name}"
            >
              <span>${astrologer.name}</span>
              <span class="text-[#7439EA] text-xs shrink-0 font-bold" title="गुरुकुल एवं वैदिक विवि द्वारा सत्यापित">✓</span>
            </h3>

            <!-- Rating & Reviews -->
            <div class="flex items-center justify-between text-xs mb-2">
              <div class="flex items-center gap-1">
                <span class="text-amber-500 font-bold">★</span>
                <span class="font-bold text-[#1E1B4B]">${ratingVal}</span>
                <span class="text-slate-400 font-normal">${reviewCount}</span>
              </div>
              <button 
                type="button" 
                class="text-[11px] font-bold text-[#7439EA] hover:text-[#5B21B6] hover:underline cursor-pointer transition-colors"
                onclick="event.stopPropagation(); window.App && window.App.openAstrologerProfile ? window.App.openAstrologerProfile('${profileSlug}') : (window.location.href='/astrologers/${profileSlug}')"
              >
                Profile देखें ➔
              </button>
            </div>

            <!-- Expertise Lines -->
            <div class="text-xs text-slate-500 space-y-0.5 mb-3 leading-snug">
              <p class="truncate font-medium text-slate-600">${specsLine1}</p>
              <p class="truncate text-slate-400">${specsLine2}</p>
            </div>
          </div>

          <!-- Bottom Row: Price & Side-by-Side Action Buttons -->
            <div class="flex items-center justify-between mb-3">
              <div>${priceText}</div>
              <button 
                type="button" 
                class="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs hover:scale-105" 
                title="पंडित जी का स्वर सुनें (Audio Voice Intro)"
                onclick="event.stopPropagation(); window.App && window.App.playAstrologerVoice ? window.App.playAstrologerVoice('${astrologer.name}') : (window.ChatController && window.ChatController.playTempleChime && window.ChatController.playTempleChime())"
              >
                <span>▶️</span> <span>सुनें</span>
              </button>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <!-- Chat Button -->
              <button 
                type="button" 
                class="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-gradient-to-r from-[#7439EA] to-[#6366F1] hover:from-[#5B21B6] hover:to-[#4F46E5] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer" 
                onclick="window.App && window.App.startConsultationWith ? window.App.startConsultationWith('${profileSlug}') : (window.location.href='/consultation/${profileSlug}')"
              >
                <span>💬</span>
                <span>Chat</span>
              </button>

              <!-- Call Button -->
              <button 
                type="button" 
                class="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white hover:bg-[#F5F3FF] border border-[#7439EA] text-[#7439EA] font-bold text-xs transition-colors cursor-pointer" 
                onclick="window.App && (window.App.startCallWith ? window.App.startCallWith('${profileSlug}') : window.App.startConsultationWith('${profileSlug}'))"
              >
                <span>📞</span>
                <span>Call</span>
              </button>
            </div>
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
