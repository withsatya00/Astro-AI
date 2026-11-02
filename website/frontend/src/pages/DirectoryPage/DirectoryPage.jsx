import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import HelpMeChooseModal from './HelpMeChooseModal.jsx';

const FALLBACK_ASTROLOGERS = [
  {
    id: 'pt-rameshwar-dwivedi',
    slug: 'pt-rameshwar-dwivedi',
    name: 'Pt. Rameshwar Dwivedi',
    title: 'Senior Vedic Jyotish & Karmakand Scholar',
    avatar: '/assets/portraits/pt-rameshwar-dwivedi.webp',
    fallbackAvatar: '/assets/portraits/pt-rameshwar-dwivedi.jpg',
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
    avatar: '/assets/portraits/acharya-kn-rao.webp',
    fallbackAvatar: '/assets/portraits/acharya-kn-rao.jpg',
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
    avatar: '/assets/portraits/vidushi-sunita-sharma.webp',
    fallbackAvatar: '/assets/portraits/vidushi-sunita-sharma.jpg',
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
    avatar: '/assets/portraits/dr-arvind-mohan.webp',
    fallbackAvatar: '/assets/portraits/dr-arvind-mohan.jpg',
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
    avatar: '/assets/portraits/acharya-vishwanath.webp',
    fallbackAvatar: '/assets/portraits/acharya-vishwanath.jpg',
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
    avatar: '/assets/portraits/vidushi-tarot-aradhana.webp',
    fallbackAvatar: '/assets/portraits/vidushi-tarot-aradhana.jpg',
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
    avatar: '/assets/portraits/pt-harinarayan-mishra.webp',
    fallbackAvatar: '/assets/portraits/pt-harinarayan-mishra.jpg',
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
    avatar: '/assets/portraits/dr-meenakshi-iyer.webp',
    fallbackAvatar: '/assets/portraits/dr-meenakshi-iyer.jpg',
    rating: 4.8,
    review_count: 1420,
    experience_years: 16,
    price_per_minute: 49,
    languages: ['Tamil', 'English', 'Hindi'],
    specialties: ['Kundli Analysis', 'Marriage', 'Career', 'Health'],
    availability: 'online',
    gender: 'female',
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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Fetch astrologers from API
  useEffect(() => {
    fetch('/api/v1/astrologers')
      .then((res) => {
        if (!res.ok) throw new Error('API fetch error');
        return res.json();
      })
      .then((data) => {
        const items = data.items || data.astrologers || data;
        if (Array.isArray(items) && items.length > 0) {
          setAstrologers(items);
        }
      })
      .catch(() => {
        // Fallback already pre-set
      });
  }, []);

  // Sync URL search params
  useEffect(() => {
    const q = searchParams.get('search');
    const spec = searchParams.get('specialty');
    if (q !== null && q !== searchQuery) setSearchQuery(q);
    if (spec !== null && spec !== selectedSpecialty) setSelectedSpecialty(spec);
  }, [searchParams]);

  // Filter and sort astrologers
  const filteredAstrologers = useMemo(() => {
    return astrologers.filter((astro) => {
      // 1. Search text
      if (searchQuery.trim()) {
        const text = `${astro.name} ${astro.title || ''} ${(astro.specialties || []).join(' ')} ${(astro.languages || []).join(' ')}`.toLowerCase();
        if (!text.includes(searchQuery.toLowerCase())) return false;
      }

      // 2. Specialty Dropdown
      if (selectedSpecialty) {
        const specs = (astro.specialties || []).map((s) => s.toLowerCase());
        const match = specs.some((s) => s.includes(selectedSpecialty.toLowerCase()));
        if (!match) return false;
      }

      // 3. Language Dropdown
      if (selectedLanguage) {
        const langs = (astro.languages || []).map((l) => l.toLowerCase());
        if (!langs.includes(selectedLanguage.toLowerCase())) return false;
      }

      // 4. Price Dropdown
      if (selectedPrice) {
        const rate = Number(astro.price_per_minute) || 0;
        if (selectedPrice === '50' && rate > 50) return false;
        if (selectedPrice === '75' && (rate <= 50 || rate > 75)) return false;
        if (selectedPrice === '100' && rate <= 75) return false;
      }

      // 5. Gender Dropdown
      if (selectedGender !== 'all' && astro.gender) {
        if (astro.gender.toLowerCase() !== selectedGender.toLowerCase()) return false;
      }

      // 6. Category Chip
      if (activeConcern) {
        const specs = (astro.specialties || []).map((s) => s.toLowerCase());
        const match = specs.some((s) => s.includes(activeConcern.toLowerCase()));
        if (!match) return false;
      }

      // 7. Subtab
      if (activeSubtab === 'top-rated' && Number(astro.rating) < 4.8) return false;
      if (activeSubtab === 'most-consulted' && (Number(astro.review_count) || 0) < 1500) return false;

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
    if (window.App && typeof window.App.startConsultationWith === 'function') {
      window.App.startConsultationWith(slug);
    } else {
      navigate(`/astrologers/${slug}`);
    }
  };

  const handleStartCall = (slug) => {
    if (window.App && typeof window.App.startCallWith === 'function') {
      window.App.startCallWith(slug);
    } else {
      navigate(`/astrologers/${slug}`);
    }
  };

  const handleConcernClick = (concern) => {
    setActiveConcern(concern === activeConcern ? '' : concern);
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
        {/* Row 1: Search input + Help choose button */}
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
            <button
              type="button"
              className="dir-search-submit-btn cursor-pointer"
              onClick={() => setCurrentPage(1)}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search</span>
            </button>
          </div>

          <button
            type="button"
            className="dir-help-choose-btn cursor-pointer"
            onClick={() => setIsHelpModalOpen(true)}
          >
            <span className="dir-sparkle">✦</span>
            <span className="dir-help-text">
              <strong>I'm not sure</strong>
              <small>Help me choose →</small>
            </span>
          </button>
        </div>

        {/* Row 2: 5 Filter Dropdowns */}
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

        {/* Row 3: Horizontal Scrolling Category Concern Pills */}
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
            <h2 className="dir-sec-title">Find the Right Astrologer for Your Concern</h2>
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
            { id: 'all', label: `All Astrologers (${filteredAstrologers.length})` },
            { id: 'top-rated', label: '⭐ Top Rated' },
            { id: 'most-consulted', label: '👑 Most Consulted' },
            { id: 'new', label: '🌟 New Astrologers' },
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
                <div className="col-span-2 text-center p-12 bg-white rounded-3xl border border-[#E7E2D8]">
                  <span className="text-4xl block mb-3">🔍</span>
                  <h3 className="font-serif font-bold text-lg text-[#1E1B4B] mb-1">No astrologers found</h3>
                  <p className="text-xs text-slate-500 mb-4">Try relaxing your search query or filter selections.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSpecialty('');
                      setSelectedLanguage('');
                      setSelectedPrice('');
                      setSelectedGender('all');
                      setActiveConcern('');
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#3E0B18] text-white cursor-pointer border-0"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                paginatedAstrologers.map((astro) => (
                  <article key={astro.id} className="home-ref-astro-card" data-id={astro.id}>
                    <div className="home-ref-astro-top">
                      <div
                        className="home-ref-astro-avatar-wrap cursor-pointer"
                        onClick={() => navigate(`/astrologers/${astro.slug || astro.id}`)}
                      >
                        <img
                          src={astro.avatar || '/assets/portraits/default-avatar.svg'}
                          alt={astro.name}
                          className="home-ref-astro-avatar"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            if (astro.fallbackAvatar && e.target.src !== astro.fallbackAvatar) {
                              e.target.src = astro.fallbackAvatar;
                            } else {
                              e.target.src = '/assets/portraits/default-avatar.svg';
                            }
                          }}
                        />
                      </div>
                      <div className="home-ref-astro-info">
                        <div className="home-ref-astro-status-row">
                          <span
                            className={`home-ref-astro-status ${
                              astro.availability === 'busy' ? 'home-ref-astro-status--busy' : 'home-ref-astro-status--online'
                            }`}
                          >
                            <span className="home-ref-astro-status-dot"></span>
                            {astro.availability === 'busy' ? 'Busy' : 'Online'}
                          </span>
                        </div>
                        <h3
                          className="home-ref-astro-name cursor-pointer"
                          onClick={() => navigate(`/astrologers/${astro.slug || astro.id}`)}
                        >
                          {astro.name}
                        </h3>
                      </div>
                    </div>

                    <div className="home-ref-astro-meta-row">
                      <span className="home-ref-astro-rating">
                        <span className="home-ref-astro-rating-star">★</span> {astro.rating || '4.8'}{' '}
                        <small className="text-slate-400 font-normal">
                          ({astro.review_count || '1.2k'} reviews)
                        </small>
                      </span>
                      <span>⏱ {astro.experience_years || '15'}+ Years</span>
                    </div>

                    <p className="home-ref-astro-specs" title={(astro.specialties || []).join(', ')}>
                      {(astro.specialties || []).slice(0, 5).join(', ')}
                    </p>

                    <div className="home-ref-astro-langs">
                      {(astro.languages || ['Hindi', 'English']).map((lang, lIdx) => (
                        <span key={lIdx} className="home-ref-astro-lang-tag">
                          {lang}
                        </span>
                      ))}
                    </div>

                    <div className="home-ref-astro-bottom">
                      <div className="home-ref-astro-rate">
                        ₹{astro.price_per_minute || 51}
                        <small>/min</small>
                      </div>
                      <div className="home-ref-astro-actions">
                        <button
                          type="button"
                          className="home-ref-astro-btn-chat cursor-pointer"
                          onClick={() => handleStartConsultation(astro.slug || astro.id)}
                        >
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
                          </svg>
                          <span>Chat</span>
                        </button>
                        <button
                          type="button"
                          className="home-ref-astro-btn-call cursor-pointer"
                          title={`Call ${astro.name}`}
                          aria-label="Call"
                          onClick={() => handleStartCall(astro.slug || astro.id)}
                        >
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="dir-pager-container flex items-center justify-center gap-2 mt-8">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  ‹ Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      currentPage === num
                        ? 'bg-[#3E0B18] text-white border-[#3E0B18]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#4a1b9a]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next ›
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Sidebar */}
          <aside className="dir-sidebar-col">
            {/* Card 1: Om Guidance Card */}
            <div className="dir-sidebar-guidance-card">
              <div className="dir-guidance-mandala-ornament">
                <div className="dir-om-badge">
                  <span className="dir-om-symbol">ॐ</span>
                </div>
              </div>
              <h3 className="dir-guidance-heading">
                Get Personalised<br />Astrology Guidance
              </h3>
              <p className="dir-guidance-desc">
                Talk to verified astrologers and find solutions to your life's deepest questions.
              </p>
              <button
                type="button"
                className="dir-guidance-cta-btn cursor-pointer"
                onClick={() => setIsHelpModalOpen(true)}
              >
                <span>Start a Consultation</span>
                <span className="dir-arrow">→</span>
              </button>
            </div>

            {/* Card 2: Most Consulted Astrologers Ranking */}
            <div className="dir-sidebar-ranking-card">
              <div className="dir-ranking-header">
                <div className="dir-ranking-title-wrap">
                  <span className="dir-ranking-star">⭐</span>
                  <h3 className="dir-ranking-title">Most Consulted Astrologers</h3>
                </div>
                <a
                  href="#directory-page-cards-grid"
                  className="dir-view-all-link"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSubtab('most-consulted');
                  }}
                >
                  View All →
                </a>
              </div>
              <div className="dir-ranking-list" id="dir-ranking-list">
                {astrologers.slice(0, 5).map((exp, rankIdx) => (
                  <Link
                    key={exp.id}
                    to={`/astrologers/${exp.slug || exp.id}`}
                    className="dir-expert-row no-underline"
                  >
                    <span className="dir-rank-num">{rankIdx + 1}</span>
                    <img
                      src={exp.avatar || '/assets/portraits/default-avatar.svg'}
                      alt={exp.name}
                      className="dir-rank-img"
                      onError={(e) => {
                        e.target.src = '/assets/portraits/default-avatar.svg';
                      }}
                    />
                    <div className="dir-rank-info">
                      <strong>{exp.name}</strong>
                      <div className="dir-rank-meta">★ {exp.rating || '4.9'} • {exp.review_count || '2.1k'}</div>
                      <span className="dir-rank-status dir-status-online">● Online</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Card 3: First Consultation at ₹1 Offer */}
            <div className="dir-sidebar-offer-card">
              <div className="dir-offer-top">
                <span className="dir-offer-gift">🎁</span>
                <h4 className="dir-offer-heading">First Consultation<br />at Just ₹0</h4>
              </div>
              <p className="dir-offer-desc">
                Talk to verified astrologers at an exclusive introductory price with code <b>FIRSTFREE</b>.
              </p>
              <button
                type="button"
                className="dir-offer-cta-btn cursor-pointer"
                onClick={() => {
                  if (window.App && typeof window.App.openWalletModal === 'function') {
                    window.App.openWalletModal();
                  } else {
                    navigate('/wallet');
                  }
                }}
              >
                Claim Offer →
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* Help Me Choose Questionnaire Modal */}
      <HelpMeChooseModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        astrologers={astrologers}
      />
    </div>
  );
}
