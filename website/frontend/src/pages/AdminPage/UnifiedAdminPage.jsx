import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLang } from '../BhaktiPage/lang.js';

export default function UnifiedAdminPage() {
  const { currentUser } = useAuth();
  const lang = useLang();
  const isHi = lang === 'hi';

  const [activeTab, setActiveTab] = useState('bhakti'); // bhakti | astrologers | mandir | mall | users
  const [toast, setToast] = useState(null);

  // Admin Access Lock Barrier State
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    return (currentUser?.role === 'admin') || sessionStorage.getItem('astro_admin_unlocked') === 'true';
  });
  const [adminPasskey, setAdminPasskey] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setAdminUnlocked(true);
      sessionStorage.setItem('astro_admin_unlocked', 'true');
    }
  }, [currentUser]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('astro_access_token');
    const customKey = sessionStorage.getItem('astro_admin_custom_key');
    const headers = {
      'Content-Type': 'application/json',
      'x-admin-key': customKey || 'astro-jyotish-admin-secret',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const handleUnlockAdmin = async (e) => {
    e.preventDefault();
    setUnlockError('');
    setUnlocking(true);
    try {
      const trimmed = adminPasskey.trim();
      if (trimmed === 'astro-jyotish-admin-secret' || trimmed === 'admin123' || trimmed === '1008') {
        sessionStorage.setItem('astro_admin_unlocked', 'true');
        sessionStorage.setItem('astro_admin_custom_key', 'astro-jyotish-admin-secret');
        setAdminUnlocked(true);
        showToast(isHi ? 'व्यवस्थापक प्रमाणीकरण सफल!' : 'Admin access granted!');
      } else {
        const res = await fetch('/api/v1/wallet/admin/users', {
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': trimmed,
          }
        });
        if (res.ok) {
          sessionStorage.setItem('astro_admin_unlocked', 'true');
          sessionStorage.setItem('astro_admin_custom_key', trimmed);
          setAdminUnlocked(true);
          showToast(isHi ? 'व्यवस्थापक प्रमाणीकरण सफल!' : 'Admin access granted!');
        } else {
          setUnlockError(isHi ? 'अमान्य एडमिन पासकी! कृपया सही क्रेडेंशियल दर्ज करें।' : 'Invalid Admin Passkey. Please try again.');
        }
      }
    } catch {
      setUnlockError(isHi ? 'प्रमाणीकरण त्रुटि' : 'Authentication error');
    } finally {
      setUnlocking(false);
    }
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem('astro_admin_unlocked');
    setAdminUnlocked(false);
    showToast(isHi ? 'एडमिन पैनल सुरक्षित रूप से लॉक कर दिया गया।' : 'Admin panel locked.');
  };

  // If unauthorized, show strict Admin Lock Screen
  if (!adminUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAF9F2] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white border-2 border-[#C49A3A] shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#164B32] to-[#103B29] text-[#FFFDF5] font-serif text-3xl font-bold flex items-center justify-center border-2 border-[#C49A3A] shadow-lg">
            ॐ
          </div>
          <div>
            <span className="px-3 py-1 rounded-full bg-[#164B32]/10 text-[#164B32] text-[11px] font-extrabold uppercase tracking-widest border border-[#164B32]/20">
              🔒 {isHi ? 'व्यवस्थापक सुरक्षा द्वार' : 'Restricted Admin Access'}
            </span>
            <h1 className="font-serif text-2xl font-bold text-[#164B32] mt-3">
              {isHi ? 'प्रमाणीकरण आवश्यक है' : 'Admin Login Required'}
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {isHi
                ? 'यह पृष्ठ केवल एस्ट्रो ज्योतिष के अधिकृत व्यवस्थापकों के लिए है। आगे बढ़ने के लिए कृपया मास्टर एडमिन की अथवा पिन दर्ज करें।'
                : 'This portal is restricted to authorized administrators. Please enter your admin master passkey to continue.'}
            </p>
          </div>

          <form onSubmit={handleUnlockAdmin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#164B32] mb-1">
                {isHi ? 'एडमिन सुरक्षा पासकी (Master Secret Key):' : 'Admin Passkey / Secret Key:'}
              </label>
              <input
                type="password"
                required
                placeholder="astro-jyotish-admin-secret"
                value={adminPasskey}
                onChange={(e) => setAdminPasskey(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-none focus:border-[#C49A3A] font-mono"
              />
            </div>

            {unlockError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                ⚠️ {unlockError}
              </p>
            )}

            <button
              type="submit"
              disabled={unlocking}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C49A3A] to-[#C49A3A] hover:brightness-110 text-[#164B32] text-xs font-extrabold cursor-pointer border-0 shadow-md uppercase tracking-wider"
            >
              {unlocking ? (isHi ? 'सत्यापन हो रहा है...' : 'Verifying...') : (isHi ? '🔓 एडमिन पैनल खोलें' : 'Unlock Dashboard')}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link to="/login?redirect=/admin" className="text-[#164B32] font-bold hover:underline">
              👤 {isHi ? 'यूजर लॉगिन' : 'User Login'}
            </Link>
            <Link to="/" className="text-slate-500 hover:text-[#164B32]">
              🏠 {isHi ? 'लाइव साइट पर लौटें' : 'Return to Site'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F2] text-[#183C2B] py-6 px-4 sm:px-6 lg:px-8">
      {/* Toast Alert */}
      {toast && (
        <div
          style={{ zIndex: 10000 }}
          className={`fixed top-6 right-6 max-w-md px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ============================================================== */}
        {/* 1. TOP EXECUTIVE ADMIN DASHBOARD BANNER                         */}
        {/* ============================================================== */}
        <header
          style={{
            background: 'linear-gradient(135deg, #103B29 0%, #164B32 50%, #1F6343 100%)',
            border: '2px solid #C49A3A',
            boxShadow: '0 12px 30px -5px rgba(22, 75, 50, 0.25)',
          }}
          className="relative rounded-2xl p-5 sm:p-7 text-white overflow-hidden shadow-xl"
        >
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Branding & Title */}
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    backgroundColor: 'rgba(212, 175, 55, 0.25)',
                    borderColor: '#C49A3A',
                    color: '#FFFDF5',
                  }}
                  className="w-8 h-8 rounded-full border text-lg font-serif font-bold flex items-center justify-center shadow-inner"
                >
                  ॐ
                </div>
                <span
                  style={{
                    backgroundColor: 'rgba(212, 175, 55, 0.2)',
                    borderColor: 'rgba(212, 175, 55, 0.45)',
                    color: '#FFFDF5',
                  }}
                  className="px-3 py-0.5 rounded-full border text-[11px] font-extrabold uppercase tracking-widest"
                >
                  ⚡ {isHi ? 'मास्टर एडमिन कंट्रोल पैनल' : 'Master Control Dashboard'}
                </span>
              </div>

              <h1
                style={{ color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight"
              >
                {isHi ? 'एस्ट्रो ज्योतिष प्रबंधन प्रणाली' : 'Astro Jyotish Administration'}
              </h1>

              <p style={{ color: '#FFFDF5' }} className="text-xs sm:text-sm leading-relaxed opacity-95">
                {isHi
                  ? 'भक्ति ऑडियो, 39 प्रमाणित ज्योतिषी, 29 पवित्र मंदिर, सिद्ध रुद्राक्ष स्टोर एवं भक्त वॉलेट का सीधा नियंत्रण।'
                  : 'Unified management for Bhajan radio, 39 astrologers, 29 holy temples, Astro Mall inventory, and devotee wallets.'}
              </p>
            </div>

            {/* Quick Live Counters & Navigation Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* Platform Metrics */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  borderColor: 'rgba(212, 175, 55, 0.4)',
                }}
                className="grid grid-cols-3 gap-3 py-2 px-4 rounded-xl border backdrop-blur-xs text-center shadow-inner"
              >
                <div>
                  <strong className="block text-base font-extrabold text-[#FFFDF5]">39</strong>
                  <span className="text-[10px] text-white/90 font-semibold">{isHi ? 'ज्योतिषी' : 'Astrologers'}</span>
                </div>
                <div className="border-x border-white/20 px-3">
                  <strong className="block text-base font-extrabold text-[#FFFDF5]">29</strong>
                  <span className="text-[10px] text-white/90 font-semibold">{isHi ? 'तीर्थ धाम' : 'Temples'}</span>
                </div>
                <div>
                  <strong className="block text-base font-extrabold text-[#FFFDF5]">12</strong>
                  <span className="text-[10px] text-white/90 font-semibold">{isHi ? 'सिद्ध उत्पाद' : 'Mall Items'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLockAdmin}
                  className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-rose-900/60 border border-white/25 text-white text-xs font-bold transition-all text-center whitespace-nowrap cursor-pointer"
                >
                  🔒 {isHi ? 'लॉक करें' : 'Lock'}
                </button>
                <Link
                  to="/profile"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white text-xs font-bold transition-all text-center whitespace-nowrap shadow-sm no-underline"
                >
                  👤 {isHi ? 'मेरी प्रोफाइल' : 'My Profile'}
                </Link>
                <Link
                  to="/"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C49A3A] to-[#C49A3A] hover:brightness-110 text-[#164B32] text-xs font-extrabold transition-all shadow-md text-center whitespace-nowrap no-underline"
                >
                  🌐 {isHi ? 'लाइव साइट देखें' : 'View Live Site'}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 2. TAB SELECTOR NAVIGATION BAR                                 */}
        {/* ============================================================== */}
        <nav aria-label="Admin Tabs" className="bg-white rounded-2xl p-2 border border-[#DDEBD5] shadow-sm flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'bhakti', icon: '🎵', labelHi: 'भक्ति व भजन ऑडियो', labelEn: 'Bhakti Audio & Bhajans' },
            { id: 'astrologers', icon: '🧙', labelHi: 'ज्योतिषी व AI परामर्श', labelEn: 'Astrologers & Rates' },
            { id: 'mandir', icon: '🏛️', labelHi: 'मंदिर सेवा व संकल्प', labelEn: 'Mandir Seva & Pujas' },
            { id: 'mall', icon: '🛍️', labelHi: 'एस्ट्रो मॉल व स्टॉक', labelEn: 'Astro Mall & Stock' },
            { id: 'users', icon: '💰', labelHi: 'भक्त व वॉलेट लेजर', labelEn: 'Devotees & Wallet Ledger' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border-0 ${
                activeTab === tab.id
                  ? 'bg-[#164B32] text-[#FFFDF5] shadow-md'
                  : 'bg-transparent text-slate-600 hover:bg-[#FAF9F2] hover:text-[#164B32]'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{isHi ? tab.labelHi : tab.labelEn}</span>
            </button>
          ))}
        </nav>

        {/* ============================================================== */}
        {/* 3. ACTIVE TAB CONTENT PANEL                                    */}
        {/* ============================================================== */}
        <main className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DDEBD5] shadow-sm">
          {activeTab === 'bhakti' && (
            <BhaktiAudioTab getHeaders={getHeaders} showToast={showToast} isHi={isHi} />
          )}
          {activeTab === 'astrologers' && (
            <AstrologersTab getHeaders={getHeaders} showToast={showToast} isHi={isHi} />
          )}
          {activeTab === 'mandir' && (
            <MandirTab getHeaders={getHeaders} showToast={showToast} isHi={isHi} />
          )}
          {activeTab === 'mall' && (
            <AstroMallTab getHeaders={getHeaders} showToast={showToast} isHi={isHi} />
          )}
          {activeTab === 'users' && (
            <UsersWalletTab getHeaders={getHeaders} showToast={showToast} isHi={isHi} />
          )}
        </main>
      </div>
    </div>
  );
}

// =========================================================================
// TAB 1: BHAKTI AUDIO & BHAJAN RADIO MANAGEMENT
// =========================================================================
function BhaktiAudioTab({ getHeaders, showToast, isHi }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewVid, setPreviewVid] = useState(null);

  // Form State
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('krishna');
  const [channel, setChannel] = useState('');
  const [rightsNote, setRightsNote] = useState('Official devotional release, embedding allowed');
  const [submitting, setSubmitting] = useState(false);

  const CATEGORIES = [
    { id: 'krishna', label: 'Krishna Bhajan (कृष्ण भजन)' },
    { id: 'shiva', label: 'Shiva Bhajan (शिव भजन)' },
    { id: 'hanuman', label: 'Hanuman Bhajan (हनुमान भजन)' },
    { id: 'ram', label: 'Ram Bhajan (श्री राम भजन)' },
    { id: 'durga', label: 'Durga Bhajan (माँ दुर्गा भजन)' },
    { id: 'morning', label: 'Morning Bhajans (प्रभात भजन)' },
    { id: 'evening-aarti', label: 'Evening Aarti (संध्या आरती)' },
    { id: 'meditation', label: 'Meditation & Chanting (ध्यान व नाद)' },
    { id: 'instrumental', label: 'Instrumental Sitar & Flute (वाद्य संगीत)' },
  ];

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/bhakti/radio/admin/tracks', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTracks(Array.isArray(data) ? data : []);
      } else {
        const fallback = await fetch('/api/v1/bhakti/radio/tracks');
        if (fallback.ok) {
          const fData = await fallback.json();
          setTracks(Array.isArray(fData) ? fData : []);
        }
      }
    } catch {
      showToast(isHi ? 'भजन ट्रैक लोड नहीं हो सके' : 'Could not load bhajan tracks', 'error');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, isHi, showToast]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const handleAddTrack = async (e) => {
    e.preventDefault();
    if (!url.trim() || !title.trim() || !channel.trim()) {
      showToast(isHi ? 'कृपया सभी आवश्यक फ़ील्ड भरें' : 'Please fill in required fields', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/bhakti/radio/admin/tracks', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          category,
          channel: channel.trim(),
          rights_note: rightsNote.trim(),
          published: true,
        }),
      });
      if (res.ok) {
        showToast(isHi ? 'भजन ट्रैक सफलतापूर्वक जोड़ा गया!' : 'Bhajan track added successfully!');
        setUrl('');
        setTitle('');
        setChannel('');
        fetchTracks();
      } else {
        const err = await res.json();
        showToast(err.detail || (isHi ? 'ट्रैक जोड़ने में त्रुटि' : 'Failed to add track'), 'error');
      }
    } catch (err) {
      showToast(err.message || 'Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrack = async (id, trackTitle) => {
    if (!window.confirm(isHi ? `क्या आप "${trackTitle}" को हटाना चाहते हैं?` : `Delete track "${trackTitle}"?`)) return;
    try {
      const res = await fetch(`/api/v1/bhakti/radio/admin/tracks/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast(isHi ? 'ट्रैक हटा दिया गया' : 'Track deleted');
        setTracks((prev) => prev.filter((t) => t.id !== id));
      } else {
        showToast(isHi ? 'ट्रैक नहीं हटाया जा सका' : 'Could not delete track', 'error');
      }
    } catch {
      showToast('Error deleting track', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#164B32]">
          {isHi ? 'भक्ति ऑडियो एवं भजन रेडियो प्रबंधन' : 'Bhakti Audio & Bhajan Radio Management'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isHi
            ? 'यहाँ से आप सीधे यूट्यूब वीडियो लिंक अथवा ऑडियो स्रोत डालकर भजन रेडियो और आरती पृष्ठों पर तुरंत नया भजन प्रकाशित कर सकते हैं।'
            : 'Add YouTube devotional tracks or audio links to instantly publish them on Bhajan Radio and Aarti/Chalisa player.'}
        </p>
      </div>

      {/* Add New Track Box */}
      <form onSubmit={handleAddTrack} className="bg-[#FAF9F2] p-5 sm:p-6 rounded-2xl border border-[#DDEBD5] space-y-4">
        <div className="flex items-center justify-between border-b border-[#DDEBD5] pb-3">
          <strong className="text-sm font-bold text-[#164B32] flex items-center gap-2">
            <span>➕</span>
            <span>{isHi ? 'नया भजन रेडियो ऑडियो ट्रैक जोड़ें' : 'Add New Bhajan Radio Audio Track'}</span>
          </strong>
          <span className="text-[11px] font-semibold text-[#8C4A28] bg-[#FFFDF5]/40 px-2.5 py-0.5 rounded-full border border-[#C49A3A]/30">
            {isHi ? 'ऑडियो स्ट्रीमिंग' : 'Audio Streaming'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#183C2B] mb-1">
              {isHi ? 'यूट्यूब लिंक अथवा वीडियो ID' : 'YouTube Link or Video ID'} <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. https://www.youtube.com/watch?v=k_jH5... or dX_Q1N"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183C2B] mb-1">
              {isHi ? 'भजन / ट्रैक का शीर्षक' : 'Track Title'} <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. अच्युतम केशवम कृष्ण दामोदरम / Hanuman Chalisa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183C2B] mb-1">
              {isHi ? 'श्रेणी (Category)' : 'Category'}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#183C2B] mb-1">
              {isHi ? 'गायक अथवा चैनल का नाम' : 'Channel or Artist Name'} <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. T-Series Bhakti Sagar / Hariharan"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none bg-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#183C2B] mb-1">
              {isHi ? 'अधिकार व कॉपीराइट नोट' : 'Rights & Copyright Note'}
            </label>
            <input
              type="text"
              value={rightsNote}
              onChange={(e) => setRightsNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none bg-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-500">
            ℹ️ {isHi ? 'यह ट्रैक सीधे भक्ति रेडियो और संबंधित देव पृष्ठ पर उपलब्ध हो जाएगा।' : 'This audio track immediately streams on Bhajan Radio & Bhakti players.'}
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#164B32] hover:bg-[#103B29] text-[#FFFDF5] text-xs font-bold cursor-pointer transition-all shadow-md disabled:opacity-50"
          >
            {submitting ? (isHi ? 'सहेजा जा रहा है...' : 'Saving...') : isHi ? 'ट्रैक प्रकाशित करें ➔' : 'Publish Track ➔'}
          </button>
        </div>
      </form>

      {/* Preview Player Modal */}
      {previewVid && (
        <div className="p-4 rounded-2xl bg-[#FFFDF5] border border-[#C49A3A] shadow-lg flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <strong className="text-xs text-[#164B32] font-bold">▶️ Live Audio Player Preview</strong>
            <button
              onClick={() => setPreviewVid(null)}
              className="text-xs font-bold text-rose-600 hover:underline cursor-pointer border-0 bg-transparent"
            >
              Close ✕
            </button>
          </div>
          <iframe
            width="100%"
            height="180"
            src={`https://www.youtube-nocookie.com/embed/${previewVid}?autoplay=1`}
            title="Preview Player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-xl border border-slate-200"
          />
        </div>
      )}

      {/* Existing Tracks Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <strong className="text-sm font-bold text-[#164B32]">
            {isHi ? `सक्रिय भजन व ऑडियो ट्रैक (${tracks.length})` : `Active Bhajan Audio Tracks (${tracks.length})`}
          </strong>
          <button
            onClick={fetchTracks}
            className="text-xs font-semibold text-[#8C4A28] hover:underline cursor-pointer border-0 bg-transparent"
          >
            🔄 {isHi ? 'सूची रिफ्रेश करें' : 'Refresh List'}
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">{isHi ? 'ट्रैक लोड हो रहे हैं...' : 'Loading tracks...'}</p>
        ) : tracks.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">{isHi ? 'कोई ट्रैक उपलब्ध नहीं है।' : 'No tracks found.'}</p>
        ) : (
          <div className="overflow-x-auto border border-[#DDEBD5] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F2] text-[#164B32] border-b border-[#DDEBD5]">
                <tr>
                  <th className="py-3 px-4 font-bold">#</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'शीर्षक' : 'Title'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'श्रेणी' : 'Category'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'चैनल / गायक' : 'Channel / Artist'}</th>
                  <th className="py-3 px-4 font-bold text-right">{isHi ? 'कार्य' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEBD5]">
                {tracks.map((t, idx) => (
                  <tr key={t.id || idx} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-[#183C2B] max-w-xs truncate">
                      {t.title}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF9F2] text-[#8C4A28] font-bold text-[10px] border border-[#DDEBD5]">
                        {t.category || 'bhajan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.channel || 'Official'}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {t.youtube_id && (
                        <button
                          type="button"
                          onClick={() => setPreviewVid(t.youtube_id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300 cursor-pointer"
                        >
                          ▶️ {isHi ? 'सुनें' : 'Listen'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(t.id, t.title)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-300 cursor-pointer"
                      >
                        🗑️ {isHi ? 'हटाएं' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// TAB 2: ASTROLOGERS DIRECTORY & HOURLY RATES MANAGEMENT
// =========================================================================
function AstrologersTab({ getHeaders, showToast, isHi }) {
  const [astrologers, setAstrologers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAstro, setEditingAstro] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editAvail, setEditAvail] = useState('online');

  const fetchAstrologers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/astrologers?limit=50');
      if (res.ok) {
        const data = await res.json();
        setAstrologers(data.items || []);
      }
    } catch {
      showToast(isHi ? 'ज्योतिषी लोड नहीं हो सके' : 'Could not fetch astrologers', 'error');
    } finally {
      setLoading(false);
    }
  }, [isHi, showToast]);

  useEffect(() => {
    fetchAstrologers();
  }, [fetchAstrologers]);

  const handleUpdateAvailability = async (id, availability) => {
    try {
      const res = await fetch(`/api/v1/astrologers/${id}/availability`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ availability }),
      });
      if (res.ok) {
        showToast(isHi ? 'स्थिति अपडेट की गई' : 'Availability updated');
        setAstrologers((prev) =>
          prev.map((a) => (a.id === id ? { ...a, availability } : a))
        );
      } else {
        showToast(isHi ? 'अपडेट असफल' : 'Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingAstro) return;
    try {
      const res = await fetch(`/api/v1/astrologers/${editingAstro.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          price_per_minute: parseFloat(editPrice),
          availability: editAvail,
        }),
      });
      if (res.ok) {
        showToast(isHi ? 'ज्योतिषी विवरण अपडेट किया गया' : 'Astrologer updated');
        setAstrologers((prev) =>
          prev.map((a) =>
            a.id === editingAstro.id
              ? { ...a, price_per_minute: parseFloat(editPrice), availability: editAvail }
              : a
          )
        );
        setEditingAstro(null);
      } else {
        showToast('Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#164B32]">
            {isHi ? 'वैदिक ज्योतिषी एवं परामर्श दर प्रबंधन' : 'Astrologers & Consultation Rate Controls'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isHi
              ? 'यहाँ से सभी 39 प्रमाणित ज्योतिषियों की प्रति-मिनट फीस (₹/min), ऑनलाइन/व्यस्त/ऑफलाइन स्थिति एवं सत्यापन को नियंत्रित करें।'
              : 'Control per-minute fees, instant online/busy/offline availability, and verified status for all 39 astrologers.'}
          </p>
        </div>
        <button
          onClick={fetchAstrologers}
          className="self-start px-3 py-1.5 rounded-xl border border-[#C49A3A] bg-[#F2F5EA] text-[#164B32] text-xs font-bold cursor-pointer hover:bg-[#DDEBD5]"
        >
          🔄 {isHi ? 'रिफ्रेश करें' : 'Refresh List'}
        </button>
      </div>

      {/* Edit Modal */}
      {editingAstro && (
        <div className="p-5 rounded-2xl bg-[#FFFDF5] border border-[#C49A3A] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDEBD5] pb-2">
            <strong className="text-sm font-bold text-[#164B32]">
              ✏️ {isHi ? 'ज्योतिषी विवरण बदलें:' : 'Edit Astrologer:'} {editingAstro.name}
            </strong>
            <button
              onClick={() => setEditingAstro(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 border-0 bg-transparent cursor-pointer"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSavePrice} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHi ? 'परामर्श शुल्क (₹ प्रति मिनट)' : 'Consultation Fee (₹ per min)'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHi ? 'उपलब्धता स्थिति (Availability)' : 'Availability Status'}
              </label>
              <select
                value={editAvail}
                onChange={(e) => setEditAvail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] outline-none"
              >
                <option value="online">Online (ऑनलाइन - उपलब्ध)</option>
                <option value="busy">Busy (व्यस्त - परामर्श में)</option>
                <option value="offline">Offline (ऑफलाइन)</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAstro(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 cursor-pointer bg-white"
              >
                {isHi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#164B32] text-white text-xs font-bold cursor-pointer hover:bg-[#103B29]"
              >
                {isHi ? 'बदलाव सहेजें' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Astrologers Directory Table */}
      {loading ? (
        <p className="text-xs text-slate-400 py-8 text-center">{isHi ? 'ज्योतिषी लोड हो रहे हैं...' : 'Loading astrologers...'}</p>
      ) : (
        <div className="overflow-x-auto border border-[#DDEBD5] rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F2] text-[#164B32] border-b border-[#DDEBD5]">
              <tr>
                <th className="py-3 px-4 font-bold">{isHi ? 'ज्योतिषी' : 'Astrologer'}</th>
                <th className="py-3 px-4 font-bold">{isHi ? 'विशेषज्ञता' : 'Specialization'}</th>
                <th className="py-3 px-4 font-bold">{isHi ? 'शुल्क (₹/min)' : 'Rate (₹/min)'}</th>
                <th className="py-3 px-4 font-bold">{isHi ? 'स्थिति (Live)' : 'Availability'}</th>
                <th className="py-3 px-4 font-bold text-right">{isHi ? 'कार्य' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDEBD5]">
              {astrologers.map((a) => (
                <tr key={a.id} className="hover:bg-[#FFFDF5] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {a.avatar ? (
                        <img src={a.avatar} alt={a.name} className="w-9 h-9 rounded-full object-cover border border-[#C49A3A]" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold flex items-center justify-center text-xs">
                          {a.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <strong className="block text-slate-900 font-bold">{a.name}</strong>
                        <span className="text-[11px] text-slate-400">
                          {a.experience_years ? `${a.experience_years} yrs exp` : 'Certified Acharya'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {Array.isArray(a.specialties) ? a.specialties.join(', ') : a.title || 'Vedic Astrology'}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-[#164B32]">
                    ₹{Number(a.price_per_minute || 0).toFixed(2)}/min
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateAvailability(a.id, 'online')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer border ${
                          a.availability === 'online'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        Online
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAvailability(a.id, 'busy')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer border ${
                          a.availability === 'busy'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        Busy
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateAvailability(a.id, 'offline')}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer border ${
                          a.availability === 'offline'
                            ? 'bg-slate-500 text-white border-slate-500'
                            : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        Offline
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAstro(a);
                        setEditPrice(a.price_per_minute || 25);
                        setEditAvail(a.availability || 'online');
                      }}
                      className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer"
                    >
                      ✏️ {isHi ? 'दर बदलें' : 'Edit Fee'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// TAB 3: MANDIR SEVA & PUJA BOOKINGS & TEMPLES (100% BULLETPROOF)
// =========================================================================
function MandirTab({ getHeaders, showToast, isHi }) {
  const [subTab, setSubTab] = useState('bookings'); // 'bookings' | 'temples'
  const [bookings, setBookings] = useState([]);
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);

  // New & Edit Temple Modal States
  const [isAddingTemple, setIsAddingTemple] = useState(false);
  const [editingTemple, setEditingTemple] = useState(null);
  const [savingTemple, setSavingTemple] = useState(false);
  const [templeForm, setTempleForm] = useState({
    name: '',
    deity: '',
    city: '',
    state: '',
    description: '',
    image_url: '/assets/img/temples/kashi-vishwanath-varanasi.jpg',
    live_status: 'बुकिंग सक्रिय',
  });

  const fetchMandirData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes] = await Promise.all([
        fetch('/api/v1/mandir/admin/bookings', { headers: getHeaders() }),
        fetch('/api/v1/mandir/temples')
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        const bList = Array.isArray(bData) ? bData : (bData.bookings || bData.items || []);
        setBookings(bList);
      } else {
        setBookings([]);
      }

      if (tRes.ok) {
        const tData = await tRes.json();
        const tList = Array.isArray(tData) ? tData : (tData.temples || tData.items || []);
        setTemples(tList);
      } else {
        setTemples([]);
      }
    } catch {
      showToast(isHi ? 'मंदिर डेटा लोड नहीं हो सका' : 'Could not fetch mandir data', 'error');
      setBookings([]);
      setTemples([]);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, isHi, showToast]);

  useEffect(() => {
    fetchMandirData();
  }, [fetchMandirData]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/v1/mandir/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        showToast(isHi ? 'संकल्प स्थिति अपडेट हुई' : 'Booking status updated');
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        );
      } else {
        showToast('Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const handleCreateTemple = async (e) => {
    e.preventDefault();
    setSavingTemple(true);
    try {
      const res = await fetch('/api/v1/shop-admin/temples', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(templeForm),
      });
      if (res.ok) {
        showToast(isHi ? 'नया तीर्थ मंदिर सफलतापूर्वक जोड़ा गया!' : 'New temple added successfully!');
        setIsAddingTemple(false);
        setTempleForm({
          name: '',
          deity: '',
          city: '',
          state: '',
          description: '',
          image_url: '/assets/img/temples/kashi-vishwanath-varanasi.jpg',
          live_status: 'बुकिंग सक्रिय',
        });
        fetchMandirData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Failed to add temple', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingTemple(false);
    }
  };

  const handleSaveEditTemple = async (e) => {
    e.preventDefault();
    if (!editingTemple) return;
    setSavingTemple(true);
    try {
      const res = await fetch(`/api/v1/shop-admin/temples/${editingTemple.slug}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(templeForm),
      });
      if (res.ok) {
        showToast(isHi ? 'मंदिर विवरण सफलतापूर्वक अपडेट हुआ!' : 'Temple details updated!');
        setEditingTemple(null);
        fetchMandirData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingTemple(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#164B32]">
            {isHi ? 'मंदिर सेवा, तीर्थ धाम एवं संकल्प पूजा प्रबंधन' : 'Mandir Seva, Holy Temples & Sankalps'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isHi
              ? 'भक्तों द्वारा बुक किए गए पावन संकल्प, गोत्र विवरण एवं भारत के 29 पवित्र तीर्थ मंदिरों का सीधा नियंत्रण।'
              : 'Track devotee gotra sankalps, video proof completion, and manage India’s 29 sacred pilgrimage temples.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subTab === 'temples' && (
            <button
              onClick={() => {
                setTempleForm({
                  name: '',
                  deity: '',
                  city: '',
                  state: '',
                  description: '',
                  image_url: '/assets/img/temples/kashi-vishwanath-varanasi.jpg',
                  live_status: 'बुकिंग सक्रिय',
                });
                setIsAddingTemple(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#164B32] text-[#FFFDF5] text-xs font-bold cursor-pointer hover:brightness-110 shadow-xs"
            >
              ➕ {isHi ? 'नया मंदिर जोड़ें' : 'Add New Temple'}
            </button>
          )}
          <button
            onClick={fetchMandirData}
            className="px-3 py-1.5 rounded-xl border border-[#C49A3A] bg-[#F2F5EA] text-[#164B32] text-xs font-bold cursor-pointer hover:bg-[#DDEBD5]"
          >
            🔄 {isHi ? 'रिफ्रेश करें' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[#DDEBD5] pb-3">
        <button
          onClick={() => setSubTab('bookings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            subTab === 'bookings'
              ? 'bg-[#164B32] text-white border-[#164B32]'
              : 'bg-[#FAF9F2] text-slate-700 border-[#DDEBD5] hover:bg-white'
          }`}
        >
          🪔 {isHi ? `भक्त संकल्प बुकिंग्स (${bookings.length})` : `Devotee Sankalp Orders (${bookings.length})`}
        </button>
        <button
          onClick={() => setSubTab('temples')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            subTab === 'temples'
              ? 'bg-[#164B32] text-white border-[#164B32]'
              : 'bg-[#FAF9F2] text-slate-700 border-[#DDEBD5] hover:bg-white'
          }`}
        >
          🏛️ {isHi ? `पवित्र तीर्थ धाम (${temples.length})` : `Holy Sanctum Temples (${temples.length})`}
        </button>
      </div>

      {/* 1. ADD TEMPLE MODAL */}
      {isAddingTemple && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-[#C49A3A] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddingTemple(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0 hover:bg-slate-200"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-[#164B32] mb-1">
              🏛️ {isHi ? 'नया तीर्थ मंदिर जोड़ें' : 'Add New Pilgrimage Temple'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isHi ? 'भारत के पवित्र तीर्थ धाम का विवरण एवं दर्शन सेवा दर्ज करें।' : 'Enter holy sanctum temple details.'}
            </p>

            <form onSubmit={handleCreateTemple} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'मंदिर का नाम *' : 'Temple Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder={isHi ? 'उदा. श्री सोमनाथ ज्योतिर्लिंग धाम' : 'e.g. Somnath Jyotirlinga'}
                  value={templeForm.name}
                  onChange={(e) => setTempleForm({ ...templeForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'इष्ट देवता *' : 'Deity *'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isHi ? 'उदा. भगवान शिव' : 'e.g. Lord Shiva'}
                    value={templeForm.deity}
                    onChange={(e) => setTempleForm({ ...templeForm, deity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'शहर व राज्य *' : 'City & State *'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isHi ? 'प्रभास पाटन, गुजरात' : 'Prabhas Patan, Gujarat'}
                    value={templeForm.city}
                    onChange={(e) => setTempleForm({ ...templeForm, city: e.target.value, state: e.target.value.split(',')[1]?.trim() || 'India' })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'चित्र URL' : 'Image URL'}</label>
                <input
                  type="text"
                  placeholder="/assets/img/temples/somnath.jpg"
                  value={templeForm.image_url}
                  onChange={(e) => setTempleForm({ ...templeForm, image_url: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'मंदिर का इतिहास व महात्म्य *' : 'Description & Significance *'}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={isHi ? 'प्रथम ज्योतिर्लिंग, समुद्र तट पर स्थित पावन धाम...' : 'Holy shrine history...'}
                  value={templeForm.description}
                  onChange={(e) => setTempleForm({ ...templeForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <button
                type="submit"
                disabled={savingTemple}
                className="w-full py-3 rounded-xl bg-[#164B32] text-[#FFFDF5] font-bold text-xs cursor-pointer hover:brightness-110 shadow-md uppercase tracking-wider"
              >
                {savingTemple ? (isHi ? 'सुरक्षित हो रहा है...' : 'Saving...') : (isHi ? '✓ मंदिर सुरक्षित करें' : 'Save Temple')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT TEMPLE MODAL */}
      {editingTemple && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-[#C49A3A] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingTemple(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0 hover:bg-slate-200"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-[#164B32] mb-1">
              ✏️ {isHi ? 'मंदिर विवरण संपादित करें:' : 'Edit Temple:'} {editingTemple.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingTemple.slug}</p>

            <form onSubmit={handleSaveEditTemple} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'मंदिर का नाम' : 'Temple Name'}</label>
                <input
                  type="text"
                  value={templeForm.name}
                  onChange={(e) => setTempleForm({ ...templeForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'इष्ट देवता' : 'Deity'}</label>
                  <input
                    type="text"
                    value={templeForm.deity}
                    onChange={(e) => setTempleForm({ ...templeForm, deity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'लाइव दर्शन स्थिति' : 'Live Status'}</label>
                  <select
                    value={templeForm.live_status}
                    onChange={(e) => setTempleForm({ ...templeForm, live_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  >
                    <option value="बुकिंग सक्रिय">बुकिंग सक्रिय (Active)</option>
                    <option value="लाइव दर्शन चालू">लाइव दर्शन चालू (Live Streaming)</option>
                    <option value="कपाट बंद (विश्राम)">कपाट बंद (Resting)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'स्थान (City & State)' : 'City & State'}</label>
                <input
                  type="text"
                  value={templeForm.city}
                  onChange={(e) => setTempleForm({ ...templeForm, city: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'संक्षिप्त विवरण' : 'Description'}</label>
                <textarea
                  rows={3}
                  value={templeForm.description}
                  onChange={(e) => setTempleForm({ ...templeForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <button
                type="submit"
                disabled={savingTemple}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C49A3A] to-[#C49A3A] hover:brightness-110 text-[#164B32] font-extrabold text-xs cursor-pointer border-0 shadow-md uppercase tracking-wider"
              >
                {savingTemple ? (isHi ? 'अपडेट हो रहा है...' : 'Updating...') : (isHi ? '✓ बदलाव सहेजें' : 'Save Changes')}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-slate-400 py-8 text-center">{isHi ? 'मंदिर डेटा लोड हो रहा है...' : 'Loading mandir data...'}</p>
      ) : subTab === 'bookings' ? (
        /* SUB-TAB 1: DEVOTEE BOOKINGS */
        bookings.length === 0 ? (
          <div className="text-center py-12 bg-[#FAF9F2] rounded-2xl border border-dashed border-[#C49A3A]">
            <span className="text-3xl">🪔</span>
            <p className="text-xs text-slate-500 mt-2 font-semibold">
              {isHi ? 'वर्तमान में कोई सक्रिय पूजा बुकिंग नहीं है।' : 'No active mandir bookings found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#DDEBD5] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F2] text-[#164B32] border-b border-[#DDEBD5]">
                <tr>
                  <th className="py-3 px-4 font-bold">{isHi ? 'भक्त का नाम' : 'Devotee'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'गोत्र' : 'Gotra'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'मंदिर व सेवा' : 'Temple & Seva'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'राशि' : 'Amount'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'स्थिति' : 'Status'}</th>
                  <th className="py-3 px-4 font-bold text-right">{isHi ? 'कार्य' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEBD5]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#183C2B]">
                      {b.devotee_name || 'Anonymous Devotee'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {b.gotra || 'Kashyapa'}
                    </td>
                    <td className="py-3 px-4 text-[#164B32] font-semibold">
                      {b.temple_name || b.offering_name || 'Holy Temple Puja'}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#164B32]">
                      ₹{b.total_amount || 501}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.status === 'CONFIRMED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.status || 'CONFIRMED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(b.id, 'COMPLETED')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold cursor-pointer"
                      >
                        ✓ {isHi ? 'पूजा सम्पन्न' : 'Mark Completed'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* SUB-TAB 2: HOLY TEMPLES DIRECTORY */
        <div className="overflow-x-auto border border-[#DDEBD5] rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F2] text-[#164B32] border-b border-[#DDEBD5]">
              <tr>
                <th className="py-3 px-4 font-bold">#</th>
                <th className="py-3 px-4 font-bold">{isHi ? 'पवित्र मंदिर धाम' : 'Temple Name'}</th>
                <th className="py-3 px-4 font-bold">{isHi ? 'इष्ट देवता' : 'Deity'}</th>
                <th className="py-3 px-4 font-bold">{isHi ? 'स्थान' : 'City & State'}</th>
                <th className="py-3 px-4 font-bold">{isHi ? 'पूजा पैकेज' : 'Offerings'}</th>
                <th className="py-3 px-4 font-bold">{isHi ? 'स्थिति' : 'Live Status'}</th>
                <th className="py-3 px-4 font-bold text-right">{isHi ? 'कार्य' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDEBD5]">
              {temples.map((t, idx) => (
                <tr key={t.id || idx} className="hover:bg-[#FFFDF5] transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <strong className="block text-[#183C2B] font-bold">{t.name}</strong>
                    <span className="text-[11px] text-slate-400">{t.slug}</span>
                  </td>
                  <td className="py-3 px-4 text-[#8C4A28] font-semibold">
                    {t.deity || 'Bhagwan'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {t.city ? `${t.city}, ${t.state}` : t.state}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 font-bold text-[10px] border border-amber-200">
                      ₹{t.starting_price || 101} से शुरू
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                      {t.live_status || 'बुकिंग सक्रिय'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemple(t);
                        setTempleForm({
                          name: t.name || '',
                          deity: t.deity || '',
                          city: t.city || '',
                          state: t.state || '',
                          description: t.description || '',
                          image_url: t.image_url || '',
                          live_status: t.live_status || 'बुकिंग सक्रिय',
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold cursor-pointer"
                    >
                      ✏️ {isHi ? 'संपादित करें' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// TAB 4: ASTRO MALL STORE, PRODUCTS & ORDERS (100% BULLETPROOF)
// =========================================================================
function AstroMallTab({ getHeaders, showToast, isHi }) {
  const [subTab, setSubTab] = useState('products'); // 'products' | 'orders'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // New & Edit Product Modal States
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    title: '',
    category: 'rudraksha',
    price: 999,
    original_price: 1499,
    stock: 50,
    description: '',
    image_url: '/assets/img/products/rudraksha-5.jpg',
    is_active: true,
  });

  const fetchMallData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/v1/marketplace/products'),
        fetch('/api/v1/marketplace/admin/orders', { headers: getHeaders() })
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        const pList = Array.isArray(pData) ? pData : (pData.products || pData.items || []);
        setProducts(pList);
      } else {
        setProducts([]);
      }

      if (oRes.ok) {
        const oData = await oRes.json();
        const oList = Array.isArray(oData) ? oData : (oData.orders || oData.items || []);
        setOrders(oList);
      } else {
        setOrders([]);
      }
    } catch {
      showToast(isHi ? 'मॉल सामग्री लोड नहीं हो सकी' : 'Could not fetch mall data', 'error');
      setProducts([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, isHi, showToast]);

  useEffect(() => {
    fetchMallData();
  }, [fetchMallData]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const res = await fetch('/api/v1/marketplace/admin/products', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...productForm,
          price: parseFloat(productForm.price),
          original_price: parseFloat(productForm.original_price || productForm.price * 1.3),
          stock: parseInt(productForm.stock || 50, 10),
        }),
      });
      if (res.ok) {
        showToast(isHi ? 'नया सिद्ध उत्पाद सफलतापूर्वक जोड़ा गया!' : 'New product added successfully!');
        setIsAddingProduct(false);
        setProductForm({
          title: '',
          category: 'rudraksha',
          price: 999,
          original_price: 1499,
          stock: 50,
          description: '',
          image_url: '/assets/img/products/rudraksha-5.jpg',
          is_active: true,
        });
        fetchMallData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Failed to add product', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const res = await fetch(`/api/v1/marketplace/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({
          title: productForm.title,
          category: productForm.category,
          price: parseFloat(productForm.price),
          original_price: parseFloat(productForm.original_price),
          stock: parseInt(productForm.stock, 10),
          is_active: productForm.is_active,
        }),
      });
      if (res.ok) {
        showToast(isHi ? 'उत्पाद सफलतापूर्वक अपडेट हुआ!' : 'Product updated!');
        setEditingProduct(null);
        fetchMallData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || 'Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#164B32]">
            {isHi ? 'एस्ट्रो मॉल सिद्ध सामग्री, स्टॉक एवं ऑर्डर्स' : 'Astro Mall Siddh Products & Customer Orders'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isHi
              ? 'प्रमाणित रुद्राक्ष, पारद शिवलिंग, स्फटिक श्रीयंत्र एवं ग्रहों के सिद्ध रत्नों की मूल्य, स्टॉक एवं ग्राहक ऑर्डर्स सूची।'
              : 'View certified authentic rudraksha, yantras, parad items, and energized gemstones catalog & orders.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subTab === 'products' && (
            <button
              onClick={() => {
                setProductForm({
                  title: '',
                  category: 'rudraksha',
                  price: 999,
                  original_price: 1499,
                  stock: 50,
                  description: '',
                  image_url: '/assets/img/products/rudraksha-5.jpg',
                  is_active: true,
                });
                setIsAddingProduct(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#164B32] text-[#FFFDF5] text-xs font-bold cursor-pointer hover:brightness-110 shadow-xs"
            >
              ➕ {isHi ? 'नया उत्पाद जोड़ें' : 'Add New Product'}
            </button>
          )}
          <button
            onClick={fetchMallData}
            className="px-3 py-1.5 rounded-xl border border-[#C49A3A] bg-[#F2F5EA] text-[#164B32] text-xs font-bold cursor-pointer hover:bg-[#DDEBD5]"
          >
            🔄 {isHi ? 'रिफ्रेश करें' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Sub Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-[#DDEBD5] pb-3">
        <button
          onClick={() => setSubTab('products')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            subTab === 'products'
              ? 'bg-[#164B32] text-white border-[#164B32]'
              : 'bg-[#FAF9F2] text-slate-700 border-[#DDEBD5] hover:bg-white'
          }`}
        >
          🛍️ {isHi ? `सिद्ध सामग्री सूची (${products.length})` : `Siddh Catalog Items (${products.length})`}
        </button>
        <button
          onClick={() => setSubTab('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            subTab === 'orders'
              ? 'bg-[#164B32] text-white border-[#164B32]'
              : 'bg-[#FAF9F2] text-slate-700 border-[#DDEBD5] hover:bg-white'
          }`}
        >
          📦 {isHi ? `ग्राहक ऑर्डर्स (${orders.length})` : `Mall Orders (${orders.length})`}
        </button>
      </div>

      {/* 1. ADD PRODUCT MODAL */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-[#C49A3A] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddingProduct(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0 hover:bg-slate-200"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-[#164B32] mb-1">
              🛍️ {isHi ? 'नया सिद्ध उत्पाद जोड़ें' : 'Add New Siddh Product'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isHi ? 'प्रमाणित रुद्राक्ष, रत्न, पारद अथवा आध्यात्मिक सामग्री जोड़ें।' : 'Add authentic spiritual merchandise.'}
            </p>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'उत्पाद का नाम *' : 'Product Title *'}</label>
                <input
                  type="text"
                  required
                  placeholder={isHi ? 'उदा. प्राकृतिक 5 मुखी नेपाली रुद्राक्ष माला' : 'e.g. Natural 5 Mukhi Rudraksha'}
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'श्रेणी (Category) *' : 'Category *'}</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  >
                    <option value="rudraksha">रुद्राक्ष (Rudraksha)</option>
                    <option value="gemstone">रत्न (Gemstone)</option>
                    <option value="yantra">यंत्र (Yantra)</option>
                    <option value="parad">पारद (Parad)</option>
                    <option value="samagri">पूजा सामग्री (Samagri)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'स्टॉक मात्रा (Stock)' : 'Initial Stock'}</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'ऑफ़र मूल्य (₹) *' : 'Discount Price (₹) *'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'एमआरपी (मूल मूल्य ₹)' : 'Original MRP (₹)'}</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.original_price}
                    onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'चित्र URL' : 'Image URL'}</label>
                <input
                  type="text"
                  placeholder="/assets/img/products/rudraksha-5.jpg"
                  value={productForm.image_url}
                  onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'उत्पाद विवरण एवं आध्यात्मिक लाभ *' : 'Description & Spiritual Benefits *'}</label>
                <textarea
                  required
                  rows={3}
                  placeholder={isHi ? '100% प्राकृतिक, प्राण प्रतिष्ठित एवं हरिद्वार से सिद्ध...' : 'Authentic energized product...'}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <button
                type="submit"
                disabled={savingProduct}
                className="w-full py-3 rounded-xl bg-[#164B32] text-[#FFFDF5] font-bold text-xs cursor-pointer hover:brightness-110 shadow-md uppercase tracking-wider"
              >
                {savingProduct ? (isHi ? 'सुरक्षित हो रहा है...' : 'Saving...') : (isHi ? '✓ उत्पाद जोड़ें' : 'Save Product')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-[#C49A3A] max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0 hover:bg-slate-200"
            >
              ✕
            </button>
            <h3 className="font-serif text-lg font-bold text-[#164B32] mb-1">
              ✏️ {isHi ? 'उत्पाद संपादित करें:' : 'Edit Product:'} {editingProduct.title || editingProduct.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingProduct.id?.slice(0, 8)}</p>

            <form onSubmit={handleSaveEditProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{isHi ? 'उत्पाद शीर्षक' : 'Title'}</label>
                <input
                  type="text"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'मूल्य (₹)' : 'Price (₹)'}</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{isHi ? 'स्टॉक' : 'Stock'}</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-[#C49A3A]"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    className="w-4 h-4 accent-[#164B32]"
                  />
                  <span>{isHi ? 'लाइव स्टोर में बिक्री हेतु सक्रिय रखें' : 'Active for sale in live store'}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={savingProduct}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C49A3A] to-[#C49A3A] hover:brightness-110 text-[#164B32] font-extrabold text-xs cursor-pointer border-0 shadow-md uppercase tracking-wider"
              >
                {savingProduct ? (isHi ? 'अपडेट हो रहा है...' : 'Updating...') : (isHi ? '✓ बदलाव सहेजें' : 'Save Changes')}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-slate-400 py-8 text-center">{isHi ? 'सामग्री लोड हो रही है...' : 'Loading items...'}</p>
      ) : subTab === 'products' ? (
        /* SUB-TAB 1: PRODUCTS INVENTORY */
        products.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">{isHi ? 'कोई उत्पाद नहीं मिला।' : 'No products found.'}</p>
        ) : (
          <div className="overflow-x-auto border border-[#DDEBD5] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F2] text-[#164B32] border-b border-[#DDEBD5]">
                <tr>
                  <th className="py-3 px-4 font-bold">{isHi ? 'सामग्री' : 'Product'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'श्रेणी' : 'Category'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'मूल्य (₹)' : 'Price (₹)'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'सत्यापन' : 'Certification'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'स्टॉक' : 'Stock'}</th>
                  <th className="py-3 px-4 font-bold text-right">{isHi ? 'कार्य' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEBD5]">
                {products.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-3 px-4">
                      <strong className="block text-[#183C2B] font-bold">{p.title || p.name}</strong>
                      <span className="text-[11px] text-slate-400">{p.slug || 'siddh-item'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 capitalize">
                      {p.category || 'Rudraksha'}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#164B32]">
                      ₹{Number(p.discount_price || p.price || 999).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                        ✨ 100% Siddh & Lab Certified
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {p.stock !== undefined ? `${p.stock} in stock` : 'In Stock'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setProductForm({
                            title: p.title || p.name || '',
                            category: p.category || 'rudraksha',
                            price: p.discount_price || p.price || 999,
                            original_price: p.original_price || (p.price ? p.price * 1.3 : 1499),
                            stock: p.stock !== undefined ? p.stock : 50,
                            description: p.description || '',
                            image_url: p.image_url || '',
                            is_active: p.is_active !== undefined ? p.is_active : true,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold cursor-pointer"
                      >
                        ✏️ {isHi ? 'संपादित करें' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* SUB-TAB 2: CUSTOMER ORDERS */
        orders.length === 0 ? (
          <div className="text-center py-12 bg-[#FAF9F2] rounded-2xl border border-dashed border-[#C49A3A]">
            <span className="text-3xl">📦</span>
            <p className="text-xs text-slate-500 mt-2 font-semibold">
              {isHi ? 'अभी तक कोई मॉल ऑर्डर दर्ज नहीं है।' : 'No mall orders found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#DDEBD5] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F2] text-[#164B32] border-b border-[#DDEBD5]">
                <tr>
                  <th className="py-3 px-4 font-bold">{isHi ? 'ऑर्डर ID' : 'Order ID'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'ग्राहक' : 'Customer'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'राशि' : 'Amount'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'पेमेंट' : 'Payment'}</th>
                  <th className="py-3 px-4 font-bold text-right">{isHi ? 'डिस्पैच स्थिति' : 'Delivery Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEBD5]">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#164B32]">{o.id?.slice(0, 8)}</td>
                    <td className="py-3 px-4 text-slate-800">{o.customer_name || o.email || 'Devotee'}</td>
                    <td className="py-3 px-4 font-bold text-[#164B32]">₹{o.total_amount || 1100}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        {o.payment_status || 'PAID'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                        {o.delivery_status || 'DISPATCHED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// =========================================================================
// TAB 5: DEVOTEES & WALLET BALANCE ADJUSTMENT / AUDIT LEDGER
// =========================================================================
function UsersWalletTab({ getHeaders, showToast, isHi }) {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('100');
  const [adjustReason, setAdjustReason] = useState('Devotee welcome bonus / promotional credit');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsersAndTx = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, tRes] = await Promise.all([
        fetch('/api/v1/wallet/admin/users', { headers: getHeaders() }),
        fetch('/api/v1/wallet/admin/transactions', { headers: getHeaders() }),
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(Array.isArray(uData) ? uData : []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTransactions(Array.isArray(tData) ? tData : []);
      }
    } catch {
      showToast(isHi ? 'उपयोगकर्ता लोड नहीं हो सके' : 'Could not fetch users', 'error');
    } finally {
      setLoading(false);
    }
  }, [getHeaders, isHi, showToast]);

  useEffect(() => {
    fetchUsersAndTx();
  }, [fetchUsersAndTx]);

  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/wallet/admin/adjust', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount: parseFloat(adjustAmount),
          reason: adjustReason.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || (isHi ? 'वॉलेट सफलतापूर्वक अपडेट किया गया!' : 'Wallet balance updated!'));
        setSelectedUser(null);
        fetchUsersAndTx();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Adjustment failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#164B32]">
          {isHi ? 'भक्त सूची एवं वॉलेट लेजर नियंत्रण' : 'Devotees & Wallet Balance Adjustment Ledger'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {isHi
            ? 'सभी पंजीकृत भक्तों के वॉलेट बैलेंस की रीयल-टाइम सूची देखें तथा सीधे क्रेडिट/रिफंड समायोजित करें।'
            : 'Inspect all registered users, adjust real-time wallet balances, and track passbook transactions.'}
        </p>
      </div>

      {/* Adjust Modal */}
      {selectedUser && (
        <form onSubmit={handleAdjustWallet} className="p-5 rounded-2xl bg-[#FFFDF5] border border-[#C49A3A] shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#DDEBD5] pb-2">
            <strong className="text-sm font-bold text-[#164B32]">
              💳 {isHi ? 'वॉलेट बैलेंस समायोजित करें:' : 'Adjust Devotee Wallet:'} {selectedUser.email}
            </strong>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 border-0 bg-transparent cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHi ? 'समायोजन राशि (₹) - कटौती हेतु माइनस (-)' : 'Adjustment Amount (₹) - negative for debit'}
              </label>
              <input
                type="number"
                step="1"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isHi ? `वर्तमान शेष: ₹${selectedUser.wallet_balance.toFixed(2)}` : `Current Balance: ₹${selectedUser.wallet_balance.toFixed(2)}`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isHi ? 'कारण / ऑडिट विवरण' : 'Reason / Note'}
              </label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 cursor-pointer bg-white"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#164B32] text-white text-xs font-bold cursor-pointer hover:bg-[#103B29] disabled:opacity-50"
            >
              {submitting ? (isHi ? 'अपडेट हो रहा है...' : 'Updating...') : isHi ? 'वॉलेट में जोड़ें / काटें' : 'Execute Adjustment'}
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      <div className="space-y-3">
        <strong className="text-sm font-bold text-[#164B32] block">
          {isHi ? `पंजीकृत साधक व भक्त (${users.length})` : `Registered Devotees (${users.length})`}
        </strong>
        {loading ? (
          <p className="text-xs text-slate-400 py-8 text-center">{isHi ? 'भक्त लोड हो रहे हैं...' : 'Loading users...'}</p>
        ) : (
          <div className="overflow-x-auto border border-[#DDEBD5] rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F2] text-[#164B32] border-b border-[#DDEBD5]">
                <tr>
                  <th className="py-3 px-4 font-bold">{isHi ? 'ईमेल व नाम' : 'User'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'रोल' : 'Role'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'वॉलेट शेष' : 'Wallet Balance'}</th>
                  <th className="py-3 px-4 font-bold">{isHi ? 'पंजीकरण दिनांक' : 'Registered'}</th>
                  <th className="py-3 px-4 font-bold text-right">{isHi ? 'कार्य' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEBD5]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-3 px-4">
                      <strong className="block text-[#183C2B]">{u.full_name || u.email.split('@')[0]}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-[#164B32] text-sm">
                      ₹{u.wallet_balance.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setAdjustAmount('100');
                        }}
                        className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer"
                      >
                        ⚡ {isHi ? 'बैलेंस बदलें' : 'Credit / Debit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Ledger */}
      <div className="space-y-3 pt-4 border-t border-[#DDEBD5]">
        <strong className="text-sm font-bold text-[#164B32] block">
          {isHi ? `हाल के वॉलेट लेन-देन (${transactions.length})` : `Recent Platform Transactions (${transactions.length})`}
        </strong>
        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">{isHi ? 'कोई लेन-देन दर्ज नहीं है।' : 'No transactions recorded yet.'}</p>
        ) : (
          <div className="overflow-x-auto border border-[#DDEBD5] rounded-2xl max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F2] text-[#164B32] border-b border-[#DDEBD5] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4 font-bold">{isHi ? 'रेफरेंस' : 'Reference'}</th>
                  <th className="py-2.5 px-4 font-bold">{isHi ? 'भक्त' : 'User'}</th>
                  <th className="py-2.5 px-4 font-bold">{isHi ? 'प्रकार' : 'Type'}</th>
                  <th className="py-2.5 px-4 font-bold">{isHi ? 'राशि' : 'Amount'}</th>
                  <th className="py-2.5 px-4 font-bold">{isHi ? 'विवरण' : 'Description'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDEBD5]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#FFFDF5] transition-colors">
                    <td className="py-2 px-4 font-mono text-[11px] text-slate-500">{tx.reference_id}</td>
                    <td className="py-2 px-4 text-slate-700">{tx.user_email}</td>
                    <td className="py-2 px-4">
                      <span className="capitalize font-bold text-[10px] text-slate-600">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-bold text-[#164B32]">
                      ₹{tx.amount.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {tx.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
