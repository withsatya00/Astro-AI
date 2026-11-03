import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-[#FAF7F2] pt-6 pb-10 lg:pt-10 lg:pb-14 overflow-hidden border-b border-[#EADBCA]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Subtitle, CTAs & Trust Badges */}
          <div className="lg:col-span-7 flex flex-col justify-center text-center lg:text-left">
            {/* Eyebrow with decorative gold lines */}
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 mb-3.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#8C6538]">
              <span className="w-6 sm:w-10 h-[1.5px] bg-[#D9A441]" />
              <span>VEDIC ASTROLOGY FOR MODERN LIFE</span>
              <span className="w-6 sm:w-10 h-[1.5px] bg-[#D9A441]" />
            </div>

            {/* Main Headline (Exact match to reference) */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] xl:text-[62px] font-bold tracking-tight text-[#3E0B18] leading-[1.12] mb-4">
              Ancient wisdom.<br />
              <span className="text-[#C88A2C]">Personal guidance.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-[#4A4543] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal mb-6">
              Consult trusted, experienced Vedic astrologers for clarity on life, relationships, career, health and more.
            </p>

            {/* Action Buttons Row */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-6">
              <Link
                to="/astrologers"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold text-[#FFFDF8] bg-[#3E0B18] hover:bg-[#5B1324] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 no-underline active:scale-98"
              >
                <span>Consult an Astrologer</span>
                <span className="text-sm">→</span>
              </Link>
              <Link
                to="/calculators/kundali-milan"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full text-xs sm:text-sm font-bold text-[#3E0B18] bg-[#FFFDF8] border border-[#D9A441] hover:bg-[#FAF3E6] shadow-xs transition-all flex items-center justify-center gap-2 no-underline active:scale-98"
              >
                <span className="text-sm">🪟</span>
                <span>Create Free Kundli</span>
              </Link>
            </div>

            {/* Mobile-Only Sage Artwork (shown between CTA and Trust badges on small screens) */}
            <div className="block lg:hidden my-6">
              <div className="relative mx-auto w-full max-w-[360px] aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-[#EADBCA] bg-[#FFFDF8]">
                <img
                  src="/assets/img/vedic-sage-hero.webp"
                  alt="Vedic Astrology Scholar"
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            </div>

            {/* Trust Badges Strip (3 Items with Green Icons) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-5 text-[11.5px] sm:text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                <span>Verified Astrologers</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-700 text-xs">🔒</span>
                <span>Private &amp; Secure</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-600 text-xs">★</span>
                <span>Trusted by 10L+ Users</span>
              </div>
            </div>
          </div>

          {/* Right Column: Desktop Sage Artwork */}
          <div className="hidden lg:flex lg:col-span-5 items-center justify-center">
            <div className="relative w-full max-w-[490px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#EADBCA]/70 bg-gradient-to-b from-[#FAF3E6] to-[#FAF7F2]">
              <img
                src="/assets/img/vedic-sage-hero.webp"
                alt="Vedic Astrology Scholar & Sage"
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-102"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
