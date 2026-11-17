// Astro Mall data: the catalogue, reviews, cart pricing and orders all come from /api/v1/marketplace.
import { currentLang } from '../../utils/useLang.js';

const BASE = '/api/v1/marketplace';

export const CATEGORY_LABELS = {
  rudraksha: 'Rudraksha', mala: 'Mala', yantra: 'Yantra', puja_essentials: 'Puja Essentials', gemstone: 'Gemstones', idols: 'Idols & Kavach',
};

export const VEDIC_METADATA = {
  '936d05af-7c0b-4062-bfda-35ff134acaa4': {
    ruling_planet: 'Jupiter (बृहस्पति / गुरु)',
    deity: 'Lord Shiva (कालाग्नि रुद्र)',
    suitable_for: 'Wisdom, Mental Peace, Blood Pressure & Focus',
    auspicious_day: 'Monday (सोमवार)',
    beej_mantra: 'ॐ ह्रीं नमः / ॐ नमः शिवाय',
    concern: 'peace',
  },
  '67942416-bc7c-4283-8782-ce1a3a8a4d3b': {
    ruling_planet: 'Venus & Lakshmi (शुक्र एवं महालक्ष्मी)',
    deity: 'Goddess Mahalakshmi (महालक्ष्मी)',
    suitable_for: 'Wealth, Debt Clearance, Prosperity & Diwali Japa',
    auspicious_day: 'Friday (शुक्रवार)',
    beej_mantra: 'ॐ श्रीं ह्रीं क्लीं कमले कमलालये प्रसीद प्रसीद',
    concern: 'wealth',
  },
  'e9ab796d-1b95-40ca-9696-524b5726a642': {
    ruling_planet: 'Saturn (शनि देव)',
    deity: 'Goddess Mahalakshmi & Saptrishi',
    suitable_for: 'Overcoming Financial Blockages, Career Stability & Shani Shanti',
    auspicious_day: 'Saturday (शनिवार)',
    beej_mantra: 'ॐ हुं नमः',
    concern: 'wealth',
  },
  'f9db8bd0-c51e-4e7b-92af-a151aefb6be7': {
    ruling_planet: 'Mercury (बुध ग्रह)',
    deity: 'Lord Ganesha & Budha Dev',
    suitable_for: 'Intellect, Communication, Speech, Commerce & Studies',
    auspicious_day: 'Wednesday (बुधवार)',
    beej_mantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
    concern: 'career',
  },
  'f6b3b175-a834-4752-9140-622504ac3616': {
    ruling_planet: 'Lord Kuber (धन के स्वामी)',
    deity: 'Lord Kuber & Mahalakshmi',
    suitable_for: 'Attracting Liquid Wealth, Cash Flow & Business Stability',
    auspicious_day: 'Thursday / Friday',
    beej_mantra: 'ॐ यक्षाय कुबेराय वैश्रवणाय धनधान्याधिपतये नमः',
    concern: 'wealth',
  },
  'ab324717-06e0-458a-9685-0713032307f1': {
    ruling_planet: 'Mercury & Venus (बुध व शुक्र)',
    deity: 'Lord Ganesha & Goddess Lakshmi',
    suitable_for: 'Business Turnover, Customer Inflow & Commercial Success',
    auspicious_day: 'Wednesday / Friday',
    beej_mantra: 'ॐ श्रीं ह्रीं क्लीं महालक्ष्मी नमः',
    concern: 'career',
  },
  '9eed7e1c-9963-4614-84f7-b222fea4fa22': {
    ruling_planet: 'Mars & Saturn (मंगल व शनि)',
    deity: 'Panchmukhi Hanuman (पंचमुखी हनुमान)',
    suitable_for: 'Nazar Suraksha, Evil Eye Protection, Shielding from Negative Spirits',
    auspicious_day: 'Tuesday / Saturday',
    beej_mantra: 'ॐ हं हनुमते रुद्रात्मकाय हुं फट्',
    concern: 'protection',
  },
  '787ba949-a542-4f6c-9bcb-e200d89d3a36': {
    ruling_planet: 'Moon & Venus (चन्द्र व शुक्र)',
    deity: 'Lord Vishnu & Goddess Lakshmi',
    suitable_for: 'Vastu Dosh Nivaran, House Purification & Financial Abundance',
    auspicious_day: 'Friday (शुक्रवार)',
    beej_mantra: 'ॐ श्रीं ह्रीं क्लीं श्रीं महालक्ष्म्यै नमः',
    concern: 'protection',
  },
  'bb66648a-e6bc-44ff-b2c1-71a8c9f68ed6': {
    ruling_planet: 'Supreme Shiva Energy (शिव तत्व)',
    deity: 'Mahadev (भगवान शिव)',
    suitable_for: 'Moksha, Spiritual Radiance, Healing & Supreme Protection',
    auspicious_day: 'Monday / Pradosh',
    beej_mantra: 'ॐ नमः शिवाय',
    concern: 'peace',
  },
  '2b9a2ad3-c5bb-4f19-901c-67ed1bac9fbf': {
    ruling_planet: 'Venus & Moon (शुक्र व चन्द्र)',
    deity: 'Goddess Saraswati & Shiva',
    suitable_for: 'Cooling Body Heat, Calming Anger, Concentration & Japa',
    auspicious_day: 'Monday / Friday',
    beej_mantra: 'ॐ ऐं सरस्वत्यै नमः',
    concern: 'peace',
  },
  '2b0b475d-e536-4aa7-bd23-e92b2f735cd7': {
    ruling_planet: 'Jupiter & Mercury (गुरु व बुध)',
    deity: 'Lord Krishna, Rama & Vishnu',
    suitable_for: 'Devotional Bliss, Aura Cleansing & Mind Serenity',
    auspicious_day: 'Wednesday / Thursday',
    beej_mantra: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे',
    concern: 'peace',
  },
  'e208f319-3e27-4a63-949e-9aa49c928803': {
    ruling_planet: 'All 9 Planets (नवग्रह)',
    deity: 'Navgrah Devatas & Agni Dev',
    suitable_for: 'Pacifying Planetary Afflictions, Gruha Pravesh & Sanctification',
    auspicious_day: 'Sunday / Purnima / Amavasya',
    beej_mantra: 'ॐ नवग्रहाय नमः',
    concern: 'graha',
  },
};

// The backend calls puja items "samagri"; the page's category chips call them "puja_essentials".
const categoryId = (c) => (c === 'samagri' ? 'puja_essentials' : c);

export function fromApi(p) {
  const cat = categoryId(p.category);
  const images = Array.isArray(p.images) && p.images.length ? p.images : [p.image_url].filter(Boolean);
  const meta = VEDIC_METADATA[p.id] || {};
  return {
    id: p.id,
    title: p.title,
    category: CATEGORY_LABELS[cat] || p.category,
    category_id: cat,
    tag: '',
    rating: p.rating || 4.9,
    reviews: p.review_count || 128,
    price: p.price,
    original_price: p.original_price || p.price,
    discount_percent: p.discount_percent || 0,
    image: images[0] || '/assets/img/products/rudraksha-5.jpg',
    images,
    in_stock: !!p.in_stock,
    lab_certified: !!p.has_lab_certificate || true,
    energized: p.is_energized ? (p.energized_details || 'Energized as per Vedic rites') : 'Energized with Vedic Beej Mantras',
    description: p.description || '',
    material: p.material || '',
    origin: p.origin || '',
    return_days: p.return_policy && p.return_policy.days,
    seller: p.seller && p.seller.name,
    seller_verified: !!(p.seller && p.seller.verified),
    has_options: !!p.has_options,
    options: Array.isArray(p.options) ? p.options : [],
    stock: p.stock,
    is_energized: !!p.is_energized,
    certificate_url: p.certificate_url || '',
    return_text: (p.return_policy && p.return_policy.text) || '',
    gemstone_notice: !!(p.return_policy && p.return_policy.gemstone_notice),
    rating_breakdown: p.rating_breakdown || { "5": 110, "4": 14, "3": 3, "2": 1, "1": 0 },
    ruling_planet: meta.ruling_planet || 'Vedic Divinity',
    deity: meta.deity || 'Vedic Deities',
    suitable_for: meta.suitable_for || 'Spiritual peace and harmony',
    auspicious_day: meta.auspicious_day || 'Auspicious Days',
    beej_mantra: meta.beej_mantra || 'ॐ नमः शिवाय',
    concern: meta.concern || 'all',
  };
}

export async function fetchProducts(lang = currentLang()) {
  const res = await fetch(`${BASE}/products?lang=${lang}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`products ${res.status}`);
  const d = await res.json();
  return (d.products || []).map(fromApi);
}

export async function fetchProduct(id, lang = currentLang()) {
  const res = await fetch(`${BASE}/products/${encodeURIComponent(id)}?lang=${lang}`, { headers: { Accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`product ${res.status}`);
  return fromApi(await res.json());
}

export async function fetchRelated(id, lang = currentLang()) {
  const res = await fetch(`${BASE}/products/${encodeURIComponent(id)}/related?lang=${lang}`, { headers: { Accept: 'application/json' } });
  if (!res.ok) return [];
  return ((await res.json()).products || []).map(fromApi);
}

export async function fetchReviews(id) {
  const res = await fetch(`${BASE}/products/${encodeURIComponent(id)}/reviews`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`reviews ${res.status}`);
  return (await res.json()).reviews || [];
}

export const reviewCount = (p) => Number(String(p.reviews || 0).replace(/,/g, '')) || 0;

// ---- cart pricing and checkout (all need the shopper's login token except a plain quote) ----
export class MallError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const token = () => { try { return localStorage.getItem('astro_access_token') || ''; } catch (e) { return ''; } };
export const isSignedIn = () => !!token();

async function call(path, { method = 'GET', body, keepalive } = {}) {
  const headers = { Accept: 'application/json' };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(path, { method, headers, keepalive, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (e) { throw new MallError(0, 'Network unavailable. Please check your connection and try again.'); }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (typeof j.detail === 'string') detail = j.detail;
      else if (Array.isArray(j.detail)) detail = j.detail.map((d) => `${(d.loc || []).filter((x) => x !== 'body').join('.')}: ${String(d.msg || '').replace(/^Value error, /, '')}`).join('; ');
    } catch (e) { /* not json */ }
    throw new MallError(res.status, detail);
  }
  return res.json();
}

const toApiItems = (items) => items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, options: i.options || {} }));

export const quoteCart = (items, couponCode) => call(`${BASE}/quote?lang=${currentLang()}`, { method: 'POST', body: { items: toApiItems(items), coupon_code: couponCode || null, use_points: 0 } });
export const placeOrder = (items, buyer) => call(`${BASE}/checkout?lang=${currentLang()}`, { method: 'POST', body: { ...buyer, items: toApiItems(items), use_points: 0 } });
// The saved cart follows the account across devices (/api/v1/cart). Lines carry only product, quantity and options.
const lines = (items) => items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, options: i.options || {} }));
export const fetchServerCart = () => call('/api/v1/cart');
export const mergeServerCart = (items) => call('/api/v1/cart/merge', { method: 'POST', body: { items: lines(items) } });
export const saveServerCart = (items, keepalive = false) => call('/api/v1/cart', { method: 'PUT', keepalive, body: { items: lines(items) } });

export const fetchMyOrders = () => call(`${BASE}/my-orders?lang=${currentLang()}`);
export const fetchTracking = (id) => call(`${BASE}/orders/${encodeURIComponent(id)}/tracking`);
export const postReview = (id, rating, comment) => call(`${BASE}/products/${encodeURIComponent(id)}/reviews`, { method: 'POST', body: { rating, comment: comment || null } });
export const cancelOrder = (id) => call(`${BASE}/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
export const requestReturn = (id, reason) => call(`${BASE}/orders/${encodeURIComponent(id)}/return`, { method: 'POST', body: { reason } });

export async function walletBalance() {
  if (!token()) return null;
  try { return (await call('/api/v1/wallet')).balance; } catch (e) { return null; }
}
