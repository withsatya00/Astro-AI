import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [promoDismissed, setPromoDismissed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mandirDropdownOpen, setMandirDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [isAmbiencePlaying, setIsAmbiencePlaying] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [walletBalance, setWalletBalance] = useState('₹0.00');
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const mandirDropdownRef = useRef(null);
  const toolsDropdownRef = useRef(null);

  useEffect(() => {
    // Check promo bar dismissed status
    try {
      if (sessionStorage.getItem('astro_promo_dismissed') === '1') {
        setPromoDismissed(true);
      }
    } catch (e) {}

    // Check user & wallet from state / localStorage
    const savedBal = localStorage.getItem('astro_wallet_balance');
    if (savedBal !== null) {
      setWalletBalance(`₹${Number(savedBal).toFixed(2)}`);
    } else if (window.App && window.App.walletBalance !== undefined) {
      setWalletBalance(`₹${Number(window.App.walletBalance).toFixed(2)}`);
    }
    if (window.App && window.App.currentUser) {
      setCurrentUser(window.App.currentUser);
    }

    // Wallet balance live event listener
    const handleWalletUpdated = (e) => {
      if (e.detail?.balance !== undefined) {
        setWalletBalance(`₹${Number(e.detail.balance).toFixed(2)}`);
      }
    };
    window.addEventListener('astro:wallet-updated', handleWalletUpdated);

    // Language change listener
    const handleLangChange = (e) => {
      if (e.detail?.language) setCurrentLang(e.detail.language);
    };
    window.addEventListener('astro:languagechange', handleLangChange);

    // Click outside to close dropdowns
    const handleClickOutside = (e) => {
      if (mandirDropdownRef.current && !mandirDropdownRef.current.contains(e.target)) {
        setMandirDropdownOpen(false);
      }
      if (toolsDropdownRef.current && !toolsDropdownRef.current.contains(e.target)) {
        setToolsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('astro:wallet-updated', handleWalletUpdated);
      window.removeEventListener('astro:languagechange', handleLangChange);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Close mobile drawer whenever location changes
  useEffect(() => {
    setMobileDrawerOpen(false);
    setMandirDropdownOpen(false);
    setToolsDropdownOpen(false);
  }, [location.pathname]);

  const handleDismissPromo = () => {
    setPromoDismissed(true);
    try {
      sessionStorage.setItem('astro_promo_dismissed', '1');
    } catch (e) {}
  };

  const handleLanguageChange = (lang) => {
    setCurrentLang(lang);
    if (window.I18n && typeof window.I18n.setLanguage === 'function') {
      window.I18n.setLanguage(lang, true);
    }
  };

  const handleToggleAmbience = () => {
    if (window.App && typeof window.App.toggleVedicAmbience === 'function') {
      const active = window.App.toggleVedicAmbience();
      setIsAmbiencePlaying(!!active);
    } else {
      setIsAmbiencePlaying(!isAmbiencePlaying);
    }
  };

  const handleWalletClick = () => {
    if (window.App && typeof window.App.openWalletModal === 'function') {
      window.App.openWalletModal();
    } else {
      navigate('/wallet');
    }
  };

  const handleAuthClick = (mode = 'login') => {
    if (window.App) {
      if (window.App.currentUser) {
        window.App.openUserAccountModal();
      } else {
        window.App.openAuthModal(mode);
      }
    } else {
      navigate('/profile');
    }
  };

  return (
    <>
      {/* 1. Top Promo Announcement Bar (Exact Match to Reference Design) */}
      {!promoDismissed && (
        <div className="top-promo-bar bg-[#3E0B18] text-[#FFFDF8] text-[12px] py-1.5 px-3 font-semibold shadow-inner flex items-center justify-between z-50 relative overflow-hidden w-full max-w-full border-b border-[#D9A441]/20">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 px-2 sm:px-6 min-w-0">
            {location.pathname.startsWith('/astrologers') ? (
              <>
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <span
                    className="font-extrabold uppercase tracking-wider shrink-0 shadow-xs"
                    style={{
                      background: '#F8D882',
                      color: '#3E0B18',
                      fontSize: '10px',
                      padding: '2px 9px',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    New
                  </span>
                  <span className="truncate block text-xs text-[#FFFDF8] font-medium">
                    Consult Verified Astrologers 24x7 · Chat | Call | Remedies | Kundli
                  </span>
                </div>
                <div className="flex items-center gap-3.5 shrink-0 text-xs text-[#FFFDF8]">
                  <span className="cursor-pointer hover:text-[#F8D882] flex items-center gap-1 font-normal">
                    Download App <span className="text-[13px]">📱</span> <span className="text-[13px]">🍎</span>
                  </span>
                  <span className="text-white/30 hidden sm:inline">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.App && window.App.openContactModal) window.App.openContactModal();
                      else navigate('/help');
                    }}
                    className="cursor-pointer hover:text-[#F8D882] hidden sm:flex items-center gap-1 bg-transparent border-0 text-[#FFFDF8] text-xs font-normal"
                  >
                    🎧 Need Help?
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <span
                    className="font-extrabold uppercase tracking-wider shrink-0"
                    style={{
                      background: '#E5A83B',
                      color: '#3E0B18',
                      fontSize: '10px',
                      padding: '2px 9px',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    OFFER
                  </span>
                  <span className="truncate block text-xs text-[#FFFDF8]">
                    First Consultation Free · Code: <strong className="text-[#FDE68A] font-bold">FIRSTFREE</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate('/astrologers')}
                    className="bg-white text-[#3E0B18] hover:bg-[#FAF7F2] font-extrabold text-[11px] px-3.5 py-1 rounded-full transition-all shadow-xs cursor-pointer shrink-0 border-0 active:scale-95"
                  >
                    Claim now →
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissPromo}
                    className="promo-dismiss text-white/80 hover:text-white text-sm leading-none px-1 cursor-pointer bg-transparent border-0"
                    aria-label="Dismiss offer"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Live Planetary Ephemeris Ticker */}
      {!location.pathname.startsWith('/astrologers') && (
      <div className="ephemeris-ticker-bar bg-[#1E1B4B] text-amber-100 text-[11px] py-1 px-3 border-b border-[#D97706]/30 overflow-hidden relative shadow-xs z-40 select-none w-full max-w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-0">
          <div className="ephemeris-title-tag shrink-0 hidden sm:flex items-center gap-1.5 font-bold text-[#FCD34D] text-[10px] tracking-wider uppercase bg-[#1e0b44] px-2 py-0.5 rounded border border-[#D97706]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>लाहिरी अयनांश 24°10' • ग्रह गोचर</span>
          </div>
          <div className="ephemeris-scroll-container overflow-hidden flex-1 min-w-0 relative">
            <div className="ephemeris-marquee flex items-center gap-6 whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5"><strong className="text-amber-400">☀️ सूर्य:</strong> मेष 14°28' <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">उच्च राशि</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-cyan-300">🌙 चन्द्र:</strong> वृषभ 22°10' <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">रोहिणी नक्षत्र</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-yellow-300">🪐 गुरु:</strong> वृषभ 04°12' <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">शुभ गोचर</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-indigo-300">🪐 शनि:</strong> कुम्भ 18°45' <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold">मूलत्रिकोण</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-rose-400">🔴 मंगल:</strong> कर्क 07°19' <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold">पुनर्वसु</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-emerald-300">☿ बुध:</strong> मेष 28°15'</span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-pink-300">♀ शुक्र:</strong> मीन 19°40' <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">उच्च</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-purple-300">🌪️ राहु:</strong> मीन 11°02' <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">वक्री (R)</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-purple-300">🌪️ केतु:</strong> कन्या 11°02' <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">वक्री (R)</span></span>
              
              {/* Loop repetition */}
              <span className="inline-flex items-center gap-1.5"><strong className="text-amber-400">☀️ सूर्य:</strong> मेष 14°28' <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">उच्च राशि</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-cyan-300">🌙 चन्द्र:</strong> वृषभ 22°10' <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">रोहिणी नक्षत्र</span></span>
              <span className="inline-flex items-center gap-1.5"><strong className="text-yellow-300">🪐 गुरु:</strong> वृषभ 04°12' <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">शुभ गोचर</span></span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 3. Sticky Site Navbar */}
      <header className="site-navbar sticky top-0 z-50 bg-[#FFFDF7]/95 backdrop-blur-md border-b border-[#E7E2D8] shadow-xs w-full max-w-full" id="site-navbar">
        <div className="site-navbar-inner max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3 sm:gap-4 w-full">
          
          {/* Brand Logo */}
          <Link to="/" className="site-brand flex items-center gap-2.5 shrink-0 no-underline">
            <div className="brand-mark shrink-0">
              <img
                src="/assets/brand/logo-mark-v3-96.png"
                srcSet="/assets/brand/logo-mark-v3-96.png 1x, /assets/brand/logo-mark-v3-256.png 2x"
                width="44"
                height="44"
                alt="Astro Jyotish"
                className="brand-mark-img"
                decoding="async"
              />
            </div>
            <div className="site-brand-text flex flex-col">
              <span className="brand-title font-serif font-extrabold text-[15px] sm:text-[17px] leading-tight tracking-tight text-[#1E1B4B]">
                Astro Jyotish
              </span>
              <span className="brand-subtitle text-[8px] sm:text-[8.5px] font-bold text-[#B45309] tracking-wider uppercase leading-tight">
                Guidance Beyond Boundaries
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="site-nav-links items-center gap-5" id="site-nav-links">
            <NavLink
              to="/"
              className={({ isActive }) => `site-nav-link hover:text-[#4a1b9a] transition-colors py-1.5 ${isActive ? 'active text-[#4a1b9a]' : ''}`}
            >
              Home
            </NavLink>

            <NavLink
              to="/astrologers"
              className={({ isActive }) => `site-nav-link hover:text-[#4a1b9a] transition-colors py-1.5 ${isActive ? 'active text-[#4a1b9a]' : ''}`}
            >
              Astrologers
            </NavLink>

            <NavLink
              to="/bhakti"
              className={({ isActive }) => `site-nav-link hover:text-[#4a1b9a] transition-colors py-1.5 flex items-center gap-1.5 font-bold ${isActive ? 'active text-[#4a1b9a]' : ''}`}
            >
              <span aria-hidden="true">🪷</span>
              <span>Bhakti</span>
            </NavLink>

            {/* Mandir Seva Dropdown */}
            <div className="site-nav-dropdown-wrapper relative py-1.5" ref={mandirDropdownRef}>
              <button
                type="button"
                className="site-nav-link flex items-center gap-1.5 hover:text-[#4a1b9a] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  setMandirDropdownOpen(!mandirDropdownOpen);
                  setToolsDropdownOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={mandirDropdownOpen}
              >
                <span>🏛️ Mandir Seva</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Puja
                </span>
                <span className={`dropdown-chevron text-[10px] transition-transform duration-200 ${mandirDropdownOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {mandirDropdownOpen && (
                <div className="nav-dropdown-menu absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-[#E7E2D8] p-2.5 z-50">
                  <div className="px-2 py-1 mb-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 rounded-lg flex items-center gap-1.5">
                    <span>🏛️</span> <span>Mandir Seva</span>
                  </div>
                  <Link
                    to="/mandir-seva/puja"
                    onClick={() => setMandirDropdownOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F2] transition-colors text-slate-800 no-underline group/item"
                  >
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] border-amber-100 flex items-center justify-center text-sm font-bold border group-hover/item:scale-110 transition-transform shrink-0">
                      🛕
                    </span>
                    <div>
                      <span className="font-bold text-xs block text-[#1E1B4B]">Puja</span>
                      <span className="text-[10px] text-slate-500 block">Book a temple puja for you and your family</span>
                    </div>
                  </Link>
                  <Link
                    to="/mandir-seva/chadhava"
                    onClick={() => setMandirDropdownOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F2] transition-colors text-slate-800 no-underline group/item"
                  >
                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-[#4a1b9a] border-purple-100 flex items-center justify-center text-sm font-bold border group-hover/item:scale-110 transition-transform shrink-0">
                      🪔
                    </span>
                    <div>
                      <span className="font-bold text-xs block text-[#1E1B4B]">Chadhava</span>
                      <span className="text-[10px] text-slate-500 block">Explore temple events and listed offerings</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <NavLink
              to="/gau-sewa"
              className={({ isActive }) => `site-nav-link hover:text-[#4a1b9a] transition-colors py-1.5 flex items-center gap-1.5 font-bold ${isActive ? 'active text-[#4a1b9a]' : ''}`}
            >
              <span aria-hidden="true">🐄</span>
              <span>Gau Sewa</span>
            </NavLink>

            <NavLink
              to="/astro-mall"
              className={({ isActive }) => `site-nav-link hover:text-[#4a1b9a] transition-colors py-1.5 flex items-center gap-1.5 group font-bold ${isActive ? 'active text-[#4a1b9a]' : ''}`}
            >
              <span>📿 Astro Mall</span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-300 group-hover:bg-purple-200 transition-colors">
                Siddh
              </span>
            </NavLink>

            {/* Vedic Tools Dropdown */}
            <div className="site-nav-dropdown-wrapper relative py-1.5" ref={toolsDropdownRef}>
              <button
                type="button"
                className="site-nav-link flex items-center gap-1 hover:text-[#4a1b9a] transition-colors cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  setToolsDropdownOpen(!toolsDropdownOpen);
                  setMandirDropdownOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={toolsDropdownOpen}
              >
                <span>🔮 Vedic Tools</span>
                <span className={`dropdown-chevron text-[10px] transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {toolsDropdownOpen && (
                <div className="nav-dropdown-menu nav-dropdown-menu--tools absolute top-full right-0 mt-2 w-80 max-h-[75vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-[#E7E2D8] p-2.5 z-50">
                  <div className="px-2 py-1 mb-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 rounded-lg flex items-center gap-1.5">
                    <span>✨</span> <span>Vedic Astrology Tools</span>
                  </div>
                  <Link
                    to="/rashiphal"
                    onClick={() => setToolsDropdownOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F2] transition-colors text-slate-800 no-underline group/item"
                  >
                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-[#4a1b9a] flex items-center justify-center text-sm font-bold border border-purple-100 group-hover/item:scale-110 transition-transform shrink-0">♈</span>
                    <div>
                      <span className="font-bold text-xs block text-[#1E1B4B]">Daily Horoscope</span>
                      <span className="text-[10px] text-slate-500 block">Predictions for all 12 Zodiac signs</span>
                    </div>
                  </Link>
                  <Link
                    to="/panchang"
                    onClick={() => setToolsDropdownOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F2] transition-colors text-slate-800 no-underline group/item"
                  >
                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center text-sm font-bold border border-amber-100 group-hover/item:scale-110 transition-transform shrink-0">📅</span>
                    <div>
                      <span className="font-bold text-xs block text-[#1E1B4B]">Today's Panchang</span>
                      <span className="text-[10px] text-slate-500 block">Tithi, Nakshatra, Shubh Muhurat &amp; Rahukaal</span>
                    </div>
                  </Link>
                  <Link
                    to="/calculators"
                    onClick={() => setToolsDropdownOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F2] transition-colors text-slate-800 no-underline group/item"
                  >
                    <span className="w-8 h-8 rounded-lg bg-pink-50 text-[#DB2777] flex items-center justify-center text-sm font-bold border border-pink-100 group-hover/item:scale-110 transition-transform shrink-0">💖</span>
                    <div>
                      <span className="font-bold text-xs block text-[#1E1B4B]">Kundli Matching (Gun Milan)</span>
                      <span className="text-[10px] text-slate-500 block">36 Gunas, Ashtakoot &amp; Manglik analysis</span>
                    </div>
                  </Link>
                  <Link
                    to="/calculators"
                    onClick={() => setToolsDropdownOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F2] transition-colors text-slate-800 no-underline group/item"
                  >
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4a1b9a] flex items-center justify-center text-sm font-bold border border-indigo-100 group-hover/item:scale-110 transition-transform shrink-0">🪐</span>
                    <div>
                      <span className="font-bold text-xs block text-[#1E1B4B]">Shani Sade Sati &amp; Dosha</span>
                      <span className="text-[10px] text-slate-500 block">Kaal Sarp, Pitra Dosha &amp; Vedic remedies</span>
                    </div>
                  </Link>
                  <Link
                    to="/calculators"
                    onClick={() => setToolsDropdownOpen(false)}
                    className="nav-tools-toggle flex items-center justify-between p-2 mt-1 rounded-xl bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 font-bold text-xs transition-colors"
                  >
                    <span>View all 17 Vedic Tools</span>
                    <i aria-hidden="true">→</i>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Group */}
          <div className="site-nav-actions flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Vedic Ambience 432Hz Soundscape Toggle Button */}
            <button
              type="button"
              className={`btn-nav-ambience items-center gap-1.5 ${isAmbiencePlaying ? 'bg-amber-200 border-amber-500' : 'bg-[#FFFBEB] border-[#FCD34D]'} border text-[#B45309] font-bold text-xs px-3 py-1.5 rounded-full hover:bg-[#FEF3C7] transition-all cursor-pointer shadow-2xs shrink-0`}
              title="वैदिक वातावरण नाद (432Hz Soundscape Drone)"
              onClick={handleToggleAmbience}
            >
              <span className="text-xs">🕉️</span>
              <span className="text-xs whitespace-nowrap font-bold">432Hz नाद</span>
            </button>

            {/* Language Picker (Desktop) */}
            <div className="global-lang-picker-wrapper items-center gap-1.5 bg-white border border-[#E7E2D8] rounded-full px-3 py-1 text-xs text-[#1E1B4B] shadow-2xs hover:border-[#4a1b9a] transition-all shrink-0">
              <span className="global-lang-icon text-xs">🌐</span>
              <select
                value={currentLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="global-lang-select bg-transparent font-semibold border-none outline-none cursor-pointer text-xs pr-1 text-[#1E1B4B]"
                aria-label="Select Language"
              >
                <option value="en">English (Global)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="sa">संस्कृतम् (Sanskrit)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="gu">ગુજરાતી (Gujarati)</option>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </select>
            </div>

            {/* Wallet Balance Pill */}
            <button
              type="button"
              onClick={handleWalletClick}
              className="btn-nav-wallet inline-flex items-center gap-1.5 bg-[#FFFBEB] border border-[#FCD34D] text-[#B45309] font-bold text-xs px-3 py-1.5 rounded-full hover:bg-[#FEF3C7] transition-all cursor-pointer shadow-2xs shrink-0"
              title="Wallet & Bookings"
            >
              <span className="wallet-icon text-xs">🪙</span>
              <span id="nav-wallet-balance">{walletBalance}</span>
            </button>

            {/* Sign In & Register Buttons */}
            <div className="nav-auth-group items-center gap-2 shrink-0">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => handleAuthClick('profile')}
                  className="btn-nav-auth inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF8F2] border border-[#E7E2D8] hover:border-[#4a1b9a] text-[#1E1B4B] font-semibold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <span>👤</span>
                  <span>{currentUser.name || 'Account'}</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleAuthClick('login')}
                    className="btn-nav-auth inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF8F2] border border-[#E7E2D8] hover:border-[#4a1b9a] text-[#1E1B4B] font-semibold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs shrink-0"
                    title="Sign In"
                  >
                    <span>👤</span>
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuthClick('register')}
                    className="btn-nav-register inline-flex items-center gap-1.5 bg-gradient-to-r from-[#4a1b9a] to-[#1e0b44] hover:from-[#1e0b44] hover:to-[#1e0b44] text-white font-bold text-xs px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-xs hover:shadow-md shrink-0"
                    title="Create Free Account"
                  >
                    <span>✨</span>
                    <span>Register</span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="btn-mobile-menu items-center justify-center w-9 h-9 rounded-xl border border-[#E7E2D8] bg-white hover:bg-[#FAF8F2] text-[#1E1B4B] text-lg font-bold shadow-2xs cursor-pointer shrink-0 transition-colors"
              aria-label="Toggle navigation menu"
              title="Menu"
              onClick={() => setMobileDrawerOpen(true)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* 4. Mobile Slide-Down Navigation Drawer & Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="mobile-nav-backdrop fixed inset-0 bg-black/50 z-50 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <div
        className={`mobile-nav-drawer fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl p-6 transform transition-transform duration-300 flex flex-col justify-between overflow-y-auto ${
          mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        id="mobile-nav-drawer"
      >
        <div>
          <div className="mobile-nav-header flex items-center justify-between pb-4 border-b border-[#E7E2D8] mb-4">
            <div className="mobile-nav-brand flex items-center gap-2 font-serif font-bold text-[#1E1B4B]">
              <div className="brand-mark brand-mark-sm">
                <img
                  src="/assets/brand/logo-mark-v3-96.png"
                  width="32"
                  height="32"
                  alt="Astro Jyotish"
                  className="brand-mark-img"
                  decoding="async"
                />
              </div>
              <span>Astro Jyotish</span>
            </div>
            <button
              type="button"
              className="btn-icon text-gray-500 hover:text-black text-xl p-1 cursor-pointer bg-transparent border-0"
              title="Close Menu"
              onClick={() => setMobileDrawerOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Mobile Language Selector */}
          <div className="mb-4 p-2.5 bg-[#FAF8F2] rounded-xl border border-[#E7E2D8] flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#1E1B4B] flex items-center gap-1.5">
              <span>🌐</span> <span>भाषा / Lang:</span>
            </span>
            <select
              value={currentLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-white border border-[#E7E2D8] rounded-lg px-2 py-1 text-xs font-semibold text-[#1E1B4B] outline-none cursor-pointer"
            >
              <option value="en">English (Global)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="sa">संस्कृतम् (Sanskrit)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="gu">ગુજરાતી (Gujarati)</option>
              <option value="bn">বাংলা (Bengali)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
          </div>

          {/* Mobile Sign In & Register Buttons */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-[#E7E2D8] hover:border-[#4a1b9a] text-[#1E1B4B] font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
              onClick={() => {
                setMobileDrawerOpen(false);
                handleAuthClick('login');
              }}
            >
              <span>👤</span>
              <span>Sign In</span>
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-[#4a1b9a] to-[#1e0b44] text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 cursor-pointer"
              onClick={() => {
                setMobileDrawerOpen(false);
                handleAuthClick('register');
              }}
            >
              <span>✨</span>
              <span>Register</span>
            </button>
          </div>

          {/* Mobile Wallet Balance */}
          <div className="flex items-center justify-between gap-2 p-3 bg-[#FAF8F2] rounded-xl border border-[#E7E2D8] mb-4">
            <div className="flex items-center gap-2">
              <span>🪙</span>
              <span className="text-xs font-bold text-[#B45309]">{walletBalance}</span>
            </div>
            <button
              type="button"
              className="text-xs font-bold text-[#4a1b9a] hover:underline cursor-pointer bg-transparent border-0"
              onClick={() => {
                setMobileDrawerOpen(false);
                handleWalletClick();
              }}
            >
              Recharge
            </button>
          </div>

          {/* Navigation Links in Mobile Drawer */}
          <nav className="mobile-nav-list flex flex-col gap-1.5">
            <Link
              to="/"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>🏠</span> <span>Home</span>
            </Link>
            <Link
              to="/astrologers"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>🔮</span> <span>Astrologers</span>
            </Link>
            <Link
              to="/mandir-seva/puja"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>🛕</span> <span>Puja (मंदिर सेवा)</span>
            </Link>
            <Link
              to="/mandir-seva/chadhava"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>🪔</span> <span>Chadhava (चढ़ावा)</span>
            </Link>
            <Link
              to="/bhakti"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>🪷</span> <span>Bhakti (भक्ति)</span>
            </Link>
            <Link
              to="/gau-sewa"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>🐄</span> <span>Gau Sewa</span>
            </Link>
            <Link
              to="/astro-mall"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>📿</span> <span>Astro Mall (एस्ट्रो मॉल)</span>
            </Link>
            <Link
              to="/rashiphal"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>♈</span> <span>Rashiphal (दैनिक राशिफल)</span>
            </Link>
            <Link
              to="/panchang"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>📅</span> <span>Aaj Ka Panchang</span>
            </Link>
            <Link
              to="/calculators"
              className="mobile-nav-item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#1E1B4B] hover:bg-[#f4eefb] hover:text-[#4a1b9a] transition-colors"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <span>📐</span> <span>Calculators (17 वैदिक साधन)</span>
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-[#E7E2D8] flex items-center justify-between text-xs text-slate-400">
          <span>Astro Jyotish • Vedic Science</span>
          <span>🇮🇳 India</span>
        </div>
      </div>
    </>
  );
}

