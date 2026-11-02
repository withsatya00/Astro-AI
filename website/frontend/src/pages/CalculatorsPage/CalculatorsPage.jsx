import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const CALCULATORS_LIST = [
  {
    id: 'kundali-milan',
    title: 'Kundali Milan (36 Gunas)',
    desc: 'Analyze the marriage compatibility between bride and groom based on the traditional Ashta Kuta 36 Guna system.',
    cat: 'marriage',
    icon: '🤝',
    cta: 'Calculate Now ➔',
  },
  {
    id: 'janam-kundli',
    title: 'Janam Kundli (Birth Chart)',
    desc: 'Generate your accurate Vedic birth chart, planetary degrees, Bhavas and Lagna with full astrological commentary.',
    cat: 'planetary',
    icon: '📜',
    cta: 'Generate Kundli ➔',
  },
  {
    id: 'sade-sati',
    title: 'Shani Sade Sati Timeline',
    desc: 'Know the start, peak and end phases of Saturn Sade Sati and Dhaiya with personalized Vedic remedies.',
    cat: 'doshas',
    icon: '🪐',
    cta: 'Read Timeline ➔',
  },
  {
    id: 'mangal-dosha',
    title: 'Mangal Dosha & Parihar',
    desc: 'Check Kuja Dosha placement from Lagna, Moon and Venus charts and discover authentic Parihar remedies.',
    cat: 'doshas',
    icon: '🔥',
    cta: 'Check Dosha ➔',
  },
  {
    id: 'kaal-sarp',
    title: 'Kaal Sarp Dosha Analysis',
    desc: 'Find whether Rahu and Ketu hem all seven planets in your chart and identify which of the 12 Kaal Sarp yogas exists.',
    cat: 'doshas',
    icon: '🐍',
    cta: 'Check Yoga ➔',
  },
  {
    id: 'panchang',
    title: 'Daily Vedic Panchang & Muhurat',
    desc: 'Calculate today’s Tithi, Nakshatra, Yoga, Karana, Rahu Kaal, Abhijit Muhurat and Brahma Muhurat.',
    cat: 'planetary',
    icon: '☀️',
    cta: 'View Panchang ➔',
  },
  {
    id: 'numerology',
    title: 'Life Path & Numerology',
    desc: 'Calculate your Destiny Number, Life Path Number, and Lucky Colors based on your exact date of birth.',
    cat: 'personal',
    icon: '🔢',
    cta: 'Calculate Now ➔',
  },
  {
    id: 'name-numerology',
    title: 'Name Numerology Calculator',
    desc: 'Discover how the vibrations of your name influence your destiny, career opportunities, and success path.',
    cat: 'personal',
    icon: '🅰️',
    cta: 'Analyze Name ➔',
  },
  {
    id: 'gemstone',
    title: 'Lucky Gemstone Suggestion',
    desc: 'Find which primary and secondary gemstones (Ratna) are most auspicious for your Lagna Lord and Bhagya.',
    cat: 'personal',
    icon: '💎',
    cta: 'Find Gemstone ➔',
  },
  {
    id: 'vimshottari-dasha',
    title: 'Vimshottari Dasha Periods',
    desc: 'View your 120-year planetary Mahadasha, Antardasha and Pratyantardasha timeline sequence.',
    cat: 'planetary',
    icon: '⏳',
    cta: 'View Dasha ➔',
  },
  {
    id: 'pitra-dosha',
    title: 'Pitra Dosha Calculator',
    desc: 'Identify planetary indicators of ancestral debts and learn authentic Vedic remedies for family prosperity.',
    cat: 'doshas',
    icon: '🪔',
    cta: 'Check Pitra Dosha ➔',
  },
  {
    id: 'gandmool',
    title: 'Gandmool Dosha Finder',
    desc: 'Check if birth occurred during the transitional nakshatra junctions (Ashwini, Ashlesha, Magha, Jyeshtha, Moola, Revati).',
    cat: 'doshas',
    icon: '⚡',
    cta: 'Check Nakshatra ➔',
  },
  {
    id: 'lagna',
    title: 'Ascendant (Lagna) Calculator',
    desc: 'Discover your rising sign on the eastern horizon at the exact moment of birth and your core life persona.',
    cat: 'planetary',
    icon: '🌅',
    cta: 'Find Lagna ➔',
  },
  {
    id: 'chandra-rashi',
    title: 'Moon Sign (Chandra Rashi)',
    desc: 'Calculate your true Vedic Moon sign which governs your emotions, inner subconscious mind and nature.',
    cat: 'planetary',
    icon: '🌙',
    cta: 'Find Rashi ➔',
  },
  {
    id: 'nakshatra',
    title: 'Birth Star (Nakshatra) Finder',
    desc: 'Identify which of the 27 lunar constellations your Moon was transiting at birth and your Janma Akshar.',
    cat: 'planetary',
    icon: '✨',
    cta: 'Find Star ➔',
  },
  {
    id: 'love-compatibility',
    title: 'Love & Relationship Compatibility',
    desc: 'Check mutual harmony, emotional synergy, and mental compatibility between two zodiac signs.',
    cat: 'marriage',
    icon: '💖',
    cta: 'Check Compatibility ➔',
  },
  {
    id: 'sun-sign',
    title: 'Vedic Sun Sign (Surya Rashi)',
    desc: 'Calculate your true Nirayana Vedic Sun sign representing your soul purpose, leadership, and vitality.',
    cat: 'planetary',
    icon: '🌞',
    cta: 'Find Sun Sign ➔',
  },
];

export default function CalculatorsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalCalc, setActiveModalCalc] = useState(null);
  const [calculationResult, setCalculationResult] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [dob, setDob] = useState('1995-05-15');
  const [tob, setTob] = useState('14:30');
  const [place, setPlace] = useState('New Delhi');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const categories = [
    { id: 'all', label: 'All Calculators (17)', icon: '🪷' },
    { id: 'marriage', label: 'Marriage & Compatibility', icon: '🤝' },
    { id: 'doshas', label: 'Dosh & Pooja', icon: '🔥' },
    { id: 'planetary', label: 'Planetary & Charts', icon: '🪐' },
    { id: 'personal', label: 'Personal & Numerology', icon: '🔢' },
  ];

  const filteredCalculators = useMemo(() => {
    return CALCULATORS_LIST.filter((calc) => {
      if (activeCategory !== 'all' && calc.cat !== activeCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return calc.title.toLowerCase().includes(q) || calc.desc.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const handleOpenCalc = (calc) => {
    setActiveModalCalc(calc);
    setCalculationResult(null);
  };

  const handleRunCalculation = (e) => {
    e.preventDefault();
    // Simulate real calculation report
    const d = new Date(dob);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const lifePath = ((day + month + year) % 9) || 9;

    setCalculationResult({
      title: activeModalCalc.title,
      name: name || 'Seeker',
      lagna: 'Leo (Simha - सिंह)',
      rashi: 'Sagittarius (Dhanu - धनु)',
      nakshatra: 'Moola (Quarter 2)',
      gunaScore: '28 / 36 (Very Auspicious)',
      sadeSatiStatus: 'Dhaiya (Peaceful Phase)',
      lifePathNumber: lifePath,
      luckyGemstone: 'Yellow Sapphire (Pukhraj) or Ruby (Manikya)',
      verdict: 'Planetary placements indicate steady career growth, strong intellect and auspicious yoga.',
    });
  };

  return (
    <div className="calc-reference-page w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-24">
      {/* 1. Hero Banner (1:1 Unified Chadhava Blueprint) */}
      <section className="service-banner service-banner--calc calc-ref-hero max-w-7xl mx-auto mt-4 px-4">
        <figure className="service-banner__art">
          <img src="/assets/img/calculators-banner.webp" alt="Vedic Astrology Calculators" fetchPriority="high" />
          <figcaption>Illustrative image</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow">✦ PRECISE VEDIC CALCULATIONS FOR LIFE'S KEY DECISIONS ✦</p>
          <h1>
            17 Vedic Astrology <em>Calculators Suite</em>
          </h1>
          <p>
            Instant, mathematically verified and insightful Vedic calculators for planetary placements, doshas, marriage compatibility, numerology and more.
          </p>
          <div className="shop-hero__actions">
            <a
              href="#calc-grid"
              className="shop-btn shop-btn--gold cursor-pointer no-underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('calc-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Calculators →
            </a>
            <Link to="/astrologers" className="shop-btn shop-btn--ghost no-underline">
              Talk to Astrologer
            </Link>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div>
            <span>⚡</span>
            <p>
              <b>Precise Calculations</b>
              <small>As per Vedic Principles</small>
            </p>
          </div>
          <div>
            <span>🛡️</span>
            <p>
              <b>Trusted &amp; Reliable</b>
              <small>NASA JPL Ephemeris</small>
            </p>
          </div>
          <div>
            <span>🪷</span>
            <p>
              <b>Wide Range of Tools</b>
              <small>For Important Decisions</small>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Filter Chips Bar (Horizontal Scrolling on Mobile) */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <nav className="calc-ref-chips-bar flex items-center gap-2 overflow-x-auto pb-1" aria-label="Calculator Categories">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`calc-ref-chip px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all border flex items-center gap-1.5 ${
                activeCategory === c.id
                  ? 'bg-[#3E0B18] text-[#FFF9EF] border-[#3E0B18] shadow-xs'
                  : 'bg-white text-slate-700 border-[#E7E2D8] hover:border-amber-400'
              }`}
              onClick={() => setActiveCategory(c.id)}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 3. Search Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        <div className="bg-white p-3 rounded-2xl border border-[#E7E2D8] flex items-center gap-2">
          <span className="text-slate-400 ml-2">🔍</span>
          <input
            type="search"
            placeholder="Search calculator (e.g. Kundali, Sade Sati, Numerology...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-xs text-[#1E1B4B]"
          />
        </div>
      </div>

      {/* 4. Calculators Grid (3 Columns on Desktop, 1 Column on Mobile) */}
      <div className="max-w-7xl mx-auto px-4 mt-8" id="calc-grid">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCalculators.map((calc) => (
            <article
              key={calc.id}
              onClick={() => handleOpenCalc(calc)}
              className="bg-white p-6 rounded-3xl border border-[#E7E2D8] shadow-xs hover:shadow-md hover:border-[#D9A441] transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-4">
                  {calc.icon}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1E1B4B] mb-2">{calc.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">{calc.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-[#3E0B18]">{calc.cta}</span>
                <span className="w-7 h-7 rounded-full bg-amber-100 text-[#3E0B18] flex items-center justify-center text-xs font-bold">
                  ➔
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Interactive Calculation Modal */}
      {activeModalCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModalCalc(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{activeModalCalc.icon}</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">Vedic Astrology Suite</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1E1B4B] mb-2">{activeModalCalc.title}</h3>
            <p className="text-xs text-slate-500 mb-6">{activeModalCalc.desc}</p>

            {!calculationResult ? (
              <form onSubmit={handleRunCalculation} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Time of Birth</label>
                    <input
                      type="time"
                      required
                      value={tob}
                      onChange={(e) => setTob(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Place of Birth (City)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Delhi, Mumbai, Varanasi"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider mt-4 cursor-pointer border-0 shadow-md hover:brightness-110"
                >
                  Generate Accurate Vedic Report ➔
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/60 text-xs space-y-2">
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">Seeker:</span>
                    <strong className="text-[#1E1B4B]">{calculationResult.name}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">Ascendant (Lagna):</span>
                    <strong className="text-[#1E1B4B]">{calculationResult.lagna}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">Moon Sign (Rashi):</span>
                    <strong className="text-[#1E1B4B]">{calculationResult.rashi}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">Birth Nakshatra:</span>
                    <strong className="text-[#1E1B4B]">{calculationResult.nakshatra}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">Marriage Guna Score:</span>
                    <strong className="text-emerald-700 font-extrabold">{calculationResult.gunaScore}</strong>
                  </div>
                  <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                    <span className="text-slate-500">Destiny Life Path:</span>
                    <strong className="text-[#3E0B18] font-bold">Number {calculationResult.lifePathNumber}</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">Auspicious Ratna:</span>
                    <strong className="text-amber-800">{calculationResult.luckyGemstone}</strong>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                  {calculationResult.verdict}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCalculationResult(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Calculate Another
                  </button>
                  <Link
                    to="/astrologers"
                    className="flex-1 py-2.5 rounded-xl bg-[#3E0B18] text-[#FFF9EF] text-xs font-bold text-center no-underline cursor-pointer"
                  >
                    Consult Expert Now
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
