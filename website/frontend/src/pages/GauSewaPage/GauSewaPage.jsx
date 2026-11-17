import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { announceBalance } from '../../components/WalletModal/walletApi.js';
import WalletModal from '../../components/WalletModal/WalletModal.jsx';
import { useLang } from '../BhaktiPage/lang.js';

// Gau Sewa: a one-time donation to a gaushala, paid from the Astro Jyotish wallet. Everything shown here comes from the
// backend (/api/v1/gau-sewa): the recipient, the amount rules, the published updates and the receipt.
const API = '/api/v1/gau-sewa';

// Photos for the three kinds of seva. (cow-calf.webp is not used: the picture has text printed on it.)
const PURPOSES = [
  { id: 'chaara', title: 'Daily Green Fodder Seva', desc: 'Nutritious fresh green grass, jaggery and bran for the cows.', photo: '/assets/img/gausewa/cow-feeding-art.webp' },
  { id: 'chikitsa', title: 'Medical Care & Rehabilitation', desc: 'Medicines, bandages and veterinary treatment for injured and aged cows.', photo: '/assets/img/gausewa/gaushala-shelter-real.webp' },
  { id: 'general', title: 'General Gau Seva', desc: 'Where it is needed most: food, shelter and care for the cows.', photo: '/assets/img/gausewa/cow-mother-calf.webp' },
];
const PURPOSE_NAME = { chaara: 'Daily Green Fodder Seva', chikitsa: 'Medical Care & Rehabilitation', general: 'General Gau Seva' };
const DEFAULT_RULES = { presets: [101, 501, 1100], min_amount: 11, max_amount: 100000 };
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

async function getJson(path, init = {}) {
  const token = localStorage.getItem('astro_access_token');
  const headers = {
    ...(init.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  const res = await fetch(`${API}${path}`, { ...init, headers });
  let data = null;
  try { data = await res.json(); } catch (e) { /* not json */ }
  if (!res.ok) {
    const d = data && data.detail;
    const err = new Error(typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => String(x.msg || '').replace(/^Value error, /, '')).join('; ') : 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

const dateText = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

function Dialog({ label, onClose, children }) {
  const box = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const items = box.current.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const close = box.current && box.current.querySelector('[data-close]');
    if (close) close.focus();
    return () => { document.removeEventListener('keydown', onKey); if (before && before.focus) before.focus(); };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={label} className="relative w-full max-w-md p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] max-h-[92vh] overflow-y-auto">
        <button type="button" data-close onClick={onClose} aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0">✕</button>
        {children}
      </div>
    </div>
  );
}

function ReceiptCard({ info }) {
  const rows = [
    ['Reference', info.reference],
    ['Date', dateText(info.paid_at || info.created_at)],
    ['Donor', info.donor_name],
    ['Seva', PURPOSE_NAME[info.purpose] || info.purpose],
    ['Given to', info.recipient_name],
  ].filter((r) => r[1]);
  return (
    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 space-y-2 text-xs" translate="no">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-amber-200/40 pb-1.5">
          <span className="text-slate-500" translate="yes">{k}</span><strong className="text-[#1E1B4B] text-right">{v}</strong>
        </div>
      ))}
      <div className="flex justify-between pt-1 text-sm">
        <span className="font-bold text-slate-700" translate="yes">Amount given</span>
        <strong className="text-[#3E0B18] font-extrabold">{money(info.amount)}</strong>
      </div>
    </div>
  );
}

const downloadHref = (token) => `${API}/donations/receipt/${encodeURIComponent(token)}/download`;

export function GauSewaReceiptPage() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    window.scrollTo({ top: 0 });
    let on = true;
    getJson(`/donations/receipt/${encodeURIComponent(token)}`)
      .then((info) => on && setState({ info }))
      .catch((e) => on && setState({ error: e.status === 404 ? 'We could not find this receipt.' : e.message }));
    return () => { on = false; };
  }, [token]);
  return (
    <div className="w-full bg-[#FAF7F2] min-h-screen py-10 px-4">
      <div className="max-w-md mx-auto p-6 bg-white rounded-3xl border border-[#E7E2D8] shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-[#1E1B4B] mb-1">Gau Seva donation receipt</h1>
        {state.loading && <p role="status" className="text-xs text-slate-500 mt-3">Loading your receipt…</p>}
        {state.error && <p role="alert" className="text-sm text-rose-700 mt-3">{state.error}</p>}
        {state.info && (
          <>
            <p className="text-xs text-slate-500 mb-4">Thank you for your contribution.</p>
            <ReceiptCard info={state.info} />
            {state.info.receipt_available ? (
              <a href={downloadHref(token)} download className="block text-center w-full py-3 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider mt-5 no-underline">Download receipt</a>
            ) : <p className="text-xs text-slate-500 mt-4">A receipt is available once the payment is confirmed.</p>}
          </>
        )}
        <Link to="/gau-sewa" className="block text-center text-xs font-bold text-[#3E0B18] mt-5">← Back to Gau Seva</Link>
      </div>
    </div>
  );
}

export default function GauSewaPage() {
  const { currentUser, openAuthModal } = useAuth();
  const [config, setConfig] = useState(null);
  const [gaushala, setGaushala] = useState(undefined); // undefined while loading, null if none accepts donations
  const [updates, setUpdates] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  const [purpose, setPurpose] = useState('chaara');
  const [preset, setPreset] = useState(501);
  const [custom, setCustom] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hideName, setHideName] = useState(false);
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState(null); // { text, needsFunds }
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  const load = useCallback(() => {
    setLoadFailed(false);
    getJson('/config').then(setConfig).catch(() => setConfig(DEFAULT_RULES));
    getJson('/gaushalas')
      .then((d) => setGaushala((d.gaushalas || []).find((g) => g.accepting_donations) || null))
      .catch(() => { setGaushala(null); setLoadFailed(true); });
    getJson('/updates?limit=6').then((d) => setUpdates(d.updates || [])).catch(() => setUpdates([]));
  }, []);
  useEffect(load, [load]);

  useEffect(() => { if (currentUser && !name) setName(currentUser.full_name || currentUser.name || ''); }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const rules = { ...DEFAULT_RULES, ...(config || {}) };
  const customText = custom.trim();
  const amount = customText ? Number(customText) : preset;
  const amountOk = Number.isInteger(amount) && amount >= rules.min_amount && amount <= rules.max_amount;
  const accepting = !!gaushala;
  const lang = useLang();
  const hindi = lang === 'hi';

  const validate = () => {
    const e = {};
    if (!amountOk) e.amount = `Enter a whole amount between ${money(rules.min_amount)} and ${money(rules.max_amount)}.`;
    const n = name.replace(/\s+/g, ' ').trim();
    if (n.length < 2 || n.length > 120) e.name = 'Enter the donor name (2 to 120 characters).';
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) e.email = 'Enter a valid email address or leave it blank.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setFormMessage(null);
    if (!validate()) return;
    if (!currentUser) {
      setFormMessage({ text: 'Please sign in to give from your Astro Jyotish wallet.' });
      openAuthModal('login');
      return;
    }
    setBusy(true);
    try {
      const out = await getJson('/donations/wallet', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount, purpose, donor_name: name.replace(/\s+/g, ' ').trim(), donor_email: email.trim() || null,
          hide_name_public: hideName, gaushala_id: gaushala.id,
        }),
      });
      if (typeof out.new_balance === 'number') announceBalance(out.new_balance);
      let info = { reference: out.reference, donor_name: out.donor_name, purpose: out.purpose, amount: out.amount, recipient_name: out.recipient_name, paid_at: new Date().toISOString() };
      try { info = { ...info, ...(await getJson(`/donations/receipt/${encodeURIComponent(out.receipt_token)}`)) }; } catch (e) { /* the response above is enough */ }
      setReceipt({ info, token: out.receipt_token });
      setCustom('');
    } catch (e) {
      if (e.status === 401) { setFormMessage({ text: 'Please sign in to give from your Astro Jyotish wallet.' }); openAuthModal('login'); }
      else setFormMessage({ text: e.message, needsFunds: e.status === 402 });
    }
    setBusy(false);
  };

  const field = 'w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none';
  const err = (key) => errors[key] && <p role="alert" id={`gs-err-${key}`} className="text-[11px] text-rose-700 mt-1">{errors[key]}</p>;
  const closeReceipt = useCallback(() => setReceipt(null), []);

  return (
    <div className="gs-reference-page w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-20">
      <header className="service-banner service-banner--gausewa gs-ref-hero max-w-7xl mx-auto mt-4 px-4">
        <figure className="service-banner__art">
          <img src="/assets/img/gau-sewa-hero-v2.webp?v=hero_v4" alt="Sacred Gau Seva Gomata and Calf" fetchPriority="high" />
          <figcaption>Illustrative image</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow">✦ GAU SEVA – SACRED COW PROTECTION ✦</p>
          <h1>A little kindness, <em>A lifetime of care.</em></h1>
          <p>Bring Gau Seva into your life. Your contribution supports the daily food, medical care and shelter of cows at the gaushala named below.</p>
          <div className="shop-hero__actions">
            <a href="#gs-donation-form" className="shop-btn shop-btn--gold cursor-pointer no-underline"
              onClick={(e) => { e.preventDefault(); document.getElementById('gs-donation-form')?.scrollIntoView({ behavior: 'smooth' }); }}>Donate Now →</a>
            <a href="#gs-updates-section" className="shop-btn shop-btn--ghost cursor-pointer no-underline"
              onClick={(e) => { e.preventDefault(); document.getElementById('gs-updates-section')?.scrollIntoView({ behavior: 'smooth' }); }}>Gaushala Updates</a>
          </div>
          <div className="gs-hero-trust-grid">
            <div className="gs-trust-badge-card">
              <div className="gs-trust-badge-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8D882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div className="gs-trust-badge-card__info">
                <b className="gs-trust-badge-card__title">Published Updates</b>
                <small className="gs-trust-badge-card__sub">Posted by the gaushala</small>
              </div>
            </div>
            <div className="gs-trust-badge-card">
              <div className="gs-trust-badge-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8D882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="gs-trust-badge-card__info">
                <b className="gs-trust-badge-card__title">Named Recipient</b>
                <small className="gs-trust-badge-card__sub">Shown before you give</small>
              </div>
            </div>
            <div className="gs-trust-badge-card">
              <div className="gs-trust-badge-card__icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F8D882" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className="gs-trust-badge-card__info">
                <b className="gs-trust-badge-card__title">Receipt at once</b>
                <small className="gs-trust-badge-card__sub">Right after you give</small>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="gs-content-2col max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="gs-col-left lg:col-span-7 space-y-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#B45309] mb-1">AN OFFERING FOR THE SELFLESS</div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1E1B4B] mb-2">Your kindness, their everyday care</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">Choose a Gau Seva option that resonates with your devotion. Each contribution supports fresh green fodder, veterinary care and clean shelter.</p>
          </div>

          <div className="space-y-3" role="radiogroup" aria-label="Seva purpose">
            {PURPOSES.map((p) => {
              const on = purpose === p.id;
              return (
                <button key={p.id} type="button" role="radio" aria-checked={on} onClick={() => setPurpose(p.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${on ? 'bg-amber-50/80 border-[#3E0B18] shadow-md ring-1 ring-[#3E0B18]' : 'bg-white border-[#E7E2D8] hover:border-amber-300'}`}>
                  <span className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-amber-200 block">
                    <img src={p.photo} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="flex-1 min-w-0 block">
                    <span className="block font-serif text-sm font-bold text-[#1E1B4B] mb-1">{p.title}</span>
                    <span className="block text-xs text-slate-500 leading-relaxed">{p.desc}</span>
                  </span>
                  <span aria-hidden="true" className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-[#3E0B18] bg-[#3E0B18]' : 'border-slate-300'}`}>
                    {on && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>

          {gaushala && (
            <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] shadow-xs" translate="no">
              <div className="text-xs font-bold uppercase tracking-widest text-[#B45309] mb-1" translate="yes">Your contribution goes to</div>
              <h3 className="font-serif text-lg font-bold text-[#1E1B4B]">{gaushala.beneficiary_name || gaushala.name}</h3>
              <p className="text-xs text-slate-500 mb-2">{[gaushala.name, gaushala.location].filter(Boolean).join(' · ')}</p>
              {gaushala.introduction && <p className="text-xs text-slate-600 leading-relaxed mb-2">{gaushala.introduction}</p>}
              {gaushala.beneficiary_details && <p className="text-xs text-slate-600 leading-relaxed">{gaushala.beneficiary_details}</p>}
            </div>
          )}

          <div className="p-6 rounded-3xl bg-white border border-[#E7E2D8] shadow-xs">
            <h3 className="font-serif text-lg font-bold text-[#1E1B4B] mb-4 flex items-center gap-2"><span>✦</span> A Thoughtful Way to Give</h3>
            <ol className="space-y-4 text-xs list-none p-0 m-0">
              {[
                ['Select your seva purpose', 'Pick green fodder, medical care or general seva.'],
                ['Choose what feels right', 'Give any amount according to your devotion.'],
                ['Receive your digital receipt', 'Your receipt is ready as soon as the donation is made.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#3E0B18] text-[#FFF9EF] flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                  <div><strong className="text-[#1E1B4B] block text-xs">{t}</strong><p className="text-xs text-slate-500 m-0">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="gs-col-right lg:col-span-5" id="gs-donation-form" style={{ scrollMarginTop: 120 }}>
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E7E2D8] shadow-lg lg:sticky lg:top-28">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">GAU SEVA DANA</span>
            <h3 className="font-serif text-xl font-bold text-[#1E1B4B] mt-2 mb-2">Sacred Donation</h3>
            <p className="text-xs text-slate-500 mb-5">Your donation is paid from your Astro Jyotish wallet and a receipt is issued straight away.</p>

            {gaushala === undefined && <p role="status" className="text-xs text-slate-500">Loading…</p>}
            {gaushala === null && (
              <div role="status" className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
                {loadFailed ? 'We could not load the donation details. ' : 'Donations are not open yet. The gaushala details are still being set up.'}
                {loadFailed && <button type="button" onClick={load} className="underline font-bold cursor-pointer bg-transparent border-0 text-amber-900 p-0">Try again</button>}
              </div>
            )}

            {accepting && (
              <form onSubmit={submit} className="space-y-4" noValidate>
                <fieldset className="border-0 p-0 m-0">
                  <legend className="block text-xs font-bold text-[#1E1B4B] mb-1.5">Select Amount (₹)</legend>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {rules.presets.map((amt) => {
                      const on = preset === amt && !customText;
                      return (
                        <button key={amt} type="button" aria-pressed={on} onClick={() => { setPreset(amt); setCustom(''); setErrors((x) => ({ ...x, amount: undefined })); }}
                          className="py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                          style={{ minHeight: 44, backgroundColor: on ? '#3E0B18' : '#FFFDF7', color: on ? '#F8D882' : '#3E0B18', border: on ? '2px solid #D9A441' : '1.5px solid #EADBCA' }}>
                          {money(amt)}
                        </button>
                      );
                    })}
                  </div>
                  <input aria-label="Custom contribution amount" type="number" inputMode="numeric" min={rules.min_amount} max={rules.max_amount} step="1"
                    placeholder="Or enter your own amount in ₹" value={custom} onChange={(e) => setCustom(e.target.value)}
                    aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'gs-err-amount' : undefined} className={field} />
                  {err('amount')}
                </fieldset>

                <div>
                  <label htmlFor="gs-name" className="block text-xs font-bold text-[#1E1B4B] mb-1">Devotee (Yajman) Name *</label>
                  <input id="gs-name" type="text" autoComplete="name" placeholder="e.g. Suresh Kumar" value={name} onChange={(e) => setName(e.target.value)}
                    aria-invalid={!!errors.name} aria-describedby={errors.name ? 'gs-err-name' : undefined} className={field} />
                  {err('name')}
                </div>

                <div>
                  <label htmlFor="gs-email" className="block text-xs font-bold text-[#1E1B4B] mb-1">Email (optional)</label>
                  <input id="gs-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email} aria-describedby={errors.email ? 'gs-err-email' : undefined} className={field} />
                  {err('email')}
                </div>

                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={hideName} onChange={(e) => setHideName(e.target.checked)} className="mt-0.5" />
                  <span>Do not show my name in public lists</span>
                </label>

                {formMessage && (
                  <div role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    {formMessage.text}
                    {formMessage.needsFunds && (
                      <button type="button" onClick={() => setWalletOpen(true)} className="block mt-2 px-4 py-2 rounded-full bg-[#3E0B18] text-[#FFF9EF] font-bold cursor-pointer border-0" style={{ minHeight: 40 }}>Add money to wallet</button>
                    )}
                  </div>
                )}

                <button type="submit" disabled={busy}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#1E1B4B] font-extrabold text-xs uppercase tracking-wider mt-2 cursor-pointer border-0 shadow-md hover:brightness-105 disabled:opacity-60 disabled:cursor-default">
                  {busy ? 'Giving…' : amountOk ? (hindi ? `${money(amount)} वॉलेट से दान करें →` : `Give ${money(amount)} from wallet →`) : 'Give from wallet →'}
                </button>
                {!currentUser && <p className="text-[11px] text-slate-500 text-center">You will be asked to sign in first.</p>}
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16" id="gs-updates-section" style={{ scrollMarginTop: 100 }}>
        <h3 className="font-serif text-xl font-bold text-[#1E1B4B] mb-6 text-center">Recent Gaushala Care &amp; Seva Updates</h3>
        {updates === null && <p role="status" className="text-center text-xs text-slate-500">Loading updates…</p>}
        {updates && updates.length === 0 && (
          <p className="text-center text-sm text-slate-500 max-w-md mx-auto">No updates have been posted yet. Seva updates from the gaushala will appear here.</p>
        )}
        {updates && updates.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" translate="no">
            {updates.map((u) => (
              <article key={u.id} className="p-4 rounded-2xl bg-white border border-[#E7E2D8] shadow-xs">
                {u.photos && u.photos[0] && (
                  <div className="h-40 rounded-xl overflow-hidden mb-3 bg-slate-100"><img src={u.photos[0]} alt="" loading="lazy" className="w-full h-full object-cover" /></div>
                )}
                <time dateTime={u.published_at} className="text-[10px] text-amber-700 font-bold block mb-1">{dateText(u.published_at)}</time>
                <h4 className="font-serif text-sm font-bold text-[#1E1B4B] mb-1">{u.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{u.body}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {receipt && (
        <Dialog label="Donation receipt" onClose={closeReceipt}>
          <div className="text-center mb-4">
            <span className="text-3xl block mb-1" aria-hidden="true">🙏</span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#B45309]">Gau Seva Dana</span>
            <h3 className="font-serif text-xl font-bold text-[#1E1B4B]">Donation Receipt</h3>
            <p className="text-xs text-slate-500">Thank you for your sacred contribution!</p>
          </div>
          <ReceiptCard info={receipt.info} />
          <a href={downloadHref(receipt.token)} download className="block text-center w-full py-3 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider mt-5 no-underline">Download receipt</a>
          <Link to={`/gau-sewa/receipt/${receipt.token}`} onClick={closeReceipt} className="block text-center text-xs font-bold text-[#3E0B18] mt-3">Open receipt page</Link>
        </Dialog>
      )}

      <WalletModal isOpen={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}
