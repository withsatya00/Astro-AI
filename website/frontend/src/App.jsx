import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Layout from './layouts/Layout.jsx';
import HomePage from './pages/HomePage/HomePage.jsx';
import DirectoryPage from './pages/DirectoryPage/DirectoryPage.jsx';
import ProfilePage from './pages/ProfilePage/ProfilePage.jsx';
import MandirSevaPage from './pages/MandirSevaPage/MandirSevaPage.jsx';
import TempleDetailPage from './pages/TemplePage/TempleDetailPage.jsx';
import GauSewaPage from './pages/GauSewaPage/GauSewaPage.jsx';
import AstroMallPage from './pages/AstroMallPage/AstroMallPage.jsx';
import ProductDetailPage from './pages/ProductPage/ProductDetailPage.jsx';
import CalculatorsPage from './pages/CalculatorsPage/CalculatorsPage.jsx';
import ConsultationRoom from './pages/ConsultationPage/ConsultationRoom.jsx';
import WalletPage from './pages/WalletPage/WalletPage.jsx';
import PanchangAndHoroscope from './pages/HomePage/PanchangAndHoroscope.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/astrologers" element={<DirectoryPage />} />
          <Route path="/astrologers/:slug" element={<ProfilePage />} />
          <Route path="/consultation" element={<ConsultationRoom />} />
          <Route path="/consultation/:slug" element={<ConsultationRoom />} />
          <Route path="/consult/:slug" element={<ConsultationRoom />} />
          <Route path="/mandir-seva" element={<MandirSevaPage />} />
          <Route path="/mandir-seva/puja" element={<MandirSevaPage section="puja" />} />
          <Route path="/mandir-seva/chadhava" element={<MandirSevaPage section="chadhava" />} />
          <Route path="/mandir-seva/temple/:slug" element={<TempleDetailPage />} />
          <Route path="/mandir-seva/chadhava/:slug" element={<TempleDetailPage />} />
          <Route path="/gau-sewa" element={<GauSewaPage />} />
          <Route path="/astro-mall" element={<AstroMallPage />} />
          <Route path="/mall" element={<AstroMallPage />} />
          <Route path="/astro-mall/product/:id" element={<ProductDetailPage />} />
          <Route path="/mall/product/:id" element={<ProductDetailPage />} />
          <Route path="/calculators" element={<CalculatorsPage />} />
          <Route path="/calculators/:slug" element={<CalculatorsPage />} />
          <Route path="/rashiphal" element={<RashiphalDedicatedPage />} />
          <Route path="/panchang" element={<PanchangDedicatedPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/profile" element={<ProfileView />} />
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

function RashiphalDedicatedPage() {
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

function PanchangDedicatedPage() {
  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] py-8">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#3E0B18]">Aaj Ka Panchang (दैनिक पंचांग)</h1>
        <p className="text-xs sm:text-sm text-slate-600">Accurate Vedic calendar timings: Tithi, Nakshatra, Yoga, Karana, Shubh Muhurat &amp; Rahukaal.</p>
      </div>
      <PanchangAndHoroscope />
    </div>
  );
}

/* Route View Placeholders for Step 2 Verification */

function HomeView() {
  return (
    <div className="home-preview max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Welcome banner */}
      <section
        className="rounded-3xl p-6 sm:p-10 shadow-xl border border-[#D9A441]/40 mb-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #3E0B18 0%, #5B1024 50%, #2B050F 100%)',
          color: '#FFF9EF',
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-[#F8D882] text-xs font-bold uppercase tracking-wider border border-[#D9A441]/30 mb-3">
            ✨ प्रामाणिक वैदिक ज्योतिष एवं कुण्डली परामर्श
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            Talk to India's Top Vedic Astrologers
          </h1>
          <p className="text-amber-100/90 text-sm sm:text-base leading-relaxed mb-6">
            Get authentic guidance on career, marriage, health, finance, and life's critical crossroads from verified Vedic masters.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/astrologers"
              className="bg-gradient-to-r from-[#D9A441] to-[#B3832B] hover:brightness-110 text-[#1E1B4B] font-bold text-sm px-6 py-3 rounded-full transition-all shadow-md cursor-pointer no-underline"
            >
              Find an Astrologer →
            </Link>
            <Link
              to="/mandir-seva"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-5 py-3 rounded-full transition-all border border-white/20 cursor-pointer no-underline"
            >
              Explore Mandir Seva
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Navigation Cards Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-10">
        {[
          { label: 'Chat Astrologer', icon: '💬', to: '/astrologers', desc: 'Instant chat' },
          { label: 'Call Astrologer', icon: '📞', to: '/astrologers', desc: 'Direct call' },
          { label: 'Daily Horoscope', icon: '♈', to: '/rashiphal', desc: 'All 12 signs' },
          { label: 'Kundli Milan', icon: '💖', to: '/calculators/kundali-milan', desc: 'Gun matching' },
          { label: '17 Calculators', icon: '📐', to: '/calculators', desc: 'Vedic tools' },
          { label: 'Astro Mall', icon: '📿', to: '/astro-mall', desc: 'Siddh items' },
        ].map((card, i) => (
          <Link
            key={i}
            to={card.to}
            className="p-4 rounded-2xl bg-white border border-[#E7E2D8] hover:border-[#4a1b9a] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2 group no-underline"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{card.icon}</span>
            <span className="font-bold text-xs sm:text-sm text-[#1E1B4B]">{card.label}</span>
            <span className="text-[11px] text-slate-400">{card.desc}</span>
          </Link>
        ))}
      </section>

      {/* Gau Sewa Promo Bar */}
      <section className="p-4 sm:p-5 rounded-2xl bg-[#FFF8EB] border border-[#FCD34D] flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🐄</span>
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E1B4B]">पवित्र गौ सेवा (Shree Krishna Gaushala Seva)</h4>
            <p className="text-xs text-slate-600">Provide green fodder, jaggery, and medical care for revered cows.</p>
          </div>
        </div>
        <Link
          to="/gau-sewa"
          className="bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-xs px-5 py-2.5 rounded-full transition-colors whitespace-nowrap no-underline shrink-0"
        >
          Contribute Gau Sewa →
        </Link>
      </section>
    </div>
  );
}

function AstrologersView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">Verified Vedic Astrologers</h2>
      <p className="text-slate-600 text-sm mb-6">Connect with certified astrologers specializing in Vedic astrology, Tarot, Numerology &amp; Vastu.</p>
      <div className="p-6 bg-white rounded-2xl border border-[#E7E2D8] text-center text-slate-500 text-sm">
        Astrologers directory &amp; filter system will be hydrated here in Step 4.
      </div>
    </div>
  );
}

function MandirSevaView({ section = 'all' }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">
        {section === 'puja' ? 'Temple Puja Bookings' : section === 'chadhava' ? 'Daily Chadhava Seva' : 'Mandir Seva'}
      </h2>
      <p className="text-slate-600 text-sm mb-6">Participate in divine rituals at 12 Jyotirlingas and ancient Vedic temples across India.</p>
      <div className="p-6 bg-white rounded-2xl border border-[#E7E2D8] text-center text-slate-500 text-sm">
        Mandir Puja &amp; Chadhava catalogue will be hydrated here in Step 5.
      </div>
    </div>
  );
}

function GauSewaView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">Gau Sewa (गौ सेवा)</h2>
      <p className="text-slate-600 text-sm mb-6">Direct contribution to Gaushalas with live receipt and sankalp.</p>
      <div className="p-6 bg-white rounded-2xl border border-[#E7E2D8] text-center text-slate-500 text-sm">
        Gau Sewa offerings will be hydrated here in Step 5.
      </div>
    </div>
  );
}

function AstroMallView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">Vedic Astro Mall</h2>
      <p className="text-slate-600 text-sm mb-6">100% Authentic, Lab-Certified Gemstones, Rudraksha, Yantras &amp; Puja Samagri.</p>
      <div className="p-6 bg-white rounded-2xl border border-[#E7E2D8] text-center text-slate-500 text-sm">
        Mall e-commerce products grid will be hydrated here in Step 5.
      </div>
    </div>
  );
}

function RashiphalView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">Daily Rashifal (दैनिक राशिफल)</h2>
      <p className="text-slate-600 text-sm mb-6">Detailed astrological predictions for all 12 Rashi / Zodiac signs.</p>
    </div>
  );
}

function PanchangView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">Aaj Ka Panchang (दैनिक पंचांग)</h2>
      <p className="text-slate-600 text-sm mb-6">Tithi, Nakshatra, Yoga, Karana, Shubh Muhurat &amp; Rahukaal.</p>
    </div>
  );
}

function CalculatorsView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">17 Vedic Astrology Calculators</h2>
      <p className="text-slate-600 text-sm mb-6">Kundli Milan, Shani Sade Sati, Mangal Dosha, Gemstone recommendation, and more.</p>
    </div>
  );
}

function ProfileView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">My Account &amp; Consultations</h2>
      <p className="text-slate-600 text-sm mb-6">View past chats, calls, saved kundlis, and active orders.</p>
    </div>
  );
}

function WalletView() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">Wallet &amp; Recharge</h2>
      <p className="text-slate-600 text-sm mb-6">Add balance for instant chat &amp; call consultations.</p>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <span className="text-5xl block mb-4">🪐</span>
      <h2 className="font-serif text-2xl font-bold text-[#1E1B4B] mb-2">Page Not Found</h2>
      <p className="text-slate-600 text-sm mb-6">The cosmic coordinates you requested do not exist.</p>
      <Link to="/" className="inline-block bg-[#3E0B18] text-white font-bold text-xs px-5 py-2.5 rounded-full no-underline">
        Return to Home
      </Link>
    </div>
  );
}
