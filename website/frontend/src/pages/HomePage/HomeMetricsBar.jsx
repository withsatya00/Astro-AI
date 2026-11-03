import React from 'react';

export default function HomeMetricsBar() {
  const metrics = [
    {
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#B45309" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      value: '10L+',
      label: 'Happy Seekers',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#D9A441" stroke="#B45309" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
      value: '4.8/5',
      label: 'Average Rating',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#B45309" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      value: '15+ Years',
      label: 'of Vedic Expertise',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#B45309" strokeWidth="2">
          <path d="M12 2C8 6 4 9 4 14a8 8 0 0 0 16 0c0-5-4-8-8-12z" />
          <path d="M12 12c-2 2-2 4 0 6 2-2 2-4 0-6z" />
        </svg>
      ),
      value: '50K+',
      label: 'Consultations Monthly',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 relative z-20 mb-8">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#EADBCA] shadow-sm py-4 px-4 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#EADBCA]/60">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 justify-center text-left ${idx > 0 ? 'pt-3 sm:pt-0' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#EADBCA] flex items-center justify-center shrink-0">
                {m.icon}
              </div>
              <div>
                <div className="text-base sm:text-lg font-extrabold text-[#3E0B18] leading-tight">
                  {m.value}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  {m.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
