import React from 'react';
import { Link } from 'react-router-dom';

export default function AstroPlusBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12" style={{ width: '100%' }}>
      <div
        className="rounded-3xl p-6 sm:p-8 text-[#FFFDF8] relative overflow-hidden shadow-xl border border-[#D9A441]/40"
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #3E0B18 0%, #20040B 100%)',
        }}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#D9A441]/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-[#D9A441]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 w-full">
          
          {/* Left: Crown, Title & Description */}
          <div className="flex items-center gap-4 text-center md:text-left">
            <div
              className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(217, 164, 65, 0.2)', border: '1px solid rgba(217, 164, 65, 0.5)' }}
            >
              👑
            </div>
            <div>
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#F8D882] tracking-wide mb-0.5">
                Astro Plus
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-[#F1E6D2]">
                Your premium astrology membership
              </p>
              <p className="text-[11px] sm:text-xs text-[#E2D8CC] font-normal hidden sm:block">
                More benefits. Deeper insights. Greater guidance.
              </p>
            </div>
          </div>

          {/* Middle: Perks Row */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 text-center py-2 md:py-0 border-y md:border-y-0 md:border-x border-[#D9A441]/30 px-0 md:px-10 w-full md:w-auto">
            <div className="flex flex-col items-center">
              <span className="text-xl text-[#F8D882] mb-0.5">♾️</span>
              <span className="text-xs font-bold text-[#FFFDF8]">Priority</span>
              <span className="text-[10px] text-slate-300">Consultations</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl text-[#F8D882] mb-0.5">%</span>
              <span className="text-xs font-bold text-[#FFFDF8]">Exclusive</span>
              <span className="text-[10px] text-slate-300">Offers</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl text-[#F8D882] mb-0.5">💎</span>
              <span className="text-xs font-bold text-[#FFFDF8]">Advanced</span>
              <span className="text-[10px] text-slate-300">Reports</span>
            </div>
          </div>

          {/* Right: CTA Button */}
          <div className="shrink-0">
            <Link
              to="/rewards"
              className="px-7 py-3 rounded-full text-xs sm:text-sm font-extrabold shadow-md transition-all flex items-center gap-2 no-underline active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #F8D882 0%, #E5A83B 100%)',
                color: '#3E0B18',
                border: 'none',
              }}
            >
              <span>Explore Astro Plus</span>
              <span>→</span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
