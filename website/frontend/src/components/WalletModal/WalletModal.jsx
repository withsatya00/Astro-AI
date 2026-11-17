import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWallet, recharge, MIN_RECHARGE, MAX_RECHARGE } from './walletApi.js';

const PACKS = [100, 250, 500, 1000, 2100];
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Transaction rows are shared with the wallet page.
export function TransactionList({ rows, empty, roomy }) {
  if (!rows.length) return <p className="text-center text-xs text-slate-400 py-6">{empty}</p>;
  return rows.map((tx) => (
    <div key={tx.id} className={`flex items-center justify-between ${roomy ? 'p-3.5 rounded-2xl' : 'p-3 rounded-xl'} bg-[#FFFDF7] border border-[#DDEBD5] text-xs`}>
      <div>
        <strong className="text-[#183C2B] block text-xs">{tx.title}</strong>
        <small className="text-slate-500 text-[11.5px]">{tx.date} • {tx.ref}</small>
      </div>
      <span className={`font-extrabold text-sm ${tx.type === 'credit' ? 'text-emerald-700' : 'text-rose-600'}`}>
        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
      </span>
    </div>
  ));
}

export default function WalletModal({ isOpen, onClose }) {
  const { currentUser, openAuthModal } = useAuth();
  const wallet = useWallet(isOpen);
  const [selectedPack, setSelectedPack] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [activeTab, setActiveTab] = useState('recharge');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  if (!isOpen) return null;

  const amount = customAmount ? Number(customAmount) : selectedPack;
  const invalid = !Number.isFinite(amount) || amount < MIN_RECHARGE || amount > MAX_RECHARGE;

  const signIn = () => { onClose(); openAuthModal('login'); };

  const handleRecharge = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (invalid) { setMsg({ ok: false, text: `Enter an amount between ₹${MIN_RECHARGE} and ₹${MAX_RECHARGE.toLocaleString('en-IN')}.` }); return; }
    setBusy(true);
    try {
      const r = await recharge(amount, currentUser);
      setMsg({ ok: true, text: `₹${r.amount_added ?? amount} added to your wallet.` });
      setCustomAmount('');
      await wallet.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
      if (err.status === 401) wallet.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div style={{ zIndex: 9999 }} className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Astro Wallet">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDEBD5] overflow-hidden max-h-[92vh] overflow-y-auto" style={{ animation: 'fadeInScale 0.2s ease-out' }}>
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm" aria-hidden="true">🪙</span>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#183C2B] leading-none">Astro Wallet</h3>
              <small className="text-slate-500 text-[11.5px]">Consultations, sevas and Astro Mall</small>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0" aria-label="Close">✕</button>
        </div>

        <div className="p-6 pt-4">
          <div className="p-5 rounded-2xl border border-amber-300 text-white relative overflow-hidden mb-5" style={{ background: 'linear-gradient(135deg, #164B32 0%, #5B1024 60%, #20040A 100%)' }}>
            <span className="text-xs uppercase font-extrabold tracking-wider text-[#EFD4A0]/90 block mb-2">Available balance</span>
            <div className="text-3xl sm:text-4xl font-extrabold font-serif text-[#FFFDF8] tracking-tight" aria-live="polite">
              {wallet.loading ? '…' : money(wallet.balance)}
            </div>
            <p className="text-[11.5px] text-amber-200/90 mt-1">Use it for astrologer chat and calls, temple sevas and Astro Mall orders.</p>
          </div>

          {!wallet.signedIn ? (
            <div className="text-center py-4">
              <p className="text-sm text-slate-600 mb-3">Sign in to see your balance and add money.</p>
              <button type="button" onClick={signIn} className="px-6 py-3 rounded-xl bg-[#164B32] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider cursor-pointer border-0">Sign in</button>
            </div>
          ) : (
            <>
              {wallet.error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-3">{wallet.error}</p>}
              {wallet.testMode && <p role="note" className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3">Test mode: no real money is charged and the credit is only for testing.</p>}

              <div className="flex border-b border-slate-200 mb-4" role="tablist">
                {[['recharge', 'Add money'], ['history', 'Transaction history']].map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)}
                    className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent border-0 ${activeTab === id ? 'border-[#164B32] text-[#164B32]' : 'border-transparent text-slate-500'}`}
                    style={{ minHeight: 40 }}>{label}</button>
                ))}
              </div>

              {activeTab === 'recharge' ? (
                <form onSubmit={handleRecharge} className="space-y-4">
                  <fieldset className="border-0 p-0 m-0">
                    <legend className="block text-xs font-bold text-[#183C2B] mb-2">Choose an amount</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {PACKS.map((p) => {
                        const on = amount === p && !customAmount;
                        return (
                          <button key={p} type="button" aria-pressed={on} onClick={() => { setSelectedPack(p); setCustomAmount(''); }}
                            className={`py-3 px-1 rounded-xl border text-center font-serif text-sm font-bold cursor-pointer ${on ? 'bg-amber-50 border-[#164B32] text-[#164B32]' : 'bg-white border-slate-200 text-[#183C2B] hover:border-amber-300'}`}
                            style={{ minHeight: 44 }}>₹{p}</button>
                        );
                      })}
                    </div>
                    <input type="number" inputMode="numeric" aria-label="Custom amount" placeholder={`Or enter another amount (min ₹${MIN_RECHARGE})`} value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)} className="w-full mt-2.5 p-3 text-sm rounded-xl border border-slate-200 outline-none" min={MIN_RECHARGE} max={MAX_RECHARGE} />
                  </fieldset>

                  {!wallet.available && <p role="alert" className="text-xs text-rose-700">Online payments are not available right now. Please try again later.</p>}
                  {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-xs rounded-xl px-3 py-2 border ${msg.ok ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>{msg.text}</p>}

                  <button type="submit" disabled={busy || invalid || !wallet.available}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs uppercase tracking-wider mt-2 cursor-pointer border-0 shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                    {busy ? 'Processing…' : `Add ₹${Number.isFinite(amount) ? amount : 0} →`}
                  </button>
                  <p className="text-[11.5px] text-slate-500 text-center">Payments are handled by Razorpay (UPI, cards, net banking). Your wallet is credited only after the payment is confirmed.</p>
                </form>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <TransactionList rows={wallet.rows} empty="No transactions yet." />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
