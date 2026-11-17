import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { fetchMyOrders, fetchTracking, cancelOrder, requestReturn, isSignedIn } from './mallApi.js';
import { fetchWallet } from '../../components/WalletModal/walletApi.js';
import SimpleDialog from '../../components/SimpleDialog/SimpleDialog.jsx';
import './mall-checkout.css';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const STATUS = {
  PLACED: 'Order placed', PAID: 'Paid', ENERGIZING: 'Being energized', DISPATCHED: 'Dispatched', DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled', RETURN_REQUESTED: 'Return requested',
};
const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

function Timeline({ data }) {
  return (
    <div className="mo-track">
      <ol className="mo-steps">
        {data.steps.map((s, i) => (
          <li key={i}><b>{s.label_en}</b>{s.note ? <span>{s.note}</span> : null}<small>{when(s.time)}</small></li>
        ))}
      </ol>
      {data.tracking_id && (
        <p className="mc-muted">
          {data.provider ? `${data.provider} · ` : ''}Tracking number <b>{data.tracking_id}</b>
          {data.external_url ? <> · <a href={data.external_url} target="_blank" rel="noopener noreferrer">Track on the courier site ↗</a></> : null}
        </p>
      )}
      {data.courier_scans.length > 0 && (
        <ul className="mo-scans">{data.courier_scans.map((c, i) => <li key={i}><b>{c.status}</b> {c.location ? `· ${c.location}` : ''} <small>{c.time}</small></li>)}</ul>
      )}
    </div>
  );
}

function OrderCard({ o, onChanged }) {
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState(null);
  const [trackErr, setTrackErr] = useState('');
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirming, setConfirming] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !track) {
      setTrackErr('');
      try { setTrack(await fetchTracking(o.id)); } catch (e) { setTrackErr(e.message); }
    }
  };

  const act = async (fn, okMsg) => {
    setBusy(true); setMsg('');
    try { await fn(); setMsg(okMsg); setTrack(null); setReturning(false); await onChanged(); } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };
  const cancel = () => {
    setConfirming(false);
    act(() => cancelOrder(o.id).then(() => fetchWallet().catch(() => {})), 'Order cancelled.');
  };

  const canCancel = o.status === 'PLACED' || o.status === 'PAID';
  const canReturn = o.status === 'DELIVERED';
  return (
    <li className="mc-card mo-order">
      <div className="mo-head">
        <img src={o.product_image} alt="" loading="lazy" />
        <div className="mo-main">
          <Link to={`/mall/product/${o.product_id}`} className="mc-line-title">{o.product_title}</Link>
          {o.options_label ? <small className="mc-muted">{o.options_label}</small> : null}
          <small className="mc-muted">Quantity {o.quantity} · {money(o.total_price)} · {o.payment_method === 'COD' ? 'Cash on delivery' : o.payment_method === 'WALLET' ? 'Paid from wallet' : o.payment_method}</small>
          <small className="mc-muted">Order {o.order_number} · {when(o.created_at)}</small>
        </div>
        <span className={`mo-badge mo-${String(o.status).toLowerCase()}`}>{STATUS[o.status] || o.status}</span>
      </div>
      <div className="mo-actions">
        <button type="button" className="mc-btn mc-btn-ghost" onClick={toggle} aria-expanded={open}>{open ? 'Hide tracking' : 'Track order'}</button>
        {canCancel && <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setConfirming(true)} disabled={busy}>Cancel order</button>}
        {canReturn && !returning && <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setReturning(true)}>Request return</button>}
      </div>
      {returning && (
        <form className="mo-return" onSubmit={(e) => { e.preventDefault(); act(() => requestReturn(o.id, reason.trim()), 'Return requested. We will contact you.'); }}>
          <label>Why do you want to return it?<textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={300} required minLength={5} placeholder="e.g. damaged in transit, wrong item" /></label>
          <div className="mo-actions">
            <button type="submit" className="mc-btn mc-btn-primary" disabled={busy || reason.trim().length < 5}>Send return request</button>
            <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setReturning(false)}>Not now</button>
          </div>
        </form>
      )}
      {msg && <p className="mc-msg" role="status">{msg}</p>}
      {confirming && (
        <SimpleDialog label="Cancel order" onClose={() => setConfirming(false)}>
          <h3 className="font-serif text-lg font-bold text-[#1E1B4B] mt-0 pr-10">Cancel this order?</h3>
          <p className="text-xs text-slate-600">{o.product_title} · {o.order_number}.{o.payment_method === 'WALLET' ? ' The amount will be refunded to your wallet.' : ''}</p>
          <div className="mo-actions" style={{ marginTop: 16 }}>
            <button type="button" className="mc-btn mc-btn-primary" onClick={cancel} disabled={busy}>Yes, cancel order</button>
            <button type="button" className="mc-btn mc-btn-ghost" onClick={() => setConfirming(false)}>Keep order</button>
          </div>
        </SimpleDialog>
      )}
      {open && (track ? <Timeline data={track} /> : trackErr ? <p className="mc-msg mc-bad" role="alert">{trackErr}</p> : <div className="mc-skel" aria-hidden="true" style={{ height: 60 }} />)}
    </li>
  );
}

export default function MyOrdersPage() {
  const { openAuthModal } = useAuth();
  const signedIn = isSignedIn();
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!isSignedIn()) { setOrders([]); return; }
    try { setOrders((await fetchMyOrders()).orders); setErr(''); } catch (e) { setErr(e.status === 401 ? 'Please sign in again to see your orders.' : e.message); setOrders([]); }
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); load(); }, [load]);

  return (
    <main className="mc">
      <nav className="mc-crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><Link to="/astro-mall">Astro Mall</Link><span aria-hidden="true">›</span><b>My orders</b></nav>
      <h1 className="mc-title">My orders</h1>
      {!signedIn ? (
        <section className="mc-card mc-empty">
          <h2>Sign in to see your orders</h2>
          <button type="button" className="mc-btn mc-btn-primary" onClick={() => openAuthModal('login')}>Sign in</button>
        </section>
      ) : orders === null ? (
        <div className="mc-skel" aria-hidden="true" style={{ height: 160, borderRadius: 16 }} role="status" />
      ) : (
        <>
          {err && <p className="mc-msg mc-bad" role="alert">{err}</p>}
          {orders.length === 0 && !err ? (
            <section className="mc-card mc-empty"><h2>No orders yet</h2><p className="mc-muted">When you order from the Astro Mall, you can follow it here.</p><Link className="mc-btn mc-btn-primary" to="/astro-mall">Browse Astro Mall</Link></section>
          ) : (
            <ul className="mo-list">{orders.map((o) => <OrderCard key={o.id} o={o} onChanged={load} />)}</ul>
          )}
        </>
      )}
    </main>
  );
}
