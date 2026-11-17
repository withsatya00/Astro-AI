import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchProducts, reviewCount, CATEGORY_LABELS } from './mallApi.js';
import useLang from '../../utils/useLang.js';
import { useCart } from './cartStore.js';

const CATEGORY_ICONS = {
  all: '✨',
  rudraksha: '📿',
  mala: '📿',
  yantra: '🔯',
  puja_essentials: '🪔',
  gemstone: '💎',
  idols: '🕉️',
};

const CONCERN_LIST = [
  { id: 'all', label: 'All Remedies', icon: '✨' },
  { id: 'wealth', label: 'Wealth & Prosperity', icon: '💰' },
  { id: 'protection', label: 'Protection & Nazar', icon: '🧿' },
  { id: 'career', label: 'Career & Growth', icon: '💼' },
  { id: 'peace', label: 'Peace & Health', icon: '🧠' },
  { id: 'graha', label: 'Navgrah Dosh Shanti', icon: '🪐' },
];

export default function AstroMallPage() {
  const [searchParams] = useSearchParams();
  // ?category= lets other pages (e.g. Bhakti) land on a filtered shelf; unknown values fall back to all products.
  const [activeCategory, setActiveCategory] = useState(() => {
    const c = searchParams.get('category');
    return ['rudraksha', 'mala', 'yantra', 'puja_essentials', 'idols', 'gemstone'].includes(c) ? c : 'all';
  });
  const [filterMode, setFilterMode] = useState('category'); // 'category' | 'concern'
  const [activeConcern, setActiveConcern] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [inStockOnly, setInStockOnly] = useState(false);
  const cart = useCart();
  const [wishlist, setWishlist] = useState(() => { try { const v = JSON.parse(localStorage.getItem('astro_mall_wishlist') || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  const lang = useLang();
  const [products, setProducts] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let alive = true;
    setLoadFailed(false);
    fetchProducts(lang)
      .then((list) => { if (alive) setProducts(list); })
      .catch(() => { if (alive) { setProducts([]); setLoadFailed(true); } });
    return () => { alive = false; };
  }, [lang, reloadKey]);

  // Only categories that have products are offered, so no chip leads to an empty shelf.
  const present = new Set((products || []).map((p) => p.category_id));
  const categoryChips = [
    { id: 'all', label: 'All Products', icon: '✨' },
    ...Object.keys(CATEGORY_LABELS)
      .filter((id) => present.has(id) || id === activeCategory)
      .map((id) => ({ id, label: CATEGORY_LABELS[id], icon: CATEGORY_ICONS[id] || '🕉️' })),
  ];

  const filteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (filterMode === 'concern') {
        if (activeConcern !== 'all' && p.concern !== activeConcern) return false;
      } else {
        if (activeCategory !== 'all' && p.category_id !== activeCategory) return false;
      }
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
    setWishlist((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem('astro_mall_wishlist', JSON.stringify(next)); } catch (e) { /* kept for this visit only */ }
      return next;
    });
  };

  const addToCart = (product) => {
    // Items with sizes, weights or metals need those chosen first, so they go to the product page.
    if (product.has_options) { navigate(`/mall/product/${product.id}`); return; }
    cart.add(product, 1, {});
    setIsCartOpen(true);
  };

  const cartTotal = cart.subtotal;
  const drawerRef = useRef(null);
  useEffect(() => {
    if (!isCartOpen) return undefined;
    const before = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') setIsCartOpen(false); };
    document.addEventListener('keydown', onKey);
    const close = drawerRef.current && drawerRef.current.querySelector('[data-close]');
    if (close) close.focus();
    return () => { document.removeEventListener('keydown', onKey); if (before && before.focus) before.focus(); };
  }, [isCartOpen]);

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-screen pb-24">
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
            <Link to="/my-orders" className="shop-btn shop-btn--ghost cursor-pointer">My Orders</Link>
          </div>

          {/* High-Contrast Frosted Glass Trust Grid */}
          <div className="gs-hero-trust-grid">
            <div className="gs-trust-badge-card">
              <div className="gs-trust-badge-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8D882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div className="gs-trust-badge-card__info">
                <b className="gs-trust-badge-card__title">100% Authentic</b>
                <small className="gs-trust-badge-card__sub">Certified genuine &amp; pure</small>
              </div>
            </div>
            <div className="gs-trust-badge-card">
              <div className="gs-trust-badge-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8D882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div className="gs-trust-badge-card__info">
                <b className="gs-trust-badge-card__title">Vedic Energized</b>
                <small className="gs-trust-badge-card__sub">Prana Pratishtha by priests</small>
              </div>
            </div>
            <div className="gs-trust-badge-card">
              <div className="gs-trust-badge-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8D882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <div className="gs-trust-badge-card__info">
                <b className="gs-trust-badge-card__title">Pan-India Delivery</b>
                <small className="gs-trust-badge-card__sub">Insured express dispatch</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Consult Astrologer Before Buying Conversion Strip (Solid High-Contrast Maroon & Gold) */}
      <section className="max-w-7xl mx-auto px-4 mt-6">
        <div
          className="p-4 sm:p-5 rounded-2xl shadow-md text-white flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            backgroundColor: '#164B32',
            backgroundImage: 'linear-gradient(135deg, #164B32 0%, #26050E 100%)',
            border: '1.5px solid #D9A441',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: 'rgba(248, 216, 130, 0.15)', border: '1px solid rgba(248, 216, 130, 0.35)' }}
            >
              🕉️
            </div>
            <div>
              <div
                className="text-[11px] font-bold tracking-wider uppercase"
                style={{ color: '#F8D882' }}
              >
                Kundli &amp; Planetary Verification
              </div>
              <h3
                className="font-serif text-sm sm:text-base font-bold m-0 leading-snug"
                style={{ color: '#FFFDF5' }}
              >
                Confused which gemstone or rudraksha suits your birth chart?
              </h3>
              <p
                className="text-xs m-0 mt-0.5"
                style={{ color: '#E0D0B8' }}
              >
                Consult verified Vedic astrologers starting at ₹10/min to ensure flawless alignment before wearing.
              </p>
            </div>
          </div>
          <Link
            to="/astrologers"
            className="px-5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider no-underline hover:brightness-105 shrink-0 shadow-sm"
            style={{
              backgroundColor: '#F1CF8B',
              color: '#164B32',
            }}
          >
            Talk to Astrologer ➔
          </Link>
        </div>
      </section>

      {/* 3. Unified Category & Astrological Need Filter System */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Mode Switcher */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#DDEBD5] rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setFilterMode('category')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                filterMode === 'category'
                  ? 'bg-[#164B32] text-[#FFFDF5] shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-[#164B32]'
              }`}
            >
              📿 Browse by Category
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('concern')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                filterMode === 'concern'
                  ? 'bg-[#164B32] text-[#FFFDF5] shadow-xs'
                  : 'bg-transparent text-slate-600 hover:text-[#164B32]'
              }`}
            >
              🔮 By Astrological Need (उपाय अनुसार)
            </button>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            {filterMode === 'category' ? 'Explore sacred categories' : 'Energized remedies for specific life concerns'}
          </span>
        </div>

        {/* Filter Chips Bar (Single Clean Row) */}
        <nav className="ml-ref-chips-bar flex items-center gap-2 overflow-x-auto pb-1" aria-label="Filters">
          {filterMode === 'category'
            ? categoryChips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`ml-ref-chip flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                    activeCategory === c.id
                      ? 'bg-[#164B32] text-[#FFFDF5] border-[#D9A441] shadow-xs ring-1 ring-[#D9A441]/40'
                      : 'bg-white text-slate-700 border-[#DDEBD5] hover:border-amber-400'
                  }`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))
            : CONCERN_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`ml-ref-chip flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border ${
                    activeConcern === c.id
                      ? 'bg-[#164B32] text-[#FFFDF5] border-[#D9A441] shadow-xs ring-1 ring-[#D9A441]/40'
                      : 'bg-white text-slate-700 border-[#DDEBD5] hover:border-amber-400'
                  }`}
                  onClick={() => setActiveConcern(c.id)}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
        </nav>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white p-4 rounded-2xl border border-[#DDEBD5] shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1 flex items-center bg-[#FAF9F2] border border-[#D8CCB5] rounded-xl px-3 py-2">
            <span className="text-slate-400 mr-2 text-sm">🔍</span>
            <input
              aria-label="Search products"
              type="search"
              id="ml-search-input"
              className="bg-transparent border-0 outline-none w-full text-xs text-[#183C2B]"
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
              {categoryChips.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
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
        {loadFailed && <div role="alert" className="text-sm text-rose-800 bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center mb-4">We could not load the products right now. <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="underline font-bold bg-transparent border-0 p-0 cursor-pointer text-rose-800">Try again</button></div>}
        {products && !loadFailed && filteredProducts.length === 0 && (
          <p role="status" className="text-sm text-slate-600 bg-white border border-[#DDEBD5] rounded-2xl p-6 text-center">No products match this selection yet. Try another category or clear the search.</p>
        )}
        <div className="ml-products-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {!products && [0, 1, 2, 3].map((i) => <div key={i} aria-hidden="true" className="rounded-2xl bg-white border border-[#DDEBD5] aspect-[3/4] animate-pulse" />)}
          {filteredProducts.map((p) => {
            const isWished = wishlist.includes(p.id);
            return (
              <article
                key={p.id}
                className="bg-white rounded-2xl border border-[#DDEBD5] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
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
                    {p.lab_certified && <div style={{ top: "10px", left: "10px" }} className="absolute bg-[#FFFDF8] border border-[#D9A441] px-2 py-0.5 rounded-md text-[11.5px] font-extrabold text-[#164B32] flex items-center gap-1 shadow-xs">
                      <span>🛡️</span> LAB CERTIFIED
                    </div>}

                    {/* Wishlist button */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      style={{ top: "10px", right: "10px" }} className="absolute w-7 h-7 rounded-full bg-white/90 hover:bg-white text-rose-500 flex items-center justify-center text-sm shadow-xs cursor-pointer border-0 transition-transform active:scale-90"
                      aria-label={isWished ? `Remove ${p.title} from wishlist` : `Add ${p.title} to wishlist`} aria-pressed={isWished}
                    >
                      {isWished ? '♥' : '♡'}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-3.5">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] text-amber-800 uppercase font-bold tracking-wider">
                        {p.category}
                      </span>
                      {p.ruling_planet && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-amber-50/70 border border-amber-200/50 px-1.5 py-0.5 rounded">
                          {p.ruling_planet.split('(')[0].trim()}
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/mall/product/${p.id}`} style={{ display: 'block', minHeight: 38 }}>
                      <h4 className="font-serif text-xs sm:text-sm font-bold text-[#183C2B] line-clamp-2 hover:text-[#A77B25] no-underline leading-snug">
                        {p.title}
                      </h4>
                    </Link>

                    {/* Suitable for note */}
                    {p.suitable_for && (
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                        🎯 {p.suitable_for}
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-amber-500 font-bold">
                      <span>★</span>
                      <span className="text-[#183C2B]">{Number(p.rating || 4.9).toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({p.reviews || 128})</span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-1.5 mt-2">
                      <span className="font-extrabold text-sm sm:text-base text-[#164B32]">₹{p.price}</span>
                      <span className="text-[11px] text-slate-400 line-through">₹{p.original_price}</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
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
                    disabled={!p.in_stock}
                    className="w-full py-2.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider text-[#183C2B] shadow-xs cursor-pointer border-0 transition-all hover:brightness-105 active:scale-98"
                    style={{
                      background: 'linear-gradient(135deg, #D9A441 0%, #B3832B 100%)',
                      opacity: !p.in_stock ? 0.5 : 1,
                      cursor: !p.in_stock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {!p.in_stock ? 'Out of stock' : 'Add to Cart →'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsCartOpen(false); }}>
          <div ref={drawerRef} role="dialog" aria-modal="true" aria-label="Your cart" className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-serif text-lg font-bold text-[#183C2B]">Your Spiritual Cart ({cart.items.length})</h3>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  aria-label="Close cart" data-close
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold cursor-pointer border-0"
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
                      <img src={item.image} alt="" className="w-14 h-14 object-cover rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-xs font-bold text-[#183C2B] truncate">{item.title}</h4>
                        <span className="text-xs font-bold text-[#164B32]">₹{item.unit_price} × {item.quantity}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => cart.remove(item.key)}
                        aria-label={`Remove ${item.title}`}
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
                <div className="flex justify-between text-sm font-bold text-[#183C2B] mb-4">
                  <span>Subtotal:</span>
                  <span className="text-[#164B32] font-extrabold text-lg">₹{cartTotal}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsCartOpen(false); navigate('/astro-mall/checkout'); }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md"
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

