import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DEFAULT_ASTROLOGERS = [
  {
    id: 'pt-rameshwar-dwivedi',
    name: 'Pt. Rameshwar Dwivedi',
    avatar: '/assets/portraits/pt-rameshwar-dwivedi.webp',
    fallbackAvatar: '/assets/portraits/pt-rameshwar-dwivedi.jpg',
    status: 'Online',
    rating: 4.9,
    reviews: '2.1k reviews',
    exp: '25+ Years',
    specs: 'Vedic Astrology, Career, Business, Finance, Vastu',
    languages: ['Hindi', 'English', 'Sanskrit'],
    rate: 71,
  },
  {
    id: 'acharya-kn-rao',
    name: 'Acharya K.N. Rao Ji',
    avatar: '/assets/portraits/acharya-kn-rao.webp',
    fallbackAvatar: '/assets/portraits/acharya-kn-rao.jpg',
    status: 'Online',
    rating: 4.8,
    reviews: '1.8k reviews',
    exp: '18+ Years',
    specs: 'Kundli Analysis, Dasha, Career, Marriage, Vastu',
    languages: ['Hindi', 'English', 'Gujarati'],
    rate: 61,
  },
  {
    id: 'vidushi-sunita-sharma',
    name: 'Vidushi Sunita Sharma',
    avatar: '/assets/portraits/vidushi-sunita-sharma.webp',
    fallbackAvatar: '/assets/portraits/vidushi-sunita-sharma.jpg',
    status: 'Online',
    rating: 4.9,
    reviews: '1.5k reviews',
    exp: '15+ Years',
    specs: 'Tarot Reading, Love, Relationship, Numerology',
    languages: ['Hindi', 'English', 'Punjabi'],
    rate: 51,
  },
  {
    id: 'dr-arvind-mohan',
    name: 'Dr. Arvind Mohan',
    avatar: '/assets/portraits/dr-arvind-mohan.webp',
    fallbackAvatar: '/assets/portraits/dr-arvind-mohan.jpg',
    status: 'Online',
    rating: 4.8,
    reviews: '1.2k reviews',
    exp: '20+ Years',
    specs: 'Medical Astrology, Career, KP Astrology',
    languages: ['Hindi', 'English', 'Bengali'],
    rate: 65,
  },
  {
    id: 'acharya-vishwanath',
    name: 'Acharya Vishwanath',
    avatar: '/assets/portraits/acharya-vishwanath.webp',
    fallbackAvatar: '/assets/portraits/acharya-vishwanath.jpg',
    status: 'Online',
    rating: 4.9,
    reviews: '2.4k reviews',
    exp: '22+ Years',
    specs: 'Vedic Astrology, Prashna Kundli, Gemology',
    languages: ['Hindi', 'Sanskrit', 'Marathi'],
    rate: 75,
  },
  {
    id: 'vidushi-tarot-aradhana',
    name: 'Vidushi Tarot Aradhana',
    avatar: '/assets/portraits/vidushi-tarot-aradhana.webp',
    fallbackAvatar: '/assets/portraits/vidushi-tarot-aradhana.jpg',
    status: 'Online',
    rating: 4.7,
    reviews: '980 reviews',
    exp: '11+ Years',
    specs: 'Tarot, Crystal Healing, Relationship, Career',
    languages: ['Hindi', 'English'],
    rate: 45,
  },
];

export default function FeaturedAstrologers() {
  const [favorites, setFavorites] = useState({});
  const navigate = useNavigate();

  const toggleFavorite = (id) => {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartChat = (slug) => {
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

  return (
    <section className="home-ref-astrologers-sec" id="featured-astrologers-section">
      {/* Header with Live Status & View All Link */}
      <div className="home-ref-astrologers-header">
        <div>
          <div className="home-ref-live-pill">
            <span className="home-ref-live-dot"></span>
            <span>Live Astrologer Online Now: 25+ Available</span>
          </div>
          <h2 className="home-ref-section-title">Meet Our Top Vedic Astrologers</h2>
          <p className="home-ref-section-sub">
            Certified, experienced and approachable astrologers with authentic Vedic knowledge, personalized advice and trusted remedies.
          </p>
        </div>
        <Link to="/astrologers" className="home-ref-btn-outline no-underline">
          <span>View All 30+ Astrologers</span>
          <span>→</span>
        </Link>
      </div>

      {/* 3x2 Grid for Top Astrologers */}
      <div className="home-ref-astro-grid" id="home-featured-grid">
        {DEFAULT_ASTROLOGERS.map((astro) => (
          <article key={astro.id} className="home-ref-astro-card" data-id={astro.id}>
            <div className="home-ref-astro-top">
              <div
                className="home-ref-astro-avatar-wrap cursor-pointer"
                onClick={() => navigate(`/astrologers/${astro.id}`)}
              >
                <img
                  src={astro.avatar}
                  alt={astro.name}
                  className="home-ref-astro-avatar"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    if (e.target.src !== astro.fallbackAvatar) {
                      e.target.src = astro.fallbackAvatar;
                    } else {
                      e.target.src = '/assets/portraits/default-avatar.svg';
                    }
                  }}
                />
              </div>
              <div className="home-ref-astro-info">
                <div className="home-ref-astro-status-row">
                  <span className="home-ref-astro-status home-ref-astro-status--online">
                    <span className="home-ref-astro-status-dot"></span> Online
                  </span>
                  <button
                    type="button"
                    className={`home-ref-astro-heart cursor-pointer ${favorites[astro.id] ? 'active text-rose-500' : ''}`}
                    aria-label="Save astrologer"
                    title="Save astrologer"
                    onClick={() => toggleFavorite(astro.id)}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill={favorites[astro.id] ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>
                <h3
                  className="home-ref-astro-name cursor-pointer"
                  onClick={() => navigate(`/astrologers/${astro.id}`)}
                >
                  {astro.name}
                </h3>
              </div>
            </div>

            <div className="home-ref-astro-meta-row">
              <span className="home-ref-astro-rating">
                <span className="home-ref-astro-rating-star">★</span> {astro.rating}{' '}
                <small className="text-slate-400 font-normal">({astro.reviews})</small>
              </span>
              <span>⏱ {astro.exp}</span>
            </div>

            <p className="home-ref-astro-specs" title={astro.specs}>
              {astro.specs}
            </p>

            <div className="home-ref-astro-langs">
              {astro.languages.map((lang, lIdx) => (
                <span key={lIdx} className="home-ref-astro-lang-tag">
                  {lang}
                </span>
              ))}
            </div>

            <div className="home-ref-astro-bottom">
              <div className="home-ref-astro-rate">
                ₹{astro.rate}
                <small>/min</small>
              </div>
              <div className="home-ref-astro-actions">
                <button
                  type="button"
                  className="home-ref-astro-btn-chat cursor-pointer"
                  onClick={() => handleStartChat(astro.id)}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                  <span>Chat</span>
                </button>
                <button
                  type="button"
                  className="home-ref-astro-btn-call cursor-pointer"
                  title={`Call ${astro.name}`}
                  aria-label="Call"
                  onClick={() => handleStartCall(astro.id)}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

