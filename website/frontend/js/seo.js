/* Per-page title, description, canonical and structured data (updated on every route change). */
(function () {
  const PAGES = {
    '/': ['Astro Jyotish – Vedic Astrology, Kundli, Mandir Seva & Astro Mall', 'वैदिक ज्योतिष, कुंडली, मंदिर सेवा और एस्ट्रो मॉल | Astro Jyotish', 'Consult astrologers, generate your Kundli, book temple pujas and shop spiritual products on Astro Jyotish.', 'ज्योतिषियों से परामर्श करें, कुंडली बनाएँ, मंदिर पूजा बुक करें और आध्यात्मिक सामग्री खरीदें।'],
    '/astrologers': ['Talk to Astrologers Online | Astro Jyotish', 'ज्योतिषियों से ऑनलाइन बात करें | Astro Jyotish', 'Browse astrologers by language, speciality and price, then chat, call or book an appointment.', 'भाषा, विशेषज्ञता और शुल्क के अनुसार ज्योतिषी चुनें और चैट, कॉल या अपॉइंटमेंट बुक करें।'],
    '/calculators': ['Free Kundli, Matching & Vedic Calculators | Astro Jyotish', 'मुफ़्त कुंडली, मिलान और वैदिक कैलकुलेटर | Astro Jyotish', 'Birth chart, Kundli matching, Dosha, Sade Sati and numerology calculators.', 'जन्म कुंडली, कुंडली मिलान, दोष, साढ़ेसाती और अंक ज्योतिष कैलकुलेटर।'],
    '/panchang': ['Today\'s Panchang | Astro Jyotish', 'आज का पंचांग | Astro Jyotish', 'Tithi, nakshatra, yoga, karana and auspicious timings for today.', 'आज की तिथि, नक्षत्र, योग, करण और शुभ मुहूर्त।'],
    '/rashiphal': ['Daily Horoscope (Rashifal) | Astro Jyotish', 'दैनिक राशिफल | Astro Jyotish', 'Daily horoscope for all twelve zodiac signs.', 'सभी बारह राशियों का दैनिक राशिफल।'],
    '/mandir-seva': ['Mandir Seva – Book Temple Puja Online | Astro Jyotish', 'मंदिर सेवा – ऑनलाइन पूजा बुक करें | Astro Jyotish', 'Book sankalp puja and offerings at temples and follow your booking status.', 'मंदिरों में संकल्प पूजा और चढ़ावा बुक करें और बुकिंग की स्थिति देखें।'],
    '/astro-mall': ['Astro Mall – Rudraksha, Gemstones & Yantras | Astro Jyotish', 'एस्ट्रो मॉल – रुद्राक्ष, रत्न और यंत्र | Astro Jyotish', 'Spiritual products with clear details, delivery estimates and return policy.', 'स्पष्ट विवरण, डिलीवरी अनुमान और वापसी नीति के साथ आध्यात्मिक सामग्री।'],
    '/gau-sewa': ['Gau Sewa – Support Cow Care | Astro Jyotish', 'गौ सेवा – गौ सेवा में सहयोग करें | Astro Jyotish', 'Make a one-time donation for fodder, medical help or general seva at a gaushala.', 'गौशाला में चारा, चिकित्सा या सामान्य सेवा के लिए एक बार दान करें।'],
    '/gifts': ['Gifts & Festival Packs | Astro Jyotish', 'उपहार और त्योहार पैक | Astro Jyotish', 'Send wallet credit as a gift card or buy a ready festival puja set.', 'वॉलेट क्रेडिट उपहार कार्ड के रूप में भेजें या तैयार त्योहार पूजा सेट खरीदें।'],
    '/rewards': ['My Rewards | Astro Jyotish', 'मेरे रिवॉर्ड | Astro Jyotish', '', '', true],
    '/dashboard': ['My Dashboard | Astro Jyotish', 'मेरा डैशबोर्ड | Astro Jyotish', '', '', true],
    '/admin': ['Admin | Astro Jyotish', 'व्यवस्थापक | Astro Jyotish', '', '', true],
    '/seller': ['Seller | Astro Jyotish', 'विक्रेता | Astro Jyotish', '', '', true],
  };
  const hi = () => (window.I18n && window.I18n.currentLang) === 'hi';
  function meta(selector, create, value) {
    let el = document.head.querySelector(selector);
    if (!el) { el = create(); document.head.appendChild(el); }
    el.setAttribute(el.tagName === 'LINK' ? 'href' : 'content', value);
  }
  function apply(title, description, noindex, path) {
    document.title = title;
    if (description) {
      meta('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }), description);
      meta('meta[property="og:description"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:description'); return m; }, description);
    }
    meta('meta[property="og:title"]', () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:title'); return m; }, title);
    meta('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' }), noindex ? 'noindex, nofollow' : 'index, follow');
    meta('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), location.origin + path);
  }
  function jsonld(data) {
    let el = document.getElementById('seo-jsonld');
    if (!data) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'seo-jsonld'; document.head.appendChild(el); }
    el.textContent = JSON.stringify(data);
  }
  window.Seo = {
    last: null,
    /** Re-applies the current page's SEO (the language switcher resets the title). Returns false if no page was set yet. */
    refresh() { if (!this.last) return false; this.last(); return true; },
    update(pathname) {
      this.last = () => this.apply(pathname);
      this.apply(pathname);
    },
    apply(pathname) {
      // A donation receipt URL carries a secret token: never index it and never echo the token in the canonical URL.
      if (pathname.startsWith('/gau-sewa/receipt/')) {
        jsonld(null);
        apply(hi() ? 'गौ सेवा रसीद | Astro Jyotish' : 'Gau Sewa receipt | Astro Jyotish', '', true, '/gau-sewa');
        return;
      }
      const key = pathname === '/home' ? '/' : (PAGES[pathname] ? pathname : (/^\/calculators\/[a-z-]+$/.test(pathname) ? '/calculators' : null));
      const page = key && PAGES[key];
      jsonld(key === '/' ? { '@context': 'https://schema.org', '@type': 'Organization', name: 'Astro Jyotish', url: location.origin, logo: location.origin + '/assets/brand/icon-512.png' } : null);
      if (page) apply(hi() ? page[1] : page[0], hi() ? page[3] : page[2], !!page[4], pathname);
      else if (!/^\/(astrologers?|consultations?|astro-mall|mandir-seva|verify)\//.test(pathname)) {
        // Unknown route: do not keep the previous page's title, and keep it out of search results.
        apply(hi() ? 'पृष्ठ नहीं मिला | Astro Jyotish' : 'Page not found | Astro Jyotish', '', true, pathname);
      }
    },
    /** For detail pages (astrologer, product): own title/description plus structured data. */
    entity(info) {
      this.last = () => { apply(info.title, info.description, false, location.pathname); jsonld(info.data); };
      this.last();
    },
  };
})();
