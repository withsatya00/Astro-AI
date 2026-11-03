import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function FeaturedAstrologers() {
  const navigate = useNavigate();

  const astrologers = [
    {
      id: 'jyotishi-devendra',
      name: 'Acharya Devendra Ji',
      slug: 'jyotishi-devendra',
      avatar: '/assets/portraits/acharya-devendra-ref.jpg',
      specs: 'Vedic Astrology, Kundli, Career',
      rating: '4.9 (12.4K)',
      exp: '18+ Yrs',
      status: 'Online',
    },
    {
      id: 'dr-meera-sharma',
      name: 'Dr. Meera Sharma',
      slug: 'dr-meera-sharma',
      avatar: '/assets/portraits/dr-meera-sharma-ref.jpg',
      specs: 'Marriage, Relationships, Life Path',
      rating: '4.8 (8.9K)',
      exp: '12+ Yrs',
      status: 'Online',
    },
    {
      id: 'acharya-raghavendra',
      name: 'Pandit Raghav Joshi',
      slug: 'acharya-raghavendra',
      avatar: '/assets/portraits/pandit-raghav-ref.jpg',
      specs: 'Finance, Business, Property',
      rating: '4.9 (10.7K)',
      exp: '20+ Yrs',
      status: 'Online',
    },
    {
      id: 'acharya-shastri',
      name: 'Acharya Nitin Trivedi',
      slug: 'acharya-shastri',
      avatar: '/assets/portraits/acharya-nitin-ref.jpg',
      specs: 'Health, Remedies, Vastu',
      rating: '4.8 (6.3K)',
      exp: '15+ Yrs',
      status: 'Online',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1B4B]">
          Featured Astrologers
        </h2>
        <Link
          to="/astrologers"
          className="text-xs sm:text-sm font-bold text-[#3E0B18] hover:text-[#B45309] no-underline flex items-center gap-1 transition-colors"
        >
          View All Astrologers →
        </Link>
      </div>

      {/* Cards Grid: 2 columns on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {astrologers.map((astro) => (
          <article
            key={astro.id}
            onClick={() => navigate(`/consultation/${astro.slug || astro.id}`)}
            className="bg-white rounded-2xl border border-[#E7E2D8] p-3 sm:p-4 shadow-2xs hover:shadow-md hover:border-[#D9A441] transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div>
              {/* Top Row: Avatar & Status */}
              <div className="flex items-start justify-between mb-2.5">
                <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-amber-50 border border-[#EADBCA] shrink-0">
                  <img
                    src={astro.avatar}
                    alt={astro.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{astro.status}</span>
                </div>
              </div>

              {/* Astrologer Name & Verified Tick */}
              <div className="flex items-center gap-1 mb-1">
                <h3 className="font-serif text-xs sm:text-sm font-bold text-[#1E1B4B] group-hover:text-[#B45309] transition-colors truncate">
                  {astro.name}
                </h3>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                  ✓
                </span>
              </div>

              {/* Specialities */}
              <p className="text-[10.5px] sm:text-xs text-slate-500 font-medium line-clamp-1 mb-2.5">
                {astro.specs}
              </p>
            </div>

            {/* Rating & Experience Foot */}
            <div className="pt-2 border-t border-[#F2ECE1] flex items-center justify-between text-[11px] sm:text-xs">
              <span className="font-bold text-[#1E1B4B] flex items-center gap-1">
                <span className="text-amber-500">★</span>
                <span>{astro.rating}</span>
              </span>
              <span className="text-slate-500 font-semibold">{astro.exp}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
