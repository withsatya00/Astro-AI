import React, { useState, useEffect } from 'react';

const PURPOSES = [
  {
    id: 'chaara',
    title: 'Daily Green Fodder Seva (नित्य हरा चारा)',
    desc: 'Nutritious fresh green grass, jaggery and bran for cows at our registered gaushala.',
    photo: '/assets/img/gausewa/cow-calf.webp',
  },
  {
    id: 'chikitsa',
    title: 'Medical Care & Rehabilitation (चिकित्सा सेवा)',
    desc: 'Medicines, bandages and round-the-clock veterinary treatment for injured and aged cows.',
    photo: '/assets/img/gausewa/gau-shelter.webp',
  },
  {
    id: 'monthly',
    title: 'Monthly Cow Adoption (मासिक गौ सेवा)',
    desc: 'Sponsor the complete food, shelter and medical care of a cow for an entire month.',
    photo: '/assets/img/gausewa/cow-calf.webp',
  },
];

const PRESET_AMOUNTS = [251, 501, 1100, 2100, 5100];

export default function GauSewaPage() {
  const [selectedPurpose, setSelectedPurpose] = useState('chaara');
  const [selectedAmount, setSelectedAmount] = useState(501);
  const [customAmount, setCustomAmount] = useState('');
  const [devoteeName, setDevoteeName] = useState('');
  const [devoteePhone, setDevoteePhone] = useState('');
  const [gotra, setGotra] = useState('');
  const [sankalpOccasion, setSankalpOccasion] = useState('General Blessing');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const effectiveAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      receiptNo: `GS-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      name: devoteeName || 'Anonymous Devotee',
      phone: devoteePhone,
      gotra: gotra || 'Kashyap',
      amount: effectiveAmount,
      purpose: PURPOSES.find((p) => p.id === selectedPurpose)?.title || 'Daily Green Fodder',
      occasion: sankalpOccasion,
    };
    setReceiptData(data);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="gs-reference-page w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-20">
      {/* 1. Hero Banner */}
      <header className="service-banner service-banner--gausewa gs-ref-hero max-w-7xl mx-auto mt-4 px-4">
        <figure className="service-banner__art">
          <img src="/assets/img/gau-sewa-hero-v2.webp" alt="Gau Seva Cow and Calf" fetchPriority="high" />
          <figcaption>Illustrative image</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow">✦ GAU SEVA – SACRED COW PROTECTION ✦</p>
          <h1>
            A little kindness, <em>A lifetime of care.</em>
          </h1>
          <p>
            Bring Gau Seva into your life. Your contribution directly supports the daily nourishment, medical care, and lifelong shelter of sacred cows at our registered gaushala.
          </p>
          <div className="shop-hero__actions">
            <a
              href="#gs-donation-form"
              className="shop-btn shop-btn--gold cursor-pointer no-underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('gs-donation-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Donate Now →
            </a>
            <a
              href="#gs-updates-section"
              className="shop-btn shop-btn--ghost cursor-pointer no-underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('gs-updates-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Gaushala Updates
            </a>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div>
            <span>🛡️</span>
            <p>
              <b>100% Transparent</b>
              <small>Verified daily seva</small>
            </p>
          </div>
          <div>
            <span>🪷</span>
            <p>
              <b>Registered Gaushala</b>
              <small>Lifelong protection</small>
            </p>
          </div>
          <div>
            <span>📜</span>
            <p>
              <b>Digital Receipt</b>
              <small>Instant donation receipt</small>
            </p>
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid (Two Columns on Desktop) */}
      <div className="max-w-7xl mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Seva Purposes and Thoughtful Guide */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#B45309] mb-1">
              AN OFFERING FOR THE SELFLESS
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">
              Your kindness, their everyday care
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Choose a Gau Seva option that resonates with your devotion. Each contribution supports fresh green fodder, veterinary care, and clean shelter.
            </p>
          </div>

          {/* 3 Seva Cards */}
          <div className="space-y-3">
            {PURPOSES.map((p) => {
              const isSelected = selectedPurpose === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPurpose(p.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                    isSelected ? 'bg-amber-50/80 border-[#3E0B18] shadow-md ring-1 ring-[#3E0B18]' : 'bg-white border-[#E7E2D8] hover:border-amber-300'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-amber-200">
                    <img src={p.photo} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-sm font-bold text-[#1E1B4B] mb-1">{p.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-[#3E0B18] bg-[#3E0B18]' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* How Seva Works */}
          <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#1E1B4B] mb-4 flex items-center gap-2">
              <span>✦</span> A Thoughtful Way to Give
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3E0B18] text-[#FFF9EF] flex items-center justify-center font-bold shrink-0">1</span>
                <div>
                  <strong className="text-[#1E1B4B] block text-xs">Select your seva purpose</strong>
                  <p className="text-slate-500">Pick green fodder, medication, or monthly care.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3E0B18] text-[#FFF9EF] flex items-center justify-center font-bold shrink-0">2</span>
                <div>
                  <strong className="text-[#1E1B4B] block text-xs">Choose what feels right</strong>
                  <p className="text-slate-500">Contribute any amount according to your devotion.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3E0B18] text-[#FFF9EF] flex items-center justify-center font-bold shrink-0">3</span>
                <div>
                  <strong className="text-[#1E1B4B] block text-xs">Receive digital receipt &amp; blessings</strong>
                  <p className="text-slate-500">Get an instant verified receipt with sankalp details.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Donation Form */}
        <div className="lg:col-span-5" id="gs-donation-form">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E2D8] shadow-lg sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">GAU SEVA DANA</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">100% Tax Deductible</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1E1B4B] mb-2">Sacred Donation</h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter devotee details for the sacred sankalp and digital certificate.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1.5">Select Amount (₹)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2">
                  {PRESET_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        selectedAmount === amt && !customAmount
                          ? 'bg-[#3E0B18] text-white border-[#3E0B18]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Or enter custom amount in ₹"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                />
              </div>

              {/* Devotee Info */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Devotee (Yajman) Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] mb-1">WhatsApp Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={devoteePhone}
                    onChange={(e) => setDevoteePhone(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Gotra (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Kashyap"
                    value={gotra}
                    onChange={(e) => setGotra(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Sankalp Occasion</label>
                <select
                  value={sankalpOccasion}
                  onChange={(e) => setSankalpOccasion(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white outline-none"
                >
                  <option value="General Blessing">Family Health &amp; General Blessing (सुख-समृद्धि)</option>
                  <option value="Birthday">Birthday Celebration (जन्मदिन)</option>
                  <option value="Anniversary">Wedding Anniversary (विवाह वर्षगांठ)</option>
                  <option value="Ancestral">Pitru Shanti &amp; Punya (पितृ शांति)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#1E1B4B] font-extrabold text-xs uppercase tracking-wider mt-4 cursor-pointer border-0 shadow-md hover:brightness-105"
              >
                Donate ₹{effectiveAmount} with Sankalp →
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 3. Gaushala Updates Section */}
      <div className="max-w-7xl mx-auto px-4 mt-16" id="gs-updates-section">
        <h3 className="font-serif text-xl font-bold text-[#1E1B4B] mb-6 text-center">
          Recent Gaushala Care &amp; Seva Updates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              title: 'Morning Fresh Fodder Distribution',
              date: 'Today, 7:30 AM',
              desc: 'Over 250 kg of nutritious green grass and jaggery provided to all 85 mother cows.',
              img: '/assets/img/gausewa/cow-calf.webp',
            },
            {
              title: 'Routine Veterinary Health Checkup',
              date: 'Yesterday, 3:00 PM',
              desc: 'Veterinary doctor completed health checkups and administered vitamins to calves.',
              img: '/assets/img/gausewa/gau-shelter.webp',
            },
            {
              title: 'Shelter Winter Protection Upgrades',
              date: '2 Nov 2026',
              desc: 'Clean straw bedding and windbreakers installed to ensure cozy shelter.',
              img: '/assets/img/gausewa/cow-calf.webp',
            },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white border border-[#E7E2D8] shadow-xs">
              <div className="h-40 rounded-xl overflow-hidden mb-3 bg-slate-100">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-amber-700 font-bold block mb-1">{item.date}</span>
              <h4 className="font-serif text-sm font-bold text-[#1E1B4B] mb-1">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Digital Receipt Modal */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8]">
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0"
            >
              ✕
            </button>
            <div className="text-center mb-4">
              <span className="text-3xl block mb-1">🙏</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">Gau Seva Dana</span>
              <h3 className="font-serif text-xl font-bold text-[#1E1B4B]">Donation Receipt</h3>
              <p className="text-xs text-slate-500">Thank you for your sacred contribution!</p>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 space-y-2 text-xs">
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Receipt No:</span>
                <strong className="text-[#1E1B4B]">{receiptData.receiptNo}</strong>
              </div>
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Date:</span>
                <strong className="text-[#1E1B4B]">{receiptData.date}</strong>
              </div>
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Yajman Name:</span>
                <strong className="text-[#1E1B4B]">{receiptData.name}</strong>
              </div>
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Gotra:</span>
                <strong className="text-[#1E1B4B]">{receiptData.gotra}</strong>
              </div>
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Seva Purpose:</span>
                <strong className="text-[#1E1B4B]">{receiptData.purpose}</strong>
              </div>
              <div className="flex justify-between pt-1 text-sm">
                <span className="font-bold text-slate-700">Amount Contributed:</span>
                <strong className="text-[#3E0B18] font-extrabold">₹{receiptData.amount}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                alert(`Receipt #${receiptData.receiptNo} sent to WhatsApp (${receiptData.phone})!`);
                setIsReceiptModalOpen(false);
              }}
              className="w-full py-3 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider mt-5 cursor-pointer border-0 shadow-md"
            >
              Download &amp; Share on WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
