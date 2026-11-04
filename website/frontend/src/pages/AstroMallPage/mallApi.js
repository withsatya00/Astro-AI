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
