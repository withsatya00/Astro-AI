// The wallet lives on the server (/api/v1/wallet). Nothing about balance or credit is kept or decided in the browser:
// a recharge is credited only after Razorpay confirms the payment (or, in development, by the server's test mode).
import { useCallback, useEffect, useState } from 'react';

const BASE = '/api/v1/wallet';
export const MIN_RECHARGE = 50;
export const MAX_RECHARGE = 100000;

export class WalletError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const token = () => { try { return localStorage.getItem('astro_access_token') || ''; } catch (e) { return ''; } };
export const walletSignedIn = () => !!token();

async function call(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token()) headers.Authorization = `Bearer ${token()}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (e) { throw new WalletError(0, 'Network unavailable. Please check your connection and try again.'); }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (typeof j.detail === 'string') detail = j.detail;
      else if (Array.isArray(j.detail)) detail = j.detail.map((d) => String(d.msg || '').replace(/^Value error, /, '')).join('; ');
    } catch (e) { /* not json */ }
    throw new WalletError(res.status, detail);
  }
  return res.json();
}

// Tells the navbar and any open wallet view that the balance changed.
export function announceBalance(balance) {
  try { if (window.App) window.App.walletBalance = balance; } catch (e) { /* ignore */ }
  window.dispatchEvent(new CustomEvent('astro:wallet-updated', { detail: { balance } }));
}

export async function fetchWallet() {
  const w = await call('');
  announceBalance(w.balance);
  return w;
}

const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

export const toRow = (t) => ({
  id: t.id,
  ref: t.reference_id || String(t.id).slice(0, 8),
  title: t.description || (t.type === 'credit' ? 'Wallet credit' : 'Wallet debit'),
  date: when(t.created_at),
  type: t.type === 'credit' || t.type === 'refund' ? 'credit' : 'debit',
  amount: Math.abs(Number(t.amount) || 0),
});

export function useWallet(active = true) {
  const signedIn = walletSignedIn();
  const [state, setState] = useState({ loading: signedIn, balance: 0, rows: [], error: '', testMode: false, available: true });
  const refresh = useCallback(async () => {
    if (!walletSignedIn()) { setState({ loading: false, balance: 0, rows: [], error: '', testMode: false, available: true }); return; }
    try {
      const w = await fetchWallet();
      setState({ loading: false, balance: w.balance, rows: (w.transactions || []).map(toRow), error: '', testMode: !!w.is_test_mode, available: !!w.payments_available });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.status === 401 ? 'Please sign in again to see your wallet.' : e.message }));
    }
  }, []);
  useEffect(() => { if (active) refresh(); }, [active, refresh]);
  return { ...state, signedIn, refresh };
}

let checkoutScript = null;
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript) {
    checkoutScript = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve;
      s.onerror = () => { checkoutScript = null; reject(new WalletError(0, 'The payment window could not be loaded. Please check your connection and try again.')); };
      document.head.appendChild(s);
    });
  }
  return checkoutScript;
}

// Starts a recharge. Resolves with the server's result once the money is credited; rejects with a WalletError otherwise.
export async function recharge(amount, user) {
  if (!walletSignedIn()) throw new WalletError(401, 'Please sign in to recharge your wallet.');
  const cfg = await call('/payment-config');
  if (cfg.provider === 'test') {
    const r = await call('/recharge', { method: 'POST', body: { amount, payment_method: 'Test mode (no real money)' } });
    announceBalance(r.new_balance);
    return r;
  }
  if (cfg.provider !== 'razorpay') throw new WalletError(409, 'Online payments are not available right now. Please try again later.');
  const order = await call('/razorpay/order', { method: 'POST', body: { amount } });
  await loadCheckout();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.key_id, amount: order.amount, currency: order.currency, order_id: order.order_id,
      name: 'Astro Jyotish', description: 'Wallet recharge', theme: { color: '#3E0B18' },
      prefill: { name: (user && user.full_name) || '', email: (user && user.email) || '' },
      handler: async (resp) => {
        try {
          const r = await call('/razorpay/verify', { method: 'POST', body: resp });
          announceBalance(r.new_balance);
          resolve(r);
        } catch (e) {
          // The payment went through at Razorpay; the signed webhook credits it even if this confirmation fails.
          reject(new WalletError(e.status || 0, 'We could not confirm your payment just now. If money was deducted, it will be added to your wallet shortly.'));
        }
      },
      modal: { ondismiss: () => reject(new WalletError(0, 'Payment was cancelled.')) },
    });
    rzp.on('payment.failed', (resp) => reject(new WalletError(0, (resp && resp.error && resp.error.description) || 'Payment failed. Please try again.')));
    rzp.open();
  });
}
