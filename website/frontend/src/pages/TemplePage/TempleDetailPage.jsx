import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const TEMPLE_DATA = {
  'mahakaleshwar-ujjain': {
    id: 'mahakaleshwar-ujjain',
    slug: 'mahakaleshwar-ujjain',
    name: 'Shri Mahakaleshwar Jyotirlinga, Ujjain',
    city: 'Ujjain',
    state: 'Madhya Pradesh',
    deity: 'Lord Shiva (Mahakal)',
    category_label: '🔱 12 Jyotirlingas',
    description:
      'The only south-facing Jyotirlinga among the twelve. Darshan and the Bhasma Aarti of Mahakal, the lord of time, are believed to remove the fear of untimely death.',
    photos: [
      '/assets/img/temples/mahakaleshwar-ujjain.jpg',
      '/assets/img/temples/omkareshwar-madhya-pradesh.jpg',
      '/assets/img/temples/kashi-vishwanath-varanasi.jpg',
      '/assets/img/temples/somnath-jyotirlinga-gujarat.jpg',
      '/assets/img/temples/kedarnath-dham-uttarakhand.jpg',
    ],
    highlights: [
      'Sankalp in your name and gotra',
      'Daily Bhasma Aarti & Bilva Patra Archana',
      'Video delivery within 72 hours in your bookings',
      'Prasad delivered directly to your doorstep',
    ],
    stages: [
      'Select your sacred offering items and provide Yajman details',
      'Temple priest conducts sankalp with your name and gotra',
      'Sacred offerings are offered inside the Garbhagriha',
      'Video recording is generated and uploaded to your account',
    ],
    offerings: [
      {
        id: 'off-flowers',
        title: 'Flowers, Bilva Leaves & Lamp Offering',
        description: 'Offer fresh flowers, Bilva leaves and a sacred lamp to Lord Mahakal.',
        price: 51,
        image: '/assets/img/offerings/flowers.webp',
      },
      {
        id: 'off-panchamrit',
        title: 'Panchamrit Abhishek & Prasadam Offering',
        description: 'Sacred abhishek with Panchamrit (milk, curd, honey, ghee and sugar).',
        price: 251,
        image: '/assets/img/offerings/panchamrit.webp',
      },
      {
        id: 'off-havan',
        title: 'Special Mahakaleshwar Puja & Shanti Havan',
        description: 'A powerful puja and havan for removal of obstacles, good health and peace.',
        price: 1101,
        image: '/assets/img/offerings/havan.webp',
      },
    ],
  },
};

export default function TempleDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('temple');
  const [photoIndex, setPhotoIndex] = useState(0);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [selectedOfferings, setSelectedOfferings] = useState([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Form fields
  const [devoteeName, setDevoteeName] = useState('');
  const [gotra, setGotra] = useState('');

  const temple = TEMPLE_DATA[slug] || TEMPLE_DATA['mahakaleshwar-ujjain'];
  const photos = temple.photos || [];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const nextPhoto = () => setPhotoIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);

  const toggleOffering = (off) => {
    setSelectedOfferings((prev) => {
      const exists = prev.find((item) => item.id === off.id);
      if (exists) {
        return prev.filter((item) => item.id !== off.id);
      }
      return [...prev, off];
    });
  };

  const totalAmount = selectedOfferings.reduce((sum, item) => sum + item.price, 0);

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you, ${devoteeName}! Your chadhava offering of ₹${totalAmount || 51} has been received. Your video proof will be available within 72 hours.`);
    setIsBookingModalOpen(false);
    setSelectedOfferings([]);
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-24">
      {/* Top Header / Breadcrumb and Bookings Bar (1:1 Reference Match to Screenshot 2) */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <nav className="pp-crumbs flex items-center gap-1.5 text-xs text-slate-500 mb-4" aria-label="Breadcrumb">
          <Link to="/mandir-seva" className="hover:text-[#4A0E17] text-slate-600 no-underline">Mandir Seva</Link>
          <span>/</span>
          <Link to="/mandir-seva" className="hover:text-[#4A0E17] text-slate-600 no-underline">Chadhava</Link>
          <span>/</span>
          <span className="font-semibold text-[#1E1B4B]">Daily chadhava seva</span>
        </nav>

        <div className="ch-bookings-bar flex items-center justify-between mb-6">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#E7DFC9] bg-white text-[#3E0B18] shadow-xs hover:bg-[#FFFDF7] cursor-pointer"
            onClick={() => {
              if (window.App && typeof window.App.openBookingsModal === 'function') {
                window.App.openBookingsModal();
              } else {
                alert('Your booked sevas and videos will be accessible in your profile.');
              }
            }}
          >
            My bookings &amp; videos
          </button>
        </div>

        {/* Navigation Tabs (1:1 Reference Match to Screenshot 1) */}
        <nav
          className="flex items-center gap-2 border-b border-[#E7E2D8] pb-2 mb-6 overflow-x-auto scrollbar-none"
          aria-label="Temple tabs"
        >
          {[
            { id: 'about', label: 'About' },
            { id: 'temple', label: 'Temple details' },
            { id: 'highlights', label: 'Highlights' },
            { id: 'process', label: 'Process' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap border"
              style={{
                background: activeTab === tab.id ? '#3E0B18' : '#FFFDF9',
                color: activeTab === tab.id ? '#FFF9EF' : '#372E2F',
                borderColor: activeTab === tab.id ? '#3E0B18' : '#E6D2B5',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Temple Heading */}
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-6">
          {temple.name}
        </h1>

        {/* Interactive Image Gallery Carousel (1:1 Reference Match to Screenshot 1) */}
        <div className="bg-white rounded-3xl border border-[#E7E2D8] p-4 shadow-sm mb-8">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-4/3 sm:aspect-16/9 mb-3">
            <img
              src={photos[photoIndex]}
              alt={temple.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {/* Arrows */}
            <button
              type="button"
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xl cursor-pointer border-0 shadow-md backdrop-blur-xs"
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-xl cursor-pointer border-0 shadow-md backdrop-blur-xs"
              aria-label="Next image"
            >
              ›
            </button>
            {/* Counter */}
            <span className="absolute bottom-3 right-3 z-10 pointer-events-none px-2.5 py-1 rounded-lg text-xs font-bold bg-black/60 text-white backdrop-blur-xs">
              {photoIndex + 1}/{photos.length}
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-3 font-medium">
            {temple.name}
          </p>

          {/* Thumbnails Row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3">
            {photos.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPhotoIndex(idx)}
                className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer p-0 ${
                  photoIndex === idx ? 'border-[#3E0B18] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={p} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Photo credits expandable toggle */}
          <div>
            <button
              type="button"
              onClick={() => setCreditsOpen(!creditsOpen)}
              className="text-xs text-[#8C787E] hover:text-[#3E0B18] flex items-center gap-1 cursor-pointer font-medium bg-transparent border-0 p-0"
            >
              <span>{creditsOpen ? '▼' : '▶'}</span>
              <span>Photo credits &amp; licences</span>
            </button>
            {creditsOpen && (
              <div className="mt-2 p-3 bg-amber-50/50 rounded-xl text-[11px] text-slate-600 space-y-1 border border-amber-200/40">
                <p>• Shri Mahakaleshwar Jyotirlinga, Ujjain - Creative Commons CC BY-SA 4.0</p>
                <p>• Photographs licensed from Wikimedia Commons contributors.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tab 1: Temple Details / About Description */}
        <section className="bg-white rounded-3xl border border-[#E7E2D8] p-6 shadow-sm mb-8">
          <h2 className="font-serif text-lg font-bold text-[#1E1B4B] mb-2">About Shri Mahakaleshwar Jyotirlinga</h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-6">
            {temple.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Location</span>
              <strong className="text-[#1E1B4B]">{temple.city}, {temple.state}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Principal Deity</span>
              <strong className="text-[#1E1B4B]">{temple.deity}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Bhasma Aarti</span>
              <strong className="text-[#1E1B4B]">Daily 4:00 AM</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Video Delivery</span>
              <strong className="text-emerald-700">Within 72 Hours</strong>
            </div>
          </div>
        </section>

        {/* Offerings Section */}
        <section className="mb-12" id="temple-offerings-grid">
          <div className="text-center mb-6">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#B45309]">OFFER CHADHAVA</span>
            <h2 className="font-serif text-2xl font-bold text-[#1E1B4B] mt-1">Select Your Devotional Offerings</h2>
            <p className="text-xs text-slate-500 mt-1">Sankalp will be performed by temple priests in your name and gotra.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {temple.offerings.map((off) => {
              const isSelected = selectedOfferings.some((item) => item.id === off.id);
              return (
                <div
                  key={off.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isSelected ? 'bg-amber-50/80 border-[#3E0B18] shadow-md' : 'bg-white border-[#E7E2D8]'
                  }`}
                >
                  <div>
                    <div className="h-28 rounded-xl overflow-hidden mb-3 bg-amber-100">
                      <img src={off.image} alt={off.title} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-serif text-sm font-bold text-[#1E1B4B] mb-1">{off.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{off.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="font-bold text-sm text-[#3E0B18]">₹{off.price}</span>
                    <button
                      type="button"
                      onClick={() => toggleOffering(off)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border ${
                        isSelected
                          ? 'bg-[#3E0B18] text-white border-[#3E0B18]'
                          : 'bg-white text-[#3E0B18] border-[#E7E2D8] hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? '✓ Added' : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Offering Checkout Bar */}
          <div className="mt-6 p-4 rounded-2xl bg-white border border-[#E7E2D8] shadow-md flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Total Offering Amount:</span>
              <strong className="text-xl font-extrabold text-[#3E0B18]">₹{totalAmount || 51}</strong>
            </div>
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(true)}
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#3E0B18] text-[#FFF9EF] shadow-md hover:brightness-110 cursor-pointer border-0"
            >
              Continue to Sankalp ➔
            </button>
          </div>
        </section>
      </div>

      {/* Booking / Sankalp Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8]">
            <button
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0"
            >
              ✕
            </button>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">Sankalp Details</span>
            <h3 className="font-serif text-xl font-bold text-[#1E1B4B] mt-1 mb-2">Book Daily Chadhava</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the devotee details for the sacred sankalp at Shri Mahakaleshwar Temple.
            </p>

            <form onSubmit={handleBookingSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Devotee (Yajman) Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Sharma"
                  value={devoteeName}
                  onChange={(e) => setDevoteeName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">Gotra (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Kashyap (or leave blank for Kashyap)"
                  value={gotra}
                  onChange={(e) => setGotra(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200/60 mt-2">
                <span className="font-bold block mb-1">Total Payable: ₹{totalAmount || 51}</span>
                <small className="text-slate-600">You will receive the full HD Sankalp video in your profile within 72 hours.</small>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider mt-4 cursor-pointer border-0 shadow-md"
              >
                Confirm &amp; Pay ₹{totalAmount || 51}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
