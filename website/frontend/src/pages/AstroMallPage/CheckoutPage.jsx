import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from './cartStore.js';
import { quoteCart, placeOrder, walletBalance, isSignedIn } from './mallApi.js';
import { track } from '../../analytics.jsx';
import { useLang } from '../BhaktiPage/lang.js';
import './mall-checkout.css';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function Done({ result, isHi }) {
  const t = result.totals || {};
  return (
    <section className="mc-card mc-done" aria-labelledby="mc-done-h">
      <div className="mc-done-ic" aria-hidden="true">🙏</div>
      <h1 id="mc-done-h">{isHi ? 'ऑर्डर सफलतापूर्वक दर्ज हुआ' : 'Order placed'}</h1>
      <p className="mc-muted">
        {isHi
          ? 'धन्यवाद। आपकी सामग्रियां वैदिक विधि से अभिमंत्रित (सिद्ध) कर प्रेषित की जाएंगी। आप अपने खाते से ऑर्डर की स्थिति देख सकते हैं।'
          : 'Thank you. Your items will be energized and then dispatched. You can follow each order from your dashboard.'}
      </p>
      <ul className="mc-orders">
        {result.orders.map((o) => (
          <li key={o.id}>
            <span>
              <b>{o.product_title}</b> × {o.quantity}
              {o.options_label ? <small> · {o.options_label}</small> : null}
              <small>{isHi ? `ऑर्डर सं. ${o.order_number}` : `Order ${o.order_number}`}</small>
            </span>
            <span>{money(o.total_price)}</span>
          </li>
        ))}
      </ul>
      <p className="mc-total-line">
        <span>
          {isHi
            ? `कुल राशि ${result.orders[0] && result.orders[0].payment_method === 'COD' ? '(डिलीवरी पर देय)' : '(भुगतान संपन्न)'}`
            : `Total ${result.orders[0] && result.orders[0].payment_method === 'COD' ? '(pay on delivery)' : '(paid)'}`}
        </span>
        <b>{money(result.total ?? t.total)}</b>
      </p>
      <div className="mc-actions">
        <Link className="mc-btn mc-btn-primary" to="/my-orders">
          {isHi ? 'मेरे ऑर्डर देखें' : 'View my orders'}
        </Link>
        <Link className="mc-btn mc-btn-ghost" to="/astro-mall">
          {isHi ? 'खरीदारी जारी रखें' : 'Continue shopping'}
        </Link>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  const { items, setQuantity, remove, clear } = useCart();
  const { currentUser, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const lang = useLang();
  const isHi = lang === 'hi';
  const signedIn = !!currentUser || isSignedIn();

  const [form, setForm] = useState({ name: '', phone: '', gotra: '', address: '', method: 'COD', ack: false });
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteErr, setQuoteErr] = useState('');
  const [balance, setBalance] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [fieldErr, setFieldErr] = useState({});
  const [done, setDone] = useState(null);

  const itemsKey = useMemo(() => JSON.stringify(items.map((i) => [i.key, i.quantity])), [items]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  useEffect(() => {
    if (!currentUser) return;
    setForm((f) => ({ ...f, name: f.name || currentUser.full_name || '', phone: f.phone || currentUser.phone || '' }));
  }, [currentUser]);
  useEffect(() => { if (signedIn) walletBalance().then(setBalance); else setBalance(null); }, [signedIn]);

  // Re-price whenever the cart changes. The server is the source of truth for totals, delivery and stock.
  useEffect(() => {
    if (!items.length) { setQuote(null); return undefined; }
    let alive = true;
    setQuoteErr('');
    quoteCart(items, applied).then((q) => { if (alive) setQuote(q); })
      .catch((e) => { if (alive) { setQuote(null); setQuoteErr(e.message); } });
    return () => { alive = false; };
  }, [itemsKey, applied, signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const total = quote ? quote.totals.total : null;
  const outOfStock = quote ? quote.lines.some((l) => !l.in_stock) : false;
  const walletShort = form.method === 'WALLET' && balance !== null && total !== null && balance < total;

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    setCouponMsg('');
    if (!code) { setApplied(''); return; }
    if (!signedIn) { openAuthModal('login'); setCouponMsg(isHi ? 'कूपन लगाने हेतु कृपया साइन इन करें।' : 'Please sign in to use a coupon.'); return; }
    try {
      const q = await quoteCart(items, code);
      setQuote(q); setApplied(code); setCouponMsg(isHi ? `कूपन कोड ${code} लागू हो गया।` : `Coupon ${code} applied.`);
    } catch (e) { setCouponMsg(e.message); }
  };

  const handleWalletRecharge = () => {
    if (window.App && typeof window.App.openWalletModal === 'function') {
      window.App.openWalletModal();
    } else {
      navigate('/wallet');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!signedIn) { openAuthModal('login'); setErr(isHi ? 'ऑर्डर देने हेतु कृपया साइन इन करें।' : 'Please sign in to place your order.'); return; }
    const fe = {};
    if (form.name.trim().length < 2) fe.name = isHi ? 'कृपया ऑर्डर हेतु नाम दर्ज करें।' : 'Please enter the name for the order.';
    if (form.phone.replace(/\D/g, '').length < 10) fe.phone = isHi ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।' : 'Please enter a phone number with at least 10 digits.';
    if (form.address.trim().length < 5) fe.address = isHi ? 'कृपया पूरा डिलीवरी पता दर्ज करें।' : 'Please enter the full delivery address.';
    if (quote && quote.has_gemstone && !form.ack) fe.ack = isHi ? 'कृपया रत्न परामर्श एवं वापसी नीति की पुष्टि करें।' : 'Please confirm the gemstone advice and return policy to continue.';
    setFieldErr(fe);
    if (Object.keys(fe).length) {
      setErr(Object.values(fe)[0]);
      const first = document.querySelector('[aria-invalid="true"]');
      if (first && first.focus) first.focus();
      return;
    }
    setBusy(true);
    try {
      const res = await placeOrder(items, {
        buyer_name: form.name.trim(), buyer_phone: form.phone.trim(), buyer_gotra: form.gotra.trim() || undefined,
        shipping_address: form.address.trim(), payment_method: form.method, coupon_code: applied || null, gemstone_ack: form.ack,
      });
      track('cta_click', { target: `mall_order_${form.method.toLowerCase()}` });
      clear();
      setDone(res);
      window.scrollTo({ top: 0 });
    } catch (e2) {
      setErr(e2.status === 401 ? (isHi ? 'सत्र समाप्त हो गया है। कृपया पुनः साइन इन करें।' : 'Your session has ended. Please sign in again.') : e2.message);
      if (e2.status === 401) openAuthModal('login');
    } finally { setBusy(false); }
  };

  if (done) return <main className="mc"><Done result={done} isHi={isHi} /></main>;

  if (!items.length) {
    return (
      <main className="mc">
        <section className="mc-card mc-empty">
          <h1>{isHi ? 'आपकी कार्ट खाली है' : 'Your cart is empty'}</h1>
          <p className="mc-muted">
            {isHi ? 'शुरुआत करने के लिए एस्ट्रो मॉल से सिद्ध सामग्रियां जोड़ें।' : 'Add sacred items from the Astro Mall to get started.'}
          </p>
          <Link className="mc-btn mc-btn-primary" to="/astro-mall">
            {isHi ? 'एस्ट्रो मॉल देखें' : 'Browse Astro Mall'}
          </Link>
        </section>
      </main>
    );
  }

  const t = quote && quote.totals;
  return (
    <main className="mc">
      <nav className="mc-crumbs" aria-label="Breadcrumb">
        <Link to="/">{isHi ? 'होम' : 'Home'}</Link>
        <span aria-hidden="true">›</span>
        <Link to="/astro-mall">{isHi ? 'एस्ट्रो मॉल' : 'Astro Mall'}</Link>
        <span aria-hidden="true">›</span>
        <b>{isHi ? 'चेकआउट' : 'Checkout'}</b>
      </nav>
      <h1 className="mc-title">{isHi ? 'चेकआउट' : 'Checkout'}</h1>

      <form className="mc-grid" onSubmit={submit} noValidate>
        <div className="mc-col">
          <section className="mc-card" aria-labelledby="mc-cart-h">
            <h2 id="mc-cart-h">{isHi ? 'आपकी सामग्रियां' : 'Your items'}</h2>
            <ul className="mc-lines">
              {items.map((i, idx) => {
                const line = quote && quote.lines[idx];
                return (
                  <li key={i.key}>
                    <img src={i.image} alt="" loading="lazy" />
                    <div className="mc-line-body">
                      <Link to={`/mall/product/${i.product_id}`} className="mc-line-title">{i.title}</Link>
                      {line && line.options_label ? <small className="mc-muted">{line.options_label}</small> : null}
                      {line && !line.in_stock ? <small className="mc-bad">{isHi ? 'इस मात्रा हेतु पर्याप्त स्टॉक नहीं है' : 'Not enough stock for this quantity'}</small> : null}
                      <div className="mc-qty" role="group" aria-label={`Quantity for ${i.title}`}>
                        <button type="button" onClick={() => setQuantity(i.key, i.quantity - 1)} aria-label="Decrease quantity" disabled={i.quantity <= 1}>−</button>
                        <span aria-live="polite">{i.quantity}</span>
                        <button type="button" onClick={() => setQuantity(i.key, i.quantity + 1)} aria-label="Increase quantity" disabled={i.quantity >= 10}>+</button>
                        <button type="button" className="mc-remove" onClick={() => remove(i.key)}>{isHi ? 'हटाएं' : 'Remove'}</button>
                      </div>
                    </div>
                    <b className="mc-line-price">{money(line ? line.line_total : i.unit_price * i.quantity)}</b>
                  </li>
                );
              })}
            </ul>
            {quoteErr && <p className="mc-msg mc-bad" role="alert">{quoteErr}</p>}
          </section>

          <section className="mc-card" aria-labelledby="mc-ship-h">
            <h2 id="mc-ship-h">{isHi ? 'डिलीवरी विवरण' : 'Delivery details'}</h2>
            {!signedIn && (
              <p className="mc-msg" role="note">
                {isHi ? 'ऑर्डर देने हेतु साइन इन आवश्यक है। ' : 'You need to sign in to place an order. '}
                <button type="button" className="mc-link" onClick={() => openAuthModal('login')}>
                  {isHi ? 'साइन इन करें' : 'Sign in'}
                </button>
              </p>
            )}
            <div className="mc-fields">
              <label>
                {isHi ? 'पूरा नाम' : 'Full name'}
                <input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={100} aria-invalid={!!fieldErr.name} aria-describedby={fieldErr.name ? 'mc-e-name' : undefined} />
                {fieldErr.name && <small id="mc-e-name" className="mc-bad" role="alert">{fieldErr.name}</small>}
              </label>
              <label>
                {isHi ? 'मोबाइल नंबर' : 'Phone number'}
                <input value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" required maxLength={20} aria-invalid={!!fieldErr.phone} aria-describedby={fieldErr.phone ? 'mc-e-phone' : undefined} />
                {fieldErr.phone && <small id="mc-e-phone" className="mc-bad" role="alert">{fieldErr.phone}</small>}
              </label>
              <label>
                <span>{isHi ? 'गोत्र' : 'Gotra'} <small className="mc-muted">{isHi ? '(वैकल्पिक)' : '(optional)'}</small></span>
                <input value={form.gotra} onChange={set('gotra')} maxLength={100} placeholder={isHi ? 'उदा. भारद्वाज / कश्यप' : 'e.g. Bharadwaj / Kashyap'} />
              </label>
              <label className="mc-wide">
                {isHi ? 'डिलीवरी पता' : 'Delivery address'}
                <textarea value={form.address} onChange={set('address')} rows={3} autoComplete="street-address" required maxLength={500} placeholder={isHi ? 'मकान नं., गली/मोहल्ला, शहर, राज्य, पिन कोड' : 'House / street, city, state, PIN code'} aria-invalid={!!fieldErr.address} aria-describedby={fieldErr.address ? 'mc-e-address' : undefined} />
                {fieldErr.address && <small id="mc-e-address" className="mc-bad" role="alert">{fieldErr.address}</small>}
              </label>
            </div>
          </section>

          <section className="mc-card" aria-labelledby="mc-pay-h">
            <h2 id="mc-pay-h">{isHi ? 'भुगतान माध्यम' : 'Payment'}</h2>
            <div className="mc-pay" role="radiogroup" aria-label="Payment method">
              <label className={form.method === 'COD' ? 'on' : ''}>
                <input type="radio" name="method" value="COD" checked={form.method === 'COD'} onChange={set('method')} />
                <span>
                  <b>{isHi ? 'कैश ऑन डिलीवरी (COD)' : 'Cash on delivery'}</b>
                  <small>{isHi ? 'पार्सल प्राप्त होने पर भुगतान करें।' : 'Pay when the parcel arrives.'}</small>
                </span>
              </label>
              <label className={form.method === 'WALLET' ? 'on' : ''}>
                <input type="radio" name="method" value="WALLET" checked={form.method === 'WALLET'} onChange={set('method')} />
                <span>
                  <b>{isHi ? 'एस्ट्रो ज्योतिष वॉलेट' : 'Astro Jyotish wallet'}</b>
                  <small>
                    {balance === null
                      ? (signedIn ? (isHi ? 'बैलेंस जांचा जा रहा है…' : 'Checking balance…') : (isHi ? 'वॉलेट उपयोग हेतु साइन इन करें।' : 'Sign in to use your wallet.'))
                      : `${isHi ? 'उपलब्ध बैलेंस' : 'Balance'} ${money(balance)}`}
                  </small>
                </span>
              </label>
            </div>
            {walletShort && (
              <div className="mc-msg mc-bad" role="alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span>
                  {isHi
                    ? `आपके वॉलेट में अपर्याप्त बैलेंस है (उपलब्ध: ${money(balance)})।`
                    : `Your wallet balance is lower than the total (Available: ${money(balance)}).`}
                </span>
                <button
                  type="button"
                  onClick={handleWalletRecharge}
                  className="px-3 py-1 rounded-lg bg-[#164B32] text-[#FFFDF5] font-bold text-xs cursor-pointer border-0 shadow-xs"
                >
                  {isHi ? '+ तुरंत वॉलेट रिचार्ज करें' : '+ Add Money to Wallet'}
                </button>
              </div>
            )}
            {quote && quote.has_gemstone && (
              <label className="mc-check">
                <input type="checkbox" checked={form.ack} onChange={set('ack')} aria-invalid={!!fieldErr.ack} />
                <span>
                  {isHi
                    ? 'मैंने रत्न परामर्श एवं वापसी नीति पढ़ ली है, और मैं समझता/समझती हूँ कि रत्न ज्योतिषी परामर्श के पश्चात ही धारण किए जाने चाहिए।'
                    : 'I have read the gemstone advice and return policy, and I understand gemstones should be worn after consulting an astrologer.'}
                </span>
              </label>
            )}
            {fieldErr.ack && (
              <small className="mc-bad" role="alert">{fieldErr.ack}</small>
            )}
          </section>
        </div>

        <aside className="mc-side">
          <section className="mc-card mc-summary" aria-labelledby="mc-sum-h">
            <h2 id="mc-sum-h">{isHi ? 'ऑर्डर सारांश' : 'Order summary'}</h2>
            <div className="mc-coupon">
              <input aria-label="Coupon code" placeholder={isHi ? 'कूपन कोड' : 'Coupon code'} value={coupon} onChange={(e) => setCoupon(e.target.value)} maxLength={30} />
              <button type="button" className="mc-btn mc-btn-ghost" onClick={applyCoupon}>{isHi ? 'लागू करें' : 'Apply'}</button>
            </div>
            {couponMsg && <p className={`mc-msg ${/applied|लागू/i.test(couponMsg) ? 'mc-ok' : 'mc-bad'}`} role="status">{couponMsg}</p>}
            {t ? (
              <dl className="mc-totals">
                <div><dt>{isHi ? 'उप-योग' : 'Subtotal'}</dt><dd>{money(t.subtotal)}</dd></div>
                {t.member_discount > 0 && <div><dt>{isHi ? 'सदस्य छूट' : 'Member discount'}</dt><dd>−{money(t.member_discount)}</dd></div>}
                {t.coupon_discount > 0 && <div><dt>{isHi ? `कूपन छूट (${t.coupon_code})` : `Coupon ${t.coupon_code}`}</dt><dd>−{money(t.coupon_discount)}</dd></div>}
                <div><dt>{isHi ? 'डिलीवरी' : 'Delivery'}</dt><dd>{t.delivery_fee > 0 ? money(t.delivery_fee) : (isHi ? 'निःशुल्क' : 'Free')}</dd></div>
                <div className="mc-grand"><dt>{isHi ? 'कुल राशि' : 'Total'}</dt><dd>{money(t.total)}</dd></div>
              </dl>
            ) : <div className="mc-skel" aria-hidden="true" />}
            {err && <p className="mc-msg mc-bad" role="alert">{err}</p>}
            <button type="submit" className="mc-btn mc-btn-primary mc-block" disabled={busy || !quote || outOfStock || walletShort}>
              {busy
                ? (isHi ? 'ऑर्डर दर्ज हो रहा है…' : 'Placing order…')
                : form.method === 'COD'
                ? (isHi ? 'ऑर्डर दर्ज करें (डिलीवरी पर देय)' : 'Place order (pay on delivery)')
                : (isHi ? 'वॉलेट से भुगतान करें एवं ऑर्डर दें' : 'Pay from wallet & place order')}
            </button>
            <p className="mc-muted mc-fine">
              {isHi
                ? 'प्रेषण से पूर्व सभी सामग्रियां वैदिक विधि से अभिमंत्रित (सिद्ध) की जाती हैं।'
                : "Items are energized as per Vedic rites before dispatch. Returns follow each product's policy."}
            </p>
          </section>
        </aside>
      </form>
    </main>
  );
}
