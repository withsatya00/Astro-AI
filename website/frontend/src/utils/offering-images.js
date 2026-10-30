// Shared by temple listings and the actual event checkout. Never use a temple photo as an item photo.
const ROOT = '/assets/img/offerings/';
const GROUPS = [
  ['panchamrit', /panchamr[ui]t|abhishe[kh]|bhasm|milk|पंचामृत|अभिषेक|भस्म|दुग्ध|दूध/i],
  ['flowers', /flower|bilva|belpatra|bel\s*pat|marigold|फूल|पुष्प|बिल्व|बेलपत्र|बेल पत्र|दूर्वा/i],
  ['diya', /deep|diya|lamp|oil|दीप|दिया|ज्योत|तेल/i],
  ['bhog', /bhog|laddu|laddoo|chana|bhandara|prasad|annadaan|anna\s*daan|banana|भोग|लड्डू|लड्|चना|अन्न|भंडार|प्रसाद|केला/i],
  ['havan', /havan|homa|anushthan|mahamrity|rudra|paath|path\b|jaap|japa|chant|हवन|होम|अनुष्ठान|महामृत्युंजय|रुद्र|पाठ|जाप|जप/i],
];

export function offeringPhoto(offering = {}) {
  if (offering.image_url) return { src: offering.image_url, illustrative: false };
  // Title is the strongest signal. Description is only a fallback for generic titles.
  const title = String(offering.title || offering.title_en || '');
  const group = GROUPS.find(([,pattern]) => pattern.test(title))
    || GROUPS.find(([,pattern]) => pattern.test(String(offering.description || '')));
  return { src: ROOT + (group?.[0] || 'basket') + '.webp', illustrative: true };
}
