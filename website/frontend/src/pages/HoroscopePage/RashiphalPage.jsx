import React from 'react';
import PanchangAndHoroscope from '../HomePage/PanchangAndHoroscope.jsx';

export default function RashiphalPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] py-8">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E0B18]">Daily Rashifal (दैनिक राशिफल)</h1>
        <p className="text-xs sm:text-sm text-slate-600">Daily planetary transits, lucky numbers, colors, and astrological advice for all 12 signs.</p>
      </div>
      <PanchangAndHoroscope />
    </div>
  );
}
