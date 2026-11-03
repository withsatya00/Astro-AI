import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const PUJA_CATALOG = {
  'somnath-jyotirlinga-gujarat': {
    id: 'pj-somnath-rudrabhishek',
    slug: 'somnath-jyotirlinga-gujarat',
    title: 'Maha Rudrabhishek & Bilva Patra Archana',
    title_hi: 'महा रुद्राभिषेक एवं बिल्वपत्र अर्चना',
    subtitle: 'Sacred Vedic chanting of Sri Rudram with fresh Panchamrit abhishek at the first Jyotirlinga.',
    temple: 'Shri Somnath Jyotirlinga, Prabhas Patan, Gujarat',
    deity: 'Lord Shiva (Somnath Mahadev)',
    image_url: '/assets/img/temples/somnath-jyotirlinga-gujarat.jpg',
    muhurta: 'Upcoming Shubh Muhurta · 5 Nov 2026, 8:00 AM IST',
    duration: '2 Hours (Vedic Archana & Havan)',
    rating: 4.9,
    reviews: 1420,
    devotees_joined: 34,
    from_price: 251,
    tag: 'Special Puja',
    video_hours: 48,
    packages: [
      { id: 'pkg-single', name: 'Individual Sankalp', price: 251, desc: 'Sankalp with single name & gotra. Digital receipt & video proof included.' },
      { id: 'pkg-dampati', name: 'Dampati (Couple) Sankalp', price: 501, desc: 'Sankalp for husband & wife. Includes Bilva Patra Archana and recorded video.' },
      { id: 'pkg-parivar', name: 'Family (4 Members) Sankalp', price: 1100, desc: 'Complete family sankalp with name, gotra and special Mahaprasad dispatch.' },
      { id: 'pkg-maha', name: 'Maha Rudrabhishek & Shanti Havan', price: 2100, desc: 'Full Vedic Havan with 108 Ahutis and personalized video blessing.' },
    ],
    benefits: [
      'Removes planetary malefic effects and Rahu-Ketu dosha',
      'Promotes peace, emotional stability and physical vitality',
      'Protects against unexpected hurdles in career and relationships',
      'Personalized video proof of your sankalp delivered in your account',
    ],
  },
  'kedarnath-dham-uttarakhand': {
    id: 'pj-kedarnath-mahamrityunjaya',
    slug: 'kedarnath-dham-uttarakhand',
    title: 'Akhand Mahamrityunjaya Jaap & Havan',
    title_hi: 'अखण्ड महामृत्युंजय जाप एवं हवन',
    subtitle: 'Vedic recitation of 1,100 Mahamrityunjaya mantras for longevity, disease protection and peace.',
    temple: 'Shri Kedarnath Dham, Rudraprayag, Uttarakhand',
    deity: 'Lord Shiva (Kedarnath Mahadev)',
    image_url: '/assets/img/temples/kedarnath-dham-uttarakhand.jpg',
    muhurta: '8 Nov 2026, 6:00 AM IST',
    duration: '2.5 Hours',
    rating: 4.95,
    reviews: 2150,
    devotees_joined: 52,
    from_price: 501,
    tag: 'Maha Yagya',
    video_hours: 48,
    packages: [
      { id: 'pkg-single', name: 'Individual Jaap Sankalp', price: 501, desc: '1,100 mantra chanting in your name & gotra with digital video proof.' },
      { id: 'pkg-dampati', name: 'Dampati Ayushya Yagya', price: 1100, desc: 'Couple sankalp for long life, marital harmony and health protection.' },
      { id: 'pkg-parivar', name: 'Sarva Rog Shanti Parivar Sankalp', price: 2100, desc: 'Complete family wellness sankalp with consecrated Bhasma dispatch.' },
    ],
    benefits: [
      'Supreme protection against chronic illnesses and negativity',
      'Neutralizes Kaal Sarp and Markesh planetary cycles',
      'Bestows mental clarity, courage, and spiritual bliss',
      'Video evidence with clear audio of your name and gotra recitation',
    ],
  },
  'trimbakeshwar-nashik': {
    id: 'pj-kalsarp-dosh-trimbak',
    slug: 'trimbakeshwar-nashik',
    title: 'Kalsarp & Pitra Dosh Nivaran Maha Puja',
    title_hi: 'कालसर्प एवं पितृदोष निवारण महापूजा',
    subtitle: 'Sacred Vedic ritual at the source of Godavari River performed by authorized Trimbakeshwar Guruji.',
    temple: 'Shri Trimbakeshwar Jyotirlinga, Nashik, Maharashtra',
    deity: 'Lord Trimbakeshwar (Brahma, Vishnu, Shiva)',
    image_url: '/assets/img/temples/trimbakeshwar-nashik.jpg',
    muhurta: 'Amavasya Special · 10 Nov 2026, 7:00 AM IST',
    duration: '3 Hours',
    rating: 4.92,
    reviews: 980,
    devotees_joined: 28,
    from_price: 501,
    tag: 'Special Puja',
    video_hours: 48,
    packages: [
      { id: 'pkg-single', name: 'Laghu Kalsarp Shanti', price: 501, desc: 'Sankalp with single name, gotra and Nag-Nagin pujan.' },
      { id: 'pkg-dampati', name: 'Vishesh Kalsarp & Rahu Shanti', price: 1100, desc: 'Couple sankalp with Vedic Rudram path and silver Nag offering.' },
      { id: 'pkg-parivar', name: 'Sampoorna Parivar Dosh Nivaran', price: 2100, desc: 'Complete family dosh nivaran with full havan video proof.' },
    ],
    benefits: [
      'Neutralizes career delays, marital obstacles and recurring anxiety',
      'Purifies ancestral karma and bestows pitra blessings',
      'Delivers personal recorded video proof inside your profile',
    ],
  },
  'kamakhya-devi-assam': {
    id: 'pj-kamakhya-tantra-archana',
    slug: 'kamakhya-devi-assam',
    title: 'Maa Kamakhya Shatru Badha & Raksha Puja',
    title_hi: 'माँ कामाख्या शत्रु बाधा एवं रक्षा कवच पूजा',
    subtitle: 'Vedic Shakti archana and sindoor pujan at the prime Shaktipeeth for invincibility and protection.',
    temple: 'Maa Kamakhya Devalaya, Nilachal Hill, Guwahati, Assam',
    deity: 'Maa Kamakhya Devi',
    image_url: '/assets/img/temples/kamakhya-devi-assam.jpg',
    muhurta: 'Shukla Paksha Ashtami · 7 Nov 2026, 9:00 AM IST',
    duration: '2 Hours',
    rating: 4.97,
    reviews: 1840,
    devotees_joined: 85,
    from_price: 251,
    tag: 'Shakti Puja',
    video_hours: 48,
    packages: [
      { id: 'pkg-single', name: 'Sindoor & Chunari Archana', price: 251, desc: 'Personal sankalp with sacred Kamakhya sindoor offering & video proof.' },
      { id: 'pkg-dampati', name: 'Shakti Kavach & Raksha Path', price: 501, desc: 'Devi Kavach path for family security and evil-eye removal.' },
      { id: 'pkg-parivar', name: 'Maha Navarna Chandi Havan', price: 1500, desc: 'Intensive Vedic havan with 108 Ahutis for extreme prosperity.' },
    ],
    benefits: [
      'Overcomes severe professional roadblocks, jealousy and negative energies',
      'Invokes blessings of Maa Kamakhya for courage, wealth and peace of mind',
      'Video recording of your sankalp delivered securely',
    ],
  },
  'siddhivinayak-mumbai': {
    id: 'pj-siddhivinayak-modak-archana',
    slug: 'siddhivinayak-mumbai',
    title: 'Siddhivinayak 108 Durva & Modak Archana',
    title_hi: 'सिद्धिविनायक १०८ दूर्वा एवं मोदक महाअर्चना',
    subtitle: 'Riddhi-Siddhi archana for overcoming obstacles, exam success, and new business inauguration.',
    temple: 'Shri Siddhivinayak Ganapati Temple, Prabhadevi, Mumbai',
    deity: 'Lord Ganesha (Swayambhu Siddhivinayak)',
    image_url: '/assets/img/temples/siddhivinayak-mumbai.jpg',
    muhurta: 'Tuesday / Chaturthi · 4 Nov 2026, 7:30 AM IST',
    duration: '1.5 Hours',
    rating: 4.94,
    reviews: 2600,
    devotees_joined: 110,
    from_price: 151,
    tag: 'Vighnaharta Puja',
    video_hours: 48,
    packages: [
      { id: 'pkg-single', name: 'Durva Archana & Ladoo Bhog', price: 151, desc: 'Sankalp with single devotee name and gotra with video.' },
      { id: 'pkg-dampati', name: '108 Durva & Panchamrit Abhishek', price: 501, desc: 'For family success, prosperity, and obstacle removal.' },
      { id: 'pkg-parivar', name: 'Siddhivinayak Maha Ganapati Havan', price: 1100, desc: 'Special Vedic Ganapati Atharvashirsha havan for business growth.' },
    ],
    benefits: [
      'Dissolves all pending obstacles in jobs, contracts and legal affairs',
      'Bestows mental clarity, wisdom, and good fortune',
      'HD video proof delivered directly to your account',
    ],
  },
  'shani-shingnapur': {
    id: 'pj-shani-tailabhishek',
    slug: 'shani-shingnapur',
    title: 'Pavitra Shani Tailabhishek & Shanti Havan',
    title_hi: 'पवित्र शनि तैलाभिषेक एवं शांति हवन',
    subtitle: 'Pure mustard oil and black sesame offering at Swayambhu Shani Dev for Sade Sati relief.',
    temple: 'Shri Shani Shingnapur, Ahmednagar, Maharashtra',
    deity: 'Lord Shani Dev (Swayambhu Shila)',
    image_url: '/assets/img/temples/shani-shingnapur.jpg',
    muhurta: 'Saturday, 7 Nov 2026, 6:30 AM IST',
    duration: '1.5 Hours',
    rating: 4.85,
    reviews: 3200,
    devotees_joined: 68,
    from_price: 151,
    tag: 'Shani Shanti',
    video_hours: 48,
    packages: [
      { id: 'pkg-tail', name: 'Pure Mustard Oil Offering (1L)', price: 151, desc: 'Pure mustard oil abhishek with devotee name & gotra.' },
      { id: 'pkg-vishesh', name: 'Shani Sade Sati Shanti Archana', price: 501, desc: 'Tailabhishek, black sesame, blue flowers and Shani Stotra path.' },
      { id: 'pkg-havan', name: 'Maha Shani Havan with 108 Ahutis', price: 1100, desc: 'Intensive Vedic havan for business recovery and legal victory.' },
    ],
    benefits: [
      'Shields against harsh effects of Shani Sade Sati and Dhaiya',
      'Brings career discipline, stability and financial security',
      'Recorded video proof available directly in your account',
    ],
  },
};

export default function PujaDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Find puja in catalog or generate intelligent fallback
  const puja = PUJA_CATALOG[slug] || {
    id: `pj-${slug || 'somnath'}`,
    slug: slug || 'somnath-jyotirlinga-gujarat',
    title: slug
      ? slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') + ' Special Puja'
      : 'Maha Rudrabhishek & Bilva Patra Archana',
    title_hi: 'विशेष वैदिक पूजा एवं संकल्प अर्चना',
    subtitle: 'Authentic Vedic sankalp and sacred archana performed by certified priests with video proof.',
    temple: slug
      ? `Shri ${slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} Dham`
      : 'Shri Somnath Jyotirlinga, Gujarat',
    deity: 'Supreme Divine Deity',
    image_url: `/assets/img/temples/${slug || 'somnath-jyotirlinga-gujarat'}.jpg`,
    muhurta: 'Upcoming Shubh Muhurta · 8:00 AM IST',
    duration: '2 Hours',
    rating: 4.9,
    reviews: 850,
    devotees_joined: 25,
    from_price: 251,
    tag: 'Special Puja',
    video_hours: 48,
    packages: [
      { id: 'pkg-single', name: 'Individual Sankalp', price: 251, desc: 'Sankalp with single name & gotra with digital video proof.' },
      { id: 'pkg-dampati', name: 'Dampati (Couple) Sankalp', price: 501, desc: 'Couple sankalp for peace, prosperity and health.' },
      { id: 'pkg-parivar', name: 'Family Parivar Sankalp', price: 1100, desc: 'Complete family wellness and prosperity blessings.' },
    ],
    benefits: [
      'Personalized sankalp conducted in your name and gotra',
      'Authentic Vedic mantras chanted by senior temple scholars',
      'High-definition video recording of your ritual delivered to your profile',
    ],
  };

  const [selectedPkg, setSelectedPkg] = useState(puja.packages[0]?.id || 'pkg-single');
  const [devoteeName, setDevoteeName] = useState('');
  const [gotra, setGotra] = useState('');
  const [whatsappMobile, setWhatsappMobile] = useState('');
  const [sankalpWish, setSankalpWish] = useState('General Well-being & Family Prosperity');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const activePackage = puja.packages.find((p) => p.id === selectedPkg) || puja.packages[0];

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const data = {
      bookingId: `PJ-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      pujaTitle: puja.title,
      temple: puja.temple,
      packageName: activePackage.name,
      amount: activePackage.price,
      yajman: devoteeName || 'Anonymous Devotee',
      gotra: gotra || 'Kashyap',
      mobile: whatsappMobile,
      wish: sankalpWish,
      videoDelivery: `${puja.video_hours || 48} hours after ritual completion`,
    };
    setReceiptData(data);
    setIsReceiptOpen(true);
  };

  return (
    <div className="puja-detail-page w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-20">
      {/* 1. Hero Photographic Banner */}
      <section className="service-banner service-banner--puja max-w-7xl mx-auto mt-4 px-4">
        <figure className="service-banner__art">
          <img
            src={puja.image_url}
            alt={puja.temple}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = '/assets/img/temples/somnath-jyotirlinga-gujarat.jpg';
            }}
          />
          <figcaption>Consecrated Seva Ground</figcaption>
        </figure>

        <div className="service-banner__copy">
          <p className="service-banner__eyebrow">
            ✦ {puja.deity ? puja.deity.toUpperCase() : 'SACRED VEDIC PUJA'} ✦
          </p>
          <h1 className="font-serif">
            {puja.title}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mb-3 text-xs text-amber-200">
            <span>📍 {puja.temple}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs mb-4">
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-[#1E1B4B] font-bold">
              ★ {puja.rating} ({puja.reviews} reviews)
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
              ⏱ {puja.duration}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
              📅 {puja.muhurta}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl mb-6">
            {puja.subtitle}
          </p>

          <div className="service-banner__actions flex items-center gap-4 flex-wrap">
            <a
              href="#puja-booking-form"
              className="shop-btn shop-btn--gold no-underline cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('puja-booking-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Book Sankalp Puja (From ₹{puja.from_price}) →
            </a>
            <Link to="/mandir-seva" className="shop-btn shop-btn--ghost no-underline">
              ← View All Temples
            </Link>
          </div>
        </div>

        {/* Benefits Strip */}
        <div className="shop-trust service-benefits">
          <div>
            <span>📹</span>
            <p>
              <b>Personal Video Proof</b>
              <small>Name &amp; gotra spoken in sankalp</small>
            </p>
          </div>
          <div>
            <span>🪔</span>
            <p>
              <b>Authentic Priests</b>
              <small>Senior temple scholars</small>
            </p>
          </div>
          <div>
            <span>📜</span>
            <p>
              <b>Digital Certificate</b>
              <small>Instant booking slip &amp; updates</small>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Puja Details, Benefits & Steps */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Why perform this puja */}
          <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B45309] mb-1">
              VEDIC SIGNIFICANCE &amp; BLESSINGS
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1B4B] mb-3">
              Why Perform {puja.title}?
            </h2>
            <ul className="space-y-3">
              {puja.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card: 4-Step Puja Journey */}
          <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B45309] mb-1">
              TRANSPARENT PROCESS
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1E1B4B] mb-4">
              How Your Remote Puja is Conducted
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3E0B18] text-[#F8D882] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <div>
                  <strong className="text-xs text-[#1E1B4B] block">Select Sankalp &amp; Provide Details</strong>
                  <p className="text-xs text-slate-500">Enter your name, gotra, and specific prayer intent for the pandit.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3E0B18] text-[#F8D882] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <div>
                  <strong className="text-xs text-[#1E1B4B] block">Priest Recites Sankalp In Temple</strong>
                  <p className="text-xs text-slate-500">On the auspicious muhurta, priests chant Vedic mantras taking your name.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3E0B18] text-[#F8D882] flex items-center justify-center font-bold text-xs shrink-0">3</span>
                <div>
                  <strong className="text-xs text-[#1E1B4B] block">Archana &amp; Havan Completed</strong>
                  <p className="text-xs text-slate-500">Consecrated offerings and ahutis are offered to the divine deity.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3E0B18] text-[#F8D882] flex items-center justify-center font-bold text-xs shrink-0">4</span>
                <div>
                  <strong className="text-xs text-[#1E1B4B] block">Video Proof Uploaded to Account</strong>
                  <p className="text-xs text-slate-500">Watch the recorded video of your sankalp directly in your profile within {puja.video_hours || 48} hours.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Booking Form */}
        <div id="puja-booking-form" className="lg:col-span-5 p-6 rounded-3xl bg-white border border-[#E7E2D8] shadow-xl sticky top-24">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">SANKALP BOOKING</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">100% Verified Pandit</span>
          </div>
          <h3 className="font-serif text-xl font-bold text-[#1E1B4B] mb-2">Book Puja in Your Name</h3>
          <p className="text-xs text-slate-500 mb-5">
            Enter devotee details for the sacred sankalp and video proof.
          </p>

          <form onSubmit={handleBookingSubmit} className="space-y-4">
            {/* Package Selector */}
            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] mb-2">Choose Seva Package</label>
              <div className="space-y-2">
                {puja.packages.map((pkg) => {
                  const isSelected = selectedPkg === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg.id)}
                      className="p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                      style={{
                        backgroundColor: isSelected ? '#3E0B18' : '#FAF7F2',
                        borderColor: isSelected ? '#D9A441' : '#EADBCA',
                        color: isSelected ? '#FFFFFF' : '#1E1B4B',
                      }}
                    >
                      <div className="min-w-0">
                        <strong
                          className="block text-xs font-bold"
                          style={{ color: isSelected ? '#F8D882' : '#3E0B18' }}
                        >
                          {pkg.name}
                        </strong>
                        <small
                          className="text-[11px] leading-snug block line-clamp-1"
                          style={{ color: isSelected ? '#F1E6D2' : '#64748B' }}
                        >
                          {pkg.desc}
                        </small>
                      </div>
                      <span
                        className="text-sm font-extrabold shrink-0"
                        style={{ color: isSelected ? '#F8D882' : '#3E0B18' }}
                      >
                        ₹{pkg.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Devotee Info */}
            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Devotee (Yajman) Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Suresh Sharma"
                value={devoteeName}
                onChange={(e) => setDevoteeName(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-[#D9A441]/50 bg-[#FAF7F2] focus:bg-white focus:border-[#3E0B18] outline-none font-semibold text-[#1E1B4B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Gotra</label>
                <input
                  type="text"
                  placeholder="e.g. Kashyap"
                  value={gotra}
                  onChange={(e) => setGotra(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#D9A441]/50 bg-[#FAF7F2] focus:bg-white focus:border-[#3E0B18] outline-none font-semibold text-[#1E1B4B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">WhatsApp Mobile *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={whatsappMobile}
                  onChange={(e) => setWhatsappMobile(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#D9A441]/50 bg-[#FAF7F2] focus:bg-white focus:border-[#3E0B18] outline-none font-semibold text-[#1E1B4B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Sankalp Wish / Prayer Intent</label>
              <select
                value={sankalpWish}
                onChange={(e) => setSankalpWish(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-[#D9A441]/50 bg-[#FAF7F2] font-semibold text-[#1E1B4B] outline-none cursor-pointer"
              >
                <option>Family Health &amp; General Well-being</option>
                <option>Career Growth &amp; Job Promotion</option>
                <option>Business Expansion &amp; Financial Prosperity</option>
                <option>Marriage &amp; Harmonious Relationship</option>
                <option>Shani Sade Sati / Dhaiya Shanti</option>
                <option>Rahu-Ketu / Kaal Sarp Dosh Nivaran</option>
                <option>Child Education &amp; Success in Exams</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer border-0 shadow-lg hover:brightness-105 transition-all text-[#1E1B4B]"
              style={{
                background: 'linear-gradient(135deg, #D9A441 0%, #F5CE7A 50%, #C28B27 100%)',
              }}
            >
              Confirm &amp; Book Puja (₹{activePackage.price}) →
            </button>
          </form>
        </div>
      </div>

      {/* Digital Booking Receipt Modal */}
      {isReceiptOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8]">
            <button
              type="button"
              onClick={() => setIsReceiptOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0"
            >
              ✕
            </button>

            <div className="text-center mb-4">
              <span className="text-4xl block mb-1">🪔</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">SANKALP CONFIRMED</span>
              <h3 className="font-serif text-xl font-bold text-[#1E1B4B]">{receiptData.pujaTitle}</h3>
              <p className="text-xs text-slate-500">{receiptData.temple}</p>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 space-y-2 text-xs">
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Booking ID:</span>
                <strong className="text-[#1E1B4B] font-mono">{receiptData.bookingId}</strong>
              </div>
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Yajman Name:</span>
                <strong className="text-[#1E1B4B]">{receiptData.yajman}</strong>
              </div>
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Gotra:</span>
                <strong className="text-[#1E1B4B]">{receiptData.gotra}</strong>
              </div>
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Package:</span>
                <strong className="text-[#1E1B4B]">{receiptData.packageName}</strong>
              </div>
              <div className="flex justify-between border-b border-amber-200/40 pb-1.5">
                <span className="text-slate-500">Sankalp Wish:</span>
                <strong className="text-[#1E1B4B]">{receiptData.wish}</strong>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold">
                <span className="text-[#3E0B18]">Dakshina Paid:</span>
                <span className="text-[#3E0B18] font-extrabold">₹{receiptData.amount}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
              <span>📹</span>
              <span><strong>Video Proof Guarantee:</strong> {receiptData.videoDelivery}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsReceiptOpen(false);
                navigate('/mandir-seva');
              }}
              className="w-full mt-4 py-3 rounded-xl bg-[#3E0B18] text-[#F8D882] font-bold text-xs uppercase tracking-wider cursor-pointer border-0"
            >
              Back to Mandir Seva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
