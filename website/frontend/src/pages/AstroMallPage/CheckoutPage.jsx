import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from './cartStore.js';
import { quoteCart, placeOrder, walletBalance, isSignedIn } from './mallApi.js';
import { track } from '../../analytics.jsx';
import './mall-checkout.css';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function Done({ result }) {
  const t = result.totals || {};
  return (
    <section className="mc-card mc-done" aria-labelledby="mc-done-h">
      <div className="mc-done-ic" aria-hidden="true">🙏</div>
      <h1 id="mc-done-h">Order placed</h1>
      <p className="mc-muted">Thank you. Your items will be energized and then dispatched. You can follow each order from your dashboard.</p>
      <ul className="mc-orders">
        {result.orders.map((o) => (
          <li key={o.id}>
            <span><b>{o.product_title}</b> × {o.quantity}{o.options_label ? <small> · {o.options_label}</small> : null}<small>Order {o.order_number}</small></span>
            <span>{money(o.total_price)}</span>
          </li>
        ))}
      </ul>
      <p className="mc-total-line"><span>Total {result.orders[0] && result.orders[0].payment_method === 'COD' ? '(pay on delivery)' : '(paid)'}</span><b>{money(result.total ?? t.total)}</b></p>
      <div className="mc-actions">
        <Link className="mc-btn mc-btn-primary" to="/my-orders">View my orders</Link>
        <Link className="mc-btn mc-btn-ghost" to="/astro-mall">Continue shopping</Link>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  const { items, setQuantity, remove, clear } = useCart();
  const { currentUser, openAuthModal } = useAuth();
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
    if (!signedIn) { openAuthModal('login'); setCouponMsg('Please sign in to use a coupon.'); return; }
    try {
      const q = await quoteCart(items, code);
      setQuote(q); setApplied(code); setCouponMsg(`Coupon ${code} applied.`);
    } catch (e) { setCouponMsg(e.message); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!signedIn) { openAuthModal('login'); setErr('Please sign in to place your order.'); return; }
    if (form.name.trim().length < 2) { setErr('Please enter the name for the order.'); return; }
    if (form.phone.replace(/\D/g, '').length < 10) { setErr('Please enter a phone number with at least 10 digits.'); return; }
    if (form.address.trim().length < 5) { setErr('Please enter the full delivery address.'); return; }
    if (quote && quote.has_gemstone && !form.ack) { setErr('Please confirm the gemstone advice and return policy to continue.'); return; }
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
      setErr(e2.status === 401 ? 'Your session has ended. Please sign in again.' : e2.message);
      if (e2.status === 401) openAuthModal('login');
    } finally { setBusy(false); }
  };

  if (done) return <main className="mc"><Done result={done} /></main>;

  if (!items.length) {
    return (
      <main className="mc">
        <section className="mc-card mc-empty">
          <h1>Your cart is empty</h1>
          <p className="mc-muted">Add sacred items from the Astro Mall to get started.</p>
          <Link className="mc-btn mc-btn-primary" to="/astro-mall">Browse Astro Mall</Link>
        </section>
      </main>
    );
  }

  const t = quote && quote.totals;
  return (
    <main className="mc">
      <nav className="mc-crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><Link to="/astro-mall">Astro Mall</Link><span aria-hidden="true">›</span><b>Checkout</b></nav>
      <h1 className="mc-title">Checkout</h1>

      <form className="mc-grid" onSubmit={submit} noValidate>
        <div className="mc-col">
          <section className="mc-card" aria-labelledby="mc-cart-h">
            <h2 id="mc-cart-h">Your items</h2>
            <ul className="mc-lines">
              {items.map((i, idx) => {
                const line = quote && quote.lines[idx];
                return (
                  <li key={i.key}>
                    <img src={i.image} alt="" loading="lazy" />
                    <div className="mc-line-body">
                      <Link to={`/mall/product/${i.product_id}`} className="mc-line-title">{i.title}</Link>
                      {line && line.options_label ? <small className="mc-muted">{line.options_label}</small> : null}
                      {line && !line.in_stock ? <small className="mc-bad">Not enough stock for this quantity</small> : null}
                      <div className="mc-qty" role="group" aria-label={`Quantity for ${i.title}`}>
                        <button type="button" onClick={() => setQuantity(i.key, i.quantity - 1)} aria-label="Decrease quantity" disabled={i.quantity <= 1}>−</button>
                        <span aria-live="polite">{i.quantity}</span>
                        <button type="button" onClick={() => setQuantity(i.key, i.quantity + 1)} aria-label="Increase quantity" disabled={i.quantity >= 10}>+</button>
                        <button type="button" className="mc-remove" onClick={() => remove(i.key)}>Remove</button>
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
            <h2 id="mc-ship-h">Delivery details</h2>
            {!signedIn && <p className="mc-msg" role="note">You need to sign in to place an order. <button type="button" className="mc-link" onClick={() => openAuthModal('login')}>Sign in</button></p>}
            <div className="mc-fields">
              <label>Full name<input value={form.name} onChange={set('name')} autoComplete="name" required maxLength={100} /></label>
              <label>Phone number<input value={form.phone} onChange={set('phone')} autoComplete="tel" inputMode="tel" required maxLength={20} /></label>
              <label><span>Gotra <small className="mc-muted">(optional)</small></span><input value={form.gotra} onChange={set('gotra')} maxLength={100} /></label>
              <label className="mc-wide">Delivery address<textarea value={form.address} onChange={set('address')} rows={3} autoComplete="street-address" required maxLength={500} placeholder="House / street, city, state, PIN code" /></label>
            </div>
          </section>

          <section className="mc-card" aria-labelledby="mc-pay-h">
            <h2 id="mc-pay-h">Payment</h2>
            <div className="mc-pay" role="radiogroup" aria-label="Payment method">
              <label className={form.method === 'COD' ? 'on' : ''}><input type="radio" name="method" value="COD" checked={form.method === 'COD'} onChange={set('method')} /> <span><b>Cash on delivery</b><small>Pay when the parcel arrives.</small></span></label>
              <label className={form.method === 'WALLET' ? 'on' : ''}><input type="radio" name="method" value="WALLET" checked={form.method === 'WALLET'} onChange={set('method')} /> <span><b>Astro Jyotish wallet</b><small>{balance === null ? (signedIn ? 'Checking balance…' : 'Sign in to use your wallet.') : `Balance ${money(balance)}`}</small></span></label>
            </div>
            {walletShort && <p className="mc-msg mc-bad" role="alert">Your wallet balance is lower than the total. <Link to="/wallet">Add money</Link> or choose cash on delivery.</p>}
            {quote && quote.has_gemstone && (
              <label className="mc-check"><input type="checkbox" checked={form.ack} onChange={set('ack')} /> I have read the gemstone advice and return policy, and I understand gemstones should be worn after consulting an astrologer.</label>
            )}
          </section>
        </div>

        <aside className="mc-side">
          <section className="mc-card mc-summary" aria-labelledby="mc-sum-h">
            <h2 id="mc-sum-h">Order summary</h2>
            <div className="mc-coupon">
              <input aria-label="Coupon code" placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} maxLength={30} />
              <button type="button" className="mc-btn mc-btn-ghost" onClick={applyCoupon}>Apply</button>
            </div>
            {couponMsg && <p className={`mc-msg ${/applied/i.test(couponMsg) ? 'mc-ok' : 'mc-bad'}`} role="status">{couponMsg}</p>}
            {t ? (
              <dl className="mc-totals">
                <div><dt>Subtotal</dt><dd>{money(t.subtotal)}</dd></div>
                {t.member_discount > 0 && <div><dt>Member discount</dt><dd>−{money(t.member_discount)}</dd></div>}
                {t.coupon_discount > 0 && <div><dt>Coupon {t.coupon_code}</dt><dd>−{money(t.coupon_discount)}</dd></div>}
                <div><dt>Delivery</dt><dd>{t.delivery_fee > 0 ? money(t.delivery_fee) : 'Free'}</dd></div>
                <div className="mc-grand"><dt>Total</dt><dd>{money(t.total)}</dd></div>
              </dl>
            ) : <div className="mc-skel" aria-hidden="true" />}
            {err && <p className="mc-msg mc-bad" role="alert">{err}</p>}
            <button type="submit" className="mc-btn mc-btn-primary mc-block" disabled={busy || !quote || outOfStock || walletShort}>
              {busy ? 'Placing order…' : form.method === 'COD' ? 'Place order (pay on delivery)' : 'Pay from wallet & place order'}
            </button>
            <p className="mc-muted mc-fine">Items are energized as per Vedic rites before dispatch. Returns follow each product's policy.</p>
          </section>
        </aside>
      </form>
    </main>
  );
}
