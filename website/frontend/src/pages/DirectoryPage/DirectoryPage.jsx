import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import HelpMeChooseModal from './HelpMeChooseModal.jsx';

const FALLBACK_ASTROLOGERS = [
  {
    id: 'pt-rameshwar-dwivedi',
    slug: 'pt-rameshwar-dwivedi',
    name: 'Pt. Rameshwar Dwivedi',
    title: 'Senior Vedic Jyotish & Karmakand Scholar',
    avatar: '/assets/portraits/pt-rameshwar-dwivedi.jpg',
    fallbackAvatar: '/assets/portraits/pt-rameshwar-dwivedi.svg',
    rating: 4.9,
    review_count: 2140,
    experience_years: 25,
    price_per_minute: 71,
    languages: ['Hindi', 'English', 'Sanskrit'],
    specialties: ['Vedic Astrology', 'Career', 'Business', 'Finance', 'Vastu'],
    availability: 'online',
    gender: 'male',
  },
  {
    id: 'acharya-kn-rao',
    slug: 'acharya-kn-rao',
    name: 'Acharya K.N. Rao Ji',
    title: 'Kundli Expert & Shani Dasha Specialist',
    avatar: '/assets/portraits/acharya-kn-rao.jpg',
    fallbackAvatar: '/assets/portraits/acharya-kn-rao.svg',
    rating: 4.8,
    review_count: 1820,
    experience_years: 18,
    price_per_minute: 61,
    languages: ['Hindi', 'English', 'Gujarati'],
    specialties: ['Kundli Analysis', 'Dasha', 'Career', 'Marriage', 'Vastu'],
    availability: 'online',
    gender: 'male',
  },
  {
    id: 'vidushi-sunita-sharma',
    slug: 'vidushi-sunita-sharma',
    name: 'Vidushi Sunita Sharma',
    title: 'Tarot Grandmaster & Vedic Relationship Guide',
    avatar: '/assets/portraits/vidushi-sunita-sharma.jpg',
    fallbackAvatar: '/assets/portraits/vidushi-sunita-sharma.svg',
    rating: 4.9,
    review_count: 1530,
    experience_years: 15,
    price_per_minute: 51,
    languages: ['Hindi', 'English', 'Punjabi'],
    specialties: ['Tarot Reading', 'Love & Relationship', 'Numerology', 'Marriage'],
    availability: 'online',
    gender: 'female',
  },
  {
    id: 'dr-arvind-mohan',
    slug: 'dr-arvind-mohan',
    name: 'Dr. Arvind Mohan',
    title: 'Medical Astrology & KP System Authority',
    avatar: '/assets/portraits/dr-arvind-mohan.jpg',
    fallbackAvatar: '/assets/portraits/dr-arvind-mohan.svg',
    rating: 4.8,
    review_count: 1250,
    experience_years: 20,
    price_per_minute: 65,
    languages: ['Hindi', 'English', 'Bengali'],
    specialties: ['Health', 'Career', 'Vedic Astrology', 'Remedies'],
    availability: 'online',
    gender: 'male',
  },
  {
    id: 'acharya-vishwanath',
    slug: 'acharya-vishwanath',
    name: 'Acharya Vishwanath',
    title: 'Prashna Kundli & Ratna Jyotish Expert',
    avatar: '/assets/portraits/acharya-vishwanath.jpg',
    fallbackAvatar: '/assets/portraits/acharya-vishwanath.svg',
    rating: 4.9,
    review_count: 2410,
    experience_years: 22,
    price_per_minute: 75,
    languages: ['Hindi', 'Sanskrit', 'Marathi'],
    specialties: ['Vedic Astrology', 'Kundli', 'Gemology', 'Remedies'],
    availability: 'online',
    gender: 'male',
  },
  {
    id: 'vidushi-tarot-aradhana',
    slug: 'vidushi-tarot-aradhana',
    name: 'Vidushi Tarot Aradhana',
    title: 'Intuitive Tarot & Crystal Healing Counselor',
    avatar: '/assets/portraits/vidushi-tarot-aradhana.jpg',
    fallbackAvatar: '/assets/portraits/vidushi-tarot-aradhana.svg',
    rating: 4.7,
    review_count: 980,
    experience_years: 11,
    price_per_minute: 45,
    languages: ['Hindi', 'English'],
    specialties: ['Tarot', 'Love & Relationship', 'Career', 'Education'],
    availability: 'online',
    gender: 'female',
  },
  {
    id: 'pt-harinarayan-mishra',
    slug: 'pt-harinarayan-mishra',
    name: 'Pt. Harinarayan Mishra',
    title: 'Horoscope Specialist & Kaal Sarp Niwaran',
    avatar: '/assets/portraits/pt-harinarayan-mishra.jpg',
    fallbackAvatar: '/assets/portraits/pt-harinarayan-mishra.svg',
    rating: 4.9,
    review_count: 2750,
    experience_years: 27,
    price_per_minute: 70,
    languages: ['Hindi', 'Bhojpuri', 'Sanskrit'],
    specialties: ['Vedic Astrology', 'Remedies', 'Marriage', 'Finance'],
    availability: 'busy',
    gender: 'male',
  },
  {
    id: 'dr-meenakshi-iyer',
    slug: 'dr-meenakshi-iyer',
    name: 'Dr. Meenakshi Iyer',
    title: 'South Indian Vedic Astrology & Prashna Expert',
    avatar: '/assets/portraits/dr-meenakshi-iyer.jpg',
    fallbackAvatar: '/assets/portraits/dr-meenakshi-iyer.svg',
    rating: 4.8,
    review_count: 1420,
    experience_years: 16,
    price_per_minute: 49,
    languages: ['Tamil', 'English', 'Hindi'],
    specialties: ['Kundli Analysis', 'Marriage', 'Career', 'Health'],
    availability: 'online',
    gender: 'female',
  },
  {
    id: 'acharya-raghavendra',
    slug: 'acharya-raghavendra',
    name: 'Acharya Raghavendra Shastri',
    title: 'Mahurat & Vivah Kundli Specialist',
    avatar: '/assets/portraits/acharya-raghavendra.jpg',
    fallbackAvatar: '/assets/portraits/acharya-raghavendra.svg',
    rating: 4.8,
    review_count: 1180,
    experience_years: 19,
    price_per_minute: 55,
    languages: ['Hindi', 'English'],
    specialties: ['Vedic Astrology', 'Marriage', 'Remedies'],
    availability: 'online',
    gender: 'male',
  },
  {
    id: 'vidushi-gayatri-bhatt',
    slug: 'vidushi-gayatri-bhatt',
    name: 'Vidushi Gayatri Bhatt',
    title: 'Lal Kitab & Vastu Shastra Consultant',
    avatar: '/assets/portraits/vidushi-gayatri-bhatt.jpg',
    fallbackAvatar: '/assets/portraits/vidushi-gayatri-bhatt.svg',
    rating: 4.9,
    review_count: 1640,
    experience_years: 14,
    price_per_minute: 58,
    languages: ['Hindi', 'English'],
    specialties: ['Lal Kitab', 'Vastu', 'Finance'],
    availability: 'online',
    gender: 'female',
  },
  {
    id: 'pt-devavrata',
    slug: 'pt-devavrata',
    name: 'Pt. Devavrata Shastri',
    title: 'Nadi Astrology & Past Life Karmic Healer',
    avatar: '/assets/portraits/pt-devavrata.jpg',
    fallbackAvatar: '/assets/portraits/pt-devavrata.svg',
    rating: 4.7,
    review_count: 890,
    experience_years: 13,
    price_per_minute: 48,
    languages: ['Hindi', 'Sanskrit'],
    specialties: ['Nadi Astrology', 'Career', 'Health'],
    availability: 'online',
    gender: 'male',
  },
  {
    id: 'acharya-shastri',
    slug: 'acharya-shastri',
    name: 'Acharya Ram Shastri',
    title: 'Vedic Gemstone & Yantra Specialist',
    avatar: '/assets/portraits/acharya-shastri.jpg',
    fallbackAvatar: '/assets/portraits/acharya-shastri.svg',
    rating: 4.9,
    review_count: 1980,
    experience_years: 21,
    price_per_minute: 68,
    languages: ['Hindi', 'English', 'Marathi'],
    specialties: ['Gemology', 'Vedic Astrology', 'Remedies'],
    availability: 'busy',
    gender: 'male',
  },
];

export default function DirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [astrologers, setAstrologers] = useState(FALLBACK_ASTROLOGERS);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [activeSubtab, setActiveSubtab] = useState('all');
  const [activeConcern, setActiveConcern] = useState('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  const handleToggleVoiceBio = (astroId, e) => {
    e.stopPropagation();
    if (playingVoiceId === astroId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(astroId);
    }
  };
  const pageSize = 8;

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    return (selectedSpecialty ? 1 : 0) +
           (selectedLanguage ? 1 : 0) +
           (selectedPrice ? 1 : 0) +
           (selectedGender !== 'all' ? 1 : 0) +
           (sortBy !== 'popular' ? 1 : 0);
  }, [selectedSpecialty, selectedLanguage, selectedPrice, selectedGender, sortBy]);

  useEffect(() => {
    fetch('/api/v1/astrologers')
      .then((res) => {
        if (!res.ok) return fetch('/api/astrologers');
        return res;
      })
      .then((res) => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.astrologers || data.items);
        if (Array.isArray(list) && list.length > 0) {
          setAstrologers(list);
        }
      })
      .catch(() => {
        // Keep fallback data
      });
  }, []);

  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null && s !== searchQuery) setSearchQuery(s);
    const spec = searchParams.get('specialty');
    if (spec !== null && spec !== selectedSpecialty) setSelectedSpecialty(spec);
  }, [searchParams]);

  const filteredAstrologers = useMemo(() => {
    return astrologers.filter((astro) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (astro.name || '').toLowerCase().includes(q);
        const matchesTitle = (astro.title || '').toLowerCase().includes(q);
        const matchesSpecialties = (astro.specialties || []).some((s) => s.toLowerCase().includes(q));
        const matchesLanguages = (astro.languages || []).some((l) => l.toLowerCase().includes(q));
        if (!matchesName && !matchesTitle && !matchesSpecialties && !matchesLanguages) {
          return false;
        }
      }

      // 2. Specialty dropdown filter
      if (selectedSpecialty) {
        const hasSpec = (astro.specialties || []).some(
          (s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase())
        );
        if (!hasSpec) return false;
      }

      // 3. Language dropdown filter
      if (selectedLanguage) {
        const hasLang = (astro.languages || []).some(
          (l) => l.toLowerCase() === selectedLanguage.toLowerCase()
        );
        if (!hasLang) return false;
      }

      // 4. Price range filter
      if (selectedPrice) {
        const price = Number(astro.price_per_minute) || 0;
        if (selectedPrice === '50' && price > 50) return false;
        if (selectedPrice === '75' && (price <= 50 || price > 75)) return false;
        if (selectedPrice === '100' && price <= 75) return false;
      }

      // 5. Gender filter
      if (selectedGender && selectedGender !== 'all') {
        if (astro.gender !== selectedGender) return false;
      }

      // 6. Quick Concern horizontal chip filter
      if (activeConcern) {
        const hasConcern = (astro.specialties || []).some(
          (s) => s.toLowerCase().includes(activeConcern.toLowerCase())
        );
        if (!hasConcern) return false;
      }

      // 7. Subtabs
      if (activeSubtab === 'top-rated' && (astro.rating || 0) < 4.9) return false;
      if (activeSubtab === 'most-consulted' && (astro.review_count || 0) < 1500) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === 'experience') return (Number(b.experience_years) || 0) - (Number(a.experience_years) || 0);
      if (sortBy === 'price-low') return (Number(a.price_per_minute) || 0) - (Number(b.price_per_minute) || 0);
      if (sortBy === 'price-high') return (Number(b.price_per_minute) || 0) - (Number(a.price_per_minute) || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (Number(b.review_count) || 0) - (Number(a.review_count) || 0);
    });
  }, [astrologers, searchQuery, selectedSpecialty, selectedLanguage, selectedPrice, selectedGender, sortBy, activeSubtab, activeConcern]);

  // Paginated records
  const totalPages = Math.ceil(filteredAstrologers.length / pageSize) || 1;
  const paginatedAstrologers = filteredAstrologers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStartConsultation = (slug) => {
    navigate(`/consultation/${slug}`);
  };

  const handleStartCall = (slug) => {
    navigate(`/consultation/${slug}?call=true`);
  };

  const handleConcernClick = (concern) => {
    setActiveConcern(concern === activeConcern ? '' : concern);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSpecialty('');
    setSelectedLanguage('');
    setSelectedPrice('');
    setSelectedGender('all');
    setSortBy('popular');
    setActiveConcern('');
    setCurrentPage(1);
  };

  return (
    <div className="directory-page-container w-full min-w-0 max-w-full overflow-x-hidden">
      {/* 1. Masthead Unified Banner */}
      <section className="directory-masthead directory-masthead-ref">
        <div className="service-banner service-banner--astrologers">
          <figure className="service-banner__art">
            <img src="/assets/img/astrologers-banner.webp" alt="Vedic Astrologers" fetchPriority="high" />
            <figcaption>Illustrative image</figcaption>
          </figure>
          <div className="mandir-hero__copy service-banner__copy">
            <p className="mandir-hero__eyebrow">ANCIENT WISDOM • MODERN SOLUTIONS</p>
            <h1>Talk to Verified <em>Vedic Astrologers</em></h1>
            <p>
              Get personalised guidance for Love, Career, Marriage, Finance, Health and more. Connect with experienced astrologers in your language.
            </p>
            <div className="shop-hero__actions">
              <a
                href="#directory-page-cards-grid"
                className="shop-btn shop-btn--gold cursor-pointer no-underline"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('directory-page-cards-grid')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Find Astrologer →
              </a>
              <button
                type="button"
                className="shop-btn shop-btn--ghost cursor-pointer"
                onClick={() => setIsHelpModalOpen(true)}
              >
                Help me choose
              </button>
            </div>
          </div>
          <div className="shop-trust service-benefits">
            <div><span>🛡️</span><p><b>100% Verified</b><small>Experienced Astrologers</small></p></div>
            <div><span>🔒</span><p><b>Private &amp; Secure</b><small>Confidential Consultation</small></p></div>
            <div><span>💬</span><p><b>Chat &amp; Call</b><small>Connect in 12+ Languages</small></p></div>
          </div>
        </div>
      </section>

      {/* 2. Search & Filter Controls Card */}
      <section className="dir-search-container">
        {/* Search Input Bar */}
        <div className="dir-search-top-row">
          <div className="dir-search-input-box">
            <span className="dir-search-icon">🔍</span>
            <input
              type="text"
              id="dir-page-search-input"
              placeholder="Search astrologer by name, skill or topic..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search astrologer"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="text-slate-400 hover:text-slate-700 bg-transparent border-0 cursor-pointer p-1 text-sm flex-shrink-0"
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              className="dir-search-submit-btn cursor-pointer"
              onClick={() => setCurrentPage(1)}
              aria-label="Submit search"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Toggle Bar (Mobile & Desktop) */}
        <div className="dir-filter-actions-bar flex items-center justify-between gap-2 pt-1 pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`dir-filter-toggle-btn cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                showFiltersMobile || activeFilterCount > 0
                  ? 'bg-[#3E0B18] text-[#F8D882] border-[#3E0B18]'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-[#3E0B18]'
              }`}
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              aria-expanded={showFiltersMobile}
            >
              <span>⚙️</span>
              <span>Filters &amp; Sort</span>
              {activeFilterCount > 0 && (
                <span className="bg-[#D9A441] text-[#3E0B18] text-[10.5px] font-black px-1.5 py-0.2 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <span className="text-[10px] ml-0.5">{showFiltersMobile ? '▲' : '▼'}</span>
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-[#841833] font-bold hover:underline cursor-pointer bg-transparent border-0 p-1"
              >
                Reset
              </button>
            )}
          </div>

          <button
            type="button"
            className="dir-help-choose-compact-btn cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#FFF9EF] border border-[#E5CE9F] text-[#5A0C20] hover:bg-[#FDF3E3] transition-colors"
            onClick={() => setIsHelpModalOpen(true)}
          >
            <span className="text-[#D9A441]">✦</span>
            <span>Help me choose</span>
          </button>
        </div>

        {/* 5 Filter Dropdowns Row: Collapsible on mobile, visible on desktop */}
        <div className={`dir-dropdowns-wrapper ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>
          <div className="dir-dropdowns-row">
            <select
              id="dir-filter-specialty"
              className="dir-select"
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="All Specialities"
            >
              <option value="">All Specialities</option>
              <option value="Career">Career &amp; Business</option>
              <option value="Marriage">Love &amp; Marriage</option>
              <option value="Kundli">Kundli Analysis</option>
              <option value="Finance">Finance &amp; Wealth</option>
              <option value="Remedies">Vedic Remedies</option>
              <option value="Health">Health &amp; Wellness</option>
              <option value="Education">Education &amp; Studies</option>
            </select>

            <select
              id="dir-filter-language"
              className="dir-select"
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="All Languages"
            >
              <option value="">All Languages</option>
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

            <select
              id="dir-filter-price"
              className="dir-select"
              value={selectedPrice}
              onChange={(e) => {
                setSelectedPrice(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="All Price Range"
            >
              <option value="">All Price Range</option>
              <option value="50">Under ₹50/min</option>
              <option value="75">₹50 – ₹75/min</option>
              <option value="100">Above ₹75/min</option>
            </select>

            <select
              id="dir-filter-gender"
              className="dir-select"
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="All Genders"
            >
              <option value="all">All Genders</option>
              <option value="male">Male Astrologers</option>
              <option value="female">Female Astrologers</option>
            </select>

            <select
              id="dir-filter-sort"
              className="dir-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort By"
            >
              <option value="popular">Sort by Popularity</option>
              <option value="rating">Sort by Rating</option>
              <option value="experience">Sort by Experience</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {/* Horizontal Scrolling Category Concern Pills */}
        <div className="dir-categories-row" id="dir-quick-chips">
          {[
            { id: '', label: 'All', icon: '▦' },
            { id: 'Love', label: 'Love & Relationship', icon: '❤️' },
            { id: 'Marriage', label: 'Marriage', icon: '💍' },
            { id: 'Career', label: 'Career', icon: '💼' },
            { id: 'Finance', label: 'Finance', icon: '🪙' },
            { id: 'Health', label: 'Health', icon: '🌿' },
            { id: 'Kundli', label: 'Kundli', icon: '📜' },
            { id: 'Remedies', label: 'Remedies', icon: '🪔' },
            { id: 'Business', label: 'Business', icon: '📊' },
            { id: 'Education', label: 'Education', icon: '📖' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={`dir-cat-pill cursor-pointer ${activeConcern === chip.id ? 'is-active' : ''}`}
              onClick={() => handleConcernClick(chip.id)}
            >
              <span className="dir-cat-icon">{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Main Directory Content Section */}
      <section className="dir-main-section">
        {/* Section Header */}
        <div className="dir-section-header">
          <div className="dir-section-header-left">
            <div className="dir-sec-eyebrow">
              <span className="dir-moon-icon">🌙</span> OUR ASTROLOGERS
            </div>
            <h2 className="dir-sec-title">
              Find Verified Astrologers <span className="text-sm font-normal text-slate-500">({filteredAstrologers.length})</span>
            </h2>
            <p className="dir-sec-sub">
              Connect with experienced and verified astrologers for accurate guidance and practical solutions.
            </p>
          </div>
          <div className="dir-section-header-right">
            <div className="dir-guidance-seal">
              <div className="dir-seal-sun">☀️</div>
              <div className="dir-seal-text">
                <span>Guidance for a</span>
                <strong>Better Tomorrow</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Subtabs Bar */}
        <div className="dir-subtabs-bar">
          {[
            { id: 'all', label: `All (${filteredAstrologers.length})` },
            { id: 'top-rated', label: '⭐ Top Rated' },
            { id: 'most-consulted', label: '👑 Most Consulted' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`dir-subtab cursor-pointer ${activeSubtab === tab.id ? 'is-active' : ''}`}
              onClick={() => {
                setActiveSubtab(tab.id);
                setCurrentPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2-Column Content Layout (Cards Grid + Sticky Sidebar) */}
        <div className="dir-layout-2col">
          {/* Left Column: Astrologer Cards Grid */}
          <div className="dir-left-grid-col">
            <div className="dir-cards-grid" id="directory-page-cards-grid">
              {paginatedAstrologers.length === 0 ? (
                <div className="col-span-full text-center p-10 bg-white rounded-2xl border border-[#E7E2D8]">
                  <span className="text-3xl block mb-2">🔍</span>
                  <h3 className="font-serif font-bold text-base text-[#1E1B4B] mb-1">No astrologers found</h3>
                  <p className="text-xs text-slate-500 mb-3">Try relaxing your search query or filter selections.</p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#3E0B18] text-white cursor-pointer border-0"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                paginatedAstrologers.map((astro) => (
                  <article key={astro.id} className="home-ref-astro-card bg-white rounded-2xl border border-[#E7E2D8] p-4.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between" data-id={astro.id}>
                    <div>
                      {/* Live Dynamic Status Ribbon */}
                      <div className="mb-2.5">
                        {astro.availability === 'busy' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            In Consultation (Next: ~3 min)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            Available Now (0m wait)
                          </span>
                        )}
                      </div>

                      {/* Top Info with Verified Avatar */}
                      <div className="home-ref-astro-top flex items-center gap-3.5 mb-2.5">
                        <div
                          className="relative w-14 h-14 shrink-0 cursor-pointer"
                          onClick={() => navigate(`/astrologers/${astro.slug || astro.id}`)}
                        >
                          <img
                            src={astro.avatar || '/assets/portraits/default-avatar.svg'}
                            alt={astro.name}
                            className="w-full h-full rounded-full object-cover border-2 border-[#D9A441] shadow-2xs"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              if (!e.currentTarget.dataset.fallbackApplied && astro.fallbackAvatar) {
                                e.currentTarget.dataset.fallbackApplied = 'true';
                                e.currentTarget.src = astro.fallbackAvatar;
                              } else {
                                e.currentTarget.src = '/assets/portraits/default-avatar.svg';
                              }
                            }}
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-blue-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs">
                            ✓
                          </span>
                        </div>
                        <div className="home-ref-astro-info flex-1 min-w-0">
                          <h3
                            className="font-serif text-base font-bold text-[#1E1B4B] hover:text-[#B45309] cursor-pointer truncate"
                            onClick={() => navigate(`/astrologers/${astro.slug || astro.id}`)}
                          >
                            {astro.name}
                          </h3>
                          <p className="text-xs text-slate-500 truncate font-medium">
                            {astro.title || 'Vedic Astrology Scholar'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                            <span className="font-bold text-amber-800 flex items-center gap-1">
                              ★ {astro.rating || '4.8'}
                              <small className="text-slate-400 font-normal">
                                ({astro.review_count || '1.2k'})
                              </small>
                            </span>
                            <span>•</span>
                            <span className="text-slate-500 font-semibold">{astro.experience_years || '15'}+ Yrs</span>
                          </div>
                        </div>
                      </div>

                      {/* 30s Audio Bio Preview Pill */}
                      <div
                        onClick={(e) => handleToggleVoiceBio(astro.id, e)}
                        className="my-2.5 px-3 py-1.5 rounded-xl border border-dashed border-[#D9A441] bg-[#FFFDF8] hover:bg-[#FEF9EE] flex items-center justify-between text-[11.5px] font-semibold text-[#78350F] cursor-pointer transition-all shadow-2xs"
                        title="Click to preview astrologer voice bio"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🎙️</span> {playingVoiceId === astro.id ? 'Playing Voice Sample...' : 'Listen to Voice Bio (30s)'}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <span className={`w-0.5 bg-[#D9A441] rounded-full transition-all ${playingVoiceId === astro.id ? 'h-3 animate-pulse' : 'h-1.5'}`} />
                          <span className={`w-0.5 bg-[#D9A441] rounded-full transition-all ${playingVoiceId === astro.id ? 'h-4 animate-pulse delay-75' : 'h-3'}`} />
                          <span className={`w-0.5 bg-[#D9A441] rounded-full transition-all ${playingVoiceId === astro.id ? 'h-2 animate-pulse delay-150' : 'h-2'}`} />
                          <span className={`w-0.5 bg-[#D9A441] rounded-full transition-all ${playingVoiceId === astro.id ? 'h-4 animate-pulse delay-100' : 'h-3.5'}`} />
                        </div>
                      </div>

                      {/* Specialties & Languages */}
                      <p className="text-xs text-slate-600 line-clamp-1 mb-2 font-medium" title={(astro.specialties || []).join(', ')}>
                        {(astro.specialties || []).slice(0, 4).join(', ')}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {(astro.languages || ['Hindi', 'English']).map((lang, lIdx) => (
                          <span key={lIdx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-medium">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer with Price, Offer, & Dual CTAs */}
                    <div className="pt-3 border-t border-[#F1ECE4] flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <div className="text-base font-extrabold text-[#3E0B18]">
                          ₹{astro.price_per_minute || 51}<small className="text-xs font-normal text-slate-500">/min</small>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700">First 5 Mins Free (FREE5)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F0FDF4] text-[#166534] border border-[#86EFAC] hover:bg-[#DCFCE7] cursor-pointer flex items-center gap-1 transition-all"
                          title={`Call ${astro.name}`}
                          onClick={() => handleStartCall(astro.slug || astro.id)}
                        >
                          <span>📞</span> Call
                        </button>
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#FFF9EF] bg-[#3E0B18] hover:bg-[#5B1324] cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                          onClick={() => handleStartConsultation(astro.slug || astro.id)}
                        >
                          <span>💬</span> Chat
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="dir-pager-container flex items-center justify-center gap-2 mt-6">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  ‹ Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold cursor-pointer border ${
                      currentPage === num
                        ? 'bg-[#3E0B18] text-[#F8D882] border-[#3E0B18]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#3E0B18]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next ›
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Sidebar Widgets (Hidden on small mobile) */}
          <aside className="dir-sidebar-col hidden lg:block">
            {/* Widget 1: Live Consultation Guarantee */}
            <div className="dir-guarantee-card">
              <div className="dir-guarantee-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#D9A441" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="dir-guarantee-title">100% Satisfaction Guarantee</h3>
              <p className="dir-guarantee-desc">
                If you are not satisfied with your consultation, receive a 100% refund into your wallet, no questions asked.
              </p>
              <ul className="dir-guarantee-list">
                <li><span className="dir-guarantee-check">✓</span> Verified Vedic Astrologers</li>
                <li><span className="dir-guarantee-check">✓</span> 100% Private &amp; Confidential</li>
                <li><span className="dir-guarantee-check">✓</span> Instant Live Chat or Audio Call</li>
              </ul>
            </div>

            {/* Widget 2: First Chat Free Offer */}
            <div className="dir-offer-card">
              <div className="dir-offer-badge">SPECIAL OFFER</div>
              <h4 className="dir-offer-title">First 5 Minutes at ₹0</h4>
              <p className="dir-offer-desc">
                Experience authentic guidance from India's leading Vedic scholars with zero risk today.
              </p>
              <Link to="/wallet" className="dir-offer-cta-btn no-underline">
                Recharge Wallet →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Help Me Choose Interactive Modal */}
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
