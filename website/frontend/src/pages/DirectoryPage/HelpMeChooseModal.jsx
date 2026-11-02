import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HelpMeChooseModal({ isOpen, onClose, astrologers = [] }) {
  const [concern, setConcern] = useState('Career');
  const [preferredLang, setPreferredLang] = useState('Hindi');
  const [recommended, setRecommended] = useState(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleFindMatch = (e) => {
    e.preventDefault();
    // Filter matching astrologers based on concern and language
    const matches = astrologers.filter((a) => {
      const specs = (a.specialties || []).map((s) => s.toLowerCase()).join(' ');
      const langs = (a.languages || []).map((l) => l.toLowerCase()).join(' ');
      const matchConcern = specs.includes(concern.toLowerCase()) || specs.includes('vedic');
      const matchLang = langs.includes(preferredLang.toLowerCase());
      return matchConcern && matchLang;
    });

    const topPick = matches.length > 0 ? matches.slice(0, 2) : astrologers.slice(0, 2);
    setRecommended(topPick);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] overflow-hidden"
        style={{ animation: 'fadeInScale 0.2s ease-out' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="help-modal-close-btn w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0"
          style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#D9A441]">
          <span>✦</span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">Smart Astrologer Match</span>
        </div>
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1B4B] mb-2">
          Help Me Choose the Right Astrologer
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Tell us your primary life concern and language. Our Vedic matching algorithm will recommend the most suitable expert.
        </p>

        {!recommended ? (
          <form onSubmit={handleFindMatch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] mb-1.5">
                What is your main concern?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Career', 'Marriage', 'Finance', 'Health', 'Kundli', 'Remedies'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setConcern(c)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      concern === c
                        ? 'bg-[#3E0B18] text-[#FFF9EF] border-[#3E0B18] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#4a1b9a]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] mb-1.5">
                Preferred Consultation Language:
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-[#1E1B4B] outline-none"
              >
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="English">English</option>
                <option value="Sanskrit">Sanskrit (संस्कृत)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-4 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#1E1B4B] shadow-md hover:brightness-105 transition-all cursor-pointer border-0"
            >
              Find My Best Match →
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Recommended For You:</h4>
            {recommended.map((ast) => (
              <div
                key={ast.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-200 bg-amber-50/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={ast.avatar || '/assets/portraits/default-avatar.svg'}
                    alt={ast.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#D9A441] shrink-0"
                    onError={(e) => {
                      e.target.src = '/assets/portraits/default-avatar.svg';
                    }}
                  />
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm text-[#1E1B4B] truncate">{ast.name}</h5>
                    <p className="text-[11px] text-slate-500 truncate">{ast.title || (ast.specialties || []).join(', ')}</p>
                    <span className="text-[10px] font-bold text-[#B45309]">★ {ast.rating || '4.9'} • ₹{ast.price_per_minute || 51}/min</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/astrologers/${ast.slug || ast.id}`);
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#3E0B18] text-white hover:bg-[#5B1024] transition-colors shrink-0 cursor-pointer border-0 ml-2"
                >
                  Consult →
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRecommended(null)}
              className="w-full text-center text-xs text-slate-500 hover:text-black mt-2 underline cursor-pointer bg-transparent border-0"
            >
              ← Change criteria
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
