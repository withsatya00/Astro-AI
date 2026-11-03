import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ALL_ASTROLOGERS } from './astrologersData.js';
import HelpMeChooseModal from './HelpMeChooseModal.jsx';

export default function DirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Astrologer Dataset
  const [astrologers, setAstrologers] = useState(ALL_ASTROLOGERS);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [popularCategory, setPopularCategory] = useState('');
  const [sortBy, setSortBy] = useState('recommended');

  // Pagination & Modals
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Exactly 6 cards per page as in reference design (2 rows of 3 on desktop)

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Bookmarks saved in localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('astro_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem('astro_bookmarks', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Sync with searchParams
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== searchQuery) setSearchQuery(s);
    const spec = searchParams.get('specialty');
    if (spec !== null && spec !== selectedSpecialty) setSelectedSpecialty(spec);
  }, [searchParams]);

  // Filter & Sort Logic
  const filteredAstrologers = useMemo(() => {
    return astrologers.filter((astro) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (astro.name || '').toLowerCase();
        const title = (astro.title || '').toLowerCase();
        const specs = (astro.specialties || []).map((s) => s.toLowerCase());
        const langs = (astro.languages || []).map((l) => l.toLowerCase());
        if (!name.includes(q) && !title.includes(q) && !specs.some((s) => s.includes(q)) && !langs.some((l) => l.includes(q))) {
          return false;
        }
      }

      // 2. Language dropdown
      if (selectedLanguage) {
        const langs = (astro.languages || []).map((l) => l.toLowerCase());
        if (!langs.includes(selectedLanguage.toLowerCase())) return false;
      }

      // 3. Specialty / Expertise dropdown
      if (selectedSpecialty) {
        const specs = (astro.specialties || []).map((s) => s.toLowerCase());
        if (!specs.some((s) => s.includes(selectedSpecialty.toLowerCase()))) return false;
      }

      // 4. Availability dropdown
      if (selectedAvailability) {
        if (selectedAvailability === 'online' && astro.availability !== 'online') return false;
        if (selectedAvailability === 'available_5' && astro.availability !== 'available_5' && astro.availability !== 'online') return false;
      }

      // 5. Experience dropdown
      if (selectedExperience) {
        const exp = Number(astro.experience_years) || 0;
        if (exp < Number(selectedExperience)) return false;
      }

      // 6. Price Range dropdown
      if (selectedPrice) {
        const p = Number(astro.price_per_minute) || 0;
        if (selectedPrice === '35' && p > 35) return false;
        if (selectedPrice === '50' && (p <= 35 || p > 50)) return false;
        if (selectedPrice === '51' && p <= 50) return false;
      }

      // 7. Rating dropdown
      if (selectedRating) {
        const r = Number(astro.rating) || 0;
        if (r < Number(selectedRating)) return false;
      }

      // 8. Popular Category chip
      if (popularCategory) {
        const specs = (astro.specialties || []).map((s) => s.toLowerCase());
        const matchKey = popularCategory.toLowerCase();
        if (!specs.some((s) => s.includes(matchKey) || matchKey.includes(s))) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'top-rated') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === 'experience') return (Number(b.experience_years) || 0) - (Number(a.experience_years) || 0);
      if (sortBy === 'price-low') return (Number(a.price_per_minute) || 0) - (Number(b.price_per_minute) || 0);
      if (sortBy === 'price-high') return (Number(b.price_per_minute) || 0) - (Number(a.price_per_minute) || 0);
      if (sortBy === 'popular') return (Number(b.review_count) || 0) - (Number(a.review_count) || 0);
      // 'recommended' preserves original catalog order (Top 6 exact reference profiles)
      return 0;
    });
  }, [astrologers, searchQuery, selectedLanguage, selectedSpecialty, selectedAvailability, selectedExperience, selectedPrice, selectedRating, popularCategory, sortBy]);

  // Paginated records
  const totalPages = Math.ceil(filteredAstrologers.length / pageSize) || 1;
  const paginatedAstrologers = filteredAstrologers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedLanguage('');
    setSelectedSpecialty('');
    setSelectedAvailability('');
    setSelectedExperience('');
    setSelectedPrice('');
    setSelectedRating('');
    setPopularCategory('');
    setSortBy('recommended');
    setCurrentPage(1);
  };

  const handleStartConsultation = (slug) => {
    navigate(`/consultation/${slug}`);
  };

  const handleStartCall = (slug) => {
    navigate(`/consultation/${slug}?call=true`);
  };

  const handlePopularCategoryClick = (catName) => {
    setPopularCategory(popularCategory === catName ? '' : catName);
    setCurrentPage(1);
  };

  return (
    <div className="directory-page-container bg-[#FAF7F2] min-h-screen pb-16 font-sans w-full max-w-full min-w-0 overflow-x-hidden">
      
      {/* 1. Hero Banner Card */}
      <section className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-2 sm:pb-3 min-w-0">
        <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden bg-gradient-to-r from-[#3E0B18] via-[#2A0510] to-[#1C020A] border border-[#D9A441]/35 shadow-xl min-h-[250px] sm:min-h-[300px] flex items-center w-full min-w-0">
          
          {/* Left Content */}
          <div className="p-5 sm:p-8 md:p-10 z-10 flex flex-col justify-center max-w-[62%] sm:max-w-xl md:max-w-2xl relative min-w-0">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[#D9A441] text-[9.5px] sm:text-xs font-bold tracking-widest uppercase mb-1.5 sm:mb-2">
              <span>VERIFIED</span>
              <span>•</span>
              <span>EXPERIENCED</span>
              <span>•</span>
              <span>TRUSTED</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-[42px] font-bold text-[#FFFDF8] leading-[1.16] mb-2 sm:mb-3">
              Find Your Trusted<br />
              <span className="text-[#FFFDF8]">Vedic Astrologer</span>
            </h1>
            <p className="text-white/80 text-[11px] sm:text-sm leading-relaxed max-w-lg mb-4 sm:mb-6 line-clamp-3 sm:line-clamp-none">
              Consult with experienced and verified astrologers for accurate predictions, personalized remedies and life guidance.
            </p>
            <div>
              <a
                href="#directory-cards-container"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('directory-cards-container')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#F6D382] hover:bg-[#F3C863] text-[#3E0B18] font-bold text-xs sm:text-sm shadow-md transition-transform hover:scale-[1.02] active:scale-95 no-underline cursor-pointer"
              >
                <span className="text-sm sm:text-base">💬</span>
                <span>Talk to an Astrologer →</span>
              </a>
            </div>
          </div>

          {/* Right Artwork extending seamlessly */}
          <div className="absolute right-0 top-0 bottom-0 h-full w-[45%] md:w-1/2 pointer-events-none flex items-center justify-end overflow-hidden">
            <img
              src="/assets/img/astrologers-hero-banner-ref.webp"
              alt="Vedic Astrologer Sage"
              className="h-full w-full object-cover object-left opacity-95 md:opacity-100"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 20%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%)'
              }}
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* 2. Floating Search & Filter Card */}
      <section className="dir-search-container w-full max-w-[1320px] mx-auto px-4 sm:px-6 mb-5 min-w-0">
        <div className="bg-white rounded-2xl border border-[#E8E2D7] shadow-2xs p-4 sm:p-5 flex flex-col gap-3.5 w-full max-w-full min-w-0 overflow-hidden">
          
          {/* Row 1: Search input bar */}
          <div className="flex items-center gap-2.5 bg-white border border-[#D9D0C1] rounded-xl px-4 py-1.5 focus-within:border-[#3E0B18] focus-within:ring-2 focus-within:ring-[#3E0B18]/10 transition-all w-full min-w-0">
            <span className="text-slate-400 text-sm shrink-0">🔍</span>
            <input
              type="text"
              id="dir-page-search-input"
              placeholder="Search astrologer by name, expertise or problem..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full min-w-0 bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 py-1"
              aria-label="Search astrologer"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="text-slate-400 hover:text-slate-700 bg-transparent border-0 cursor-pointer p-1 text-sm shrink-0"
                title="Clear search"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="px-4 sm:px-5 py-2 rounded-xl bg-[#3E0B18] hover:bg-[#520E20] text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-all cursor-pointer border-0 shrink-0"
              aria-label="Submit search"
            >
              <span>🔍</span>
              <span>Search</span>
            </button>
          </div>

          {/* Mobile Filter Toggle Button */}
          <div className="flex lg:hidden items-center justify-between pt-1 w-full min-w-0">
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-[#E8E2D7] bg-white text-slate-700 shadow-2xs cursor-pointer"
            >
              <span>⚙️</span>
              <span>{showMobileFilters ? 'Hide Filters ▲' : 'Show All Filters ▼'}</span>
            </button>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#841833] font-bold hover:underline cursor-pointer bg-transparent border-0"
            >
              🔄 Reset Filters
            </button>
          </div>

          {/* Row 2: 6 Filter Dropdowns + Clear Filters */}
          <div className={`${showMobileFilters ? 'grid grid-cols-2 gap-2' : 'hidden lg:flex'} flex-wrap lg:flex-nowrap items-center gap-2 pt-1 w-full min-w-0`}>
            {/* 1. Language */}
            <select
              value={selectedLanguage}
              onChange={(e) => { setSelectedLanguage(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 h-9.5 bg-white border border-[#D9D0C1] rounded-xl px-2.5 text-xs text-slate-700 font-medium outline-none focus:border-[#3E0B18] cursor-pointer"
            >
              <option value="">🌐 Language</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="English">English</option>
              <option value="Sanskrit">Sanskrit (संस्कृत)</option>
              <option value="Bhojpuri">Bhojpuri</option>
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Gujarati">Gujarati (ગુજરાતી)</option>
              <option value="Bengali">Bengali (বাংলা)</option>
              <option value="Punjabi">Punjabi</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
            </select>

            {/* 2. Expertise */}
            <select
              value={selectedSpecialty}
              onChange={(e) => { setSelectedSpecialty(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 h-9.5 bg-white border border-[#D9D0C1] rounded-xl px-2.5 text-xs text-slate-700 font-medium outline-none focus:border-[#3E0B18] cursor-pointer"
            >
              <option value="">✨ Expertise</option>
              <option value="Vedic Astrology">Vedic Astrology</option>
              <option value="Kundli">Kundli Analysis</option>
              <option value="Marriage">Marriage & Love</option>
              <option value="Career">Career & Business</option>
              <option value="Finance">Finance & Wealth</option>
              <option value="Health">Health & Wellness</option>
              <option value="Vastu">Vastu Shastra</option>
              <option value="Tarot">Tarot Reading</option>
              <option value="Numerology">Numerology</option>
              <option value="Remedies">Vedic Remedies</option>
            </select>

            {/* 3. Availability */}
            <select
              value={selectedAvailability}
              onChange={(e) => { setSelectedAvailability(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 h-9.5 bg-white border border-[#D9D0C1] rounded-xl px-2.5 text-xs text-slate-700 font-medium outline-none focus:border-[#3E0B18] cursor-pointer"
            >
              <option value="">● Availability</option>
              <option value="online">Online Now</option>
              <option value="available_5">Available in 5 min</option>
            </select>

            {/* 4. Experience */}
            <select
              value={selectedExperience}
              onChange={(e) => { setSelectedExperience(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 h-9.5 bg-white border border-[#D9D0C1] rounded-xl px-2.5 text-xs text-slate-700 font-medium outline-none focus:border-[#3E0B18] cursor-pointer"
            >
              <option value="">⏳ Experience</option>
              <option value="5">5+ Years</option>
              <option value="10">10+ Years</option>
              <option value="15">15+ Years</option>
              <option value="20">20+ Years</option>
            </select>

            {/* 5. Price Range */}
            <select
              value={selectedPrice}
              onChange={(e) => { setSelectedPrice(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 h-9.5 bg-white border border-[#D9D0C1] rounded-xl px-2.5 text-xs text-slate-700 font-medium outline-none focus:border-[#3E0B18] cursor-pointer"
            >
              <option value="">₹ Price Range</option>
              <option value="35">Under ₹35/min</option>
              <option value="50">₹35 – ₹50/min</option>
              <option value="51">Above ₹50/min</option>
            </select>

            {/* 6. Rating */}
            <select
              value={selectedRating}
              onChange={(e) => { setSelectedRating(e.target.value); setCurrentPage(1); }}
              className="flex-1 min-w-0 h-9.5 bg-white border border-[#D9D0C1] rounded-xl px-2.5 text-xs text-slate-700 font-medium outline-none focus:border-[#3E0B18] cursor-pointer"
            >
              <option value="">⭐ Rating</option>
              <option value="4.8">4.8 &amp; Above</option>
              <option value="4.5">4.5 &amp; Above</option>
            </select>

            {/* 7. Clear Filters */}
            <button
              type="button"
              onClick={clearAllFilters}
              className="shrink-0 h-9.5 inline-flex items-center justify-center gap-1 px-3.5 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 font-semibold hover:border-[#3E0B18] hover:text-[#3E0B18] transition-colors cursor-pointer bg-transparent whitespace-nowrap"
            >
              <span>🔄</span>
              <span>Clear Filters</span>
            </button>
          </div>

          {/* Row 3: Popular Categories chips */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#F1ECE4] overflow-x-auto scrollbar-none w-full max-w-full min-w-0">
            <span className="text-xs font-bold text-slate-600 shrink-0 mr-1">
              Popular Categories:
            </span>
            {[
              { id: '', label: 'All', icon: '✨' },
              { id: 'Career', label: 'Career', icon: '💼' },
              { id: 'Marriage', label: 'Marriage', icon: '💍' },
              { id: 'Love & Relationship', label: 'Love & Relationship', icon: '❤️' },
              { id: 'Business', label: 'Business', icon: '📊' },
              { id: 'Health', label: 'Health', icon: '🌿' },
              { id: 'Education', label: 'Education', icon: '📖' },
              { id: 'Finance', label: 'Finance', icon: '💰' },
              { id: 'Kundli', label: 'Kundli Analysis', icon: '🪟' },
            ].map((cat) => (
              <button
                key={cat.id || 'all'}
                type="button"
                onClick={() => handlePopularCategoryClick(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  popularCategory === cat.id
                    ? 'bg-[#3E0B18] text-[#FFFDF8] border-[#3E0B18] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#D9A441] hover:bg-[#FFFDF8]'
                }`}
              >
                {cat.icon && <span>{cat.icon}</span>}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Section Heading & Sort Row */}
      <section className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 pt-2 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0" id="directory-cards-container">
        <div>
          <h2 className="font-serif text-2xl sm:text-[28px] font-bold text-[#24040D] tracking-tight">
            Verified Astrologers <span className="text-slate-500 font-sans text-lg font-normal">({filteredAstrologers.length})</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Consult with our top astrologers for personalized guidance, remedies and solutions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-xs font-bold text-slate-600">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
            className="h-9.5 bg-white border border-[#D9D0C1] rounded-xl px-3 text-xs text-slate-700 font-semibold outline-none focus:border-[#3E0B18] cursor-pointer shadow-2xs"
          >
            <option value="recommended">Recommended</option>
            <option value="top-rated">Top Rated</option>
            <option value="experience">Most Experienced</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </section>

      {/* 4. Main 2-Column Content Layout (Cards Grid + Sticky Sidebar) */}
      <section className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 w-full min-w-0">
          
          {/* Left Column: 6 Cards per page (2 rows x 3 columns on desktop, 1 col on mobile) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-between w-full min-w-0">
            {paginatedAstrologers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-[#E8E2D7]">
                <span className="text-4xl block mb-2">🔍</span>
                <h3 className="font-serif text-lg font-bold text-[#24040D] mb-1">No astrologers found</h3>
                <p className="text-xs text-slate-500 mb-4">Try relaxing your search query or filter selections.</p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2 rounded-full bg-[#3E0B18] text-white text-xs font-bold cursor-pointer border-0 shadow-xs"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-4.5 w-full min-w-0" id="directory-page-cards-grid">
                {paginatedAstrologers.map((astro) => {
                  const isBookmarked = bookmarkedIds.includes(astro.id);
                  const isOnline = astro.availability === 'online';

                  return (
                    <article
                      key={astro.id}
                      className="home-ref-astro-card bg-white rounded-2xl border border-[#E8E2D7] p-3.5 sm:p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group w-full min-w-0"
                      data-id={astro.id}
                    >
                      {/* Top Bookmark Ribbon Icon (Positioned Absolute Top-Right) */}
                      <button
                        type="button"
                        onClick={() => toggleBookmark(astro.id)}
                        className={`absolute top-3.5 right-3.5 p-1 cursor-pointer bg-transparent border-0 transition-colors z-10 ${
                          isBookmarked ? 'text-[#D9A441]' : 'text-slate-300 hover:text-[#D9A441]'
                        }`}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark astrologer'}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill={isBookmarked ? '#D9A441' : 'none'} stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>

                      <div>
                        {/* Top Row: Avatar + Details */}
                        <div className="flex items-start gap-2.5 sm:gap-3 mb-2.5 pr-6 min-w-0">
                          {/* Circular Avatar with gold border */}
                          <div
                            className="relative shrink-0 w-12 h-12 cursor-pointer"
                            onClick={() => navigate(`/astrologers/${astro.slug || astro.id}`)}
                          >
                            <img
                              src={astro.avatar || '/assets/portraits/default-avatar.svg'}
                              alt={astro.name}
                              className="w-12 h-12 min-w-[48px] max-w-[48px] min-h-[48px] max-h-[48px] rounded-full object-cover border-2 border-[#D9A441] shadow-2xs"
                              loading="lazy"
                              onError={(e) => {
                                if (!e.currentTarget.dataset.fallbackApplied && astro.fallbackAvatar) {
                                  e.currentTarget.dataset.fallbackApplied = 'true';
                                  e.currentTarget.src = astro.fallbackAvatar;
                                } else {
                                  e.currentTarget.src = '/assets/portraits/default-avatar.svg';
                                }
                              }}
                            />
                          </div>

                          {/* Info Column */}
                          <div className="flex-1 min-w-0">
                            {/* Status badge */}
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-0.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  isOnline
                                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span className={isOnline ? 'text-emerald-700 font-bold' : 'text-slate-600 font-medium'}>
                                {astro.statusLabel || (isOnline ? 'Online' : 'Available in 5 min')}
                              </span>
                            </div>

                            {/* Name */}
                            <h3
                              className="font-serif text-[14.5px] sm:text-[15px] font-bold text-[#24040D] hover:text-[#B45309] truncate cursor-pointer leading-tight"
                              onClick={() => navigate(`/astrologers/${astro.slug || astro.id}`)}
                              title={astro.name}
                            >
                              {astro.name}
                            </h3>

                            {/* Specialties */}
                            <p
                              className="text-[11px] text-slate-500 truncate font-medium mt-0.5"
                              title={(astro.specialties || []).join(', ')}
                            >
                              {(astro.specialties || []).slice(0, 3).join(', ')}
                            </p>

                            {/* Languages */}
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {(astro.languages || ['Hindi', 'English']).slice(0, 3).map((lang, lIdx) => (
                                <span
                                  key={lIdx}
                                  className="bg-[#F3F4F6] text-slate-600 px-1.5 py-0.2 rounded text-[10px] font-medium"
                                >
                                  {lang}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Middle Stats Row: Experience and Rating */}
                        <div className="flex items-center justify-between py-2 border-t border-[#F3EFEA] text-xs text-slate-600 mb-2 min-w-0">
                          <div className="flex items-center gap-1.5 font-medium shrink-0">
                            <span className="text-slate-400">⏳</span>
                            <span>{astro.experience_years}+ Years</span>
                          </div>
                          <div className="flex items-center gap-1 font-bold text-slate-700 shrink-0">
                            <span className="text-amber-500">⭐</span>
                            <span>{astro.rating}</span>
                            <span className="text-slate-400 font-normal">
                              ({(astro.review_count || 1200).toLocaleString()})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Price + Dual Action Buttons */}
                      <div className="pt-2 border-t border-[#F3EFEA] flex items-center justify-between mt-auto w-full min-w-0">
                        <div className="text-[#24040D] font-extrabold text-sm sm:text-base shrink-0">
                          ₹ {astro.price_per_minute}<span className="text-xs font-normal text-slate-500">/min</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartConsultation(astro.slug || astro.id)}
                            className="px-3.5 py-1.5 rounded-full bg-[#3E0B18] hover:bg-[#520E20] text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer border-0"
                          >
                            <span>💬</span>
                            <span>Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartCall(astro.slug || astro.id)}
                            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>📞</span>
                            <span>Call</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-4 min-w-0">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(p - 1, 1));
                    document.getElementById('directory-cards-container')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs hover:border-[#3E0B18] transition-all"
                >
                  ‹ Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCurrentPage(num);
                      document.getElementById('directory-cards-container')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-8 h-8 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                      currentPage === num
                        ? 'bg-[#3E0B18] text-[#F8D882] border-[#3E0B18] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#3E0B18]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(p + 1, totalPages));
                    document.getElementById('directory-cards-container')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 disabled:opacity-40 cursor-pointer shadow-2xs hover:border-[#3E0B18] transition-all"
                >
                  Next ›
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Sidebar Widgets (Hidden on mobile/tablet) */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-5 sticky top-24 self-start">
            
            {/* Widget 1: Why Consult on Astro Jyotish? */}
            <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF5EC] rounded-2xl border border-[#E8DFC9] p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🛡️</span>
                <h3 className="font-serif font-bold text-sm text-[#24040D]">
                  Why Consult on Astro Jyotish?
                </h3>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                  <span>Verified &amp; Experienced Astrologers</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                  <span>Secure &amp; Private Consultations</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                  <span>Accurate &amp; Practical Guidance</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                  <span>Remedies as per Vedic Tradition</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                  <span>24×7 Customer Support</span>
                </li>
              </ul>
            </div>

            {/* Widget 2: New User Offer */}
            <div className="rounded-2xl bg-gradient-to-br from-[#3E0B18] via-[#2A0510] to-[#1C020A] p-5 text-white border border-[#D9A441]/40 shadow-md text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFFDF8]/10 text-[#F6D382] text-[11px] font-bold mb-3 border border-[#F6D382]/30">
                <span>🎁</span>
                <span>New User Offer</span>
              </div>
              <h4 className="font-serif text-base font-bold leading-snug mb-1 text-[#FFFDF8]">
                Get 5 Minutes FREE Consultation
              </h4>
              <p className="text-[11px] text-white/70 mb-4">
                Experience authentic guidance from India's top Vedic scholars.
              </p>
              <button
                type="button"
                onClick={() => navigate('/wallet')}
                className="w-full py-2.5 rounded-xl bg-[#F6D382] hover:bg-[#F3C863] text-[#3E0B18] font-extrabold text-xs shadow-md transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer border-0"
              >
                Claim Now →
              </button>
            </div>

            {/* Optional Help Me Choose Helper Pill */}
            <div className="p-3 bg-[#FFFDF8] border border-[#E8DFC9] rounded-xl text-center">
              <button
                type="button"
                onClick={() => setIsHelpModalOpen(true)}
                className="dir-help-choose-btn text-xs text-[#841833] font-bold hover:underline inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer"
              >
                <span>✦</span>
                <span>Need help choosing an astrologer?</span>
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* 5. Help Me Choose Interactive Modal */}
      <HelpMeChooseModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        astrologers={astrologers}
        onSelectAstrologer={(slug) => {
          setIsHelpModalOpen(false);
          handleStartConsultation(slug);
        }}
      />
    </div>
  );
}
