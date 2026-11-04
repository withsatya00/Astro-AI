import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchProducts, fromReference, reviewCount } from './mallApi.js';
import { useCart } from './cartStore.js';

export const REFERENCE_PRODUCTS = [
  {
    id: 'prod-rudraksha-5mukhi',
    title: 'Sacred 5 Mukhi Rudraksha Mala (108 Beads)',
    category: 'Mala',
    category_id: 'mala',
    tag: 'Bestseller',
    tag_class: '',
    rating: 4.8,
    reviews: '1,240',
    price: 699,
    original_price: 999,
    discount_percent: 30,
    image: '/assets/img/products/rudraksha-5.jpg',
    in_stock: true,
  },
  {
    id: 'prod-kamal-gatta',
    title: '108 Lotus Seeds (Kamal Gatta) for Maha Puja',
    category: 'Puja Item',
    category_id: 'puja_essentials',
    tag: 'Trending',
    tag_class: 'tag-trending',
    rating: 4.7,
    reviews: '892',
    price: 299,
    original_price: 399,
    discount_percent: 25,
    image: '/assets/img/products/kamalgatta-mala.jpg',
    in_stock: true,
  },
  {
    id: 'prod-rudraksha-beads',
    title: 'Natural 5–7 Mukhi Rudraksha Beads (Panchmukhi Set)',
    category: 'Rudraksha',
    category_id: 'rudraksha',
    tag: 'Bestseller',
    tag_class: '',
    rating: 4.8,
    reviews: '1,756',
    price: 1199,
    original_price: 1599,
    discount_percent: 25,
    image: '/assets/img/products/rudraksha-7.jpg',
    in_stock: true,
  },
  {
    id: 'prod-navgrah-dhoop',
    title: 'Vedic Navgrah Dhoop Muskan Kit (11 Herbs)',
    category: 'Hawan & Dhoop',
    category_id: 'puja_essentials',
    tag: 'Handpicked',
    tag_class: 'tag-handpicked',
    rating: 4.7,
    reviews: '624',
    price: 399,
    original_price: 599,
    discount_percent: 33,
    image: '/assets/img/products/hawan-kit.jpg',
    in_stock: true,
  },
  {
    id: 'prod-vastu-yantra',
    title: 'Siddh Shri Yantra (For Peace & Prosperity)',
    category: 'Yantra',
    category_id: 'yantra',
    tag: 'Trending',
    tag_class: 'tag-trending',
    rating: 4.9,
    reviews: '482',
    price: 1899,
    original_price: 2499,
    discount_percent: 24,
    image: '/assets/img/products/vyapar-yantra.jpg',
    in_stock: true,
  },
  {
    id: 'prod-hanuman-kavach',
    title: 'Panchmukhi Hanuman Kavach Pendant (Pure Metal)',
    category: 'Idol & Kavach',
    category_id: 'idols',
    tag: 'Bestseller',
    tag_class: '',
    rating: 4.8,
    reviews: '917',
    price: 799,
    original_price: 1099,
    discount_percent: 27,
    image: '/assets/img/products/hanuman-locket.jpg',
    in_stock: true,
  },
  {
    id: 'prod-tulsi-rudraksha',
    title: '100 Beads Tulsi & Rudraksha Mala (Energized)',
    category: 'Mala',
    category_id: 'mala',
    tag: 'Handpicked',
    tag_class: 'tag-handpicked',
    rating: 4.7,
    reviews: '368',
    price: 899,
    original_price: 1299,
    discount_percent: 31,
    image: '/assets/img/products/sphatik-mala.jpg',
    in_stock: true,
  },
  {
    id: 'prod-gomati-chakra',
    title: 'Pure Gomati Chakra (11 Pieces Set for Wealth)',
    category: 'Puja Essentials',
    category_id: 'puja_essentials',
    tag: 'Auspicious',
    tag_class: '',
    rating: 4.9,
    reviews: '512',
    price: 499,
    original_price: 699,
    discount_percent: 28,
    image: '/assets/img/products/shankh.jpg',
    in_stock: true,
  },
];

export default function AstroMallPage() {
  const [searchParams] = useSearchParams();
  // ?category= lets other pages (e.g. Bhakti) land on a filtered shelf; unknown values fall back to all products.
  const [activeCategory, setActiveCategory] = useState(() => {
    const c = searchParams.get('category');
    return ['rudraksha', 'mala', 'yantra', 'puja_essentials', 'idols', 'gemstone'].includes(c) ? c : 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [inStockOnly, setInStockOnly] = useState(false);
  const cart = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  // The live catalogue; the hand-written reference products are used only if the API cannot be reached.
  const [products, setProducts] = useState(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let alive = true;
    fetchProducts()
      .then((list) => { if (alive) { setProducts(list); setOffline(false); } })
      .catch(() => { if (alive) { setProducts(REFERENCE_PRODUCTS.map(fromReference)); setOffline(true); } });
    return () => { alive = false; };
  }, []);

  const categoryChips = [
    { id: 'all', label: 'All Products' },
    { id: 'rudraksha', label: 'Rudraksha' },
    { id: 'mala', label: 'Mala' },
    { id: 'yantra', label: 'Yantra' },
    { id: 'puja_essentials', label: 'Puja Essentials' },
    { id: 'idols', label: 'Idols & Kavach' },
    { id: 'gemstone', label: 'Gemstones' },
  ];

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (activeCategory !== 'all' && p.category_id !== activeCategory) return false;
      if (inStockOnly && !p.in_stock) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tag || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return reviewCount(b) - reviewCount(a) || b.rating - a.rating;
    });
  }, [products, activeCategory, searchQuery, sortBy, inStockOnly]);

  const toggleWishlist = (id) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const addToCart = (product) => {
    // Items with sizes, weights or metals need those chosen first, so they go to the product page.
    if (offline) return; // sample products are not in the catalogue and cannot be ordered
    if (product.has_options) { navigate(`/mall/product/${product.id}`); return; }
    cart.add(product, 1, {});
    setIsCartOpen(true);
  };

  const cartTotal = cart.subtotal;

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-24">
      {/* 1. Hero Banner (1:1 Match to Screenshot 4) */}
      <section className="service-banner service-banner--mall ml-ref-hero max-w-7xl mx-auto mt-4 px-4">
        <figure className="service-banner__art">
          <img src="/assets/img/mall-banner.webp" alt="Vedic Astro Mall Altar" fetchPriority="high" />
          <figcaption>Illustrative image</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow">AUTHENTIC VEDIC ITEMS FOR YOUR SPIRITUAL JOURNEY</p>
          <h1>
            Vedic Astro <em>Mall</em>
          </h1>
          <p>
            Discover a curated collection of Vedic and spiritual essentials, handpicked by experts and energized as per traditional rituals to bring positivity and harmony.
          </p>
          <div className="shop-hero__actions">
            <a
              href="#ml-search-input"
              className="shop-btn shop-btn--gold cursor-pointer no-underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('ml-search-input')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Products →
            </a>
            <button
              type="button"
              className="shop-btn shop-btn--ghost cursor-pointer"
              onClick={() => setIsCartOpen(true)}
            >
              🛒 My Cart ({cart.count})
            </button>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div>
            <span>🛡️</span>
            <p>
              <b>100% Authentic</b>
              <small>Energized as per Vedic rites</small>
            </p>
          </div>
          <div>
            <span>⚡</span>
            <p>
              <b>Vedic Energized</b>
              <small>Blessed by Vedic priests</small>
            </p>
          </div>
          <div>
            <span>🚚</span>
            <p>
              <b>Pan-India Delivery</b>
              <small>Safe &amp; quick shipping</small>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Category Filter Chips (Horizontal Scrolling on Mobile) */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <nav className="ml-ref-chips-bar flex items-center gap-2 overflow-x-auto pb-1" aria-label="Product Categories">
          {categoryChips.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`ml-ref-chip px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                activeCategory === c.id
                  ? 'bg-[#3E0B18] text-[#FFF9EF] border-[#3E0B18] shadow-xs'
                  : 'bg-white text-slate-700 border-[#E7E2D8] hover:border-amber-400'
              }`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white p-4 rounded-2xl border border-[#E7E2D8] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 flex items-center bg-[#FAF7F2] border border-[#D8CCB5] rounded-xl px-3 py-2">
            <span className="text-slate-400 mr-2 text-sm">🔍</span>
            <input
              aria-label="Search products"
              type="search"
              id="ml-search-input"
              className="bg-transparent border-0 outline-none w-full text-xs text-[#1E1B4B]"
              placeholder="Search products (e.g. Rudraksha, Yantra...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="p-2 text-xs rounded-xl border border-[#D8CCB5] bg-white text-slate-700 outline-none flex-1 md:flex-none"
              aria-label="All Categories"
            >
              <option value="all">All Categories</option>
              <option value="rudraksha">Rudraksha</option>
              <option value="mala">Mala</option>
              <option value="yantra">Yantra</option>
              <option value="puja_essentials">Puja Essentials</option>
              <option value="idols">Idols &amp; Kavach</option>
              <option value="gemstone">Gemstones</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 text-xs rounded-xl border border-[#D8CCB5] bg-white text-slate-700 outline-none flex-1 md:flex-none"
              aria-label="Sort by"
            >
              <option value="popular">Sort by: Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Product Grid (2 columns on mobile, 4 columns on desktop) */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        {offline && <p role="status" className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">The live catalogue could not be loaded, so sample products are shown.</p>}
        {products && filteredProducts.length === 0 && (
          <p role="status" className="text-sm text-slate-600 bg-white border border-[#E7E2D8] rounded-2xl p-6 text-center">No products match this selection yet. Try another category or clear the search.</p>
        )}
        <div className="ml-products-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {!products && [0, 1, 2, 3].map((i) => <div key={i} aria-hidden="true" className="rounded-2xl bg-white border border-[#E7E2D8] aspect-[3/4] animate-pulse" />)}
          {filteredProducts.map((p) => {
            const isWished = wishlist.includes(p.id);
            return (
              <article
                key={p.id}
                className="bg-white rounded-2xl border border-[#E7E2D8] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image container with Lab Certified Trust Shield */}
                  <div className="relative aspect-square max-h-[260px] overflow-hidden bg-amber-50">
                    <Link to={`/mall/product/${p.id}`}>
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </Link>

                    {/* Govt. Lab Certified Badge */}
                    {p.lab_certified && <div style={{ top: "10px", left: "10px" }} className="absolute bg-[#FFFDF8] border border-[#D9A441] px-2 py-0.5 rounded-md text-[11.5px] font-extrabold text-[#3E0B18] flex items-center gap-1 shadow-xs">
                      <span>🛡️</span> LAB CERTIFIED
                    </div>}

                    {/* Wishlist button */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      style={{ top: "10px", right: "10px" }} className="absolute w-7 h-7 rounded-full bg-white/90 hover:bg-white text-rose-500 flex items-center justify-center text-sm shadow-xs cursor-pointer border-0 transition-transform active:scale-90"
                      aria-label="Add to wishlist"
                    >
                      {isWished ? '♥' : '♡'}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-3.5">
                    <span className="text-[11.5px] text-slate-400 uppercase font-bold block mb-0.5">
                      {p.category}
                    </span>
                    <Link
                      to={`/mall/product/${p.id}`} style={{ display: 'block', minHeight: 34 }}>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-[#1E1B4B] line-clamp-2 hover:text-[#B45309] no-underline leading-snug">
                        {p.title}
                      </h4>
                    </Link>

                    {/* Consecration Note */}
                    {p.energized && <div className="text-[11px] text-[#B45309] font-bold mt-1 flex items-center gap-1">
                      <span>✨</span> {p.energized}
                    </div>}

                    {/* Rating */}
                    {reviewCount(p) > 0 && <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500 font-bold">
                      <span>★</span>
                      <span className="text-[#1E1B4B]">{p.rating}</span>
                      <span className="text-slate-400 font-normal">({p.reviews})</span>
                    </div>}

                    {/* Pricing */}
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="font-extrabold text-sm sm:text-base text-[#3E0B18]">₹{p.price}</span>
                      <span className="text-[11px] text-slate-400 line-through">₹{p.original_price}</span>
                      <span className="text-[11.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                        -{p.discount_percent}% OFF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Foot Action Button */}
                <div className="p-3.5 pt-0">
                  <button
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={offline || !p.in_stock}
                    className="w-full py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-[#1E1B4B] shadow-xs cursor-pointer border-0 transition-all hover:brightness-105 active:scale-98"
                    style={{
                      background: 'linear-gradient(135deg, #D9A441 0%, #B3832B 100%)',
                      opacity: offline || !p.in_stock ? 0.5 : 1,
                      cursor: offline || !p.in_stock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {offline ? 'Unavailable right now' : !p.in_stock ? 'Out of stock' : 'Add to Cart • Instant Dispatch →'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-serif text-lg font-bold text-[#1E1B4B]">Your Spiritual Cart ({cart.items.length})</h3>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold cursor-pointer border-0"
                >
                  ✕
                </button>
              </div>

              {cart.items.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  Your cart is empty. Add sacred items to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={item.key} className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-200/50">
                      <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xs font-bold text-[#1E1B4B] truncate">{item.title}</h4>
                        <span className="text-xs font-bold text-[#3E0B18]">₹{item.unit_price} × {item.quantity}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(item.key)}
                        className="text-xs text-rose-500 font-bold cursor-pointer border-0 bg-transparent"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm font-bold text-[#1E1B4B] mb-4">
                  <span>Subtotal:</span>
                  <span className="text-[#3E0B18] font-extrabold text-lg">₹{cartTotal}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsCartOpen(false); navigate('/astro-mall/checkout'); }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#1E1B4B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md"
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

