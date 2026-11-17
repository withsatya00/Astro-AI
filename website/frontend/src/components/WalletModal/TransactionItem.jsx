import React from 'react';

const isDebit = (tx) => tx.type === 'debit' || Number(tx.amount) < 0;

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

/** One row of the backend wallet ledger ({ id, amount, type, description, reference_id, created_at }). */
export default function TransactionItem({ tx, className = '' }) {
  const debit = isDebit(tx);
  return (
    <div className={`flex items-center justify-between rounded-xl border border-[#E7E2D8] bg-[#FFFDF7] p-3 text-xs ${className}`}>
      <div>
        <strong className="block text-xs text-[#1E1B4B]">{tx.description}</strong>
        <small className="text-[10px] text-slate-400">{formatDate(tx.created_at)} • {tx.reference_id || tx.id}</small>
      </div>
      <span className={`text-sm font-extrabold ${debit ? 'text-rose-600' : 'text-emerald-700'}`}>
        {debit ? '-' : '+'}₹{Math.abs(Number(tx.amount)).toFixed(2)}
      </span>
    </div>
  );
}
