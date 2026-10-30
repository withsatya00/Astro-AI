// "What to do next" for the account overview. Pure function: no DOM, no network.
// A list that is undefined means its request failed, so it never produces a nudge (we do not guess).
const COPY = {
  kundli: { href: '/calculators', en: ['Create your Kundli', 'Enter your birth details once and every reading becomes personal.'], hi: ['अपनी कुंडली बनाएँ', 'जन्म विवरण एक बार दर्ज करें, फिर हर परामर्श आपके लिए होगा।'] },
  consult: { href: '/astrologers', en: ['Talk to an astrologer', 'Ask your first question in chat, call or video.'], hi: ['ज्योतिषी से बात करें', 'चैट, कॉल या वीडियो पर अपना पहला प्रश्न पूछें।'] },
  wallet: { href: '/dashboard', action: 'wallet', en: ['Add money to your wallet', 'Keep a balance ready so you can start a consultation right away.'], hi: ['वॉलेट में राशि जोड़ें', 'शेष राशि रखें ताकि परामर्श तुरंत शुरू हो सके।'] },
  'track-order': { href: '/dashboard', action: 'orders', en: ['Track your order', 'You have an order on its way. See where it is.'], hi: ['अपना ऑर्डर देखें', 'आपका ऑर्डर रास्ते में है। देखें कि वह कहाँ है।'] },
  seva: { href: '/mandir-seva', en: ['Book a temple seva', 'Offer a sankalp puja in your name and gotra, with video proof.'], hi: ['मंदिर सेवा बुक करें', 'अपने नाम और गोत्र से संकल्प पूजा कराएँ, वीडियो प्रमाण के साथ।'] },
};
const LOW_BALANCE = 50;
const MAX_STEPS = 3;
const IN_FLIGHT = new Set(['PLACED', 'PAID', 'ENERGIZING', 'DISPATCHED']);

export function nextSteps(data, lang = 'en') {
  const d = data || {};
  const ids = [];
  const known = list => Array.isArray(list);
  if (known(d.orders) && d.orders.some(o => IN_FLIGHT.has(o.status))) ids.push('track-order');
  if (known(d.profiles) && d.profiles.length === 0) ids.push('kundli');
  if (known(d.consultations) && d.consultations.length === 0) ids.push('consult');
  if (d.wallet && typeof d.wallet.balance === 'number' && d.wallet.balance < LOW_BALANCE && d.wallet.payments_available !== false) ids.push('wallet');
  if (known(d.pujas) && d.pujas.length === 0) ids.push('seva');
  return ids.slice(0, MAX_STEPS).map(id => {
    const c = COPY[id];
    const [title, text] = lang === 'hi' ? c.hi : c.en;
    return { id, href: c.href, action: c.action || null, title, text };
  });
}
