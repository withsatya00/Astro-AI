import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWallet } from '../../context/WalletContext.jsx';

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-astro-border-subtle py-3 last:border-0">
      <span className="text-xs text-astro-text-muted">{label}</span>
      <span className="text-sm font-semibold text-astro-navy-dark">{value || '—'}</span>
    </div>
  );
}

export default function AccountPage() {
  const { user, isSignedIn, displayName, openAuth, logout } = useAuth();
  const { formattedBalance, openWallet } = useWallet();

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="mb-4 block text-5xl">🪷</span>
        <h1 className="mb-2 font-serif text-2xl font-bold text-astro-navy-dark">My Account</h1>
        <p className="mb-6 text-sm text-astro-text-muted">
          Sign in to see your wallet, consultations, saved kundlis and seva bookings.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => openAuth('login')}
            className="cursor-pointer rounded-full border-0 bg-astro-navy-dark px-6 py-2.5 text-xs font-bold text-white"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => openAuth('register')}
            className="cursor-pointer rounded-full border border-astro-border bg-white px-6 py-2.5 text-xs font-bold text-astro-navy-dark"
          >
            Create account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 font-serif text-2xl font-bold text-astro-navy-dark sm:text-3xl">Namaste, {displayName}</h1>
          <p className="m-0 mt-1 text-sm text-astro-text-muted">Your account, wallet and activity.</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="cursor-pointer rounded-full border border-astro-border bg-white px-5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
        >
          Sign out
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl border border-astro-border bg-white p-6 shadow-astro-sm">
          <h2 className="m-0 mb-2 font-serif text-lg font-bold text-astro-navy-dark">Profile</h2>
          <InfoRow label="Name" value={user.full_name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone} />
          {user.consultations_count !== undefined && (
            <InfoRow label="Consultations" value={String(user.consultations_count)} />
          )}
          {user.saved_profiles_count !== undefined && (
            <InfoRow label="Saved kundlis" value={String(user.saved_profiles_count)} />
          )}
        </section>

        <section
          className="flex flex-col justify-between rounded-3xl border border-astro-gold p-6 text-white shadow-astro-md"
          style={{ background: 'linear-gradient(135deg, #3E0B18 0%, #5B1024 60%, #20040A 100%)' }}
        >
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#EFD4A0]">Wallet balance</span>
            <div className="mt-2 font-serif text-4xl font-extrabold text-[#FFFDF8]">{formattedBalance}</div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={openWallet}
              className="cursor-pointer rounded-full border-0 bg-astro-gold px-5 py-2 text-xs font-bold text-astro-navy-dark"
            >
              + Add money
            </button>
            <Link to="/wallet" className="rounded-full border border-white/30 px-5 py-2 text-xs font-bold text-white no-underline">
              History
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
