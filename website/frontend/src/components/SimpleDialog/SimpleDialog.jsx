import React, { useEffect, useRef } from 'react';

// An accessible modal: role=dialog, Escape and backdrop click close it, Tab stays inside, focus returns afterwards.
export default function SimpleDialog({ label, onClose, children, wide = false }) {
  const box = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const before = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') { closeRef.current(); return; }
      if (e.key !== 'Tab' || !box.current) return;
      const items = box.current.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const close = box.current && box.current.querySelector('[data-close]');
    if (close) close.focus();
    return () => { document.removeEventListener('keydown', onKey); if (before && before.focus) before.focus(); };
  }, []);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={label}
        className={`relative w-full ${wide ? 'max-w-xl' : 'max-w-md'} p-6 bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] max-h-[92vh] overflow-y-auto`}>
        <button type="button" data-close onClick={onClose} aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold cursor-pointer border-0">✕</button>
        {children}
      </div>
    </div>
  );
}
