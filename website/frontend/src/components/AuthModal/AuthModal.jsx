import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const inputClass =
  'w-full rounded-xl border border-astro-border bg-white px-3 py-2.5 text-sm text-astro-text outline-none focus:border-astro-purple focus:ring-2 focus:ring-astro-purple/15';

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-astro-navy-dark">{label}</span>
      <input className={inputClass} {...props} />
    </label>
  );
}

export default function AuthModal({ mode, onModeChange, onClose }) {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === 'register';

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => { setError(''); }, [mode]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = isRegister ? await register(form) : await login(form);
      showToast(`Welcome, ${user.full_name || user.email}!`, 'success');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-astro-border bg-astro-surface shadow-astro-lg"
      >
        <div className="flex items-start justify-between border-b border-astro-border-subtle px-6 pb-4 pt-6">
          <div>
            <h2 id="auth-modal-title" className="m-0 font-serif text-xl font-bold text-astro-navy-dark">
              {isRegister ? 'Create your account' : 'Sign in'}
            </h2>
            <p className="m-0 mt-1 text-xs text-astro-text-muted">
              {isRegister ? 'Save kundlis, track sevas and recharge your wallet.' : 'Welcome back to Astro Jyotish.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-astro-border-subtle text-base font-bold text-astro-navy-light hover:bg-astro-border"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 px-6 py-5">
          {isRegister && (
            <Field label="Full name" type="text" autoComplete="name" value={form.fullName} onChange={update('fullName')} />
          )}
          <Field label="Email" type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
          {isRegister && (
            <Field label="Phone (optional)" type="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} />
          )}
          <Field
            label="Password"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={form.password}
            onChange={update('password')}
          />

          {error && (
            <p role="alert" className="m-0 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-full border-0 bg-astro-navy-dark py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="m-0 border-t border-astro-border-subtle px-6 py-4 text-center text-xs text-astro-text-muted">
          {isRegister ? 'Already have an account?' : 'New to Astro Jyotish?'}{' '}
          <button
            type="button"
            onClick={() => onModeChange(isRegister ? 'login' : 'register')}
            className="cursor-pointer border-0 bg-transparent p-0 text-xs font-bold text-astro-purple hover:underline"
          >
            {isRegister ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
}
