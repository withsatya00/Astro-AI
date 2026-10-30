import { esc, money, mediaUrl } from './shop.js';
import { currentLang } from './shop-i18n.js';

export const COPY = {
  preferredTime: ['Preferred Time', 'पसंदीदा समय'],
  aboutTitle: ['About Astro Jyotish', 'एस्ट्रो ज्योतिष के बारे में'], aboutCopy: ['Explore astrology consultations, birth charts, temple services and spiritual products from one account.', 'एक ही खाते से ज्योतिष परामर्श, जन्म कुंडली, मंदिर सेवाएँ और आध्यात्मिक सामग्री देखें।'],
  privacyTitle: ['Privacy & account controls', 'गोपनीयता और खाते के नियंत्रण'], privacyCopy: ['Your profile brings together your saved charts and account history. Sign out on shared devices. Recently viewed products are stored in this browser and can be cleared from your profile.', 'आपकी प्रोफ़ाइल में सहेजी गई कुंडली और खाते का इतिहास दिखता है। साझा उपकरण पर साइन आउट करें। हाल में देखी सामग्री इस ब्राउज़र में सहेजी जाती है और प्रोफ़ाइल से हटाई जा सकती है।'],
  refundTitle: ['Cancellations & refunds', 'रद्दीकरण और वापसी'], refundCopy: ['Consultations you cancel in time are returned to your wallet. Cancelled Mandir Seva bookings and Astro Mall orders are refunded as shown when you cancel, and products can be returned within the return period listed on the product page. Gau Sewa donations are one-time: if a payment fails or is charged twice, contact support with your donation reference. Refunds go back to the original payment method.', 'समय पर रद्द किए गए परामर्श की राशि आपके वॉलेट में लौटाई जाती है। रद्द की गई मंदिर सेवा बुकिंग और एस्ट्रो मॉल ऑर्डर की वापसी रद्द करते समय दिखाई गई शर्तों के अनुसार होती है, और सामग्री सामग्री-पृष्ठ पर लिखी वापसी अवधि में लौटाई जा सकती है। गौ सेवा दान एक बार का होता है: भुगतान विफल हो या दो बार कटे तो अपने दान संदर्भ के साथ सहायता से संपर्क करें। वापसी मूल भुगतान माध्यम में होती है।'],
  termsTitle: ['Service information', 'सेवा की जानकारी'], termsCopy: ['Review the final price, selected options and cancellation or return conditions before confirming. Delivery and ritual schedules are estimates unless separately confirmed. Astrological guidance does not guarantee an outcome.', 'पुष्टि से पहले अंतिम मूल्य, चुने विकल्प और रद्द करने या वापसी की शर्तें देखें। अलग से पुष्टि होने तक डिलीवरी और पूजा का समय अनुमानित है। ज्योतिषीय मार्गदर्शन किसी परिणाम की गारंटी नहीं देता।'],
  contactTitle: ['Contact support', 'सहायता से संपर्क करें'], contactCopy: ['Include your order or booking reference and a description of the issue. Never send passwords or payment credentials.', 'ऑर्डर या बुकिंग का संदर्भ और समस्या का विवरण भेजें। पासवर्ड या भुगतान की गुप्त जानकारी कभी न भेजें।'],
  helpTitle: ['Help centre', 'सहायता केंद्र'], helpCopy: ['Use your profile to find orders, appointments and puja progress. Open Wallet to see additions, deductions and refunds. If a section fails to load, use Try again.', 'ऑर्डर, अपॉइंटमेंट और पूजा की प्रगति अपनी प्रोफ़ाइल में देखें। जोड़ी गई राशि, कटौती और रिफंड वॉलेट में देखें। अनुभाग लोड न होने पर दोबारा प्रयास करें।'],
  productIncludes: ['The selected product and variant are listed in your order summary. Certificate and energization details are shown when available.', 'चुनी गई सामग्री और विकल्प ऑर्डर सारांश में दिखते हैं। उपलब्ध होने पर प्रमाण पत्र और अभिमंत्रण का विवरण दिखाया जाता है।'],
  pujaIncludes: ['Inclusions vary by seva. Check the selected offering, ritual video and optional prasad delivery before confirming.', 'क्या शामिल है यह सेवा पर निर्भर है। पुष्टि से पहले चुनी हुई पूजा, वीडियो और वैकल्पिक प्रसाद डिलीवरी देखें।'],
  modechat: ['Text chat', 'लिखित परामर्श'], modecall: ['Audio call', 'ऑडियो कॉल'], modevideo: ['Video call', 'वीडियो कॉल'], cancelAppointment: ['Cancel & refund', 'रद्द करें और रिफंड पाएँ'],
  walletIntro: ['Your balance and every payment, clearly organised.', 'आपकी राशि और हर भुगतान की स्पष्ट जानकारी।'],
  testCreditNote: ['Test credits · no bank payment is collected', 'टेस्ट क्रेडिट · बैंक से कोई भुगतान नहीं लिया जाता'], topUp: ['Add funds', 'राशि जोड़ें'],
  appointmentsHint: ['Looking for an astrologer appointment?', 'ज्योतिषी से अपॉइंटमेंट चाहिए?'], manageAppointments: ['Manage appointments', 'अपॉइंटमेंट प्रबंधित करें'],
  appointmentsIntro: ['Book and manage a scheduled consultation.', 'निर्धारित परामर्श बुक और प्रबंधित करें।'],
  shortConsultations: ['Consultations', 'परामर्श'], continue: ['Continue', 'जारी रखें'], withAstrologer: ['Consultation with', 'इनके साथ परामर्श'],
  serviceDetails: ['Before you book', 'बुकिंग से पहले जानें'], inclusions: ['What is included', 'क्या शामिल है'], timeline: ['What happens next', 'आगे क्या होगा'], cancellation: ['Cancellation & refunds', 'रद्द करना और रिफंड'], support: ['Help & support', 'सहायता और समर्थन'],
  productTimeline: ['The seller prepares your selected item, then dispatches it. Track progress from your profile. Delivery dates are estimates.', 'विक्रेता आपकी चुनी सामग्री तैयार करके भेजता है। प्रगति अपनी प्रोफ़ाइल से देखें। डिलीवरी की तारीख अनुमानित है।'],
  pujaTimeline: ['The temple team confirms the schedule. Available ritual videos and prasad tracking appear in your bookings.', 'मंदिर की टीम समय की पुष्टि करती है। उपलब्ध पूजा वीडियो और प्रसाद ट्रैकिंग आपकी बुकिंग में दिखते हैं।'],
  pujaCancel: ['You can cancel while the booking is in the paid stage. The refund is credited to your wallet. Once the ritual progresses, cancellation is unavailable.', 'भुगतान वाले शुरुआती चरण में बुकिंग रद्द कर सकते हैं। रिफंड वॉलेट में आता है। पूजा की प्रक्रिया आगे बढ़ने पर रद्द करना उपलब्ध नहीं है।'],
  productCancel: ['Orders can be cancelled before energization or dispatch. Wallet payments are refunded to the wallet. Returns follow the policy shown for this product.', 'अभिमंत्रण या भेजे जाने से पहले ऑर्डर रद्द कर सकते हैं। वॉलेट भुगतान का रिफंड वॉलेट में आता है। वापसी इस सामग्री की दिखाई गई नीति के अनुसार है।'],
  mediaUnavailable: ['Photo unavailable', 'तस्वीर उपलब्ध नहीं है'],
  accountOverview: ['Account overview', 'खाते का सारांश'], accountActivity: ['Your activity at a glance', 'आपकी गतिविधियाँ एक नज़र में'],
  quickAccess: ['Made for your next step', 'आपके अगले कदम के लिए'], walletNote: ['Your balance, payments and receipts, all in one place.', 'आपकी राशि, भुगतान और रसीदें, सब एक जगह।'],
  totalAdded: ['Total added', 'कुल जोड़ी गई राशि'], totalSpent: ['Total deducted', 'कुल कटी हुई राशि'], viewHistory: ['View wallet history', 'वॉलेट इतिहास देखें'],
  personalAccount: ['Personal account', 'निजी खाता'], editProfile: ['Edit profile', 'प्रोफ़ाइल बदलें'],
  account: ['My profile', 'मेरी प्रोफ़ाइल'], settings: ['Account details & settings', 'खाते की जानकारी और सेटिंग्स'],
  dashboard: ['My dashboard', 'मेरा डैशबोर्ड'], welcome: ['Your personal space', 'आपका निजी स्थान'],
  intro: ['Your guidance, sacred journeys and shopping, together in one place.', 'आपके परामर्श, धार्मिक सेवाएँ और खरीदारी, सब एक जगह।'],
  refresh: ['Refresh', 'ताज़ा करें'], wallet: ['Wallet', 'वॉलेट'], orders: ['Orders', 'ऑर्डर'], pujas: ['Puja bookings', 'पूजा बुकिंग'],
  profiles: ['Saved kundli', 'सहेजी गई कुंडली'], consultations: ['Consultation history', 'परामर्श इतिहास'], sessions: ['Appointments', 'अपॉइंटमेंट'],
  saved: ['Wishlist', 'पसंदीदा सामग्री'], recent: ['Recently viewed', 'हाल में देखी गई सामग्री'],
  recentNote: ['Saved on this browser. Clear whenever you like.', 'इस ब्राउज़र में सहेजा गया। आप इसे कभी भी हटा सकते हैं।'],
  clear: ['Clear history', 'इतिहास हटाएँ'], explore: ['Explore Astro Mall', 'एस्ट्रो मॉल देखें'], temples: ['Explore temples', 'मंदिर देखें'],
  empty: ['Nothing here yet', 'अभी यहाँ कुछ नहीं है'], emptyNote: ['Your activity will appear here when you get started.', 'शुरुआत करने पर आपकी गतिविधियाँ यहाँ दिखाई देंगी।'],
  login: ['Sign in to your dashboard', 'अपने डैशबोर्ड में साइन इन करें'], loginNote: ['Access your account wallet, orders, bookings and saved birth charts.', 'अपने खाते का वॉलेट, ऑर्डर, बुकिंग और सहेजी हुई कुंडली देखें।'],
  signin: ['Sign in', 'साइन इन करें'], retry: ['Try again', 'दोबारा प्रयास करें'], failed: ['Could not load this section', 'यह अनुभाग लोड नहीं हुआ'],
  loading: ['Loading your experience…', 'आपके लिए जानकारी लोड हो रही है…'], manage: ['Manage', 'प्रबंधित करें'], add: ['Add funds', 'राशि जोड़ें'],
  compare: ['Compare', 'तुलना करें'], comparing: ['Selected for comparison', 'तुलना के लिए चुना गया'], compareTitle: ['Compare your favourites', 'पसंदीदा सामग्री की तुलना करें'],
  compareNote: ['Compare up to 3 products. Prices are for the base variant.', 'अधिकतम 3 सामग्री की तुलना करें। मूल्य मूल विकल्प के हैं।'],
  compareLimit: ['You can compare up to 3 products.', 'आप अधिकतम 3 सामग्री की तुलना कर सकते हैं।'],
  remove: ['Remove', 'हटाएँ'], close: ['Close', 'बंद करें'], price: ['Price', 'मूल्य'], material: ['Material', 'धातु / सामग्री'], origin: ['Origin', 'उत्पत्ति'],
  certified: ['Lab certificate', 'लैब प्रमाण पत्र'], energized: ['Energized', 'अभिमंत्रित'], stock: ['Availability', 'उपलब्धता'], yes: ['Available', 'उपलब्ध'], no: ['Not listed', 'सूचीबद्ध नहीं'],
  inStock: ['In stock', 'स्टॉक में'], outStock: ['Out of stock', 'स्टॉक में नहीं'], view: ['View product', 'सामग्री देखें'],
  returns: ['Returns & delivery', 'वापसी और डिलीवरी'], delivery: ['Estimated delivery', 'अनुमानित डिलीवरी'],
  deliveryNote: ['Enter your PIN below for an estimate. Final dispatch depends on the seller and selected options.', 'अनुमान के लिए नीचे पिन कोड डालें। भेजने का समय विक्रेता और चुने गए विकल्पों पर निर्भर है।'],
  photo: ['Product photo', 'सामग्री की तस्वीर'], next: ['Next photo', 'अगली तस्वीर'], previous: ['Previous photo', 'पिछली तस्वीर'],
  tracker: ['Your puja journey', 'आपकी पूजा की प्रगति'], confirmed: ['Booking confirmed', 'बुकिंग की पुष्टि'], scheduled: ['Puja scheduled', 'पूजा निर्धारित'],
  performed: ['Ritual video available', 'पूजा का वीडियो उपलब्ध'], completed: ['Puja completed', 'पूजा संपन्न'], prasad: ['Prasad dispatched', 'प्रसाद भेजा गया'],
  pending: ['Pending update', 'जानकारी की प्रतीक्षा'], done: ['Completed', 'पूरा हुआ'], current: ['Current stage', 'वर्तमान चरण'],
  cancelled: ['Cancelled · refund recorded', 'रद्द · रिफंड दर्ज'], trackNote: ['Progress updates come from the temple team. Future stages are not confirmed yet.', 'प्रगति की जानकारी मंदिर की टीम देती है। अगले चरणों की अभी पुष्टि नहीं हुई है।'],
  tracking: ['Tracking reference', 'ट्रैकिंग संदर्भ'], watch: ['View booking & video', 'बुकिंग और वीडियो देखें'],
  balance: ['Available balance', 'उपलब्ध राशि'], testMode: ['Test wallet', 'टेस्ट वॉलेट'], transaction: ['Recent transactions', 'हाल के लेनदेन'],
  default: ['Primary', 'मुख्य'], newChart: ['Create birth chart', 'जन्म कुंडली बनाएँ'], resume: ['Open consultation', 'परामर्श खोलें'],
  find: ['Find an astrologer', 'ज्योतिषी खोजें'],
  confirmedStatus: ['Confirmed', 'पुष्टि हुई'], cancelledStatus: ['Cancelled', 'रद्द'], completedStatus: ['Completed', 'पूरा हुआ'],
  activeStatus: ['Active', 'जारी'],
  wishlistEmpty: ['Save something meaningful', 'अपनी पसंद की सामग्री सहेजें'], wishlistNote: ['Tap the heart on any product to keep it here.', 'किसी सामग्री पर दिल का बटन दबाकर उसे यहाँ सहेजें।'],
  credentials: ['Credentials & expertise', 'योग्यता और विशेषज्ञता'], verifiedBadge: ['Verified by Astro Jyotish', 'एस्ट्रो ज्योतिष द्वारा सत्यापित'],
  typeHuman: ['Verified astrologer', 'सत्यापित ज्योतिषी'], typeAi: ['Instant guidance', 'तुरंत मार्गदर्शन'],
  humanNote: ['Personal one-to-one consultation with a human astrologer.', 'मानव ज्योतिषी के साथ व्यक्तिगत परामर्श।'],
  aiNote: ['This is an automated guidance service, not a consultation with a human astrologer.', 'यह स्वचालित मार्गदर्शन सेवा है, किसी मानव ज्योतिषी के साथ परामर्श नहीं।'],
  yearsExp: ['{n} years of experience', '{n} वर्षों का अनुभव'], consultsDone: ['{n} consultations recorded', '{n} परामर्श दर्ज'],
  ratedBy: ['Rated {r}/5 from {n} reviews', '{n} समीक्षाओं से {r}/5 रेटिंग'], speaks: ['Speaks {list}', '{list} में बात करते हैं'], focusAreas: ['Focus areas: {list}', 'विशेषज्ञता: {list}'],
  whyConsult: ['Why consult this expert?', 'इन विशेषज्ञ से परामर्श क्यों लें?'], whyNone: ['More details will appear as this expert completes consultations.', 'जैसे-जैसे परामर्श पूरे होंगे, अधिक जानकारी यहाँ दिखेगी।'],
  clientReviews: ['Client reviews', 'ग्राहक समीक्षाएँ'], noReviews: ['No client reviews yet.', 'अभी कोई ग्राहक समीक्षा नहीं है।'], aboutExpert: ['About', 'परिचय'],
  languagesLabel: ['Languages', 'भाषाएँ'], apptModes: ['Appointment modes', 'अपॉइंटमेंट के प्रकार'], specialisations: ['Specialisations', 'विशेषज्ञता के क्षेत्र'],
  ratePerMin: ['Rate per minute', 'प्रति मिनट शुल्क'], freeRate: ['Free', 'निःशुल्क'], perMin: ['/ min', '/ मिनट'], estimateTitle: ['Estimated session cost', 'सत्र का अनुमानित शुल्क'],
  minutesShort: ['{n} min', '{n} मिनट'], yourBalance: ['Your wallet balance', 'आपके वॉलेट में राशि'], signInBalance: ['Sign in to see your wallet balance and book.', 'वॉलेट राशि देखने और बुक करने के लिए साइन इन करें।'],
  lowBalance: ['Your balance is ₹{n} short for a {m}-minute session.', '{m} मिनट के सत्र के लिए आपकी राशि ₹{n} कम है।'], enoughBalance: ['Wallet balance ₹{b} covers this session.', 'वॉलेट में ₹{b} हैं, जो इस सत्र के लिए पर्याप्त हैं।'],
  shortBalance: ['Balance ₹{b}. Add ₹{n} more to confirm.', 'राशि ₹{b}। पुष्टि के लिए ₹{n} और जोड़ें।'],
  bookAppt: ['Book an appointment', 'अपॉइंटमेंट बुक करें'], chatNow: ['Start consultation now', 'अभी परामर्श शुरू करें'], attachKundli: ['Attach birth chart', 'जन्म कुंडली जोड़ें'],
  offlineNote: ['Currently offline. You can still book a future appointment.', 'अभी ऑफ़लाइन हैं। आप आगे का अपॉइंटमेंट बुक कर सकते हैं।'], busyNote: ['In a consultation right now. Book a later slot or try again shortly.', 'अभी परामर्श में हैं। बाद का समय बुक करें या कुछ देर में प्रयास करें।'],
  statusOnline: ['Online now', 'अभी ऑनलाइन'], statusBusy: ['In a consultation', 'परामर्श में व्यस्त'], statusOffline: ['Offline', 'ऑफ़लाइन'],
  cancelRule: ['Free cancellation until the appointment starts; the full fee returns to your wallet. Once it has started, it cannot be cancelled.', 'अपॉइंटमेंट शुरू होने तक निःशुल्क रद्द करें; पूरा शुल्क वॉलेट में लौटता है। शुरू होने के बाद रद्द नहीं हो सकता।'],
  slotTaken: ['booked', 'बुक है'], slotPast: ['passed', 'बीत गया'], noSlots: ['No free slots on this date. Please choose another date.', 'इस तारीख पर कोई खाली समय नहीं है। कृपया दूसरी तारीख चुनें।'],
  profileFailed: ['We could not load this profile.', 'यह प्रोफ़ाइल लोड नहीं हो सकी।'], profileMissing: ['Astrologer not found', 'ज्योतिषी नहीं मिले'], profileMissingNote: ['This profile does not exist or is not available right now.', 'यह प्रोफ़ाइल मौजूद नहीं है या अभी उपलब्ध नहीं है।'],
  browseAll: ['Browse all astrologers', 'सभी ज्योतिषी देखें'], similarAstro: ['Similar astrologers', 'मिलते-जुलते ज्योतिषी'], viewBtn: ['View', 'देखें'], loadingProfile: ['Loading astrologer profile…', 'ज्योतिषी की प्रोफ़ाइल लोड हो रही है…'],
  bookingMode: ['Consultation mode', 'परामर्श का प्रकार'],
  journeyEyebrow: ['Your journey', 'आपकी यात्रा'], journeyTitle: ['From guidance to action, in four steps', 'मार्गदर्शन से कर्म तक, चार चरणों में'],
  journeySub: ['Speak with an astrologer, understand your chart, perform a puja and choose supportive items, all in one place.', 'ज्योतिषी से बात करें, कुंडली समझें, पूजा करवाएँ और सहायक सामग्री चुनें, सब एक ही जगह।'],
  journeyStep1: ['Consult an astrologer', 'ज्योतिषी से परामर्श'], journeyStep1Text: ['Chat, call or book a time with an astrologer for your question.', 'अपने प्रश्न के लिए ज्योतिषी से चैट, कॉल या समय बुक करें।'], journeyStep1Cta: ['Find an astrologer', 'ज्योतिषी खोजें'],
  journeyStep2: ['Kundli & Vedic tools', 'कुंडली और वैदिक साधन'], journeyStep2Text: ['Birth chart, Kundli matching, Panchang, Dosha and Sade Sati checks.', 'जन्म कुंडली, कुंडली मिलान, पंचांग, दोष और साढ़ेसाती की जाँच।'], journeyStep2Cta: ['Open tools', 'साधन खोलें'],
  journeyStep3: ['Mandir Seva', 'मंदिर सेवा'], journeyStep3Text: ['Book a sankalp puja at a temple and follow its progress.', 'मंदिर में संकल्प पूजा बुक करें और उसकी प्रगति देखें।'], journeyStep3Cta: ['Explore temples', 'मंदिर देखें'],
  journeyStep4: ['Astro Mall', 'एस्ट्रो मॉल'], journeyStep4Text: ['Rudraksha, gemstones and yantras with clear product details.', 'रुद्राक्ष, रत्न और यंत्र, स्पष्ट सामग्री विवरण के साथ।'], journeyStep4Cta: ['Shop Astro Mall', 'एस्ट्रो मॉल देखें'],
  reviewRule: ['Only clients who have consulted this astrologer can post a review, once.', 'केवल वही ग्राहक समीक्षा लिख सकते हैं जिन्होंने इन ज्योतिषी से परामर्श लिया हो, एक बार।'],
  yourRating: ['Your rating', 'आपकी रेटिंग'], yourReview: ['Your review', 'आपकी समीक्षा'], postReview: ['Post review', 'समीक्षा भेजें'], reviewThanks: ['Thank you! Your review has been posted.', 'धन्यवाद! आपकी समीक्षा जुड़ गई है।'],
  yourData: ['Your data', 'आपका डेटा'], downloadData: ['Download my data (JSON)', 'मेरा डेटा डाउनलोड करें (JSON)'], dataSignIn: ['Sign in to download or delete your data.', 'अपना डेटा डाउनलोड या हटाने के लिए साइन इन करें।'],
  deleteNote: ['Deleting removes your profile, saved charts, chats and wishlist. Payment, order and booking records are kept without personal details. This cannot be undone.', 'हटाने पर आपकी प्रोफ़ाइल, सहेजी कुंडली, चैट और विशलिस्ट मिट जाएँगी। भुगतान, ऑर्डर और बुकिंग के रिकॉर्ड व्यक्तिगत जानकारी के बिना रखे जाते हैं। इसे वापस नहीं किया जा सकता।'],
  passwordLabel: ['Confirm with your password', 'अपने पासवर्ड से पुष्टि करें'], forfeitLabel: ['I understand any wallet balance will be forfeited', 'मैं समझता/समझती हूँ कि वॉलेट की शेष राशि समाप्त हो जाएगी'],
  deleteAccount: ['Delete my account', 'मेरा खाता हटाएँ'], deleteConfirm: ['Delete your account permanently?', 'क्या आप अपना खाता हमेशा के लिए हटाना चाहते हैं?'],
  searchTitle: ['Search', 'खोजें'], searchPlaceholder: ['Search astrologers, temples or products', 'ज्योतिषी, मंदिर या सामग्री खोजें'], searchHint: ['Type at least two letters. Press / anywhere to open search.', 'कम से कम दो अक्षर लिखें। कहीं भी / दबाकर खोज खोलें।'],
  searchAstrologers: ['Astrologers', 'ज्योतिषी'], searchTemples: ['Temples', 'मंदिर'], searchProducts: ['Products', 'सामग्री'], searchNone: ['Nothing matches your search.', 'आपकी खोज से कुछ नहीं मिला।'],
  trustTitle: ['How Astro Jyotish works', 'एस्ट्रो ज्योतिष कैसे काम करता है'], trustIntro: ['Plain facts about the service, so you know what to expect.', 'सेवा के बारे में सीधी जानकारी, ताकि आपको पता रहे क्या अपेक्षा रखनी है।'],
  trustCounts: ['{all} profiles listed: {human} verified astrologers and {ai} instant guidance services. Each profile clearly shows its type.', '{all} प्रोफ़ाइल सूचीबद्ध हैं: {human} सत्यापित ज्योतिषी और {ai} तुरंत मार्गदर्शन सेवाएँ। हर प्रोफ़ाइल में उसका प्रकार स्पष्ट है।'],
  trustAiLabel: ['Instant guidance services are clearly marked.', 'तुरंत मार्गदर्शन सेवाएँ स्पष्ट रूप से दर्शाई जाती हैं।'],
  trustRefund: ['A cancelled appointment before it starts is refunded in full to your wallet.', 'शुरू होने से पहले रद्द किए गए अपॉइंटमेंट का पूरा शुल्क आपके वॉलेट में लौटाया जाता है।'],
  trustReviews: ['Only clients who have consulted an astrologer can review them.', 'केवल वही ग्राहक समीक्षा लिख सकते हैं जिन्होंने ज्योतिषी से परामर्श लिया हो।'],
  trustData: ['You can download or delete your personal data any time from Privacy & account controls.', 'आप गोपनीयता और खाते के नियंत्रण से अपना व्यक्तिगत डेटा कभी भी डाउनलोड या हटा सकते हैं।'],
  recentlyEmpty: ['Your next discovery starts here', 'यहाँ से अपनी पसंद खोजना शुरू करें'],
};
export const x = key => COPY[key]?.[currentLang() === 'hi' ? 1 : 0] || key;
export const fmt = (text, values = {}) => String(text).replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');
export const statusText = value => x(({active: 'activeStatus', confirmed: 'confirmedStatus', cancelled: 'cancelledStatus', completed: 'completedStatus'})[String(value).toLowerCase()] || 'pending');
export const dateText = value => {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? String(value) : d.toLocaleDateString(currentLang() === 'hi' ? 'hi-IN' : 'en-IN', {day: 'numeric', month: 'short', year: 'numeric'});
};
export const skeleton = (count = 3) => `<div class="exp-skeletons" role="status" aria-label="${esc(x('loading'))}">${Array.from({length: count}, () => '<div class="exp-skeleton"><i></i><i></i><i></i></div>').join('')}</div>`;
export const empty = (title = 'empty', note = 'emptyNote', href = '', label = 'explore') => `<div class="exp-empty"><span aria-hidden="true">✧</span><h3>${esc(x(title))}</h3><p>${esc(x(note))}</p>${href ? `<a class="shop-btn shop-btn--gold" href="${esc(href)}">${esc(x(label))}</a>` : ''}</div>`;
export const errorState = () => `<div class="exp-empty" role="alert"><h3>${esc(x('failed'))}</h3><button type="button" class="shop-btn shop-btn--line" data-exp-retry>${esc(x('retry'))}</button></div>`;

export function bookingTimeline(b) {
  if (b.status === 'CANCELLED') return `<p class="exp-cancelled">${esc(x('cancelled'))}</p>`;
  const rank = ['PAID', 'SANKALP_SCHEDULED', 'VIDEO_UPLOADED', 'COMPLETED'].indexOf(b.status);
  const stages = [
    ['confirmed', rank >= 0, dateText(b.created_at)],
    ['scheduled', rank >= 1, b.scheduled_for || ''],
    ['performed', !!b.video_proof_url || rank >= 2, ''],
    ['completed', rank >= 3, ''],
    ...(b.include_prasad ? [['prasad', !!b.prasad_tracking_id, b.prasad_tracking_id || '']] : [])
  ];
  const current = stages.reduce((last, s, i) => s[1] ? i : last, -1);
  return `<section class="exp-journey" translate="no" aria-label="${esc(x('tracker'))}"><h4>${esc(x('tracker'))}</h4><ol>${stages.map(([key, done, detail], i) => `<li class="${done ? 'is-done' : ''}" ${i === current ? 'aria-current="step"' : ''}><span class="exp-step-dot" aria-hidden="true">${done ? '✓' : i + 1}</span><div><strong>${esc(x(key))}</strong><small>${esc(detail || x(done ? 'done' : 'pending'))}</small></div></li>`).join('')}</ol><p>${esc(x('trackNote'))}</p></section>`;
}

export function productTile(p) {
  return `<article class="exp-mini-card"><a href="/astro-mall/product/${encodeURIComponent(p.id)}"><img src="${esc(mediaUrl(p.image_url))}" alt="${esc(p.title)}" loading="lazy"><h3>${esc(p.title)}</h3></a><strong>${money(p.price)}</strong></article>`;
}
