import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { REFERENCE_PRODUCTS } from '../AstroMallPage/AstroMallPage.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');

  const product =
    REFERENCE_PRODUCTS.find((p) => p.id === id) || REFERENCE_PRODUCTS[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const photos = [
    product.image,
    '/assets/img/products/kamalgatta-mala.jpg',
    '/assets/img/products/sphatik-mala.jpg',
    '/assets/img/products/rudraksha-5.jpg',
  ];

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-24">
      {/* Breadcrumb Navigation */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#4A0E17] text-slate-600 no-underline">Home</Link>
          <span>/</span>
          <Link to="/mall" className="hover:text-[#4A0E17] text-slate-600 no-underline">Vedic Astro Mall</Link>
          <span>/</span>
          <span className="font-semibold text-[#1E1B4B]">{product.title}</span>
        </nav>

        {/* 2-Column Product Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E2D8] shadow-sm mb-12">
          {/* Left Column: Image Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-amber-50 border border-slate-200">
              <img
                src={photos[photoIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Thumbnails */}
            <div className="flex gap-2">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPhotoIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer p-0 transition-all ${
                    photoIndex === idx ? 'border-[#3E0B18] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Pricing & CTAs */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                  {product.tag || 'Bestseller'}
                </span>
                <span className="text-xs text-emerald-700 font-bold">✔ In Stock &amp; Ready to Ship</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2 leading-tight">
                {product.title}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4 text-xs font-bold text-amber-500">
                <span>★ {product.rating || '4.8'}</span>
                <span className="text-slate-400 font-normal">({product.reviews || '1,240'} verified reviews)</span>
              </div>

              {/* Pricing */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/50 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#3E0B18]">₹{product.price}</span>
                  <span className="text-sm text-slate-400 line-through">₹{product.original_price}</span>
                  <span className="text-xs font-bold text-emerald-700">Save {product.discount_percent}%</span>
                </div>
                <small className="text-slate-500 block mt-1">Inclusive of all Vedic rituals, energization &amp; taxes.</small>
              </div>

              {/* Key Benefits */}
              <div className="space-y-2 mb-6 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">✔</span>
                  <span>100% Genuine, tested and certified natural Vedic item.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">✔</span>
                  <span>Energized with Parashari Vedic mantras by learned scholars.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">✔</span>
                  <span>Free doorstep delivery across all Indian pin codes.</span>
                </div>
              </div>
            </div>

            {/* Quantity and Buy Button */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#1E1B4B]">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 font-bold cursor-pointer border-0"
                  >
                    -
                  </button>
                  <span className="px-4 text-xs font-bold text-[#1E1B4B]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 font-bold cursor-pointer border-0"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => alert(`Added ${quantity} × ${product.title} to cart!`)}
                  className="flex-1 py-3.5 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:brightness-110"
                >
                  Add to Cart • ₹{product.price * quantity}
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Starting fast checkout for ${product.title}...`)}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#1E1B4B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:brightness-105"
                >
                  Buy Now ➔
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Subtabs */}
        <div className="bg-white rounded-3xl border border-[#E7E2D8] p-6 shadow-sm mb-12">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
            {['details', 'energization', 'faqs'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer border-0 capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-[#3E0B18] text-[#FFF9EF]'
                    : 'bg-transparent text-slate-600 hover:text-[#3E0B18]'
                }`}
              >
                {tab === 'details' ? 'Description & Benefits' : tab === 'energization' ? 'Vedic Energization Process' : 'Frequently Asked Questions'}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>
                Each sacred item is ethically sourced and inspected for purity, density, and natural formation. In Vedic traditions, wearing or worshipping authentic spiritual instruments creates protective auric vibrations and aids mental calmness, concentration, and harmony.
              </p>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#B45309] pt-2">How to Use:</h4>
              <p>
                After taking a morning bath, hold the sacred item with folded hands facing North or East. Chant the associated deity mantra 11 or 108 times before wearing or placing it on your altar.
              </p>
            </div>
          )}

          {activeTab === 'energization' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>
                All items undergo an elaborate Pran Pratishtha ritual at holy pilgrim altars (Vrindavan, Ujjain, Kashi) with holy Ganga jal, raw cow milk, bilva patra, and Vedic mantras to awaken their auspicious spiritual potency.
              </p>
            </div>
          )}

          {activeTab === 'faqs' && (
            <div className="space-y-4 text-xs">
              <div>
                <strong className="text-[#1E1B4B] block mb-1">Is this item 100% genuine and certified?</strong>
                <p className="text-slate-600">Yes, every product comes with an authentic seal of purity and lab verification certificate.</p>
              </div>
              <div>
                <strong className="text-[#1E1B4B] block mb-1">How soon will I receive my order?</strong>
                <p className="text-slate-600">Orders are packed safely with bubble wrap and dispatched via express courier within 24 to 48 hours.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

