import React from 'react';
import { Link } from 'react-router-dom';

export default function QuickShortcuts() {
  const services = [
    {
      title: 'Chat Consultation',
      mobileLabel: 'Chat',
      desc: 'Get instant guidance',
      icon: '💬',
      to: '/astrologers',
    },
    {
      title: 'Call Consultation',
      mobileLabel: 'Call',
      desc: 'Talk to astrologers directly',
      icon: '📞',
      to: '/astrologers',
    },
    {
      title: 'Kundli (Birth Chart)',
      mobileLabel: 'Kundli',
      desc: 'Detailed personal analysis',
      icon: '🪟',
      to: '/calculators/kundali-milan',
    },
    {
      title: 'Horoscope',
      mobileLabel: 'Horoscope',
      desc: 'Daily, weekly & monthly predictions',
      icon: '☀️',
      to: '/rashiphal',
    },
    {
      title: 'Mandir Seva',
      mobileLabel: 'Mandir Seva',
      desc: 'Book authentic pujas & rituals',
      icon: '🏛️',
      to: '/mandir-seva',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
      <style>{`
        @media (min-width: 768px) {
          .quick-mobile-row { display: none !important; }
          .quick-desktop-grid { display: grid !important; }
        }
        @media (max-width: 767px) {
          .quick-mobile-row { display: grid !important; }
          .quick-desktop-grid { display: none !important; }
        }
      `}</style>

      {/* Desktop View: 5 Cards Grid */}
      <div className="quick-desktop-grid grid-cols-5 gap-3.5">
        {services.map((item, index) => (
          <Link
            key={index}
            to={item.to}
            className="group bg-white rounded-2xl border border-[#E7E2D8] p-4 shadow-2xs hover:shadow-md hover:border-[#D9A441] transition-all flex flex-col justify-between no-underline active:scale-98 min-h-[125px]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF7F2] border border-[#EADBCA] flex items-center justify-center text-lg">
                {item.icon}
              </div>
              <span className="text-slate-300 group-hover:text-[#B45309] font-bold text-sm transition-colors">
                ›
              </span>
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-[#1E1B4B] group-hover:text-[#B45309] transition-colors mb-0.5">
                {item.title}
              </h3>
              <p className="text-[11.5px] text-slate-500 font-medium leading-snug">
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile View: 5 Circular Shortcut Buttons Row (Exact match to reference) */}
      <div className="quick-mobile-row grid-cols-5 gap-1.5 px-1 py-1">
        {services.map((item, index) => (
          <Link
            key={index}
            to={item.to}
            className="flex flex-col items-center justify-center text-center no-underline active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E7E2D8] shadow-2xs flex items-center justify-center text-xl mb-1.5 hover:border-[#D9A441]">
              {item.icon}
            </div>
            <span className="text-[10px] font-bold text-[#1E1B4B] truncate w-full leading-tight">
              {item.mobileLabel}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
