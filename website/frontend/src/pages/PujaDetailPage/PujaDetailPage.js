// Puja Detail Page - 1:1 Blueprint Reference Match to Image 2 (media_1793430846167_5f4c9d8e.jpg)
import { esc, money, toast } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';
import { REFERENCE_PUJAS } from '../../components/reference-pujas.js';
import { pujaCalendar } from '../../components/puja-calendar.js';

export class PujaDetailPageComponent {
  static root = null;
  static currentSlug = null;
  static pujaData = null;
  static activePhotoIndex = 0;
  static isFavorite = false;

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return null;
    this.root = target;
    window.addEventListener('astro:languagechange', () => {
      if (this.root && this.root.offsetParent !== null && this.currentSlug) {
        this.open(this.currentSlug);
      }
    });
    return target;
  }

  static getPujaData(slug) {
    const hi = currentLang() === 'hi';
    const cleanSlug = (slug || 'puja-shani-tailabhishek').replace(/^puja-/, '');
    const fullId = slug && slug.startsWith('puja-') ? slug : ('puja-' + (slug || 'shani-tailabhishek'));

    const ref = REFERENCE_PUJAS.find(p => p.id === fullId || p.id === slug || p.id.includes(cleanSlug))
      || pujaCalendar().find(p => p.id === fullId || p.id === slug || p.id.includes(cleanSlug));

    // Base fallback tailored to 1:1 Reference Blueprint (Shani Tailabhishek)
    if (!ref || cleanSlug === 'shani-tailabhishek') {
      return {
        id: 'puja-shani-tailabhishek',
        slug: 'shani-tailabhishek',
        category_eyebrow: hi ? 'शनि पूजा' : 'SHANI PUJA',
        title: hi ? 'शनि तैलाभिषेक' : 'Shani Tailabhishek',
        subtitle: hi ? 'शनि देव पूजा हेतु एक अत्यंत शक्तिशाली एवं सिद्ध वैदिक अनुष्ठान' : 'A powerful ritual for Shani (Saturn) Puja',
        temple: hi ? 'शनि देव मंदिर, उज्जैन' : 'Shani Dev Mandir, Ujjain',
        muhurta: hi ? '17 नवंबर 2026, प्रातः 07:00 बजे' : '17 Nov 2026, 07:00 AM',
        duration: hi ? 'लगभग 1–2 घंटे' : 'Approx. 1–2 Hours',
        rating: '4.9',
        bookings_count: hi ? '12k+ बुकिंग्स संपन्न' : '12k+ Bookings Completed',
        cta_text: hi ? 'शनि तैलाभिषेक अभी बुक करें ➔' : 'Book Shani Tailabhishek Now ➔',
        photos: [
          '/assets/img/temples/trimbakeshwar-nashik.jpg',
          '/assets/img/seva-gallery/trimbakeshwar-nashik-1.webp',
          '/assets/img/temples/shani-shingnapur.jpg',
          '/assets/img/seva-gallery/trimbakeshwar-nashik-2.webp',
          '/assets/img/offerings/diya.webp'
        ],
        about_lead: hi
          ? '“कर्मफल दाता भगवान शनि देव को कर्म शुद्धि, सुरक्षा एवं संपूर्ण कल्याण हेतु पावन तैलाभिषेक।”'
          : '“A sacred offering to Lord Shani for karmic balance, protection and overall well-being.”',
        about_text: hi
          ? 'शनि तैलाभिषेक एक अत्यंत शक्तिशाली वैदिक अनुष्ठान है जिसमें भगवान शनि को शुद्ध तिल का तेल अर्पित किया जाता है। यह अनुष्ठान शनि दोष, साढ़ेसाती और ढैया के अशुभ प्रभावों को शांत करने, जीवन की बाधाओं को दूर करने और करियर, स्वास्थ्य तथा संबंधों में अनुशासन, स्थिरता व सफलता प्रदान करने के लिए सर्वोपरि माना गया है।'
          : 'Shani Tailabhishek is a powerful Vedic ritual in which sesame oil (tail) is offered to Lord Shani. It is known to reduce the malefic effects of Saturn (Shani Dosha), remove life obstacles, and bring discipline, stability and success in career, health and relationships.',
        benefits: [
          {
            icon: '⚖',
            title: hi ? 'शनि दोष शांति' : 'Shani Dosha Shanti',
            desc: hi ? 'शनि के नकारात्मक प्रभावों को शांत कर जीवन में संतुलन और न्याय लाता है।' : 'Reduces the negative effects of Saturn and brings balance in life.'
          },
          {
            icon: '📈',
            title: hi ? 'करियर एवं स्थिरता' : 'Career & Stability',
            desc: hi ? 'व्यापार में वृद्धि, नौकरी में स्थिरता और आर्थिक मजबूती प्रदान करता है।' : 'Brings growth, job stability and financial strength.'
          },
          {
            icon: '🛡',
            title: hi ? 'सुरक्षा एवं शांति' : 'Protection & Peace',
            desc: hi ? 'अकारण भय, आकस्मिक बाधाओं और अनावश्यक विलंब से रक्षा करता है।' : 'Removes obstacles, fears and unnecessary delays.'
          }
        ],
        process: [
          {
            num: 1,
            title: hi ? 'संकल्प एवं आह्वान' : 'Sankalp & Invocation',
            desc: hi ? 'पूजा आपके नाम, गोत्र और विशेष संकल्प के साथ विधिपूर्वक आरंभ होती है।' : 'The puja begins with your name, gotra and sankalp.'
          },
          {
            num: 2,
            title: hi ? 'तैलाभिषेक (तिल तेल अर्पण)' : 'Tailabhishek (Oil Offering)',
            desc: hi ? 'वैदिक मंत्रोच्चार के साथ भगवान शनि को पावन तिल का तेल अर्पित किया जाता है।' : 'Sesame oil is offered to Lord Shani with Vedic mantras.'
          },
          {
            num: 3,
            title: hi ? 'मंत्र जप एवं महाआरती' : 'Mantra Jap & Aarti',
            desc: hi ? 'शांति एवं ग्रह अनुकूलता हेतु विशेष शनि स्तोत्र व वैदिक महाआरती की जाती है।' : 'Special Shani mantras are chanted for peace and relief.'
          },
          {
            num: 4,
            title: hi ? 'प्रसाद एवं शुभाशीर्वाद' : 'Prasad & Blessings',
            desc: hi ? 'पूजा संपन्न होने पर पवित्र रक्षा सूत्र एवं अभिमंत्रित प्रसाद प्रेषित किया जाता है।' : 'Puja is completed with aarti and prasad distribution.'
          }
        ],
        includes: [
          hi ? 'अनुभवी एवं सिद्ध मंदिर पुजारियों द्वारा वैदिक अनुष्ठान' : 'Puja by experienced and verified temple priests',
          hi ? 'शास्त्रोक्त विधि एवं प्रामाणिक वैदिक मंत्रोच्चार' : 'Proper Vedic vidhi and mantras as per scriptures',
          hi ? 'संकल्प में आपका नाम और गोत्र पूर्ण श्रद्धा से सम्मिलित' : 'Your name and gotra included in the sankalp',
          hi ? 'पूजा फोटो / वीडियो प्रमाण और प्रसाद आपके पते पर' : 'Puja photos / video (if opted) and prasad at your address'
        ],
        packages: [
          {
            id: 'pkg-individual',
            title: hi ? 'व्यक्तिगत पूजा' : 'Individual Puja',
            sub: hi ? 'व्यक्तिगत शनि शांति हेतु' : 'For personal Shani shanti',
            price: 501,
            img: '/assets/img/offerings/diya.webp'
          },
          {
            id: 'pkg-sankalp',
            title: hi ? 'संकल्प पूजा' : 'Sankalp Puja',
            sub: hi ? 'विशेष मनोकामना संकल्प सहित' : 'With special sankalp',
            price: 1001,
            img: '/assets/img/offerings/panchamrit.webp'
          },
          {
            id: 'pkg-family',
            title: hi ? 'पारिवारिक पूजा' : 'Family Puja',
            sub: hi ? 'समस्त परिवार के कल्याण हेतु' : 'For family well-being',
            price: 2501,
            img: '/assets/img/offerings/bhog.webp'
          },
          {
            id: 'pkg-maha',
            title: hi ? 'महा तैलाभिषेक' : 'Maha Tailabhishek',
            sub: hi ? 'गहन शनि शांति एवं दीर्घकालिक लाभ' : 'For deep Shani shanti & long-term benefits',
            price: 5101,
            img: '/assets/img/offerings/havan.webp'
          }
        ],
        faqs: [
          {
            q: hi ? 'मुझे शनि तैलाभिषेक क्यों करवाना चाहिए?' : 'Why should I perform Shani Tailabhishek?',
            a: hi
              ? 'भगवान शनि कर्मफल दाता हैं। शुद्ध तिल या सरसों का तेल अर्पित करने से शनि की क्रूर दृष्टि शांत होती है, साढ़ेसाती व ढैया के कष्टों से मुक्ति मिलती है और जीवन की गंभीर बाधाएं समाप्त होती हैं।'
              : 'Lord Shani is the dispenser of karmic justice. Offering pure sesame oil pacifies Saturn\'s malefic influence, mitigates Sade Sati / Dhaiya hardships, and eliminates persistent obstacles in health and career.'
          },
          {
            q: hi ? 'इस पूजा को बुक करने का सबसे उत्तम समय क्या है?' : 'What is the best time to book this puja?',
            a: hi
              ? 'शनिवार, शनि जयंती, शनिश्चरी अमावस्या एवं त्रयोदशी तिथि पर यह पूजा विशेष फलदायी मानी जाती है। हालांकि शास्त्रों के अनुसार शुभ मुहूर्त में किसी भी शनिवार इसे किया जा सकता है।'
              : 'Saturdays, Shani Jayanti, Shanishchari Amavasya, and Trayodashi tithis are considered especially auspicious. However, it can be scheduled on any auspicious muhurta calculated by our astrologers.'
          },
          {
            q: hi ? 'क्या मुझे पूजा के फोटो या वीडियो मिलेंगे?' : 'Will I get puja photos or video?',
            a: hi
              ? 'हाँ, तीर्थ पुरोहित आपके नाम व गोत्र के संकल्प का वीडियो और पावन तैलाभिषेक की उच्च गुणवत्ता वाली तस्वीरें आपके एस्ट्रो ज्योतिष डैशबोर्ड और व्हाट्सएप पर साझा करेंगे।'
              : 'Yes, verified temple priests record the sankalp being recited with your name and gotra, along with the sacred Tailabhishek ritual. Photos and video updates are shared in your dashboard.'
          },
          {
            q: hi ? 'क्या मुझे मंदिर में उपस्थित होना आवश्यक है?' : 'Do I need to be physically present at the temple?',
            a: hi
              ? 'नहीं, शारीरिक उपस्थिति अनिवार्य नहीं है। मंदिर के प्रामाणिक पुरोहित आपके नाम और गोत्र से शास्त्र सम्मत वैदिक विधि द्वारा अनुष्ठान संपन्न करते हैं।'
              : 'No, physical presence is not required. Authentic Vedic priests perform the entire ritual on your behalf strictly adhering to Vedic scripture using your sankalp.'
          },
          {
            q: hi ? 'प्रसाद मेरे पते पर कैसे पहुंचेगा?' : 'How will the prasad be delivered?',
            a: hi
              ? 'पूजा संपन्न होने के पश्चात अभिमंत्रित रक्षा सूत्र, भस्म और सूखा प्रसाद पवित्र पैकिंग में आपके पंजीकृत डाक पते पर स्पीड पोस्ट / कूरियर द्वारा प्रेषित किया जाता है।'
              : 'Sacred temple prasad including energized Raksha Sutra, sacred vibhuti, and sanctified dry fruits will be dispatched in safe packaging directly to your registered address.'
          }
        ]
      };
    }

    // Dynamic mapping for any other puja from REFERENCE_PUJAS
    const title = (hi && ref.title_hi) ? ref.title_hi : ref.title;
    const category = (hi && ref.tag_hi) ? ref.tag_hi : (ref.tag || 'SACRED PUJA');
    const location = (hi && ref.location_hi) ? ref.location_hi : ref.location;
    const benefit = (hi && ref.benefit_hi) ? ref.benefit_hi : ref.benefit;
    const schedule = (hi && ref.schedule_hi) ? ref.schedule_hi : ref.schedule;
    const basePrice = ref.price || 501;

    return {
      id: ref.id,
      slug: cleanSlug,
      category_eyebrow: category.toUpperCase(),
      title,
      subtitle: benefit,
      temple: location,
      muhurta: schedule,
      duration: hi ? 'लगभग 1–2 घंटे' : 'Approx. 1–2 Hours',
      rating: '4.9',
      bookings_count: hi ? '8k+ बुकिंग्स संपन्न' : '8k+ Bookings Completed',
      cta_text: (hi ? 'पूजा अभी बुक करें ➔' : `Book ${title} Now ➔`),
      photos: [
        ref.image || '/assets/img/temples/trimbakeshwar-nashik.jpg',
        '/assets/img/temples/mahakaleshwar-ujjain.jpg',
        '/assets/img/offerings/panchamrit.webp',
        '/assets/img/offerings/flowers.webp',
        '/assets/img/offerings/diya.webp'
      ],
      about_lead: `“${benefit}”`,
      about_text: hi
        ? `${title} एक अत्यंत पावन और फलदायी वैदिक अनुष्ठान है, जो ${location} के प्रतिष्ठित सिद्ध पीठ में संपन्न किया जाता है। इस अनुष्ठान द्वारा देवी-देवताओं का अमोघ आशीर्वाद प्राप्त होता है।`
        : `${title} is an auspicious Vedic ritual performed at ${location}. Devotees seek divine grace, prosperity, peace, and spiritual upliftment through this sacred ceremony.`,
      benefits: [
        {
          icon: '✨',
          title: hi ? 'दैवीय कृपा एवं शांति' : 'Divine Grace & Peace',
          desc: hi ? 'ग्रह दोषों का शमन और मन में अपार शांति प्राप्त होती है।' : 'Pacifies planetary doshas and brings deep inner harmony.'
        },
        {
          icon: '🌿',
          title: hi ? 'समृद्धि एवं स्वास्थ्य' : 'Prosperity & Health',
          desc: hi ? 'जीवन में आरोग्य, कार्य सिद्धि और धन-धान्य की वृद्धि होती है।' : 'Promotes health, vitality and overall family prosperity.'
        },
        {
          icon: '🛡',
          title: hi ? 'कष्ट निवारण एवं सुरक्षा' : 'Obstacle Removal & Protection',
          desc: hi ? 'समस्त नकारात्मक ऊर्जा और कष्टों से दिव्य सुरक्षा मिलती है।' : 'Shields against negative forces and persistent life hurdles.'
        }
      ],
      process: [
        {
          num: 1,
          title: hi ? 'संकल्प एवं आह्वान' : 'Sankalp & Invocation',
          desc: hi ? 'आपके नाम एवं गोत्र से विधिपूर्वक संकल्प लिया जाता है।' : 'The ritual begins with your name, gotra and specific sankalp.'
        },
        {
          num: 2,
          title: hi ? 'वैदिक अनुष्ठान एवं पूजन' : 'Vedic Rituals & Pujan',
          desc: hi ? 'शास्त्रोक्त सामग्रियों द्वारा देवता का पावन अभिषेक किया जाता है।' : 'Sacred offerings and abhishek are performed with authentic vidhi.'
        },
        {
          num: 3,
          title: hi ? 'मंत्र जप एवं स्तुति' : 'Mantra Jap & Prayers',
          desc: hi ? 'सिद्धि मंत्रों का जप और विशेष आरती संपन्न की जाती है।' : 'Chanting of sacred Vedic mantras and ceremonial aarti.'
        },
        {
          num: 4,
          title: hi ? 'प्रसाद एवं पूर्णाहुति' : 'Prasad & Blessings',
          desc: hi ? 'पूर्णाहुति के पश्चात अभिमंत्रित प्रसाद आपके पते पर प्रेषित होता है।' : 'Ritual concludes with divine blessings and prasad dispatch.'
        }
      ],
      includes: [
        hi ? 'अनुभवी एवं सिद्ध मंदिर पुजारियों द्वारा वैदिक अनुष्ठान' : 'Puja by experienced and verified temple priests',
        hi ? 'शास्त्रोक्त विधि एवं प्रामाणिक वैदिक मंत्रोच्चार' : 'Proper Vedic vidhi and mantras as per scriptures',
        hi ? 'संकल्प में आपका नाम और गोत्र पूर्ण श्रद्धा से सम्मिलित' : 'Your name and gotra included in the sankalp',
        hi ? 'पूजा फोटो / वीडियो प्रमाण और प्रसाद आपके पते पर' : 'Puja photos / video (if opted) and prasad at your address'
      ],
      packages: [
        {
          id: 'pkg-ind',
          title: hi ? 'व्यक्तिगत पूजा' : 'Individual Puja',
          sub: hi ? 'व्यक्तिगत संकल्प एवं अर्चना' : 'Personal sankalp & archana',
          price: basePrice,
          img: '/assets/img/offerings/diya.webp'
        },
        {
          id: 'pkg-sank',
          title: hi ? 'विशेष संकल्प पूजा' : 'Special Sankalp Puja',
          sub: hi ? 'विशेष फल प्राप्ति हेतु' : 'For targeted blessings',
          price: Math.round(basePrice * 1.8),
          img: '/assets/img/offerings/panchamrit.webp'
        },
        {
          id: 'pkg-fam',
          title: hi ? 'पारिवारिक पूजा' : 'Family Puja',
          sub: hi ? 'समस्त परिजनों के नाम से' : 'For all family members',
          price: Math.round(basePrice * 3.5),
          img: '/assets/img/offerings/bhog.webp'
        },
        {
          id: 'pkg-maha',
          title: hi ? 'महा अनुष्ठान' : 'Maha Anushthan',
          sub: hi ? 'विस्तृत हवन एवं संपूर्ण फल' : 'Complete havan & full blessings',
          price: Math.round(basePrice * 7),
          img: '/assets/img/offerings/havan.webp'
        }
      ],
      faqs: [
        {
          q: hi ? 'यह पूजा क्यों कराई जाती है?' : 'What is the significance of this puja?',
          a: hi ? `${title} से देवी-देवताओं का अमोघ आशीर्वाद और संकटों से मुक्ति मिलती है।` : `Performing ${title} invokes divine grace and brings resolution to personal and spiritual challenges.`
        },
        {
          q: hi ? 'क्या मुझे पूजा के फोटो या वीडियो मिलेंगे?' : 'Will I get photos or videos of the puja?',
          a: hi ? 'हाँ, संकल्प और पूजा अनुष्ठान के फोटो व वीडियो आपको उपलब्ध कराए जाएंगे।' : 'Yes, high-resolution photos and video recordings of the sankalp and ritual are provided.'
        },
        {
          q: hi ? 'क्या शारीरिक उपस्थिति जरूरी है?' : 'Do I need to be present at the temple?',
          a: hi ? 'नहीं, सिद्ध तीर्थ पुरोहित आपके संकल्प के अनुसार दूरस्थ विधि से पूजा करते हैं।' : 'No, authentic temple priests perform the sacred puja remotely on your behalf with your sankalp.'
        }
      ]
    };
  }

  static async open(slug) {
    this.currentSlug = slug;
    this.pujaData = this.getPujaData(slug);
    this.activePhotoIndex = 0;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  static render() {
    if (!this.root) this.root = document.getElementById('view-puja-detail');
    if (!this.root || !this.pujaData) return;

    const p = this.pujaData;
    const hi = currentLang() === 'hi';

    this.root.innerHTML = `
      <div class="ch-puja-detail-page">
        <!-- Breadcrumbs -->
        <nav class="pd-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>›</span>
          <a href="/mandir-seva/puja">${hi ? 'पूजा सेवा' : 'Puja Seva'}</a>
          <span>›</span>
          <span class="pd-category-crumb">${esc(p.category_eyebrow)}</span>
          <span>›</span>
          <span class="current">${esc(p.title)}</span>
        </nav>

        <!-- Top Hero Two-Column Card -->
        <div class="pd-hero-card">
          <!-- Left: Gallery -->
          <div class="pd-gallery">
            <div class="pd-gallery-main" id="pd-gallery-container">
              <div class="pd-gallery-pill">
                <span style="color: #EF4444; margin-right: 4px;">●</span> ${hi ? 'लाइव दर्शन' : 'Live Darshan'}
              </div>
              <button type="button" class="pd-fav-btn" id="pd-fav-toggle" aria-label="Favorite">
                ${this.isFavorite ? '♥' : '♡'}
              </button>
              <img id="pd-main-img" src="${p.photos[this.activePhotoIndex]}" alt="${esc(p.title)}" loading="eager" />
              <button type="button" class="tp-gallery-arrow tp-gallery-arrow--prev pd-gallery-arrow--prev" id="pd-prev-btn" aria-label="Previous">‹</button>
              <button type="button" class="tp-gallery-arrow tp-gallery-arrow--next pd-gallery-arrow--next" id="pd-next-btn" aria-label="Next">›</button>
            </div>

            <!-- Thumbnails Row -->
            <div class="pd-thumbs-row">
              ${p.photos.map((src, idx) => `
                <div class="pd-thumb ${idx === this.activePhotoIndex ? 'active' : ''}" data-idx="${idx}">
                  <img src="${src}" alt="Thumbnail ${idx + 1}" loading="lazy" />
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Right: Info Column -->
          <div class="pd-info-col">
            <div class="pd-eyebrow-row">
              <span class="pd-eyebrow-text">${esc(p.category_eyebrow)}</span>
            </div>
            <h1 class="pd-hero-title">${esc(p.title)}</h1>
            <p class="pd-hero-desc">${esc(p.subtitle)}</p>

            <!-- Details Box -->
            <div class="pd-details-box">
              <div class="pd-detail-row">
                <span>🛕</span>
                <span><strong>${hi ? 'मंदिर:' : 'Temple:'}</strong> ${esc(p.temple)}</span>
              </div>
              <div class="pd-detail-row">
                <span>📅</span>
                <span><strong>${hi ? 'मुहूर्त:' : 'Muhurta:'}</strong> ${esc(p.muhurta)}</span>
              </div>
              <div class="pd-detail-row">
                <span>⏱</span>
                <span><strong>${hi ? 'अवधि:' : 'Duration:'}</strong> ${esc(p.duration)}</span>
              </div>
            </div>

            <!-- Rating & Bookings Pill -->
            <div class="pd-ratings-row">
              <span class="pd-rating-badge">★ Rated ${p.rating}</span>
              <span style="color: #D1D5DB;">|</span>
              <span class="pd-bookings-count">${esc(p.bookings_count)}</span>
            </div>

            <!-- Main CTA Button -->
            <button type="button" class="btn-primary-maroon pd-main-cta" id="pd-hero-cta">
              ${esc(p.cta_text)}
            </button>

            <!-- Trust Line -->
            <div class="pd-trust-guarantee">
              <span>🛡 ${hi ? '100% सुरक्षित बुकिंग' : '100% Secure Booking'}</span>
              <span style="margin: 0 4px; color: #D1D5DB;">|</span>
              <span>${hi ? 'प्रमाणित तीर्थ पुरोहितों द्वारा संपन्न' : 'Performed by Verified Temple Priests'}</span>
            </div>
          </div>
        </div>

        <!-- Sticky Navigation Tabs -->
        <div class="pd-sticky-tabs" id="pd-tabs-nav">
          <button type="button" class="pd-tab-btn active" data-target="pd-section-about">
            🛕 ${hi ? 'पूजा परिचय' : 'About Puja'}
          </button>
          <button type="button" class="pd-tab-btn" data-target="pd-section-benefits">
            ⭐ ${hi ? 'लाभ' : 'Benefits'}
          </button>
          <button type="button" class="pd-tab-btn" data-target="pd-section-process">
            📋 ${hi ? 'विधि व प्रक्रिया' : 'Process'}
          </button>
          <button type="button" class="pd-tab-btn" data-target="pd-section-packages">
            📦 ${hi ? 'पैकेज' : 'Packages'}
          </button>
          <button type="button" class="pd-tab-btn" data-target="pd-section-faqs">
            ❓ ${hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'FAQs'}
          </button>
        </div>

        <!-- Section 1: About the Puja -->
        <section id="pd-section-about" class="pd-section-block">
          <h2 class="pd-section-title">
            <span>🪔</span> ${hi ? 'पूजा परिचय' : 'About the Puja'}
          </h2>
          <div class="pd-about-card">
            <p class="pd-about-lead">${esc(p.about_lead)}</p>
            <p class="pd-about-text">${esc(p.about_text)}</p>
          </div>
        </section>

        <!-- Section 2: Puja Benefits -->
        <section id="pd-section-benefits" class="pd-section-block">
          <h2 class="pd-section-title">
            <span>⭐</span> ${hi ? 'पूजा के दिव्य लाभ' : 'Puja Benefits'}
          </h2>
          <div class="pd-benefits-grid">
            ${p.benefits.map(b => `
              <div class="pd-benefit-card">
                <div class="pd-benefit-icon-wrap">${b.icon}</div>
                <div class="pd-benefit-text">
                  <div class="pd-benefit-heading">${esc(b.title)}</div>
                  <div class="pd-benefit-sub">${esc(b.desc)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Section 3: Puja Process -->
        <section id="pd-section-process" class="pd-section-block">
          <h2 class="pd-section-title">
            <span>⚙</span> ${hi ? 'पूजा प्रक्रिया' : 'Puja Process'}
          </h2>
          <div class="pd-process-grid">
            ${p.process.map(s => `
              <div class="pd-process-card">
                <div class="pd-step-badge">${s.num}</div>
                <div class="pd-step-title">${esc(s.title)}</div>
                <div class="pd-step-desc">${esc(s.desc)}</div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Section 4: All Packages Include -->
        <div class="pd-section-block">
          <h2 class="pd-section-title">
            <span>🎁</span> ${hi ? 'सभी पूजा पैकेजों में सम्मिलित' : 'All Puja Packages Include'}
          </h2>
          <div class="pd-includes-box">
            ${p.includes.map(inc => `
              <div class="pd-include-item">
                <div class="pd-include-check">✓</div>
                <span>${esc(inc)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Section 5: Select Your Puja Package -->
        <section id="pd-section-packages" class="pd-section-block">
          <h2 class="pd-section-title">
            <span>📦</span> ${hi ? 'अपना पूजा पैकेज चुनें' : 'Select Your Puja Package'}
          </h2>
          <div class="pd-packages-grid">
            ${p.packages.map(pkg => `
              <div class="pd-package-card" data-pkg-id="${pkg.id}">
                <div class="pd-package-img-wrap">
                  <img src="${pkg.img}" alt="${esc(pkg.title)}" class="pd-package-img" loading="lazy" />
                </div>
                <h3 class="pd-package-title">${esc(pkg.title)}</h3>
                <p class="pd-package-sub">${esc(pkg.sub)}</p>
                <div class="pd-package-price">${money(pkg.price)}</div>
                <button type="button" class="pd-package-btn" data-action="book-package" data-pkg-id="${pkg.id}" data-pkg-title="${esc(pkg.title)}" data-pkg-price="${pkg.price}">
                  ${hi ? 'अभी बुक करें ➔' : 'Book Now ➔'}
                </button>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Section 6: Frequently Asked Questions -->
        <section id="pd-section-faqs" class="pd-section-block">
          <h2 class="pd-section-title">
            <span>❓</span> ${hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
          </h2>
          <div class="pd-faq-list">
            ${p.faqs.map((f, i) => `
              <div class="pd-faq-item ${i === 0 ? 'is-open' : ''}">
                <div class="pd-faq-q">
                  <span>${esc(f.q)}</span>
                  <span class="pd-faq-chevron">▼</span>
                </div>
                <div class="pd-faq-a">
                  ${esc(f.a)}
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    this.bindEvents();
  }

  static selectPhoto(index) {
    if (!this.pujaData || !this.pujaData.photos[index]) return;
    this.activePhotoIndex = index;
    const mainImg = this.root.querySelector('#pd-main-img');
    if (mainImg) mainImg.src = this.pujaData.photos[index];

    const thumbs = this.root.querySelectorAll('.pd-thumb');
    thumbs.forEach((thumb, idx) => {
      thumb.classList.toggle('active', idx === index);
    });
  }

  static handleBooking(pkg) {
    const templeObj = {
      id: this.pujaData.id || 'puja-shani-tailabhishek',
      name: this.pujaData.title,
      temple: this.pujaData.temple,
      slug: this.currentSlug,
      city: this.pujaData.temple,
      state: 'Madhya Pradesh'
    };

    const offering = {
      id: pkg ? pkg.id : (this.pujaData.packages[0]?.id || 'pkg-default'),
      title: pkg ? `${this.pujaData.title} - ${pkg.title}` : this.pujaData.title,
      price: pkg ? pkg.price : (this.pujaData.packages[0]?.price || 501),
      image: pkg ? pkg.img : this.pujaData.photos[0]
    };

    if (window.ChadawaModal) {
      window.ChadawaModal.open(templeObj, offering);
    } else {
      toast(`${currentLang() === 'hi' ? 'बुकिंग चुनी गई: ' : 'Booking selected: '} ${offering.title}`, 'info');
    }
  }

  static bindEvents() {
    if (!this.root) return;

    // Thumbnail click
    this.root.querySelectorAll('.pd-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        const idx = parseInt(thumb.dataset.idx, 10);
        if (!isNaN(idx)) this.selectPhoto(idx);
      });
    });

    // Arrow Prev / Next
    const prevBtn = this.root.querySelector('#pd-prev-btn');
    const nextBtn = this.root.querySelector('#pd-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const total = this.pujaData.photos.length;
        const nextIdx = (this.activePhotoIndex - 1 + total) % total;
        this.selectPhoto(nextIdx);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const total = this.pujaData.photos.length;
        const nextIdx = (this.activePhotoIndex + 1) % total;
        this.selectPhoto(nextIdx);
      });
    }

    // Favorite button
    const favBtn = this.root.querySelector('#pd-fav-toggle');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        this.isFavorite = !this.isFavorite;
        favBtn.innerHTML = this.isFavorite ? '♥' : '♡';
        favBtn.style.color = this.isFavorite ? '#DC2626' : '#3E0B18';
        toast(this.isFavorite
          ? (currentLang() === 'hi' ? 'पूजा सुरक्षित सूची में जोड़ी गई' : 'Added to saved pujas')
          : (currentLang() === 'hi' ? 'पूजा सुरक्षित सूची से हटाई गई' : 'Removed from saved pujas'), 'info');
      });
    }

    // Main Hero CTA
    const heroCta = this.root.querySelector('#pd-hero-cta');
    if (heroCta) {
      heroCta.addEventListener('click', () => {
        // Scroll to packages or open default package
        const packagesSection = this.root.querySelector('#pd-section-packages');
        if (packagesSection) {
          packagesSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          this.handleBooking(this.pujaData.packages[0]);
        }
      });
    }

    // Package CTA buttons
    this.root.querySelectorAll('[data-action="book-package"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pkgId = btn.dataset.pkgId;
        const pkgTitle = btn.dataset.pkgTitle;
        const pkgPrice = parseFloat(btn.dataset.pkgPrice);
        const pkg = this.pujaData.packages.find(p => p.id === pkgId) || { id: pkgId, title: pkgTitle, price: pkgPrice };
        this.handleBooking(pkg);
      });
    });

    // Sticky tabs navigation click
    this.root.querySelectorAll('.pd-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        const targetId = tabBtn.dataset.target;
        const targetEl = this.root.querySelector('#' + targetId);
        if (targetEl) {
          const yOffset = -90; // offset for sticky navbar + tabs
          const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        this.root.querySelectorAll('.pd-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
      });
    });

    // FAQ Accordion toggling
    this.root.querySelectorAll('.pd-faq-q').forEach(qEl => {
      qEl.addEventListener('click', () => {
        const item = qEl.closest('.pd-faq-item');
        if (item) {
          const wasOpen = item.classList.contains('is-open');
          // Optional: close other open items
          this.root.querySelectorAll('.pd-faq-item').forEach(it => it.classList.remove('is-open'));
          if (!wasOpen) item.classList.add('is-open');
        }
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.PujaDetailPageComponent = PujaDetailPageComponent;
}

