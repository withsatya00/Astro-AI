// English / Hindi copy for the consultation room. Replies from the astrologer are server content and are shown as sent.
import { parseUtc } from './consultApi.js';

const EN = {
  consultTitle: 'Consultation', back: 'Back', info: 'About this astrologer', wallet: 'Wallet', signIn: 'Sign in', call: 'Call', end: 'End',
  online: 'Online', busy: 'Busy right now', offline: 'Offline', aiBadge: 'Verified astrologer', verifiedBadge: 'Verified astrologer',
  aiNotice: 'Consultation is conducted in accordance with authentic Vedic Parashari principles, horoscope calculations, and traditional remedies.',
  humanNotice: 'Your message is delivered to the astrologer, who replies with personalized Vedic guidance.',
  notBilled: '',
  aiShort: 'Authentic Vedic Astrology Guidance', humanShort: 'Personalized Vedic Astrologer Guidance',
  olderFailed: 'Could not load earlier messages. Tap to try again.',
  private: 'Private consultation', privateSub: 'Your conversation is confidential and visible only to you.',
  rating: 'Rating', experience: 'Experience', languages: 'Languages', years: 'years', specialties: 'Specialties',
  perMin: '/min', about: 'About',
  composerLabel: 'Type your question', composerPlaceholder: 'Ask your astrological question…', send: 'Send', sendWaiting: 'Waiting for the reply',
  typing: 'is analyzing your chart & preparing response…', sending: 'Sending', sent: 'Sent', failed: 'Not sent', retry: 'Tap to retry',
  today: 'Today', yesterday: 'Yesterday', loadingOlder: 'Loading earlier messages…', startOfChat: 'Start of your conversation with',
  jumpLatest: 'Latest messages', newMessages: 'new', demoReply: 'Demo reply: the astrology service is not connected',
  offlineBanner: 'You are offline. Messages will not send until you reconnect.',
  greetingAi: 'Namaste! Share your question, along with your birth date, birth time (with AM/PM) and birth city so I can analyze your Kundli.',
  greetingHuman: 'Namaste! Share your question, along with your birth date, birth time (with AM/PM) and birth city so I can analyze your Kundli.',
  previousConsultation: 'Earlier consultation', consultationStarted: 'New consultation',
  loading: 'Opening the consultation room…', retryLoad: 'Try again', loadError: 'The consultation room could not be opened. Please check your connection and try again.',
  unavailableTitle: 'This astrologer is not available for consultation yet', unavailableBody: 'Their profile is listed, but live consultation has not been set up for them. These astrologers are available now:',
  chooseTitle: 'Choose an astrologer to consult', chooseBody: 'Start a private consultation with any of these certified astrologers.',
  startChat: 'Start chat', browseAll: 'Browse all astrologers', aiTag: 'Verified', humanTag: 'Verified',
  endTitle: 'End this consultation?', endBody: 'You will get a short summary. You can start a new consultation any time, and this conversation stays in your history.',
  endConfirm: 'End consultation', cancel: 'Cancel', ending: 'Ending…',
  summaryTitle: 'Consultation summary', insights: 'Key insights', remedies: 'Suggested remedies', followUps: 'Next steps', rateTitle: 'How was this consultation?',
  ratePlaceholder: 'Anything you would like to add? (optional)', submitRating: 'Submit feedback', thanks: 'Thank you for your feedback.', close: 'Close',
  endedBanner: 'This consultation has ended.', startNew: 'Start a new consultation', endFailed: 'Could not end the consultation. Please try again.',
  callAiTitle: 'Schedule a Consultation', callAiBody: 'Connect with verified Vedic astrologers for private consultation appointments.',
  bookTitle: 'Book a consultation with', bookMode: 'How would you like to talk?', modeCall: 'Phone call', modeVideo: 'Video', modeChat: 'Chat',
  bookDate: 'Date', bookTime: 'Time (IST)', bookDuration: 'Duration', minutes: 'minutes', bookName: 'Your name', bookPhone: 'Phone (optional)', bookConcern: 'What would you like to discuss? (optional)',
  bookTotal: 'Amount', bookBalance: 'Wallet balance', bookShort: 'Add money to your wallet to book this slot.', recharge: 'Add money',
  bookSignIn: 'Please sign in to book an appointment. The amount is paid from your wallet.', bookConfirm: 'Confirm and pay', booking: 'Booking…',
  bookDone: 'Your appointment is confirmed', bookId: 'Booking ID', bookBusy: 'Booked', bookPast: 'Past', pickTime: 'Choose a time',
  bookNameRequired: 'Please enter your name.', bookPhoneInvalid: 'Enter a valid 10-digit phone number or leave it empty.', bookTimeRequired: 'Choose a date and time.',
  notSignedIn: 'Sign in to see balance', balanceUnavailable: 'Unavailable',
  authRequiredTitle: 'Sign In Required to Consult',
  authRequiredBody: (name, rate) => `Please sign in or create an account to consult with ${name} at ₹${rate}/minute.`,
  authRequiredSub: 'Your wallet balance, astrological reports, and consultation records are securely preserved.',
  authRequiredBtn: 'Sign In to Continue',
  insufficientTitle: 'Insufficient Wallet Balance',
  insufficientBody: (rate, bal) => `Consultation rate is ₹${rate}/min. Your current balance is ${bal}. A minimum balance of 1 minute (₹${rate}) is required to start chat.`,
  rechargeWalletNow: '+ Recharge Wallet Now',
  exhaustedTitle: 'Wallet Balance Exhausted',
  exhaustedBody: 'Your consultation session has paused because your wallet balance has been exhausted.',
  exhaustedSub: 'Please recharge your wallet now to continue your consultation.',
  rechargeToContinue: '+ Recharge to Continue',
  endConsultationBtn: 'End Consultation',
  quick: [
    ['💼', 'How is my career going to be?'], ['💍', 'When will I get married?'], ['🍂', 'Shani Sade Sati remedies'],
    ['💎', 'Which gemstone suits me?'], ['👑', 'Is there a Raj Yoga in my chart?'],
  ],
  errs: { 0: 'You appear to be offline.', 400: 'Please reload the page and try again.', 401: 'Please sign in again.', 402: 'Your wallet balance is too low.', 404: 'This could not be found.', 409: 'That slot was just taken. Please pick another.', 422: 'Please check the details and try again.', 429: 'Too many requests. Please wait a moment.', 500: 'Something went wrong on our side. Please try again.' },
};

const HI = {
  consultTitle: 'परामर्श', back: 'वापस', info: 'ज्योतिषी के बारे में', wallet: 'वॉलेट', signIn: 'साइन इन', call: 'कॉल', end: 'समाप्त',
  online: 'ऑनलाइन', busy: 'अभी व्यस्त', offline: 'ऑफ़लाइन', aiBadge: 'सत्यापित ज्योतिषी', verifiedBadge: 'सत्यापित ज्योतिषी',
  aiNotice: 'परामर्श प्रामाणिक वैदिक पराशरी पद्धति, ग्रह गणना एवं पारंपरिक ज्योतिषीय उपायों के आधार पर किया जाता है।',
  humanNotice: 'आपका संदेश ज्योतिषी तक पहुँचाया जाता है, जो व्यक्तिगत वैदिक मार्गदर्शन प्रदान करेंगे।',
  notBilled: '',
  aiShort: 'प्रामाणिक वैदिक ज्योतिष परामर्श', humanShort: 'व्यक्तिगत वैदिक ज्योतिषी मार्गदर्शन',
  olderFailed: 'पुराने संदेश लोड नहीं हो सके। दोबारा कोशिश के लिए दबाएँ।',
  private: 'निजी परामर्श', privateSub: 'आपकी बातचीत गोपनीय है और केवल आपको दिखती है।',
  rating: 'रेटिंग', experience: 'अनुभव', languages: 'भाषाएँ', years: 'वर्ष', specialties: 'विशेषज्ञता',
  perMin: '/मिनट', about: 'परिचय',
  composerLabel: 'अपना प्रश्न लिखें', composerPlaceholder: 'अपना ज्योतिष संबंधी प्रश्न लिखें…', send: 'भेजें', sendWaiting: 'उत्तर की प्रतीक्षा है',
  typing: 'कुंडली विश्लेषण कर उत्तर तैयार कर रहे हैं…', sending: 'भेजा जा रहा है', sent: 'भेजा गया', failed: 'नहीं भेजा गया', retry: 'दोबारा भेजने के लिए दबाएँ',
  today: 'आज', yesterday: 'कल', loadingOlder: 'पुराने संदेश लोड हो रहे हैं…', startOfChat: 'आपकी बातचीत की शुरुआत',
  jumpLatest: 'नए संदेश', newMessages: 'नए', demoReply: 'डेमो उत्तर: सेवा जुड़ी नहीं है',
  offlineBanner: 'आप ऑफ़लाइन हैं। दोबारा कनेक्ट होने तक संदेश नहीं जाएँगे।',
  greetingAi: 'नमस्ते! अपना प्रश्न लिखें, और साथ में जन्म तिथि, जन्म समय (AM/PM के साथ) और जन्म शहर बताएँ, ताकि आपकी विस्तृत कुंडली का विश्लेषण किया जा सके।',
  greetingHuman: 'नमस्ते! अपना प्रश्न यहाँ लिखें। साथ में जन्म तिथि, जन्म समय और स्थान भी बताएँ।',
  previousConsultation: 'पिछला परामर्श', consultationStarted: 'नया परामर्श',
  loading: 'परामर्श कक्ष खुल रहा है…', retryLoad: 'दोबारा कोशिश करें', loadError: 'परामर्श कक्ष नहीं खुल सका। कृपया अपना कनेक्शन जाँचकर दोबारा कोशिश करें।',
  unavailableTitle: 'इन ज्योतिषी से अभी परामर्श उपलब्ध नहीं है', unavailableBody: 'इनकी प्रोफ़ाइल सूची में है, पर लाइव परामर्श अभी शुरू नहीं हुआ है। ये ज्योतिषी अभी उपलब्ध हैं:',
  chooseTitle: 'परामर्श के लिए ज्योतिषी चुनें', chooseBody: 'इनमें से किसी भी प्रमाणित ज्योतिषी से निजी चैट शुरू करें।',
  startChat: 'चैट शुरू करें', browseAll: 'सभी ज्योतिषी देखें', aiTag: 'सत्यापित', humanTag: 'सत्यापित',
  endTitle: 'क्या यह परामर्श समाप्त करें?', endBody: 'आपको एक छोटा सारांश मिलेगा। आप कभी भी नया परामर्श शुरू कर सकते हैं, और यह बातचीत आपके इतिहास में बनी रहेगी।',
  endConfirm: 'परामर्श समाप्त करें', cancel: 'रद्द करें', ending: 'समाप्त हो रहा है…',
  summaryTitle: 'परामर्श सारांश', insights: 'मुख्य बातें', remedies: 'सुझाए गए उपाय', followUps: 'अगले कदम', rateTitle: 'यह परामर्श कैसा रहा?',
  ratePlaceholder: 'कुछ और जोड़ना चाहें तो लिखें (वैकल्पिक)', submitRating: 'फ़ीडबैक भेजें', thanks: 'आपके फ़ीडबैक के लिए धन्यवाद।', close: 'बंद करें',
  endedBanner: 'यह परामर्श समाप्त हो चुका है।', startNew: 'नया परामर्श शुरू करें', endFailed: 'परामर्श समाप्त नहीं हो सका। कृपया दोबारा कोशिश करें।',
  callAiTitle: 'परामर्श बुक करें', callAiBody: 'सत्यापित वैदिक ज्योतिषियों के साथ निजी ऑडियो या वीडियो परामर्श बुक करें।',
  bookTitle: 'परामर्श बुक करें:', bookMode: 'आप कैसे बात करना चाहेंगे?', modeCall: 'फ़ोन कॉल', modeVideo: 'वीडियो', modeChat: 'चैट',
  bookDate: 'तारीख', bookTime: 'समय (IST)', bookDuration: 'अवधि', minutes: 'मिनट', bookName: 'आपका नाम', bookPhone: 'फ़ोन (वैकल्पिक)', bookConcern: 'आप किस विषय पर बात करना चाहते हैं? (वैकल्पिक)',
  bookTotal: 'राशि', bookBalance: 'वॉलेट बैलेंस', bookShort: 'यह स्लॉट बुक करने के लिए वॉलेट में पैसे जोड़ें।', recharge: 'पैसे जोड़ें',
  bookSignIn: 'अपॉइंटमेंट बुक करने के लिए कृपया साइन इन करें। राशि आपके वॉलेट से ली जाती है।', bookConfirm: 'पुष्टि करें और भुगतान करें', booking: 'बुक हो रहा है…',
  bookDone: 'आपका अपॉइंटमेंट पक्का हो गया', bookId: 'बुकिंग आईडी', bookBusy: 'बुक है', bookPast: 'बीत चुका', pickTime: 'समय चुनें',
  bookNameRequired: 'कृपया अपना नाम लिखें।', bookPhoneInvalid: 'सही 10 अंकों का फ़ोन नंबर लिखें, या खाली छोड़ दें।', bookTimeRequired: 'तारीख और समय चुनें।',
  notSignedIn: 'बैलेंस देखने के लिए साइन इन करें', balanceUnavailable: 'उपलब्ध नहीं',
  authRequiredTitle: 'परामर्श हेतु लॉगिन आवश्यक है',
  authRequiredBody: (name, rate) => `${name} के साथ ₹${rate}/मिनट पर परामर्श आरंभ करने के लिए कृपया साइन इन करें।`,
  authRequiredSub: 'आपका वॉलेट बैलेंस और कुंडली परामर्श इतिहास पूर्णतः सुरक्षित रहता है।',
  authRequiredBtn: 'साइन इन / रजिस्टर करें',
  insufficientTitle: 'वॉलेट में अपर्याप्त बैलेंस',
  insufficientBody: (rate, bal) => `परामर्श दर ₹${rate}/मिनट है। आपके वॉलेट में शेष राशि ${bal} है। चैट आरंभ करने हेतु कम से कम 1 मिनट (₹${rate}) का बैलेंस होना आवश्यक है।`,
  rechargeWalletNow: '+ वॉलेट रिचार्ज करें',
  exhaustedTitle: 'वॉलेट बैलेंस समाप्त',
  exhaustedBody: 'वॉलेट बैलेंस समाप्त होने के कारण आपका परामर्श सत्र रोक दिया गया है।',
  exhaustedSub: 'परामर्श जारी रखने के लिए कृपया तुरंत अपना वॉलेट रिचार्ज करें।',
  rechargeToContinue: '+ रिचार्ज करके जारी रखें',
  endConsultationBtn: 'परामर्श समाप्त करें',
  quick: [
    ['💼', 'मेरा करियर कैसा रहेगा?'], ['💍', 'मेरी शादी कब होगी?'], ['🍂', 'शनि साढ़े साती के उपाय'],
    ['💎', 'मेरे लिए कौन सा रत्न शुभ है?'], ['👑', 'क्या मेरी कुंडली में राजयोग है?'],
  ],
  errs: { 0: 'आप ऑफ़लाइन लग रहे हैं।', 400: 'कृपया पेज दोबारा लोड करें।', 401: 'कृपया दोबारा साइन इन करें।', 402: 'आपके वॉलेट में बैलेंस कम है।', 404: 'यह नहीं मिला।', 409: 'यह स्लॉट अभी बुक हो गया। कृपया दूसरा चुनें।', 422: 'कृपया जानकारी जाँचकर दोबारा कोशिश करें।', 429: 'बहुत अधिक अनुरोध। कृपया थोड़ा रुकें।', 500: 'हमारी तरफ़ कुछ गड़बड़ हुई। कृपया दोबारा कोशिश करें।' },
};

export const copy = (lang) => (lang === 'hi' ? HI : EN);

// A short, friendly message for an API error, falling back to what the server said.
export const errorText = (c, e) => {
  if (!e) return '';
  const known = c.errs[e.status];
  if (e.status === 402 || e.status === 409 || e.status === 401 || e.status === 0) return known || e.message;
  return (e.message && e.status >= 400 && e.status < 500 && e.status !== 404 && e.status !== 429 ? e.message : known) || e.message || c.errs[500];
};

const localeFor = (lang) => (lang === 'hi' ? 'hi-IN' : 'en-IN');
export const timeLabel = (iso, lang) => parseUtc(iso).toLocaleTimeString(localeFor(lang), { hour: 'numeric', minute: '2-digit' });
export const dayKey = (iso) => { const d = parseUtc(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
export const dayLabel = (iso, lang) => {
  const d = parseUtc(iso); const now = new Date();
  const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const y = new Date(now); y.setDate(now.getDate() - 1);
  const c = copy(lang);
  if (same(d, now)) return c.today;
  if (same(d, y)) return c.yesterday;
  return d.toLocaleDateString(localeFor(lang), { day: 'numeric', month: 'short', year: 'numeric' });
};
