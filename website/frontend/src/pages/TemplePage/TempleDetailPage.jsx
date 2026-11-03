import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getChadhavaEvent, DHANTERAS_CHADHAVA_EVENT } from './chadhavaData.js';

export default function TempleDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Load event details based on slug (defaults to Dhanteras flagship)
  const event = getChadhavaEvent(slug);

  // States
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [cart, setCart] = useState({}); // { [offeringId]: quantity }
  const [isSankalpModalOpen, setIsSankalpModalOpen] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // Sankalp Form States
  const [devoteeName, setDevoteeName] = useState('');
  const [gotra, setGotra] = useState('');
  const [nakshatra, setNakshatra] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [phone, setPhone] = useState('');
  const [sankalpPurpose, setSankalpPurpose] = useState('Dhan & Samriddhi (Enduring Wealth & Abundance)');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Cart Management
  const handleAddToCart = (offeringId) => {
    setCart((prev) => ({
      ...prev,
      [offeringId]: (prev[offeringId] || 0) + 1,
    }));
  };

  const handleIncrement = (offeringId) => {
    setCart((prev) => ({
      ...prev,
      [offeringId]: (prev[offeringId] || 0) + 1,
    }));
  };

  const handleDecrement = (offeringId) => {
    setCart((prev) => {
      const current = prev[offeringId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[offeringId];
        return next;
      }
      return {
        ...prev,
        [offeringId]: current - 1,
      };
    });
  };

  // Calculations
  const totalItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalAmount = event.offerings.reduce((sum, off) => {
    const qty = cart[off.id] || 0;
    return sum + off.price * qty;
  }, 0);

  const selectedOfferingsList = event.offerings
    .filter((off) => cart[off.id] > 0)
    .map((off) => ({
      ...off,
      qty: cart[off.id],
      lineTotal: off.price * cart[off.id],
    }));

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!devoteeName.trim()) {
      alert('Please enter Devotee (Yajman) Name for the sacred Sankalp.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      alert('Please enter a valid 10-digit WhatsApp phone number to receive video proof.');
      return;
    }

    const orderId = 'CHD-' + Math.floor(100000 + Math.random() * 900000);
    const successPayload = {
      orderId,
      devoteeName,
      gotra: gotra.trim() || 'Kashyap (कश्यप)',
      nakshatra: nakshatra || 'Uttara Phalguni',
      familyMembers: familyMembers.trim(),
      phone,
      sankalpPurpose,
      totalAmount: totalAmount || 51,
      itemCount: totalItemCount || 1,
      items: selectedOfferingsList.length > 0 ? selectedOfferingsList : [event.offerings[0]],
      eventTitle: event.title,
      temple: event.temple_location,
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setBookingSuccessData(successPayload);
    setIsSankalpModalOpen(false);
  };

  const handleGotraUnknown = () => {
    setGotra('Kashyap (कश्यप - universal gotra for all devotees)');
  };

  const nextPhoto = () => {
    if (event.photos && event.photos.length > 1) {
      setPhotoIndex((prev) => (prev + 1) % event.photos.length);
    }
  };

  const prevPhoto = () => {
    if (event.photos && event.photos.length > 1) {
      setPhotoIndex((prev) => (prev - 1 + event.photos.length) % event.photos.length);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen text-[#1E1B4B]">
      {/* 1. Breadcrumbs Matching Reference Screenshot 1:1 */}
      <div className="bg-[#FAF7F2] border-b border-[#EFE8DD]/70 py-3 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-[#3E0B18] transition-colors text-slate-600 no-underline font-medium">
              Home
            </Link>
            <span className="text-slate-400">›</span>
            <Link to="/mandir-seva" className="hover:text-[#3E0B18] transition-colors text-slate-600 no-underline font-medium">
              Sri Mandir Chadhava Seva
            </Link>
            <span className="text-slate-400">›</span>
            <span className="font-semibold text-[#1E1B4B] truncate max-w-[260px] sm:max-w-md">
              {event.breadcrumb}
            </span>
          </nav>
        </div>
      </div>

      {/* 2. Main Hero Section Matching Reference Screenshot 1:1 */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Grand Artwork Banner with Gold Frame */}
          <div className="md:col-span-6 lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden shadow-md border-2 border-[#D4AF37] bg-[#2E0B12] aspect-[16/10] sm:aspect-[16/10]">
              <img
                src={event.photos && event.photos.length > 0 ? event.photos[photoIndex] : event.banner_image}
                alt={event.title}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Carousel navigation arrows */}
              {event.photos && event.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center text-sm cursor-pointer border-0 shadow backdrop-blur-xs transition-all"
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center text-sm cursor-pointer border-0 shadow backdrop-blur-xs transition-all"
                    aria-label="Next photo"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Carousel Dots beneath banner */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {[0, 1, 2, 3, 4].map((dot) => (
                <button
                  key={dot}
                  type="button"
                  onClick={() => setPhotoIndex(dot % (event.photos?.length || 1))}
                  className={`w-2 h-2 rounded-full transition-all border-0 p-0 cursor-pointer ${
                    photoIndex === dot % (event.photos?.length || 1)
                      ? 'bg-[#3E0B18] w-4'
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${dot + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Event Narrative & Social Proof Matching Screenshot */}
          <div className="md:col-span-6 lg:col-span-6 flex flex-col justify-start">
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1E1B4B] leading-tight mb-3">
              {event.title}
            </h1>

            {/* Sacred Narrative Description with Read more toggle */}
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-5">
              <p className="inline">
                {isStoryExpanded ? event.story_full : event.story}
              </p>{' '}
              <button
                type="button"
                onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                className="inline text-xs font-bold text-[#B45309] hover:text-[#78350F] underline cursor-pointer bg-transparent border-0 p-0"
              >
                {isStoryExpanded ? 'Read less' : '... Read more'}
              </button>
            </div>

            {/* Social Proof Avatar Stack & Count Matching Screenshot */}
            <div className="flex items-center gap-3 pt-4 border-t border-[#EAE3D4]">
              {/* Stacked devotee avatars */}
              <div className="flex -space-x-2 overflow-hidden shrink-0">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80"
                  alt="Devotee"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                  alt="Devotee"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                  alt="Devotee"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80"
                  alt="Devotee"
                />
              </div>

              {/* Devotees count copy */}
              <p className="text-xs text-slate-600 leading-snug">
                Till now{' '}
                <strong className="text-[#B45309] font-bold">
                  {event.devotees_joined || '1,50,000+'} Devotees
                </strong>{' '}
                have participated in Chadhava conducted by Sri Mandir Chadhava Seva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section Heading: "Choose an offering" Matching Screenshot */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-36 sm:pb-28" id="offerings-catalog">
        <div className="border-t border-[#E8E1D3] pt-6 mb-6">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-[#1E1B4B]">
            Choose an offering
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select sacred items to offer in your name and Gotra. Priests perform Arpan inside the Garbhagriha with HD video proof.
          </p>
        </div>

        {/* 4. Sacred Offerings List (All 18 Offerings Matching Reference Screenshot 1:1) */}
        <div className="space-y-4">
          {event.offerings.map((offering) => {
            const quantity = cart[offering.id] || 0;
            const isAdded = quantity > 0;

            return (
              <div
                key={offering.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 bg-white shadow-xs flex flex-row items-center justify-between gap-3 sm:gap-4 ${
                  isAdded ? 'border-[#3E0B18]/40 ring-1 ring-[#3E0B18]/20 bg-[#FFFDF9]' : 'border-[#E7E2D8] hover:border-[#D4AF37]/50'
                }`}
              >
                {/* Left Side: Text details */}
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  {/* Optional Pink/Magenta Combo Badge */}
                  {offering.category_badge && (
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#FCE7F3] text-[#BE185D] mb-2 tracking-wide">
                      {offering.category_badge}
                    </span>
                  )}

                  {/* Offering Title */}
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#1E1B4B] leading-snug mb-1">
                    {offering.title}
                  </h3>

                  {/* Multi-temple Sub-pills for Combo Chadhavas */}
                  {offering.sub_pills && offering.sub_pills.length > 0 && (
                    <div className="flex flex-col gap-1.5 my-2">
                      {offering.sub_pills.map((pill, pIdx) => (
                        <div
                          key={pIdx}
                          className="px-2 py-1 rounded-md bg-[#F6F3EC] text-[10px] sm:text-[11px] text-slate-700 font-medium border border-[#E5DFC8] leading-tight"
                        >
                          <strong className="text-[#3E0B18]">{pill.label}</strong>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-slate-600">{pill.temple}</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-slate-500">{pill.date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Offering Sacred Significance Description */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-2.5 line-clamp-3 sm:line-clamp-none">
                    {offering.description}
                  </p>

                  {/* Offering Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-[#15803D]">
                      ₹{offering.price}
                    </span>
                    {offering.popular && (
                      <span className="text-[10px] font-bold text-[#B45309] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Most Popular
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side Column (Matching Reference Screenshot 1:1) */}
                <div
                  className="shrink-0 flex flex-col items-center justify-center gap-2"
                  style={{ width: '84px', minWidth: '84px' }}
                >
                  {/* Thumbnail Box */}
                  <div className="w-[84px] h-[68px] sm:h-[72px] rounded-xl overflow-hidden border border-[#E7E2D8] bg-[#FFFBF2] p-1 flex items-center justify-center shrink-0 shadow-2xs">
                    <img
                      src={offering.image}
                      alt={offering.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {/* Interactive Button: '+ Add' vs '[-] qty [+]' */}
                  <div className="w-[84px]">
                    {!isAdded ? (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(offering.id)}
                        className="w-full py-1.5 px-1 rounded-lg border text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1 active:scale-95"
                        style={{
                          borderColor: '#15803D',
                          color: '#15803D',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <span className="text-sm leading-none">+</span> Add
                      </button>
                    ) : (
                      <div
                        className="w-full py-1 px-1 rounded-lg flex items-center justify-between shadow-2xs"
                        style={{ backgroundColor: '#15803D', color: '#FFFFFF' }}
                      >
                        <button
                          type="button"
                          onClick={() => handleDecrement(offering.id)}
                          className="w-5 h-5 flex items-center justify-center rounded text-sm font-bold cursor-pointer border-0 p-0 text-white"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="text-xs font-bold font-mono px-1 text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrement(offering.id)}
                          className="w-5 h-5 flex items-center justify-center rounded text-sm font-bold cursor-pointer border-0 p-0 text-white"
                          style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Sticky Bottom Cart Summary Bar (Positioned above mobile tab bar, solid background) */}
      {totalItemCount > 0 && (
        <aside
          aria-label="Chadhava Cart Summary"
          className="fixed bottom-[56px] sm:bottom-0 left-0 right-0 z-40 border-t border-[#E7E2D8] shadow-2xl px-4 py-2.5 sm:py-3"
          style={{ backgroundColor: '#FFFDF9' }}
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-semibold">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} selected
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <span>📹</span> 48-72h Video Proof Included
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-slate-400">Total:</span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#3E0B18]">
                  ₹{totalAmount}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSankalpModalOpen(true)}
              className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold bg-[#3E0B18] hover:bg-[#520F20] text-[#FFF9EF] shadow-lg hover:shadow-xl cursor-pointer border-0 transition-all flex items-center gap-2 shrink-0 active:scale-95"
            >
              <span>Proceed to Sankalp (संकल्प)</span>
              <span>➔</span>
            </button>
          </div>
        </aside>
      )}

      {/* 6. Sankalp Devotee Intake Modal (Full Vedic Details & Video Delivery) */}
      {isSankalpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto my-auto p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8]">
            <button
              type="button"
              onClick={() => setIsSankalpModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0 transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>

            {/* Header */}
            <div className="mb-4">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-100 text-[#B45309]">
                🔱 Sacred Garbhagriha Sankalp
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1B4B] mt-1">
                Yajman Sankalp &amp; Video Delivery
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Priests will chant your Name, Gotra &amp; Sankalp wish inside the temple before offering your items.
              </p>
            </div>

            {/* Order Items Recap */}
            <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#EAE3D4] mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-[#3E0B18] mb-1.5">
                <span>Selected Offerings ({totalItemCount} items)</span>
                <span>₹{totalAmount}</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 max-h-24 overflow-y-auto pr-1">
                {selectedOfferingsList.map((item) => (
                  <li key={item.id} className="flex justify-between items-center text-[11px]">
                    <span className="truncate max-w-[320px]">
                      • {item.title} <strong className="text-slate-800">× {item.qty}</strong>
                    </span>
                    <span className="font-semibold text-slate-700">₹{item.lineTotal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Devotee Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-3.5">
              {/* Devotee Full Name */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                  Primary Devotee (Yajman) Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Sharma"
                  value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] outline-none"
                />
              </div>

              {/* Devotee Gotra with "Unknown Gotra" Helper Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#1E1B4B]">
                    Devotee Gotra
                  </label>
                  <button
                    type="button"
                    onClick={handleGotraUnknown}
                    className="text-[11px] font-semibold text-[#B45309] hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    Don't know Gotra? (कश्यप गोत्र)
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Kashyap, Bhardwaj, Vashishtha..."
                  value={gotra}
                  onChange={(e) => setGotra(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] outline-none"
                />
              </div>

              {/* Nakshatra or Rashi (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                    Birth Nakshatra (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rohini, Ashwini, Pushya..."
                    value={nakshatra}
                    onChange={(e) => setNakshatra(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                    WhatsApp Mobile Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit WhatsApp number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Family Members for Sankalp */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                  Family Members Names (for combined family blessings)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sunita (Wife), Aarav (Son), Ananya (Daughter)"
                  value={familyMembers}
                  onChange={(e) => setFamilyMembers(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] outline-none"
                />
              </div>

              {/* Sankalp Purpose / Wish */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                  Sankalp Wish / Focus
                </label>
                <select
                  value={sankalpPurpose}
                  onChange={(e) => setSankalpPurpose(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] outline-none bg-white cursor-pointer"
                >
                  <option value="Dhan & Samriddhi (Enduring Wealth & Abundance)">
                    💰 Dhan &amp; Samriddhi (Enduring Wealth, Business Growth &amp; Debt Relief)
                  </option>
                  <option value="Arogya & Swasthya (Divine Healing & Longevity)">
                    🌿 Arogya &amp; Swasthya (Freedom from Chronic Illness &amp; Good Health)
                  </option>
                  <option value="Karyasiddhi & Success (Job, Career & Exams)">
                    🎯 Karyasiddhi (Success in New Ventures, Job &amp; Competitive Endeavors)
                  </option>
                  <option value="Parivarik Shanti & Dampatya Sukh">
                    🕊️ Parivarik Shanti (Family Harmony, Marriage &amp; Peace of Mind)
                  </option>
                  <option value="Pitra Shanti & Graha Dosha Nivaran">
                    🔱 Pitra Shanti &amp; Planetary Dosha Peace
                  </option>
                </select>
              </div>

              {/* Guarantee Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-start gap-2">
                <span className="text-base shrink-0">🛡️</span>
                <p className="leading-snug">
                  <strong>100% Consecrated Vedic Guarantee:</strong> You will receive a high-definition video of your personalized Sankalp and Garbhagriha Arpan on your WhatsApp (+91 {phone || 'XXXXXXXXXX'}) within 48 to 72 hours.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#3E0B18] hover:bg-[#540F21] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all"
              >
                Confirm Sankalp &amp; Pay ₹{totalAmount}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. Celebration Booking Confirmation Screen */}
      {bookingSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] text-center">
            {/* Sacred Om Symbol */}
            <div className="w-16 h-16 rounded-full bg-amber-100 text-[#3E0B18] mx-auto flex items-center justify-center text-3xl font-serif mb-3 shadow-inner">
              ॐ
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ✓ Sankalp Registered Successfully
            </span>

            <h3 className="font-serif text-2xl font-bold text-[#1E1B4B] mt-2 mb-1">
              Dhanya Bhagya! (धन्य भाग्य)
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Your sacred Chadhava has been queued for the consecrated Garbhagriha ritual.
            </p>

            {/* Receipt Summary Card */}
            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E7DFC9] text-left text-xs text-slate-700 space-y-2 mb-5">
              <div className="flex justify-between border-b border-[#E7DFC9] pb-2">
                <span className="text-slate-500">Booking ID:</span>
                <strong className="font-mono text-[#3E0B18]">{bookingSuccessData.orderId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Yajman Name:</span>
                <strong className="text-[#1E1B4B]">{bookingSuccessData.devoteeName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gotra:</span>
                <span>{bookingSuccessData.gotra}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">WhatsApp Delivery:</span>
                <span className="font-mono text-emerald-700 font-bold">+91 {bookingSuccessData.phone}</span>
              </div>
              <div className="flex justify-between border-t border-[#E7DFC9] pt-2 font-bold text-[#3E0B18] text-sm">
                <span>Total Amount Paid:</span>
                <span>₹{bookingSuccessData.totalAmount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setBookingSuccessData(null);
                  setCart({});
                  navigate('/mandir-seva');
                }}
                className="flex-1 py-3 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs cursor-pointer border-0 shadow-md hover:bg-[#520F20]"
              >
                Back to Mandir Seva
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Sankalp receipt for Booking ID ${bookingSuccessData.orderId} sent to ${bookingSuccessData.phone}.`);
                }}
                className="flex-1 py-3 rounded-xl bg-white text-[#3E0B18] border border-[#E7DFC9] font-bold text-xs cursor-pointer hover:bg-amber-50"
              >
                Download Receipt 📄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
