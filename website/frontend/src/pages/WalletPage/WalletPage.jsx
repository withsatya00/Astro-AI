import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWallet, recharge, MIN_RECHARGE, MAX_RECHARGE } from '../../components/WalletModal/walletApi.js';
import { useLang } from '../BhaktiPage/lang.js';

const PACKS = [
  { amount: 100, label: '₹100', popular: false },
  { amount: 250, label: '₹250', popular: true },
  { amount: 500, label: '₹500', popular: false },
  { amount: 1000, label: '₹1,000', popular: false },
  { amount: 2100, label: '₹2,100', popular: false },
];

export default function WalletPage() {
  const { currentUser, openAuthModal } = useAuth();
  const wallet = useWallet(true);
  const lang = useLang();
  const isHi = lang === 'hi';

  const [selectedPack, setSelectedPack] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [filter, setFilter] = useState('all'); // all | credit | debit
  const [receiptModalTx, setReceiptModalTx] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const amount = customAmount ? Number(customAmount) : selectedPack;
  const invalid = !Number.isFinite(amount) || amount < MIN_RECHARGE || amount > MAX_RECHARGE;

  const handleRecharge = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!wallet.signedIn) {
      openAuthModal('login');
      return;
    }
    if (invalid) {
      setMsg({
        ok: false,
        text: isHi
          ? `कृपया ₹${MIN_RECHARGE} से ₹${MAX_RECHARGE.toLocaleString('en-IN')} के बीच राशि दर्ज करें।`
          : `Enter an amount between ₹${MIN_RECHARGE} and ₹${MAX_RECHARGE.toLocaleString('en-IN')}.`,
      });
      return;
    }

    setBusy(true);
    try {
      const r = await recharge(amount, currentUser);
      setMsg({
        ok: true,
        text: isHi
          ? `₹${r.amount_added ?? amount} आपके वॉलेट में सफलतापूर्वक जोड़ दिए गए हैं।`
          : `₹${r.amount_added ?? amount} added to your wallet successfully.`,
      });
      setCustomAmount('');
      await wallet.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
      if (err.status === 401) wallet.refresh();
    } finally {
      setBusy(false);
    }
  };

  const filteredRows = (wallet.rows || []).filter((tx) => {
    if (filter === 'credit') return tx.type === 'credit';
    if (filter === 'debit') return tx.type === 'debit';
    return true;
  });

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Breadcrumb & Title */}
        <div>
          <nav className="text-xs text-slate-500 mb-2 flex items-center gap-1.5" aria-label="Breadcrumb">
            <Link to="/" className="text-slate-600 hover:text-[#164B32] no-underline">
              {isHi ? 'होम' : 'Home'}
            </Link>
            <span>›</span>
            <span className="text-[#164B32] font-bold">
              {isHi ? 'एस्ट्रो वॉलेट' : 'Astro Wallet'}
            </span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#183C2B]">
                {isHi ? 'मेरा एस्ट्रो वॉलेट' : 'My Astro Wallet'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {isHi
                  ? 'ज्योतिषी परामर्श (चैट/कॉल), मंदिर पूजा संकल्प, चढ़ावा एवं एस्ट्रो मॉल हेतु सुरक्षित डिजिटल बैलेंस।'
                  : 'Prepaid balance for instant astrologer consultations, temple pujas, daily chadhava, and Astro Mall orders.'}
              </p>
            </div>
            {!wallet.signedIn && (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-6 py-2.5 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:brightness-110 self-start sm:self-auto"
              >
                {isHi ? 'साइन इन करें' : 'Sign In'}
              </button>
            )}
          </div>
        </div>

        {/* Ethical Transparency Banner */}
        <div style={{
          background: 'linear-gradient(90deg, #F2F5EA, #FFFDF5)', border: '1.5px solid #D5AA51',
          borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
          boxShadow: '0 4px 16px rgba(62,11,24,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 26 }}>⚖️</span>
            <div>
              <strong style={{ color: '#164B32', fontSize: 14, display: 'block', fontFamily: 'serif' }}>
                {isHi ? '१००% पारदर्शी दक्षिणा लेजर एवं शून्य छिपा हुआ शुल्क' : '100% Transparent Dakshina Ledger & Zero Hidden Surcharges'}
              </strong>
              <p style={{ margin: 0, fontSize: 12, color: '#7C6758' }}>
                {isHi
                  ? 'प्रत्येक लेनदेन का स्पष्ट विभाजन: 80% आचार्य मानदेय, 10% गौ-सेवा चारा, 10% तकनीकी संचालन। कोई सुविधा शुल्क नहीं।'
                  : 'Itemized split: 80% Astrologer, 10% Gau Sewa, 10% Infrastructure. No hidden convenience fees.'}
              </p>
            </div>
          </div>
          <Link to="/trust-center" style={{ fontSize: 12, fontWeight: 800, color: '#720720', textDecoration: 'underline' }}>
            {isHi ? 'सत्य निष्ठा पत्र देखें →' : 'View Trust Charter →'}
          </Link>
        </div>

        {/* Hero Balance & Recharge Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Balance Hero Card */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className="p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-[#D9A441]"
              style={{
                background: 'linear-gradient(135deg, #164B32 0%, #5B1024 60%, #20040A 100%)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#EFD4A0]">
                  {isHi ? 'उपलब्ध शेष राशि' : 'Available Balance'}
                </span>
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm border border-white/20">
                  🪙
                </span>
              </div>

              <div className="text-4xl sm:text-5xl font-serif font-extrabold text-[#FFFDF8] my-2" aria-live="polite">
                {!wallet.signedIn ? '₹0.00' : wallet.loading ? '…' : `₹${Number(wallet.balance || 0).toFixed(2)}`}
              </div>

              <p className="text-xs text-amber-200/90 leading-relaxed mt-2">
                {wallet.signedIn
                  ? (isHi
                    ? 'आपका बैलेंस हमारे सर्वर पर 100% सुरक्षित है। अप्रयुक्त बैलेंस कभी समाप्त नहीं होता।'
                    : 'Your balance is protected with 256-bit bank-grade encryption. Unused balance never expires.')
                  : (isHi ? 'बैलेंस देखने के लिए कृपया साइन इन करें।' : 'Sign in to see your balance and recharge.')}
              </p>

              <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-[#F8E7C0]">
                <span>✓ {isHi ? 'तत्काल क्रेडिट' : 'Instant Credit'}</span>
                <span>✓ {isHi ? 'शून्य हिडन चार्ज' : 'Zero Hidden Fees'}</span>
              </div>
            </div>

            {/* Trust Center & Security Guarantee */}
            <div className="p-4 rounded-2xl bg-white border border-[#DDEBD5] text-xs text-slate-600 space-y-2">
              <strong className="text-[#183C2B] block font-serif">
                {isHi ? '🔒 100% सुरक्षित भुगतान गारंटी' : '🔒 100% Safe & Verified Payments'}
              </strong>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isHi
                  ? 'यूपीआई (Google Pay, PhonePe, Paytm), क्रेडिट/डेबिट कार्ड एवं नेट बैंकिंग द्वारा सुरक्षित भुगतान। किसी भी समस्या पर तुरंत सहायता।'
                  : 'Supports all major UPI apps, RuPay, Visa, Mastercard, and Net Banking with instant automated settlement.'}
              </p>
            </div>
          </div>

          {/* Right Column: Instant Recharge Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#DDEBD5] shadow-sm">
            <h2 className="font-serif text-lg font-bold text-[#183C2B] mb-1">
              {isHi ? 'वॉलेट रिचार्ज करें (+ राशि जोड़ें)' : 'Add Funds to Wallet'}
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              {isHi ? 'नीचे दिए गए पैक में से चुनें अथवा इच्छित राशि दर्ज करें:' : 'Choose a recharge pack or enter a custom amount:'}
            </p>

            {wallet.error && (
              <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 mb-4">
                {wallet.error}
              </p>
            )}

            {msg && (
              <div className={`text-xs rounded-xl px-3.5 py-2.5 border mb-4 flex items-center gap-2 ${msg.ok ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                <span>{msg.ok ? '✓' : '⚠️'}</span>
                <span>{msg.text}</span>
              </div>
            )}

            <form onSubmit={handleRecharge} className="space-y-5">
              {/* Preset Packs Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {PACKS.map((pack) => {
                  const isSelected = amount === pack.amount && !customAmount;
                  return (
                    <button
                      key={pack.amount}
                      type="button"
                      onClick={() => {
                        setSelectedPack(pack.amount);
                        setCustomAmount('');
                      }}
                      className={`relative py-3 px-2 rounded-2xl border text-center font-serif text-sm font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#164B32] text-[#FFFDF5] border-[#164B32] shadow-md scale-102'
                          : 'bg-[#FFFDF5] border-[#DDEBD5] text-[#183C2B] hover:border-[#D9A441]'
                      }`}
                    >
                      {pack.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#D9A441] text-[#183C2B] text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full tracking-wider shadow-2xs">
                          {isHi ? 'लोकप्रिय' : 'Popular'}
                        </span>
                      )}
                      <span>{pack.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1.5">
                  {isHi ? 'अथवा अपनी इच्छानुसार राशि दर्ज करें (न्यूनतम ₹50)' : 'Or enter custom amount (Min ₹50)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={MIN_RECHARGE}
                    max={MAX_RECHARGE}
                    placeholder="e.g. 750"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 text-sm rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none font-semibold text-[#183C2B]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={busy || invalid}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] hover:brightness-105 text-[#183C2B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-[#183C2B] border-t-transparent rounded-full animate-spin" />
                    <span>{isHi ? 'प्रोसेसिंग…' : 'Processing Payment…'}</span>
                  </>
                ) : (
                  <span>
                    {isHi
                      ? `+ ₹${Number.isFinite(amount) ? amount.toLocaleString('en-IN') : 0} रिचार्ज करें`
                      : `+ Recharge ₹${Number.isFinite(amount) ? amount.toLocaleString('en-IN') : 0} Now`}
                  </span>
                )}
              </button>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-slate-400 text-xs">
                <span>Google Pay</span>
                <span>•</span>
                <span>PhonePe</span>
                <span>•</span>
                <span>Paytm</span>
                <span>•</span>
                <span>UPI</span>
                <span>•</span>
                <span>Cards</span>
                <span>•</span>
                <span>Net Banking</span>
              </div>
            </form>
          </div>
        </div>

        {/* Transaction History Ledger Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DDEBD5] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#183C2B]">
                {isHi ? 'लेन-देन इतिहास' : 'Transaction History'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHi
                  ? 'आपके द्वारा किए गए सभी रिचार्ज एवं परामर्श कटौतियों का विस्तृत विवरण।'
                  : 'Complete record of wallet credits, consult charges, and seva debits.'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#FAF9F2] p-1 rounded-xl border border-[#DDEBD5] self-start sm:self-auto">
              {[
                { id: 'all', labelHi: 'सभी', labelEn: 'All' },
                { id: 'credit', labelHi: 'जमा (+)', labelEn: 'Credits (+)' },
                { id: 'debit', labelHi: 'कटौती (-)', labelEn: 'Debits (-)' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                    filter === f.id
                      ? 'bg-[#164B32] text-white shadow-2xs'
                      : 'bg-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isHi ? f.labelHi : f.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Ledger Table/List */}
          <div className="space-y-2.5">
            {!wallet.signedIn ? (
              <div className="text-center py-10 px-4 bg-[#FAF9F2] rounded-2xl border border-dashed border-[#DDEBD5]">
                <p className="text-xs text-slate-500 mb-3">
                  {isHi ? 'लेन-देन इतिहास देखने के लिए कृपया साइन इन करें।' : 'Please sign in to view your transaction ledger.'}
                </p>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-5 py-2 rounded-full bg-[#164B32] text-white font-bold text-xs"
                >
                  {isHi ? 'साइन इन करें' : 'Sign In'}
                </button>
              </div>
            ) : filteredRows.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-10 bg-[#FAF9F2] rounded-2xl">
                {isHi ? 'इस श्रेणी में अभी कोई लेन-देन नहीं है।' : 'No transactions recorded in this category.'}
              </p>
            ) : (
              filteredRows.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-[#FFFDF5] border border-[#DDEBD5] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                        tx.type === 'credit'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type === 'credit' ? '↓' : '↑'}
                    </span>
                    <div>
                      <strong className="text-[#183C2B] block text-xs sm:text-sm font-serif">
                        {tx.title}
                      </strong>
                      <span className="text-slate-500 text-[11px] block mt-0.5">
                        {tx.date} {tx.ref && `• Ref: ${tx.ref}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setReceiptModalTx(tx)}
                      style={{
                        padding: '4px 10px', borderRadius: 999, background: '#F2F5EA',
                        border: '1px solid #C49A3A', color: '#720720', fontSize: 11,
                        fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {isHi ? '🧾 रसीद' : '🧾 Receipt'}
                    </button>
                    <span
                      className={`font-serif font-extrabold text-sm sm:text-base shrink-0 ${
                        tx.type === 'credit' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TRANSPARENT DAKSHINA ITEMIZED RECEIPT MODAL                     */}
      {/* ============================================================== */}
      {receiptModalTx && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(23, 3, 8, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            maxWidth: 500, width: '100%', background: '#FFFDF5',
            borderRadius: 22, border: '2px solid #D5AA51', overflow: 'hidden',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)', color: '#183C2B'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px', background: 'linear-gradient(90deg, #164B32, #20040A)',
              color: '#FFFDF5', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, color: '#C49A3A' }}>🕉️</span>
                <div>
                  <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, margin: 0, color: '#FFF' }}>
                    {isHi ? 'डिजिटल दक्षिणा रसीद' : 'Digital Dakshina Receipt'}
                  </h3>
                  <small style={{ color: '#DDEBD5', fontSize: 11 }}>
                    Ref: {receiptModalTx.ref || receiptModalTx.id?.slice(0, 8)}
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalTx(null)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid #C49A3A',
                  color: '#F8D882', fontSize: 16, cursor: 'pointer', display: 'grid', placeItems: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Receipt Content */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px dashed #E2D2B8' }}>
                <div style={{ fontSize: 12, color: '#6A564A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {receiptModalTx.type === 'credit' ? 'वॉलेट टॉप-अप (Wallet Credit)' : 'परामर्श / सेवा दक्षिणा (Devotional Debit)'}
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, fontWeight: 800, color: '#720720', margin: '4px 0' }}>
                  ₹{Number(receiptModalTx.amount).toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: '#475569' }}>
                  {receiptModalTx.title} · {receiptModalTx.date}
                </div>
              </div>

              {/* Itemized Table */}
              <div style={{ background: '#F2F5EA', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: '#164B32', marginBottom: 8, textTransform: 'uppercase' }}>
                  {isHi ? '१००% पारदर्शी विभाजन (Itemized Split)' : '100% Transparent Split'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                    <span>आचार्य मानदेय (Astrologer Dakshina - 80%):</span>
                    <strong style={{ color: '#0F172A' }}>₹{(receiptModalTx.amount * 0.8).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                    <span>गौ-सेवा समर्पण (Cow Feed & Care - 10%):</span>
                    <strong style={{ color: '#059669' }}>₹{(receiptModalTx.amount * 0.1).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                    <span>तकनीकी व एफिमरिस संचालन (Platform - 10%):</span>
                    <strong style={{ color: '#0F172A' }}>₹{(receiptModalTx.amount * 0.1).toFixed(2)}</strong>
                  </div>
                  <div style={{ borderTop: '1px dashed #D5AA51', paddingTop: 6, display: 'flex', justifyContent: 'space-between', color: '#720720', fontWeight: 800 }}>
                    <span>छिपा हुआ शुल्क (Hidden Fees / Markups):</span>
                    <span style={{ color: '#059669' }}>₹0.00 (शून्य)</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#7C6758', lineHeight: 1.5, textAlign: 'center', marginBottom: 16 }}>
                Astro Jyotish Shastric Guarantee · इस रसीद का प्रत्येक रुपया प्रामाणिक वैदिक मर्यादा अनुसार संकल्पित है।
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 999, background: '#164B32',
                    color: '#F8D882', fontWeight: 800, fontSize: 12.5, border: '1px solid #C49A3A',
                    cursor: 'pointer'
                  }}
                >
                  🖨️ रसीद प्रिंट करें (Print)
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptModalTx(null)}
                  style={{
                    padding: '10px 18px', borderRadius: 999, background: '#E2E8F0',
                    color: '#334155', fontWeight: 700, fontSize: 12.5, border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  बंद करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
