import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import WalletModal, { TransactionList } from '../../components/WalletModal/WalletModal.jsx';
import { useWallet } from '../../components/WalletModal/walletApi.js';

export default function WalletPage() {
  const { openAuthModal } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const wallet = useWallet(true);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);
  // Pick up a top-up made in the modal.
  useEffect(() => { if (!isModalOpen) wallet.refresh(); }, [isModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B]">My Astro Wallet</h1>
            <p className="text-xs text-slate-500">Credits for astrologer chat and calls, temple sevas and Astro Mall orders.</p>
          </div>
          <button type="button" onClick={() => (wallet.signedIn ? setIsModalOpen(true) : openAuthModal('login'))}
            className="px-5 py-2.5 rounded-full bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:brightness-110" style={{ minHeight: 44 }}>
            {wallet.signedIn ? '+ Add Funds' : 'Sign in'}
          </button>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3E0B18 0%, #5B1024 60%, #20040A 100%)', border: '1px solid #D9A441' }}>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#EFD4A0]">Available Balance</span>
          <div className="text-4xl sm:text-5xl font-serif font-extrabold mt-2 mb-2 text-[#FFFDF8]" aria-live="polite">
            {!wallet.signedIn ? '—' : wallet.loading ? '…' : `₹${wallet.balance.toFixed(2)}`}
          </div>
          <p className="text-xs text-amber-200/90">{wallet.signedIn ? 'Your balance is kept securely on our servers.' : 'Sign in to see your balance.'}</p>
        </div>

        {wallet.error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{wallet.error}</p>}

        <div className="bg-white p-6 rounded-3xl border border-[#E7E2D8] shadow-sm">
          <h2 className="font-serif text-lg font-bold text-[#1E1B4B] mb-4">Transaction History</h2>
          <div className="space-y-3">
            <TransactionList rows={wallet.rows} roomy empty={wallet.signedIn ? 'No transactions yet.' : 'Sign in to see your transactions.'} />
          </div>
        </div>
      </div>

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
