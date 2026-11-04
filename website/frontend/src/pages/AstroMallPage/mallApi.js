// Astro Mall data: the real catalogue comes from /api/v1/marketplace. REFERENCE_PRODUCTS (in AstroMallPage.jsx) is only a fallback when the API is unreachable.
const BASE = '/api/v1/marketplace';

export const CATEGORY_LABELS = {
  rudraksha: 'Rudraksha', mala: 'Mala', yantra: 'Yantra', puja_essentials: 'Puja Essentials', gemstone: 'Gemstones', idols: 'Idols & Kavach',
};

// The backend calls puja items "samagri"; the page's category chips call them "puja_essentials".
const categoryId = (c) => (c === 'samagri' ? 'puja_essentials' : c);

export function fromApi(p) {
  const cat = categoryId(p.category);
  const images = Array.isArray(p.images) && p.images.length ? p.images : [p.image_url].filter(Boolean);
  return {
    id: p.id,
    title: p.title,
    category: CATEGORY_LABELS[cat] || p.category,
    category_id: cat,
    tag: '',
    rating: p.rating || 0,
    reviews: p.review_count || 0,
    price: p.price,
    original_price: p.original_price || p.price,
    discount_percent: p.discount_percent || 0,
    image: images[0] || '/assets/img/products/rudraksha-5.jpg',
    images,
    in_stock: !!p.in_stock,
    lab_certified: !!p.has_lab_certificate,
    energized: p.is_energized ? (p.energized_details || 'Energized as per Vedic rites') : '',
    description: p.description || '',
    material: p.material || '',
    origin: p.origin || '',
    return_days: p.return_policy && p.return_policy.days,
    seller: p.seller && p.seller.name,
    seller_verified: !!(p.seller && p.seller.verified),
    has_options: !!p.has_options,
    options: Array.isArray(p.options) ? p.options : [],
    stock: p.stock,
  };
}

// Reference products were hand-written for the design; their badges are kept as they were.
export const fromReference = (p) => ({ ...p, lab_certified: true, energized: 'Energized by Kashi Priests', images: null });

export async function fetchProducts() {
  const res = await fetch(`${BASE}/products?lang=en`, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`products ${res.status}`);
  const d = await res.json();
  return (d.products || []).map(fromApi);
}

export async function fetchProduct(id) {
  const res = await fetch(`${BASE}/products/${encodeURIComponent(id)}?lang=en`, { headers: { Accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`product ${res.status}`);
  return fromApi(await res.json());
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

export const quoteCart = (items, couponCode) => call(`${BASE}/quote?lang=en`, { method: 'POST', body: { items: toApiItems(items), coupon_code: couponCode || null, use_points: 0 } });
export const placeOrder = (items, buyer) => call(`${BASE}/checkout?lang=en`, { method: 'POST', body: { ...buyer, items: toApiItems(items), use_points: 0 } });
// The saved cart follows the account across devices (/api/v1/cart). Lines carry only product, quantity and options.
const lines = (items) => items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, options: i.options || {} }));
export const fetchServerCart = () => call('/api/v1/cart');
export const mergeServerCart = (items) => call('/api/v1/cart/merge', { method: 'POST', body: { items: lines(items) } });
export const saveServerCart = (items, keepalive = false) => call('/api/v1/cart', { method: 'PUT', keepalive, body: { items: lines(items) } });

export async function walletBalance() {
  if (!token()) return null;
  try { return (await call('/api/v1/wallet')).balance; } catch (e) { return null; }
}
