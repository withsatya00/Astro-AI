import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import TransactionItem from './TransactionItem.jsx';

const RECHARGE_PACKS = [
  { amount: 100, tag: '' },
  { amount: 250, tag: 'Most Popular' },
  { amount: 500, tag: 'Best Value' },
  { amount: 1000, tag: '' },
  { amount: 2100, tag: '' },
];

const PAYMENT_METHOD_LABELS = { upi: 'UPI', cards: 'Card', netbanking: 'Net Banking' };

export default function WalletModal({ isOpen, onClose }) {
  const { balance, transactions, isTestMode, recharge } = useWallet();
  const { showToast } = useToast();
  const [selectedPack, setSelectedPack] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [activeTab, setActiveTab] = useState('recharge');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const rechargePacks = RECHARGE_PACKS;
  const effectiveAmount = customAmount ? Number(customAmount) : selectedPack;

  const handleRecharge = async (e) => {
    e.preventDefault();
    if (!effectiveAmount || effectiveAmount < 50) {
      showToast('Minimum recharge amount is ₹50.', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await recharge(effectiveAmount, `${PAYMENT_METHOD_LABELS[paymentMethod]}${isTestMode ? ' (Test Mode)' : ''}`);
      showToast(`₹${effectiveAmount} added to your wallet.`, 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Wallet recharge failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] overflow-hidden"
        style={{ animation: 'fadeInScale 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              🪙
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1E1B4B] leading-none">Astro Wallet</h3>
              <small className="text-slate-400 text-[11px]">Instant live consultations &amp; sevas</small>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Current Balance Card */}
        <div className="p-6 pt-4">
          <div
            className="p-5 rounded-2xl border border-amber-300 text-white relative overflow-hidden mb-5"
            style={{
              background: 'linear-gradient(135deg, #3E0B18 0%, #5B1024 60%, #20040A 100%)',
            }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#EFD4A0]/90">
                Available Consultation Balance
              </span>
              <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-serif text-[#FFFDF8] tracking-tight">
              ₹{balance.toFixed(2)}
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1">
              Can be used for Live Astrologer Chat, Audio Calling &amp; Temple Chadhava.
            </p>
          </div>

          {/* Subtabs: Recharge vs Transaction History */}
          <div className="flex border-b border-slate-200 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('recharge')}
              className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent border-0 ${
                activeTab === 'recharge' ? 'border-[#3E0B18] text-[#3E0B18]' : 'border-transparent text-slate-400'
              }`}
            >
              Add Money (Recharge)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent border-0 ${
                activeTab === 'history' ? 'border-[#3E0B18] text-[#3E0B18]' : 'border-transparent text-slate-400'
              }`}
            >
              Transaction History
            </button>
          </div>

          {activeTab === 'recharge' ? (
            <form onSubmit={handleRecharge} className="space-y-4">
              {/* Preset Pack Cards */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-2">Select Recharge Pack</label>
                <div className="grid grid-cols-3 gap-2">
                  {rechargePacks.map((pack) => {
                    const isSelected = effectiveAmount === pack.amount && !customAmount;
                    return (
                      <div
                        key={pack.amount}
                        onClick={() => {
                          setSelectedPack(pack.amount);
                          setCustomAmount('');
                        }}
                        className={`pt-3.5 pb-2 px-1 rounded-xl border text-center transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-amber-50/90 border-[#3E0B18] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        {pack.tag && (
                          <span
                            className="absolute px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap"
                            style={{
                              backgroundColor: '#3E0B18',
                              color: '#F8D882',
                              left: '50%',
                              top: '-8px',
                              transform: 'translateX(-50%)',
                              lineHeight: 1.1,
                            }}
                          >
                            {pack.tag}
                          </span>
                        )}
                        <span className="font-serif text-sm font-bold text-[#1E1B4B] block leading-tight">₹{pack.amount}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2.5">
                  <input
                    type="number"
                    placeholder="Or enter custom amount (Min. ₹50)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none"
                    min="50"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1.5">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR', icon: '⚡' },
                    { id: 'cards', label: 'Cards', icon: '💳' },
                    { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
                  ].map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        paymentMethod === pm.id
                          ? 'bg-[#3E0B18] text-white border-[#3E0B18]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{pm.icon}</span>
                      <span>{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#1E1B4B] font-extrabold text-xs uppercase tracking-wider mt-2 cursor-pointer border-0 shadow-md hover:brightness-105 disabled:opacity-50"
              >
                {isProcessing ? 'Processing Secure Recharge...' : `Recharge ₹${effectiveAmount} Now →`}
              </button>
            </form>
          ) : (
            /* Transaction History List */
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {transactions.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No transactions recorded yet.</p>
              ) : (
                transactions.map((tx) => <TransactionItem key={tx.id} tx={tx} />)
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
