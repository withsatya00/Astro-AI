import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const ALL_PROFILES = [
  {
    id: 'pt-rameshwar-dwivedi',
    slug: 'pt-rameshwar-dwivedi',
    name: 'Pt. Rameshwar Dwivedi',
    name_hi: 'पं. रामेश्वर द्विवेदी',
    title: 'Senior Vedic Jyotish & Karmakand Scholar',
    title_hi: 'वरिष्ठ वैदिक ज्योतिष एवं कर्मकाण्ड मर्मज्ञ',
    avatar: '/assets/portraits/pt-rameshwar-dwivedi.webp',
    fallbackAvatar: '/assets/portraits/pt-rameshwar-dwivedi.jpg',
    rating: 4.9,
    review_count: 2140,
    experience_years: 25,
    price_per_minute: 71,
    languages: ['Hindi', 'English', 'Sanskrit'],
    specialties: ['Vedic Astrology', 'Career Guidance', 'Business & Wealth', 'Kundli Analysis', 'Vastu Shastra'],
    consultations_count: 12500,
    bio: 'Pt. Rameshwar Dwivedi is an internationally renowned Vedic astrologer and Sanskrit scholar with over 25 years of dedicated practice in Parashari Jyotish, Jaimini Sutras, and authentic Karmakand rituals. Having analyzed over 12,000 horoscopes, his precise calculations and sattvic, non-demolition remedies have guided seekers from across 35 countries to success, harmony, and peace.',
  },
  {
    id: 'acharya-kn-rao',
    slug: 'acharya-kn-rao',
    name: 'Acharya K.N. Rao Ji',
    name_hi: 'आचार्य के.एन. राव जी',
    title: 'Kundli Expert & Shani Dasha Specialist',
    avatar: '/assets/portraits/acharya-kn-rao.webp',
    fallbackAvatar: '/assets/portraits/acharya-kn-rao.jpg',
    rating: 4.8,
    review_count: 1820,
    experience_years: 18,
    price_per_minute: 61,
    languages: ['Hindi', 'English', 'Gujarati'],
    specialties: ['Kundli Analysis', 'Shani Sade Sati', 'Career', 'Marriage', 'Vedic Remedies'],
    consultations_count: 9800,
    bio: 'Acharya K.N. Rao Ji brings 18+ years of deep predictive astrological wisdom specializing in Vimshottari Dasha cycles, Gochar transit impacts, and Shani Sade Sati pacification. His guidance is strictly based on traditional Brihat Parashara Hora Shastra.',
  },
  {
    id: 'vidushi-sunita-sharma',
    slug: 'vidushi-sunita-sharma',
    name: 'Vidushi Sunita Sharma',
    name_hi: 'विदुषी सुनीता शर्मा',
    title: 'Tarot Grandmaster & Vedic Relationship Guide',
    avatar: '/assets/portraits/vidushi-sunita-sharma.webp',
    fallbackAvatar: '/assets/portraits/vidushi-sunita-sharma.jpg',
    rating: 4.9,
    review_count: 1530,
    experience_years: 15,
    price_per_minute: 51,
    languages: ['Hindi', 'English', 'Punjabi'],
    specialties: ['Tarot Reading', 'Love & Relationship', 'Numerology', 'Kundli Matching'],
    consultations_count: 8200,
    bio: 'Vidushi Sunita Sharma is a certified Tarot Grandmaster and Vedic counselor known for her empathetic consultations, spiritual relationship guidance, and practical daily gemstone remedies.',
  },
];

export default function ProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('about');
  const [walletBalance, setWalletBalance] = useState('₹0.00');

  // Find matching profile
  const profile =
    ALL_PROFILES.find((p) => p.slug === slug || p.id === slug) || ALL_PROFILES[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.App && window.App.walletBalance !== undefined) {
      setWalletBalance(`₹${Number(window.App.walletBalance).toFixed(2)}`);
    }
  }, [slug]);

  const handleStartConsultation = () => {
    if (window.App && typeof window.App.startConsultationWith === 'function') {
      window.App.startConsultationWith(profile.slug || profile.id);
    } else {
      navigate(`/consultation/${profile.slug || profile.id}`);
    }
  };

  const handleStartCall = () => {
    if (window.App && typeof window.App.startCallWith === 'function') {
      window.App.startCallWith(profile.slug || profile.id);
    } else {
      navigate(`/consultation/${profile.slug || profile.id}`);
    }
  };

  const reviews = [
    {
      name: 'Rohit Sharma',
      stars: '★★★★★',
      time: '2 days ago',
      text: 'Amazing guidance! His predictions about my career transition were 100% on point. The simple daily remedies brought immense clarity.',
    },
    {
      name: 'Priya Verma',
      stars: '★★★★★',
      time: '5 days ago',
      text: 'Extremely patient and gentle scholar. Answered all my questions about marriage matching and dosha remedies thoroughly.',
    },
    {
      name: 'Amit Gupta',
      stars: '★★★★★',
      time: '1 week ago',
      text: 'Felt very positive and grounded after the consultation. Highly recommended for accurate Vedic Kundli analysis.',
    },
    {
      name: 'Neha Singh',
      stars: '★★★★☆',
      time: '2 weeks ago',
      text: 'Gave practical and easy to follow solutions for business stability. Very knowledgeable.',
    },
  ];

  return (
    <div className="pr-page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 1. Breadcrumb Navigation */}
      <nav className="pr-breadcrumb-nav flex items-center gap-2 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-[#4a1b9a] no-underline text-slate-600">Home</Link>
        <span className="pr-sep">›</span>
        <Link to="/astrologers" className="hover:text-[#4a1b9a] no-underline text-slate-600">Astrologers</Link>
        <span className="pr-sep">›</span>
        <span className="pr-curr font-bold text-[#1E1B4B]">{profile.name}</span>
      </nav>

      {/* 2. Main Profile Grid (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        {/* Left Column (lg:col-span-8): Profile Hero & Details */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Profile Hero Card */}
          <section className="pr-hero-banner p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E2D8] shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Portrait */}
              <div className="pr-portrait-outer shrink-0 text-center">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl overflow-hidden border-2 border-[#D9A441] shadow-md mx-auto">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (profile.fallbackAvatar && e.target.src !== profile.fallbackAvatar) {
                        e.target.src = profile.fallbackAvatar;
                      } else {
                        e.target.src = '/assets/portraits/default-avatar.svg';
                      }
                    }}
                  />
                </div>
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wide border border-amber-300">
                  ✔ Verified Expert
                </div>
              </div>

              {/* Info */}
              <div className="pr-profile-details flex-1 text-center sm:text-left">
                <div className="pr-status-line flex items-center justify-center sm:justify-start gap-2 text-xs font-bold mb-2" style={{ color: '#34D399' }}>
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ background: '#34D399' }}></span>
                  <span>ONLINE NOW • AVAILABLE FOR CHAT &amp; CALL</span>
                </div>

                <h1 className="pr-hero-name font-serif text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#FFFDF8' }}>
                  {profile.name}
                </h1>
                <p className="text-xs sm:text-sm font-semibold mb-4" style={{ color: '#EFD4A0' }}>
                  {profile.title}
                </p>

                {/* Specialties Tags */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-5">
                  {profile.specialties.map((spec, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#FFF9EF', border: '1px solid rgba(217, 164, 65, 0.5)' }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl text-center text-xs" style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(217, 164, 65, 0.3)' }}>
                  <div>
                    <span className="block text-[10px]" style={{ color: 'rgba(239, 212, 160, 0.85)' }}>Languages</span>
                    <strong className="text-xs" style={{ color: '#FFFDF8' }}>{profile.languages.join(', ')}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px]" style={{ color: 'rgba(239, 212, 160, 0.85)' }}>Experience</span>
                    <strong className="text-xs" style={{ color: '#FFFDF8' }}>{profile.experience_years}+ Years</strong>
                  </div>
                  <div>
                    <span className="block text-[10px]" style={{ color: 'rgba(239, 212, 160, 0.85)' }}>Consultations</span>
                    <strong className="text-xs" style={{ color: '#FFFDF8' }}>{(profile.consultations_count || 10000).toLocaleString('en-IN')}+</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sticky Sub-navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#E7E2D8] pb-1 overflow-x-auto">
            {[
              { id: 'about', label: 'About & Bio' },
              { id: 'why', label: 'Why Consult' },
              { id: 'reviews', label: `Reviews (${profile.review_count || 2140})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border"
                style={{
                  background: activeTab === tab.id ? '#3E0B18' : '#FFFDF9',
                  color: activeTab === tab.id ? '#FFF9EF' : '#372E2F',
                  borderColor: activeTab === tab.id ? '#3E0B18' : '#E6D2B5',
                  boxShadow: activeTab === tab.id ? '0 2px 6px rgba(62, 11, 24, 0.25)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: About & Bio */}
          {activeTab === 'about' && (
            <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#1E1B4B]">About {profile.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {profile.bio}
              </p>
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800 pt-2">Areas of Expertise:</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <li className="flex items-center gap-2"><span>✦</span> Vedic Birth Chart (Kundli) &amp; Planetary Analysis</li>
                <li className="flex items-center gap-2"><span>✦</span> Career Crossroads, Business Timing &amp; Finance</li>
                <li className="flex items-center gap-2"><span>✦</span> Marriage Matching (Kundli Milan) &amp; Manglik Remedies</li>
                <li className="flex items-center gap-2"><span>✦</span> Shani Sade Sati, Rahu-Ketu Dasha Pacification</li>
              </ul>
            </div>
          )}

          {/* Tab 2: Why Consult */}
          {activeTab === 'why' && (
            <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#1E1B4B]">Why Seek Guidance from {profile.name}?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  '100% Traditional Parashari Vedic Astrology principles',
                  'Practical, non-fear based remedies and gemstone guidance',
                  'Complete confidentiality and safe consultation environment',
                  'Over 12,000+ satisfied seekers across 35 countries',
                  'Accurate timing of events via Vimshottari Dasha & Gochar',
                  'Supportive post-consultation remedy instructions',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/60 border border-amber-200/50">
                    <span className="text-amber-600 font-bold">✔</span>
                    <span className="text-slate-800 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Reviews */}
          {activeTab === 'reviews' && (
            <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1E1B4B]">User Reviews &amp; Ratings</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-amber-500 text-sm">★★★★★</span>
                    <strong className="text-sm text-[#1E1B4B]">{profile.rating} out of 5</strong>
                    <span className="text-xs text-slate-400">({profile.review_count} ratings)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {reviews.map((rev, rIdx) => (
                  <div key={rIdx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <strong className="text-[#1E1B4B] font-bold">{rev.name}</strong>
                      <span className="text-slate-400 text-[11px]">{rev.time}</span>
                    </div>
                    <div className="text-amber-500 text-xs">{rev.stars}</div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (lg:col-span-4): Sticky Consultation Booking Card */}
        <aside className="lg:col-span-4 sticky top-24 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultation Fee</span>
              <div className="text-right">
                <span className="text-2xl font-serif font-bold text-[#3E0B18]">₹{profile.price_per_minute}</span>
                <span className="text-xs text-slate-400">/minute</span>
              </div>
            </div>

            {/* Estimated Sessions */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Session Costs:</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">15 mins</span>
                  <strong className="text-[#1E1B4B]">₹{profile.price_per_minute * 15}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">30 mins</span>
                  <strong className="text-[#1E1B4B]">₹{profile.price_per_minute * 30}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">60 mins</span>
                  <strong className="text-[#1E1B4B]">₹{profile.price_per_minute * 60}</strong>
                </div>
              </div>
            </div>

            {/* Wallet Balance Info */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FFFDF7] border border-[#E7E2D8] text-xs">
              <div className="flex items-center gap-2">
                <span>🪙</span>
                <div>
                  <span className="text-slate-400 block text-[10px]">Your Wallet Balance:</span>
                  <strong className="text-[#B45309] font-bold">{walletBalance}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.App && typeof window.App.openWalletModal === 'function') {
                    window.App.openWalletModal();
                  } else {
                    navigate('/wallet');
                  }
                }}
                className="text-xs font-bold text-[#4a1b9a] hover:underline cursor-pointer bg-transparent border-0"
              >
                + Recharge
              </button>
            </div>

            {/* CTAs */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleStartConsultation}
                className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[#D9A441] to-[#B3832B] hover:brightness-105 text-[#1E1B4B] font-extrabold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
                <span>Start Chat Consultation</span>
              </button>

              <button
                type="button"
                onClick={handleStartCall}
                className="w-full py-3 px-4 rounded-full bg-white hover:bg-[#FAF8F2] border border-[#3E0B18] text-[#3E0B18] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Start Audio Call</span>
              </button>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400">
              🔒 100% Private &amp; Confidential • Money-Back Guarantee
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
