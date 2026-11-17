import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWallet } from '../WalletModal/walletApi.js';
import { useLang } from '../../pages/BhaktiPage/lang.js';

export default function UserAccountModal() {
  const { currentUser, isAccountModalOpen, closeUserAccountModal, logout } = useAuth();
  const wallet = useWallet(isAccountModalOpen);
  const navigate = useNavigate();
  const lang = useLang();
  const isHi = lang === 'hi';

  if (!isAccountModalOpen || !currentUser) return null;

  const displayName = currentUser.full_name || currentUser.name || currentUser.email.split('@')[0];
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  // Read saved profile details from localStorage
  const savedGotra = localStorage.getItem('astro_profile_gotra') || '';
  const savedRashi = localStorage.getItem('astro_profile_rashi') || '';

  const handleNavigate = (path) => {
    closeUserAccountModal();
    navigate(path);
  };

  const handleLogoutClick = () => {
    const confirmText = isHi
      ? 'क्या आप वास्तव में अपने खाते से लॉग आउट करना चाहते हैं?'
      : 'Are you sure you want to sign out?';
    if (window.confirm(confirmText)) {
      logout();
    }
  };

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeUserAccountModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-account-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDEBD5] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeUserAccountModal}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-sm font-bold cursor-pointer border-0 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Profile Masthead (Sacred Maroon & Gold Matching AuthModal) */}
        <div className="bg-gradient-to-b from-[#164B32] to-[#25050C] text-[#FFFDF8] pt-7 pb-6 px-6 text-center shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F2]/10 border border-[#C49A3A]/50 text-[#C49A3A] mx-auto flex items-center justify-center text-2xl font-serif mb-2.5 shadow-inner">
            ॐ
          </div>
          <div className="w-16 h-16 rounded-full bg-[#C49A3A] text-[#164B32] font-bold text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg border-2 border-white/60">
            {initial}
          </div>
          <h2 id="user-account-title" className="font-serif text-xl font-bold text-[#FFFDF8] leading-tight">
            {displayName}
          </h2>
          <p className="text-xs text-[#FDE68A] mt-0.5">{currentUser.email}</p>
          {currentUser.phone && (
            <p className="text-[11px] text-white/70 font-mono mt-0.5">📞 +91 {currentUser.phone}</p>
          )}

          <div className="mt-2.5 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/10 text-emerald-300 text-[11px] font-semibold border border-white/20">
              <span>✓</span>
              <span>{isHi ? 'सत्यापित साधक' : 'Verified Devotee'}</span>
            </span>
            {savedGotra && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-400/20 text-[#FDE68A] text-[11px] font-medium border border-amber-300/30">
                {isHi ? 'गोत्र: ' : 'Gotra: '}{savedGotra}
              </span>
            )}
          </div>
        </div>

        {/* Account Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Live Wallet Balance Card - 100% Synced with Navbar */}
          <div className="p-4 rounded-2xl bg-[#FFFDF5] border border-[#E8DFC9] flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isHi ? 'वॉलेट बैलेंस' : 'Wallet Balance'}
              </span>
              <strong className="text-xl font-extrabold text-[#164B32]" aria-live="polite">
                {wallet.loading ? '…' : `₹${Number(wallet.balance || 0).toFixed(2)}`}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigate('/wallet')}
                className="px-3.5 py-2 rounded-xl bg-[#164B32] hover:bg-[#520F20] text-white text-xs font-bold cursor-pointer border-0 shadow-xs transition-all"
              >
                {isHi ? '+ रिचार्ज करें' : '+ Recharge'}
              </button>
            </div>
          </div>

          {/* Primary CTA: View Full Profile */}
          <button
            type="button"
            onClick={() => handleNavigate('/profile')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] hover:brightness-105 text-[#183C2B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <span>👤</span>
            <span>{isHi ? 'सम्पूर्ण साधक प्रोफ़ाइल देखें ➔' : 'View Full Devotee Profile ➔'}</span>
          </button>

          {/* Admin Dashboard Shortcut if Admin */}
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleNavigate('/admin')}
              className="w-full p-2.5 rounded-xl bg-[#FFF8E7] hover:bg-[#FDF0CD] border border-[#C49A3A] text-[#164B32] transition-colors flex items-center justify-between text-left cursor-pointer font-bold text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <span>{isHi ? 'मास्टर एडमिन कंट्रोल पैनल' : 'Master Admin Control Panel'}</span>
              </div>
              <span className="text-[#B3832B]">›</span>
            </button>
          )}

          {/* Activity & Service Links */}
          <div className="space-y-1.5 text-xs font-semibold text-[#183C2B]">
            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="w-full p-3 rounded-xl hover:bg-[#FAF9F2] transition-colors flex items-center justify-between text-left cursor-pointer border-0 bg-transparent text-inherit"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🔮</span>
                <span>{isHi ? 'मेरे परामर्श एवं चैट इतिहास' : 'My Consultations & History'}</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/mandir-seva/chadhava')}
              className="w-full p-3 rounded-xl hover:bg-[#FAF9F2] transition-colors flex items-center justify-between text-left cursor-pointer border-0 bg-transparent text-inherit"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🪔</span>
                <span>{isHi ? 'मंदिर सेवा एवं दैनिक चढ़ावा' : 'Mandir Seva & Holy Offerings'}</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/my-orders')}
              className="w-full p-3 rounded-xl hover:bg-[#FAF9F2] transition-colors flex items-center justify-between text-left cursor-pointer border-0 bg-transparent text-inherit"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🛍️</span>
                <span>{isHi ? 'एस्ट्रो मॉल ऑर्डर्स एवं ट्रैकिंग' : 'Astro Mall Orders & Tracking'}</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/profile')}
              className="w-full p-3 rounded-xl hover:bg-[#FAF9F2] transition-colors flex items-center justify-between text-left cursor-pointer border-0 bg-transparent text-inherit"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📜</span>
                <span>{isHi ? 'वैदिक कुंडली एवं जन्म विवरण' : 'Vedic Kundli & Birth Profile'}</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>
          </div>

          {/* Sign Out CTA (Sacred & Consistent) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>🚪</span>
              <span>{isHi ? 'खाते से लॉग आउट करें' : 'Sign Out of Account'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
