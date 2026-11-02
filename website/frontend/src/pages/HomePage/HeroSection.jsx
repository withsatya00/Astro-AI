import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/astrologers?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/astrologers');
    }
  };

  const handleHowItWorksClick = () => {
    const el = document.getElementById('home-how-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <section className="home-ref-hero-banner" id="hero-section">
        <div className="home-ref-hero-inner">
          <div className="home-ref-hero-left">
            {/* Eyebrow Pill */}
            <div className="home-ref-eyebrow">
              <span>✦ ✦</span>
              <span>ASTRO JYOTISH • AUTHENTIC VEDIC ASTROLOGY &amp; KUNDALI PLATFORM</span>
              <span>✦ ✦</span>
            </div>

            {/* Main Headline */}
            <h1 className="home-ref-hero-title">
              Talk to India's<br />
              Top Vedic Astrologers
            </h1>

            {/* Subtitle */}
            <p className="home-ref-hero-sub">
              Get authentic guidance on career, marriage, health, finance and life's important decisions from experienced Vedic astrologers.
            </p>

            {/* Search Bar with Circular Search Button */}
            <form className="home-ref-search-bar" id="hero-search-form" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                id="hero-search-input"
                className="home-ref-search-input"
                placeholder="Search astrologer or concern..."
                aria-label="Search astrologers, services or topics"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="home-ref-search-circle-btn" title="Search Astrologer" aria-label="Search">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </form>

            {/* Trending Tags */}
            <div className="home-ref-trending-row">
              <span className="home-ref-trending-label">🔥 Trending:</span>
              <Link to="/astrologers?specialty=Career" className="home-ref-trending-pill">Career Growth</Link>
              <Link to="/astrologers?specialty=Marriage" className="home-ref-trending-pill">Marriage &amp; Love</Link>
              <Link to="/astrologers?specialty=Wealth" className="home-ref-trending-pill">Dhan Yog</Link>
              <Link to="/calculators/sade-sati" className="home-ref-trending-pill">Shani Sade Sati</Link>
              <Link to="/calculators/kundali-milan" className="home-ref-trending-pill">Kundli Milan</Link>
            </div>

            {/* Action Buttons */}
            <div className="home-ref-cta-group">
              <Link to="/astrologers" className="home-ref-btn-primary">
                <span>Find an Astrologer</span>
                <span>→</span>
              </Link>
              <button type="button" className="home-ref-btn-secondary cursor-pointer" onClick={handleHowItWorksClick}>
                <span>▶</span>
                <span>How It Works</span>
              </button>
            </div>
          </div>
        </div>

        {/* Integrated 4-Item Trust Stats Strip Docked at Banner Bottom */}
        <div className="home-ref-stats-strip">
          {/* Stat 1: 50,000+ Happy Seekers */}
          <div className="home-ref-stat-col">
            <div className="home-ref-stat-icon-circle">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="home-ref-stat-num">50,000+</div>
              <div className="home-ref-stat-lbl">Happy Seekers</div>
            </div>
          </div>

          {/* Stat 2: 30+ Certified Astrologers */}
          <div className="home-ref-stat-col">
            <div className="home-ref-stat-icon-circle">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <div className="home-ref-stat-num">30+</div>
              <div className="home-ref-stat-lbl">Certified Astrologers</div>
            </div>
          </div>

          {/* Stat 3: 13+ Languages */}
          <div className="home-ref-stat-col">
            <div className="home-ref-stat-icon-circle">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div>
              <div className="home-ref-stat-num">13+</div>
              <div className="home-ref-stat-lbl">Languages</div>
            </div>
          </div>

          {/* Stat 4: 60+ Consultation Areas */}
          <div className="home-ref-stat-col">
            <div className="home-ref-stat-icon-circle">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div>
              <div className="home-ref-stat-num">60+</div>
              <div className="home-ref-stat-lbl">Consultation Areas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Green Verified Pill Directly below Hero Banner */}
      <div className="home-ref-verified-pill-row" id="trust-stats-section">
        <div className="home-ref-verified-pill">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Professional guidance from our 30+ verified astrologers</span>
        </div>
      </div>
    </>
  );
}
