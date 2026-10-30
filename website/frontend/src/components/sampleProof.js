// Layout preview for social proof (rating, devotee count, reviews).
// Real reviews and counts do not exist yet, so none of this is shown to visitors. On localhost only, open any puja or temple page with
// ?sample=1 to see how it will look once real data is plugged in; ?sample=0 switches the preview off again.
import { esc } from '../utils/shop.js';
import { currentLang } from '../utils/shop-i18n.js';

const KEY = 'astro_sample_proof';

// The preview exists for design review only. On the live site it is always off, whatever the URL says.
const isLocalHost = () => ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);

export const sampleProofOn = () => {
  if (!isLocalHost()) return false;
  try {
    const q = new URLSearchParams(location.search).get('sample');
    if (q === '1') localStorage.setItem(KEY, '1');
    if (q === '0') localStorage.removeItem(KEY);
    return localStorage.getItem(KEY) === '1';
  } catch (e) { return /[?&]sample=1\b/.test(location.search); }
};

const SAMPLES = [
  { name: ['Sample Devotee A', 'नमूना भक्त A'], city: ['City', 'शहर'], stars: 5,
    text: ['Placeholder review text. A real devotee’s words about the puja, the video and the experience will appear here.', 'नमूना समीक्षा। पूजा, वीडियो और अनुभव के बारे में वास्तविक भक्त के शब्द यहां दिखेंगे।'] },
  { name: ['Sample Devotee B', 'नमूना भक्त B'], city: ['City', 'शहर'], stars: 5,
    text: ['Placeholder review text. Short, specific feedback reads best in this card layout.', 'नमूना समीक्षा। इस कार्ड में छोटी और स्पष्ट प्रतिक्रिया सबसे अच्छी दिखती है।'] },
  { name: ['Sample Devotee C', 'नमूना भक्त C'], city: ['City', 'शहर'], stars: 4,
    text: ['Placeholder review text. Reviews can also carry a photo or a short video thumbnail.', 'नमूना समीक्षा। समीक्षा के साथ फोटो या छोटे वीडियो का थंबनेल भी जुड़ सकता है।'] },
  { name: ['Sample Devotee D', 'नमूना भक्त D'], city: ['City', 'शहर'], stars: 5,
    text: ['Placeholder review text. Verified bookings can be marked with a small badge.', 'नमूना समीक्षा। सत्यापित बुकिंग पर छोटा बैज लगाया जा सकता है।'] }
];

const pick = (pair) => pair[currentLang() === 'hi' ? 1 : 0];
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

/** One line under the title: rating and number of devotees. Empty unless the preview is on. */
export function proofLineHtml() {
  if (!sampleProofOn()) return '';
  const hi = currentLang() === 'hi';
  return `<p class="ch-proof-line" data-sample-proof><span class="ch-proof-tag">${hi ? 'नमूना' : 'SAMPLE'}</span> <b>★ 4.8</b> (X,XXX ${hi ? 'रेटिंग' : 'ratings'}) · <b>X,XX,XXX+</b> ${hi ? 'भक्त जुड़े' : 'devotees participated'}</p>`;
}

/** Reviews & ratings section. Empty unless the preview is on. */
export function reviewsSectionHtml(id = 'cd-reviews') {
  if (!sampleProofOn()) return '';
  const hi = currentLang() === 'hi';
  return `<section id="${esc(id)}" data-sample-proof><h2>${hi ? 'समीक्षाएं और रेटिंग' : 'Reviews & Ratings'}</h2>
    <p class="ch-sample-note">${hi ? 'नमूना पूर्वावलोकन: यह केवल डिज़ाइन दिखाने के लिए है, वास्तविक समीक्षा नहीं।' : 'Sample preview: placeholder content to show the design. These are not real reviews.'}</p>
    <div class="ch-review-row">${SAMPLES.map(r => `<article class="ch-review"><div class="ch-review__stars" aria-label="${r.stars} / 5">${stars(r.stars)}</div><p>${esc(pick(r.text))}</p><footer><b>${esc(pick(r.name))}</b><small>${esc(pick(r.city))}</small></footer></article>`).join('')}</div></section>`;
}
