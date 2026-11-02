import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const MOCK_EVENTS = [
  {
    id: 'ch-daily-mahakal',
    slug: 'mahakaleshwar-ujjain',
    kind: 'chadhava',
    title: 'Daily chadhava seva',
    temple: {
      name: 'Shri Mahakaleshwar Jyotirlinga, Ujjain',
      city: 'Ujjain',
      state: 'Madhya Pradesh',
      slug: 'mahakaleshwar-ujjain',
    },
    starts_at: '2026-11-03T19:41:00+05:30',
    deadline: '2026-11-02T18:41:00+05:30',
    image_url: '/assets/img/temples/mahakaleshwar-ujjain.jpg',
    video_hours: 72,
    devotees_joined: 1,
    from_price: 5,
    tag: 'Collective seva',
    bookable: true,
  },
  {
    id: 'pj-somnath-rudrabhishek',
    slug: 'somnath-jyotirlinga-gujarat',
    kind: 'puja',
    title: 'Maha Rudrabhishek & Bilva Patra Archana',
    temple: {
      name: 'Shri Somnath Jyotirlinga',
      city: 'Prabhas Patan',
      state: 'Gujarat',
      slug: 'somnath-jyotirlinga-gujarat',
    },
    starts_at: '2026-11-05T08:00:00+05:30',
    deadline: '2026-11-04T20:00:00+05:30',
    image_url: '/assets/img/temples/somnath-jyotirlinga-gujarat.jpg',
    video_hours: 48,
    devotees_joined: 34,
    from_price: 251,
    tag: 'Special Puja',
    bookable: true,
  },
  {
    id: 'ch-kashi-ganga-aarti',
    slug: 'kashi-vishwanath-varanasi',
    kind: 'chadhava',
    title: 'Ganga Jal & Bhasma Chadhava Seva',
    temple: {
      name: 'Shri Kashi Vishwanath Dham',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      slug: 'kashi-vishwanath-varanasi',
    },
    starts_at: '2026-11-06T18:30:00+05:30',
    deadline: '2026-11-05T12:00:00+05:30',
    image_url: '/assets/img/temples/kashi-vishwanath-varanasi.jpg',
    video_hours: 72,
    devotees_joined: 18,
    from_price: 51,
    tag: 'Collective seva',
    bookable: true,
  },
  {
    id: 'pj-kedarnath-mahamrityunjaya',
    slug: 'kedarnath-dham-uttarakhand',
    kind: 'puja',
    title: 'Akhand Mahamrityunjaya Jaap & Havan',
    temple: {
      name: 'Shri Kedarnath Dham',
      city: 'Rudraprayag',
      state: 'Uttarakhand',
      slug: 'kedarnath-dham-uttarakhand',
    },
    starts_at: '2026-11-08T06:00:00+05:30',
    deadline: '2026-11-07T18:00:00+05:30',
    image_url: '/assets/img/temples/kedarnath-dham-uttarakhand.jpg',
    video_hours: 48,
    devotees_joined: 52,
    from_price: 501,
    tag: 'Maha Yagya',
    bookable: true,
  },
];

export default function MandirSevaPage({ section = 'all' }) {
  const [activeTab, setActiveTab] = useState(section === 'puja' ? 'puja' : section === 'chadhava' ? 'chadhava' : 'all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState(MOCK_EVENTS);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetch('/api/v1/mandir/events')
      .then((res) => {
        if (!res.ok) throw new Error('API fetch error');
        return res.json();
      })
      .then((data) => {
        const items = data.events || data.items || data;
        if (Array.isArray(items) && items.length > 0) {
          setEvents(items);
        }
      })
      .catch(() => {
        // Fallback already pre-set
      });
  }, []);

  const filteredEvents = events.filter((e) => {
    if (activeTab === 'puja' && e.kind !== 'puja') return false;
    if (activeTab === 'chadhava' && e.kind !== 'chadhava') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        e.title.toLowerCase().includes(q) ||
        (e.temple?.name || '').toLowerCase().includes(q) ||
        (e.temple?.city || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleOfferChadhava = (event) => {
    const slug = event.temple?.slug || event.slug || 'mahakaleshwar-ujjain';
    navigate(`/mandir-seva/temple/${slug}`);
  };

  return (
    <div className="shop-page mandir-page w-full min-w-0 max-w-full overflow-x-hidden">
      {/* 1. Hero Banner */}
      <section className="shop-hero mandir-hero service-banner service-banner--mandir" data-mode="home">
        <figure className="service-banner__art">
          <img src="/assets/img/mandir-banner.webp" alt="Sacred Mandir Seva" fetchPriority="high" />
          <figcaption>Illustrative image</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow">SACRED SEVA, FROM HOME</p>
          <h1>
            Offer chadhava at <em>your chosen temple</em>
          </h1>
          <div className="mandir-hero__titlerow">
            <span className="shop-hero__badge">E-Chadawa &amp; Sankalp Puja</span>
          </div>
          <p>
            Choose an event, select offerings in your name and gotra, and track your seva through to its recorded video proof.
          </p>
          <div className="shop-hero__actions">
            <Link to="/mandir-seva/temple/mahakaleshwar-ujjain" className="shop-btn shop-btn--gold no-underline">
              <span>🛕</span>
              <span>Explore Temples →</span>
            </Link>
            <button
              type="button"
              className="shop-btn shop-btn--ghost cursor-pointer"
              onClick={() => {
                if (window.App && typeof window.App.openBookingsModal === 'function') {
                  window.App.openBookingsModal();
                } else {
                  alert('Your booked sevas and videos will appear in your account profile.');
                }
              }}
            >
              <span>📜</span>
              <span>My Bookings &amp; Video Proof</span>
            </button>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div>
            <span>📹</span>
            <p>
              <b>Video proof</b>
              <small>Video of your sankalp, with name &amp; gotra</small>
            </p>
          </div>
          <div>
            <span>🪔</span>
            <p>
              <b>Temple priests</b>
              <small>Performed by authentic temple priests</small>
            </p>
          </div>
          <div>
            <span>📦</span>
            <p>
              <b>Booking updates</b>
              <small>Payment, seva and video tracking</small>
            </p>
          </div>
        </div>
      </section>

      {/* 2. Subtabs Navigation Bar */}
      <div className="flex items-center justify-center gap-2 mb-6 px-4">
        {[
          { id: 'all', label: 'All Seva Events' },
          { id: 'chadhava', label: '🪔 Daily Chadhava' },
          { id: 'puja', label: '🔱 Special Sankalp Puja' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border"
            style={{
              background: activeTab === tab.id ? '#3E0B18' : '#FFFDF9',
              color: activeTab === tab.id ? '#FFF9EF' : '#372E2F',
              borderColor: activeTab === tab.id ? '#3E0B18' : '#E6D2B5',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(62, 11, 24, 0.25)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <section className="shop-toolbar mb-6 px-4">
        <div className="shop-toolbar__row flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="shop-chips flex items-center gap-2 overflow-x-auto pb-1" id="mandir-category-filters">
            {[
              { id: 'all', label: 'All Temples' },
              { id: 'shiva', label: '🔱 Jyotirlinga & Shiva' },
              { id: 'shakti', label: '🌸 Shaktipeeth & Devi' },
              { id: 'shani', label: '🪐 Shani & Hanuman' },
              { id: 'ganesh', label: '🐘 Ganesh' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCategoryFilter(chip.id)}
                className={`shop-chip text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  categoryFilter === chip.id ? 'is-active' : ''
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="shop-tools min-w-[260px]">
            <input
              type="search"
              className="shop-input w-full text-xs"
              placeholder="Search temple, deity or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search temples and sevas"
            />
          </div>
        </div>
      </section>

      {/* 4. Events Listing Grid (1:1 Reference Match to Screenshot 5) */}
      <section className="px-4 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((e) => {
            const dateObj = new Date(e.starts_at);
            const dayNum = dateObj.getDate() || 3;
            const monthName = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase() || 'NOV';
            const formattedDate = dateObj.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const formattedTime = dateObj.toLocaleTimeString('en-IN', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });

            return (
              <article
                key={e.id}
                className="ch-event bg-white rounded-3xl border border-[#E7E2D8] overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col"
              >
                {/* Media banner */}
                <div className="ch-event-media relative h-52 overflow-hidden bg-slate-900">
                  <img
                    src={e.image_url}
                    alt={e.temple?.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                  {/* Badge top-left */}
                  <span
                    className="absolute top-3.5 left-3.5 px-3 py-1 rounded-lg text-[11px] font-bold shadow-xs"
                    style={{ background: '#FFFDF9', color: '#3E0B18' }}
                  >
                    {e.tag || 'Collective seva'}
                  </span>
                  {/* Date badge top-right */}
                  <span
                    className="ch-date absolute top-3.5 right-3.5 w-12 h-13 rounded-xl flex flex-col items-center justify-center shadow-xs"
                    style={{ background: '#FFFDF9', border: '1px solid #E6D2B5' }}
                  >
                    <b className="text-base font-extrabold text-[#3E0B18] leading-none">{dayNum}</b>
                    <small className="text-[10px] font-bold text-[#8C787E] uppercase">{monthName}</small>
                  </span>
                </div>

                {/* Event details */}
                <div className="ch-event-copy p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className="font-serif text-lg font-bold text-[#1E1B4B] mb-1.5 cursor-pointer hover:text-[#B45309]"
                      onClick={() => handleOfferChadhava(e)}
                    >
                      {e.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2 font-medium">
                      {e.temple?.name} · {e.temple?.city}
                    </p>
                    <p className="text-xs font-bold text-[#3E0B18] mb-2">
                      {formattedDate}, {formattedTime} IST
                    </p>
                    <small className="text-[11px] text-slate-500 block mb-2">
                      Booking closes: 2 Nov 2026, 6:41 pm IST · <b className="text-amber-700 font-bold">1 day left to join</b>
                    </small>
                    <div className="text-xs text-slate-600 mb-2 flex items-center gap-1.5">
                      <span>👥</span>
                      <span>{e.devotees_joined || 1} devotee joined</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Video within: {e.video_hours || 72} hours after seva
                    </p>
                  </div>

                  {/* Foot with price and button */}
                  <div className="ch-event-foot pt-4 border-t border-[#F2E8DC] flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Starts</span>
                      <strong className="text-lg font-extrabold text-[#3E0B18]">
                        From ₹{e.from_price || 5}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="shop-btn shop-btn--gold cursor-pointer"
                      style={{
                        background: '#5A0C20',
                        color: '#FFF9EF',
                        padding: '10px 22px',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: 'none',
                      }}
                      onClick={() => handleOfferChadhava(e)}
                    >
                      Offer chadhava
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
