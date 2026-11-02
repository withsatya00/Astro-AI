import React, { useState, useEffect } from 'react';
import WalletModal from '../../components/WalletModal/WalletModal.jsx';

export default function WalletPage() {
  const [balance, setBalance] = useState(150);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const saved = localStorage.getItem('astro_wallet_balance');
    if (saved !== null) {
      setBalance(Number(saved));
    }
    const savedTx = localStorage.getItem('astro_wallet_transactions');
    if (savedTx) {
      try {
        setTransactions(JSON.parse(savedTx));
      } catch (_) {}
    }
  }, [isModalOpen]);

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B]">My Astro Wallet</h1>
            <p className="text-xs text-slate-500">Manage your credits for instant astrologer chat &amp; calls.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:brightness-110"
          >
            + Add Funds
          </button>
        </div>

        {/* Balance Card */}
        <div
          className="p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #3E0B18 0%, #5B1024 60%, #20040A 100%)',
            border: '1px solid #D9A441',
          }}
        >
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#EFD4A0]">Available Balance</span>
          <div className="text-4xl sm:text-5xl font-serif font-extrabold mt-2 mb-2 text-[#FFFDF8]">
            ₹{balance.toFixed(2)}
          </div>
          <p className="text-xs text-amber-200/80">100% Secure &amp; Encrypted • Instant live balance update</p>
        </div>

        {/* Transaction History */}
        <div className="bg-white p-6 rounded-3xl border border-[#E7E2D8] shadow-sm">
          <h2 className="font-serif text-lg font-bold text-[#1E1B4B] mb-4">Transaction History</h2>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No recent transactions found.</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFFDF7] border border-[#E7E2D8] text-xs"
                >
                  <div>
                    <strong className="text-[#1E1B4B] block text-xs">{tx.title}</strong>
                    <small className="text-slate-400 text-[10px]">{tx.date} • {tx.id}</small>
                  </div>
                  <span
                    className={`font-extrabold text-sm ${
                      tx.type === 'credit' ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'credit' ? `+₹${tx.amount}` : `-₹${tx.amount}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
