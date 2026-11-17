// Per-route SEO: [English title, Hindi title, English description, Hindi description, noindex].
export const SEO_PAGES = {
  '/': ['Astro Jyotish – Vedic Astrology, Kundli, Mandir Seva & Astro Mall', 'वैदिक ज्योतिष, कुंडली, मंदिर सेवा और एस्ट्रो मॉल | Astro Jyotish', 'Consult astrologers, generate your Kundli, book temple pujas and shop spiritual products on Astro Jyotish.', 'ज्योतिषियों से परामर्श करें, कुंडली बनाएँ, मंदिर पूजा बुक करें और आध्यात्मिक सामग्री खरीदें।'],
  '/astrologers': ['Talk to Astrologers Online | Astro Jyotish', 'ज्योतिषियों से ऑनलाइन बात करें | Astro Jyotish', 'Browse astrologers by language, speciality and price, then chat, call or book an appointment.', 'भाषा, विशेषज्ञता और शुल्क के अनुसार ज्योतिषी चुनें और चैट, कॉल या अपॉइंटमेंट बुक करें।'],
  '/calculators': ['Free Kundli, Matching & Vedic Calculators | Astro Jyotish', 'मुफ़्त कुंडली, मिलान और वैदिक कैलकुलेटर | Astro Jyotish', 'Birth chart, Kundli matching, Dosha, Sade Sati and numerology calculators.', 'जन्म कुंडली, कुंडली मिलान, दोष, साढ़ेसाती और अंक ज्योतिष कैलकुलेटर।'],
  '/panchang': ['Today\'s Panchang | Astro Jyotish', 'आज का पंचांग | Astro Jyotish', 'Tithi, nakshatra, yoga, karana and auspicious timings for today.', 'आज की तिथि, नक्षत्र, योग, करण और शुभ मुहूर्त।'],
  '/rashiphal': ['Daily Horoscope (Rashifal) | Astro Jyotish', 'दैनिक राशिफल | Astro Jyotish', 'Daily horoscope for all twelve zodiac signs.', 'सभी बारह राशियों का दैनिक राशिफल।'],
  '/mandir-seva': ['Mandir Seva – Book Temple Puja Online | Astro Jyotish', 'मंदिर सेवा – ऑनलाइन पूजा बुक करें | Astro Jyotish', 'Book sankalp puja and offerings at temples and follow your booking status.', 'मंदिरों में संकल्प पूजा और चढ़ावा बुक करें और बुकिंग की स्थिति देखें।'],
  '/astro-mall': ['Astro Mall – Rudraksha, Gemstones & Yantras | Astro Jyotish', 'एस्ट्रो मॉल – रुद्राक्ष, रत्न और यंत्र | Astro Jyotish', 'Spiritual products with clear details, delivery estimates and return policy.', 'स्पष्ट विवरण, डिलीवरी अनुमान और वापसी नीति के साथ आध्यात्मिक सामग्री।'],
  '/gau-sewa': ['Gau Sewa – Support Cow Care | Astro Jyotish', 'गौ सेवा – गौ सेवा में सहयोग करें | Astro Jyotish', 'Make a one-time donation for fodder, medical help or general seva at a gaushala.', 'गौशाला में चारा, चिकित्सा या सामान्य सेवा के लिए एक बार दान करें।'],
  '/bhakti': ['Bhakti – Naam Jaap, Aarti & Chalisa | Astro Jyotish', 'भक्ति – नाम जाप, आरती और चालीसा | Astro Jyotish', 'Count naam jaap, read aartis and chalisas, and keep your devotional progress.', 'नाम जाप गिनें, आरती और चालीसा पढ़ें और अपनी भक्ति प्रगति सहेजें।'],
  '/wallet': ['My Wallet | Astro Jyotish', 'मेरा वॉलेट | Astro Jyotish', '', '', true],
  '/profile': ['My Account | Astro Jyotish', 'मेरा खाता | Astro Jyotish', '', '', true],
};

// Detail pages under these prefixes set their own title; they are never treated as "not found".
export const SEO_DETAIL_PREFIXES = /^\/(astrologers?|consultations?|consult|astro-mall|mall|mandir-seva|temple|puja|chadhava|bhakti|calculators)\//;
