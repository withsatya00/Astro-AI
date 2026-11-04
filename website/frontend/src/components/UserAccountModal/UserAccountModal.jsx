import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function UserAccountModal() {
  const { currentUser, isAccountModalOpen, closeUserAccountModal, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAccountModalOpen || !currentUser) return null;

  const displayName = currentUser.full_name || currentUser.name || currentUser.email.split('@')[0];
  const initial = (displayName.charAt(0) || 'U').toUpperCase();

  const handleNavigate = (path) => {
    closeUserAccountModal();
    navigate(path);
  };

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeUserAccountModal();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeUserAccountModal}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer border-0 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Profile Masthead */}
        <div className="bg-gradient-to-br from-[#3E0B18] via-[#2A050F] to-[#1A0309] text-white p-6 pt-8 text-center shrink-0">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-[#3E0B18] font-bold text-2xl flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-white/80">
            {initial}
          </div>
          <h2 className="font-serif text-xl font-bold leading-snug">
            {displayName}
          </h2>
          <p className="text-xs text-[#FDE68A] mt-0.5">{currentUser.email}</p>
          {currentUser.phone && (
            <p className="text-[11px] text-white/70 font-mono mt-0.5">📞 +91 {currentUser.phone}</p>
          )}

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-[11px] font-semibold border border-white/20">
            <span>✓</span> <span>Verified Devotee Account</span>
          </div>
        </div>

        {/* Account Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Wallet Balance Card */}
          <div className="p-4 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC9] flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Wallet Balance</span>
              <strong className="text-xl font-extrabold text-[#3E0B18]">
                {currentUser.wallet_balance !== undefined ? `₹${Number(currentUser.wallet_balance).toFixed(2)}` : '₹150.00'}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => handleNavigate('/wallet')}
              className="px-4 py-2 rounded-xl bg-[#3E0B18] hover:bg-[#520F20] text-white text-xs font-bold cursor-pointer border-0 shadow-xs transition-all"
            >
              + Recharge Wallet
            </button>
          </div>

          {/* Action Links */}
          <div className="space-y-1.5 text-xs font-semibold text-[#1E1B4B]">
            <button
              type="button"
              onClick={() => handleNavigate('/astrologers')}
              className="w-full p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center justify-between text-left cursor-pointer border-0 bg-transparent text-inherit"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🔮</span>
                <span>Consult Astrologers (चैट एवं कॉल)</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/mandir-seva/chadhava')}
              className="w-full p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center justify-between text-left cursor-pointer border-0 bg-transparent text-inherit"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🪔</span>
                <span>Mandir Seva &amp; Daily Chadhava</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/astro-mall')}
              className="w-full p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center justify-between text-left cursor-pointer border-0 bg-transparent text-inherit"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">🛍️</span>
                <span>Astro Mall (सिद्ध रुद्राक्ष एवं यंत्र)</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('/calculators/kundli')}
              className="w-full p-3 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-center justify-between text-left cursor-pointer border-0 bg-transparent text-inherit"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">📜</span>
                <span>Free Kundli &amp; Planetary Analysis</span>
              </div>
              <span className="text-slate-400">›</span>
            </button>
          </div>

          {/* Sign Out CTA */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>🚪 Sign Out (लॉग आउट)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
