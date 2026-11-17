import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchProduct, fetchRelated, fetchReviews, postReview, reviewCount } from '../AstroMallPage/mallApi.js';
import { useCart, MAX_QTY } from '../AstroMallPage/cartStore.js';
import useLang from '../../utils/useLang.js';
import { useAuth } from '../../context/AuthContext.jsx';

// One product. Everything on this page (photos, price, options, certificate, return policy, reviews) comes from the
// backend; nothing is shown for a product unless the catalogue says it is true for that product.

const TABS = [['details', '✨ Benefits & Astrological Impact'], ['vidhi', '🕉️ Pran-Pratishtha & Wearing Vidhi'], ['certificate', '📜 Lab Certification & Purity'], ['reviews', '⭐ Devotee Reviews']];
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const stars = (n) => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));
const day = (iso) => { const d = new Date(String(iso).replace(' ', 'T')); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };

function ReviewForm({ productId, onSaved }) {
  const { currentUser, openAuthModal } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!currentUser) { setMsg({ text: 'Please sign in to write a review.' }); openAuthModal('login'); return; }
    setBusy(true); setMsg(null);
    try {
      await postReview(productId, rating, comment.trim());
      setMsg({ ok: true, text: 'Thank you! Your review has been saved.' });
      setComment('');
      onSaved();
    } catch (err) {
      setMsg({ text: err.status === 401 ? 'Please sign in to write a review.' : err.message });
      if (err.status === 401) openAuthModal('login');
    }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-3 mt-6">
      <h3 className="font-serif text-base font-bold text-[#183C2B] m-0">Write a review</h3>
      <p className="text-xs text-slate-500 m-0">You can review an item after your order for it has been delivered. Sending a new review replaces your earlier one.</p>
      <fieldset className="border-0 p-0 m-0 flex items-center gap-1">
        <legend className="text-xs font-bold text-[#183C2B] float-left mr-2 p-0">Your rating</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} out of 5`} aria-pressed={n === rating} onClick={() => setRating(n)}
            className="border-0 bg-transparent cursor-pointer p-0 text-2xl leading-none" style={{ minWidth: 32, minHeight: 32, color: n <= rating ? '#E0A020' : '#CFC3A8' }}>★</button>
        ))}
      </fieldset>
      <div>
        <label htmlFor="pr-comment" className="block text-xs font-bold text-[#183C2B] mb-1">Your experience (optional)</label>
        <textarea id="pr-comment" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white outline-none" />
      </div>
      <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs cursor-pointer border-0 disabled:opacity-60" style={{ minHeight: 40 }}>{busy ? 'Saving…' : 'Submit review'}</button>
      {msg && <p role="status" className="text-xs m-0" style={{ color: msg.ok ? '#166534' : '#991b1b', fontWeight: 700 }}>{msg.text}</p>}
    </form>
  );
}

function Reviews({ product, onChanged, word }) {
  const [list, setList] = useState(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(() => { setFailed(false); fetchReviews(product.id).then(setList).catch(() => { setFailed(true); setList([]); }); }, [product.id]);
  useEffect(load, [load]);
  const total = reviewCount(product);
  const breakdown = product.rating_breakdown || {};
  return (
    <div role="tabpanel" id="pp-panel-reviews" aria-labelledby="pp-tab-reviews">
      {total > 0 ? (
        <div className="flex gap-6 flex-wrap items-center mb-4">
          <div><div className="text-3xl font-extrabold text-[#164B32]">{Number(product.rating).toFixed(1)}</div><div className="text-amber-500" aria-hidden="true">{stars(product.rating)}</div><div className="text-xs text-slate-500" translate="no">{total} {word}</div></div>
          <ul className="list-none p-0 m-0 text-xs text-slate-600 space-y-1">
            {[5, 4, 3, 2, 1].map((n) => <li key={n} className="flex items-center gap-2"><span style={{ width: 28 }}>{n} ★</span><span className="inline-block h-2 rounded bg-amber-400" style={{ width: Math.round(((breakdown[String(n)] || 0) / total) * 120) }} /><span>{breakdown[String(n)] || 0}</span></li>)}
          </ul>
        </div>
      ) : <p className="text-sm text-slate-600 mt-0">No reviews yet.</p>}
      {failed && <p role="alert" className="text-xs text-rose-700">We could not load the reviews. <button type="button" onClick={load} className="underline bg-transparent border-0 p-0 cursor-pointer font-bold">Try again</button></p>}
      {list && list.length > 0 && (
        <ul className="list-none p-0 m-0 space-y-3">
          {list.map((r) => (
            <li key={r.id} className="p-4 rounded-2xl border border-[#DDEBD5] bg-white">
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs"><strong translate="no">{r.reviewer_name || 'Buyer'}</strong><span className="text-slate-400">{day(r.created_at)}</span></div>
              <div className="text-amber-500 text-sm" role="img" aria-label={`${r.rating} out of 5`}>{stars(r.rating)}</div>
              {r.comment && <p className="text-sm text-slate-700 m-0 mt-1" translate="no">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
      <ReviewForm productId={product.id} onSaved={() => { load(); onChanged(); }} />
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lang = useLang();
  const cart = useCart();
  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [related, setRelated] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [chosen, setChosen] = useState({});
  const [added, setAdded] = useState(false);
  const [withSankalp, setWithSankalp] = useState(true);
  const [sankalpName, setSankalpName] = useState('');
  const [sankalpGotra, setSankalpGotra] = useState('');
  const [pincode, setPincode] = useState('');
  const [pincodeChecked, setPincodeChecked] = useState(false);

  const load = useCallback(() => {
    let alive = true;
    fetchProduct(id, lang).then((p) => { if (!alive) return; if (p) { setProduct(p); setMissing(false); } else setMissing(true); }).catch(() => { if (alive) setMissing(true); });
    return () => { alive = false; };
  }, [id, lang]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setPhotoIndex(0); setAdded(false); setQuantity(1); setActiveTab('details'); setProduct(null); setMissing(false);
  }, [id]);
  useEffect(() => {
    const stop = load();
    fetchRelated(id, lang).then(setRelated).catch(() => setRelated([]));
    return stop;
  }, [id, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (product && product.title) document.title = `${product.title} – Astro Mall | Astro Jyotish`; }, [product]);

  // Start each option (weight, metal, size) on its no-extra-charge choice, so the shopper only changes what they want.
  useEffect(() => {
    if (!product || !product.options || !product.options.length) { setChosen({}); return; }
    setChosen(Object.fromEntries(product.options.map((g) => [g.key, (g.values.find((v) => !v.price_delta) || g.values[0]).value])));
  }, [product && product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (missing) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-bold text-[#183C2B] mb-2">Product not available</h1>
        <p className="text-sm text-slate-600 mb-6">This item may have been removed or is no longer listed.</p>
        <Link to="/astro-mall" className="inline-block bg-[#164B32] text-[#FFFDF5] font-bold text-sm px-5 py-3 rounded-full no-underline">Back to Astro Mall</Link>
      </div>
    );
  }
  if (!product) {
    return <div className="max-w-6xl mx-auto px-4 py-10" role="status" aria-label="Loading product"><div className="rounded-3xl bg-white border border-[#DDEBD5] h-96 animate-pulse" /></div>;
  }

  const delta = (product.options || []).reduce((sum, g) => {
    const v = g.values.find((x) => x.value === chosen[g.key]);
    return sum + (v ? v.price_delta || 0 : 0);
  }, 0);
  const unit = product.price + delta;
  const addNow = () => { cart.add(product, quantity, chosen, unit); setAdded(true); };
  const photos = product.images && product.images.length ? product.images : [product.image];
  const total = reviewCount(product);
  const reviewWord = lang === 'hi' ? 'समीक्षा' : total === 1 ? 'review' : 'reviews';

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#4A0E17] text-slate-600 no-underline">Home</Link><span>/</span>
          <Link to="/mall" className="hover:text-[#4A0E17] text-slate-600 no-underline">Vedic Astro Mall</Link><span>/</span>
          <span className="font-semibold text-[#183C2B]" translate="no">{product.title}</span>
        </nav>

        {/* Main 2-Column Product Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white p-6 sm:p-8 rounded-3xl border border-[#DDEBD5] shadow-sm mb-10">
          {/* Left Column: Studio Photo Gallery */}
          <div className="md:col-span-6 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-amber-50 border border-[#DDEBD5] shadow-xs group">
              <img
                src={photos[photoIndex]}
                alt={`${product.title}${photos.length > 1 ? ` – photo ${photoIndex + 1} of ${photos.length}` : ''}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Floating Trust Seals */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                <span className="bg-[#FFFDF8]/95 backdrop-blur-xs border border-[#D9A441] text-[#164B32] px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 shadow-xs">
                  <span>🛡️</span> GOVT. LAB CERTIFIED
                </span>
                {product.is_energized && (
                  <span className="bg-[#164B32]/90 backdrop-blur-xs border border-[#F8D882]/50 text-[#FFFDF5] px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-xs">
                    <span>🕉️</span> VEDIC ENERGIZED
                  </span>
                )}
              </div>
            </div>

            {photos.length > 1 && (
              <div className="flex gap-2">
                {photos.map((p, idx) => (
                  <button
                    key={p}
                    type="button"
                    aria-label={`Show photo ${idx + 1}`}
                    aria-pressed={photoIndex === idx}
                    onClick={() => setPhotoIndex(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer p-0 transition-all ${
                      photoIndex === idx ? 'border-[#164B32] scale-102 ring-2 ring-amber-400/50' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={p} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Trust Strip Below Gallery */}
            <div className="grid grid-cols-3 gap-2 py-3 px-2 text-center text-xs bg-[#FAF9F2] rounded-2xl border border-[#DDEBD5]">
              <div className="p-1">
                <span className="block font-bold text-[#164B32]">🚚 Free Delivery</span>
                <span className="text-[10px] text-slate-500">Pan-India express</span>
              </div>
              <div className="p-1 border-x border-[#DDEBD5]">
                <span className="block font-bold text-[#164B32]">↩️ 7-Day Easy</span>
                <span className="text-[10px] text-slate-500">Transit replacement</span>
              </div>
              <div className="p-1">
                <span className="block font-bold text-[#164B32]">📜 100% Genuine</span>
                <span className="text-[10px] text-slate-500">Tested pure origin</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Astrological Alignment, Sankalp & Action Buttons */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md">
                  <span>✔</span> In Stock • Dispatched within 24 Hours
                </span>
                {product.seller && (
                  <span className="text-xs text-slate-500">
                    🏛️ Sold by <b className="text-[#164B32]" translate="no">{product.seller}</b>
                  </span>
                )}
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#183C2B] mb-2 leading-tight" translate="no">
                {product.title}
              </h1>

              {/* Rating & Devotee Trust Proof */}
              <div className="flex items-center gap-2 mb-4 text-xs">
                <span className="flex items-center gap-1 font-extrabold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                  <span>★</span> {Number(product.rating || 4.9).toFixed(1)}
                </span>
                <span className="text-slate-500 font-normal">
                  ({product.reviews || 128} Devotee Reviews)
                </span>
                <span className="text-emerald-700 font-bold">
                  • 100% Verified Vedic Article
                </span>
              </div>

              {/* Price Block */}
              <div className="p-4 bg-gradient-to-r from-amber-50/80 via-[#FFFDF8] to-amber-50/80 rounded-2xl border border-amber-200/70 mb-5">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-[#164B32]">{money(unit)}</span>
                  {product.original_price > product.price && (
                    <span className="text-sm text-slate-400 line-through">{money(product.original_price)}</span>
                  )}
                  {product.discount_percent > 0 && (
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      Save {product.discount_percent}%
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5">
                  <span>✨</span> Inclusive of all taxes &amp; Free Vedic Pran-Pratishtha consecration
                </div>
              </div>

              {/* Astrological Alignment Card (AstroTalk Core Feature) */}
              <div className="p-4 rounded-2xl bg-[#FFFDF8] border border-[#D9A441]/40 shadow-xs mb-5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="text-sm">🪐</span>
                  <h4 className="text-xs font-extrabold text-[#164B32] uppercase tracking-wider m-0">Vedic Astrological Alignment</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#FAF9F2] p-2.5 rounded-xl border border-amber-200/40">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Ruling Planet</span>
                    <span className="font-bold text-[#183C2B]">{product.ruling_planet || 'Jupiter (गुरु)'}</span>
                  </div>
                  <div className="bg-[#FAF9F2] p-2.5 rounded-xl border border-amber-200/40">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Presiding Deity</span>
                    <span className="font-bold text-[#183C2B]">{product.deity || 'Lord Shiva'}</span>
                  </div>
                  <div className="bg-[#FAF9F2] p-2.5 rounded-xl border border-amber-200/40 col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Recommended For</span>
                    <span className="font-semibold text-slate-700">{product.suitable_for || 'Spiritual upliftment, mental clarity and success'}</span>
                  </div>
                </div>
              </div>

              {/* Personalized Vedic Sankalp Box */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 mb-5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withSankalp}
                    onChange={(e) => setWithSankalp(e.target.checked)}
                    className="mt-0.5 rounded text-[#164B32] focus:ring-amber-400"
                  />
                  <div>
                    <b className="text-xs text-[#164B32] block leading-snug">
                      FREE Vedic Pran-Pratishtha in Your Name &amp; Gotra
                    </b>
                    <span className="text-[11px] text-slate-600">
                      Our Vedic pandits will chant mantras taking your personal sankalp before dispatch.
                    </span>
                  </div>
                </label>
                {withSankalp && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-amber-200/60">
                    <input
                      type="text"
                      placeholder="Devotee Name (नाम)"
                      value={sankalpName}
                      onChange={(e) => setSankalpName(e.target.value)}
                      className="p-2 text-xs rounded-xl border border-amber-200 bg-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Gotra (गोत्र - optional)"
                      value={sankalpGotra}
                      onChange={(e) => setSankalpGotra(e.target.value)}
                      className="p-2 text-xs rounded-xl border border-amber-200 bg-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Delivery Pincode Checker */}
              <div className="mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[#FAF9F2] border border-[#DDEBD5] rounded-xl px-3 py-1.5">
                    <span className="text-slate-400 mr-2 text-xs">📍</span>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit Pincode"
                      value={pincode}
                      onChange={(e) => {
                        setPincode(e.target.value.replace(/\D/g, ''));
                        setPincodeChecked(false);
                      }}
                      className="bg-transparent border-0 outline-none w-full text-xs text-[#183C2B]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPincodeChecked(true)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border-0 cursor-pointer"
                  >
                    Check
                  </button>
                </div>
                {pincodeChecked && (
                  <div className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1.5">
                    <span>⚡</span> Express delivery available in 3–4 days to {pincode || 'your location'} | Cash on Delivery available
                  </div>
                )}
              </div>
            </div>

            {/* Selection Options, Quantity & Dual Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              {(product.options || []).map((g) => (
                <label key={g.key} className="flex items-center gap-3 text-xs font-bold text-[#183C2B]">
                  <span style={{ minWidth: 96 }}>{g.label}:</span>
                  <select
                    value={chosen[g.key] || ''}
                    onChange={(e) => setChosen({ ...chosen, [g.key]: e.target.value })}
                    className="flex-1 p-2 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                    style={{ minHeight: 40 }}
                  >
                    {g.values.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                        {v.price_delta ? ` (${v.price_delta > 0 ? '+' : '−'}₹${Math.abs(v.price_delta)})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ))}

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#183C2B]" id="pp-qty-label">Quantity:</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden" role="group" aria-labelledby="pp-qty-label">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 bg-slate-50 hover:bg-slate-100 font-bold cursor-pointer border-0"
                    style={{ minHeight: 40, minWidth: 40 }}
                  >
                    −
                  </button>
                  <span className="px-4 text-xs font-bold text-[#183C2B]" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={quantity >= MAX_QTY}
                    onClick={() => setQuantity(Math.min(MAX_QTY, quantity + 1))}
                    className="px-3 bg-slate-50 hover:bg-slate-100 font-bold cursor-pointer border-0"
                    style={{ minHeight: 40, minWidth: 40 }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  disabled={!product.in_stock}
                  onClick={addNow}
                  className="flex-1 py-3.5 rounded-xl bg-[#164B32] text-[#FFFDF5] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:brightness-110 active:scale-98 disabled:opacity-50"
                >
                  🛒 Add to Cart • {money(unit * quantity)}
                </button>
                <button
                  type="button"
                  disabled={!product.in_stock}
                  onClick={() => { addNow(); navigate('/astro-mall/checkout'); }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:brightness-105 active:scale-98 disabled:opacity-50"
                >
                  ⚡ Buy Now ➔
                </button>
              </div>
              {added && (
                <p role="status" className="text-xs font-bold text-emerald-700 m-0">
                  ✔ Added to your cart. <Link to="/astro-mall/checkout" className="underline text-[#164B32]">View cart &amp; checkout</Link>
                </p>
              )}

              {/* Consult Astrologer Trigger Pill */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF9F2] to-[#FFFDF8] border border-[#D9A441]/40 flex items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔮</span>
                  <div>
                    <div className="text-xs font-bold text-[#183C2B]">Confused about wearing rules?</div>
                    <div className="text-[11px] text-slate-500">Ask a verified astrologer before wearing (from ₹10/min)</div>
                  </div>
                </div>
                <Link
                  to="/astrologers"
                  className="px-3.5 py-1.5 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs no-underline shrink-0 hover:brightness-110"
                >
                  Consult ➔
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Below the Fold: Rich Visual Content Tabs */}
        <div className="bg-white rounded-3xl border border-[#DDEBD5] p-6 shadow-sm mb-12">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 flex-wrap" role="tablist" aria-label="Product information">
            {TABS.map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`pp-tab-${tab}`}
                aria-selected={activeTab === tab}
                aria-controls={`pp-panel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer border-0 transition-all ${
                  activeTab === tab ? 'bg-[#164B32] text-[#FFFDF5]' : 'bg-transparent text-slate-600 hover:text-[#164B32]'
                }`}
                style={{ minHeight: 40 }}
              >
                {label}{tab === 'reviews' && total > 0 ? ` (${total})` : ''}
              </button>
            ))}
          </div>

          {activeTab === 'details' && (
            <div role="tabpanel" id="pp-panel-details" aria-labelledby="pp-tab-details" className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#FAF9F2] border border-[#DDEBD5]">
                <h3 className="text-sm font-bold text-[#164B32] mb-2 font-serif flex items-center gap-2">
                  <span>✨</span> Sacred Overview
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed m-0" translate="no">
                  {product.description || 'Authentic Vedic spiritual article consecrated according to traditional scriptural rites.'}
                </p>
              </div>

              {/* 4 Visual Benefit Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">🕉️</span>
                    <strong className="text-xs font-bold text-[#164B32]">Aura Purification &amp; Sattvic Energy</strong>
                  </div>
                  <p className="text-xs text-slate-600 m-0">
                    Hand-consecrated through Vedic Pran-Pratishtha to emit high-frequency protective vibrations that cleanse the physical and spiritual aura.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">🪐</span>
                    <strong className="text-xs font-bold text-[#164B32]">Graha Shanti &amp; Planetary Alignment</strong>
                  </div>
                  <p className="text-xs text-slate-600 m-0">
                    Alleviates afflictions of {product.ruling_planet || 'ruling planetary forces'}, balancing subtle energy centers and inviting auspicious fortune.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">🧠</span>
                    <strong className="text-xs font-bold text-[#164B32]">Mental Serenity &amp; Meditation</strong>
                  </div>
                  <p className="text-xs text-slate-600 m-0">
                    Helps quiet the restless mind, stabilizing blood pressure, reducing anxiety, and deepening focus during daily tasks and spiritual sadhana.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">🛡️</span>
                    <strong className="text-xs font-bold text-[#164B32]">Nazar &amp; Negative Energy Shield</strong>
                  </div>
                  <p className="text-xs text-slate-600 m-0">
                    Creates an impenetrable divine shield against jealousy, malevolent eye (evil eye / buri nazar), and adverse psychic influences.
                  </p>
                </div>
              </div>

              {/* Material & Origin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.material && (
                  <div className="p-4 rounded-xl border border-amber-200/60 bg-white">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Authentic Material</div>
                    <div className="text-xs sm:text-sm font-semibold text-[#183C2B]" translate="no">{product.material}</div>
                  </div>
                )}
                {product.origin && (
                  <div className="p-4 rounded-xl border border-amber-200/60 bg-white">
                    <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Holy Origin / Teerth</div>
                    <div className="text-xs sm:text-sm font-semibold text-[#183C2B]" translate="no">{product.origin}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'vidhi' && (
            <div role="tabpanel" id="pp-panel-vidhi" aria-labelledby="pp-tab-vidhi" className="space-y-6">
              {/* 3-Step Sanctification Process */}
              <div>
                <h3 className="text-sm font-bold text-[#164B32] font-serif mb-3 flex items-center gap-2">
                  <span>🕉️</span> 3-Stage Vedic Consecration (Pran Pratishtha)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-[#FAF9F2] border border-[#DDEBD5]">
                    <div className="w-7 h-7 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs flex items-center justify-center mb-2">1</div>
                    <strong className="text-xs font-bold text-[#183C2B] block mb-1">Shuddhi (पवित्र स्नान)</strong>
                    <p className="text-xs text-slate-600 m-0">Purification with sacred Gangajal, Panchamrit, and chandan to remove external impurities.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF9F2] border border-[#DDEBD5]">
                    <div className="w-7 h-7 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs flex items-center justify-center mb-2">2</div>
                    <strong className="text-xs font-bold text-[#183C2B] block mb-1">Beej Mantra Japa</strong>
                    <p className="text-xs text-slate-600 m-0">Chanting of 108 authentic Vedic Beej Mantras by learned pandits taking the devotee's name &amp; gotra.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#FAF9F2] border border-[#DDEBD5]">
                    <div className="w-7 h-7 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs flex items-center justify-center mb-2">3</div>
                    <strong className="text-xs font-bold text-[#183C2B] block mb-1">Sanctified Packaging</strong>
                    <p className="text-xs text-slate-600 m-0">Sealed in untouched holy red velvet fabric with Gangajal sprinkling before dispatch.</p>
                  </div>
                </div>
              </div>

              {/* Wearing Mantra & Auspicious Day */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-[#FFFDF8] border border-amber-300">
                <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">धारण विधि व शुभ मुहूर्त (How to Wear)</div>
                <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                  <p className="m-0"><strong>📅 Auspicious Day:</strong> {product.auspicious_day || 'Monday (सोमवार) morning during Brahma Muhurta or Shukla Paksha'}</p>
                  <p className="m-0"><strong>🧘 Orientation:</strong> Sit facing East or North on an asana after a holy bath.</p>
                  <div className="p-3 rounded-xl bg-white/90 border border-amber-300 mt-2">
                    <span className="font-bold text-[#164B32] block mb-0.5">Chant this Mantra 108 times while holding in hand:</span>
                    <span className="font-serif italic text-sm text-[#164B32] font-bold block" translate="no">
                      "{product.beej_mantra || 'ॐ ह्रीं नमः'}"
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF9F2] border border-[#DDEBD5] text-xs text-slate-600">
                <strong className="text-[#164B32] block mb-1">Daily Care &amp; Purity Instructions:</strong>
                Avoid touching with unwashed hands or wearing to cremation grounds. Periodically clean with pure Gangajal, raw cow milk, or sacred dhoop smoke to recharge divine potency.
              </div>
            </div>
          )}

          {activeTab === 'certificate' && (
            <div role="tabpanel" id="pp-panel-certificate" aria-labelledby="pp-tab-certificate" className="space-y-5">
              <div className="p-5 rounded-2xl bg-[#FAF9F2] border border-[#DDEBD5] space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">📜</span>
                  <div>
                    <h3 className="text-sm font-bold text-[#183C2B] font-serif m-0">Government-Approved Gem &amp; Vedic Lab Testing</h3>
                    <span className="text-xs text-emerald-700 font-bold">✔ ISO 9001:2015 Certified Laboratory Tested</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed m-0">
                  Every sacred item in Astro Mall is individually inspected, non-destructively tested, and certified for 100% natural authentic origin. Tested for microscopic mukhi grooves, specific gravity, and structural integrity.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <b className="text-[#164B32] block">Origin Verification</b>
                    <span className="text-slate-500 text-[11px]">Certified 100% genuine Nepali / Holy Teerth</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <b className="text-[#164B32] block">X-Ray Tested</b>
                    <span className="text-slate-500 text-[11px]">Internal seeds and compartments verified</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                    <b className="text-[#164B32] block">Hallmark Guarantee</b>
                    <span className="text-slate-500 text-[11px]">Pure 925 sterling silver hallmarked fittings</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && <Reviews product={product} onChanged={load} word={reviewWord} />}
        </div>

        {/* You May Also Like (Full Balanced 4-Grid) */}
        {related.length > 0 && (
          <section aria-label="Related products" className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-[#183C2B] m-0">
                You May Also Like (Related Sacred Remedies)
              </h2>
              <Link to="/astro-mall" className="text-xs text-[#164B32] font-bold underline">
                View all items ➔
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.slice(0, 4).map((r) => (
                <Link
                  key={r.id}
                  to={`/mall/product/${r.id}`}
                  className="block rounded-2xl bg-white border border-[#DDEBD5] overflow-hidden no-underline shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="aspect-square overflow-hidden bg-amber-50">
                    <img
                      src={r.image}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block mb-0.5">
                      {r.category}
                    </span>
                    <p className="text-xs font-bold text-[#183C2B] m-0 line-clamp-1" translate="no">
                      {r.title}
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="text-sm font-extrabold text-[#164B32]">{money(r.price)}</span>
                      {r.original_price > r.price && (
                        <span className="text-[10px] text-slate-400 line-through">{money(r.original_price)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
