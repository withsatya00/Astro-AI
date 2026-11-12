import React, { useEffect, useMemo, useState } from 'react';
import { copy, errorText } from './consultCopy.js';
import { Modal } from './Panels.jsx';
import { busySlots, createBooking } from './consultApi.js';

const IST_MS = 5.5 * 3600000;
const SLOTS = Array.from({ length: 24 }, (_, i) => `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`); // 09:00 to 20:30 IST
const DURATIONS = [15, 30, 45, 60];
const istToday = () => new Date(Date.now() + IST_MS).toISOString().slice(0, 10);
const istPlus = (days) => new Date(Date.now() + IST_MS + days * 86400000).toISOString().slice(0, 10);
const slotStart = (date, time) => new Date(`${date}T${time}:00+05:30`);
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// A real appointment: the slot is checked against the astrologer's other bookings and the amount is paid from the wallet.
export default function BookingModal({ lang, astro, name, signedIn, user, balance, balanceReady, onClose, onRecharge, onSignIn, onBooked }) {
  const c = copy(lang);
  const [mode, setMode] = useState('call');
  const [date, setDate] = useState(istToday());
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(15);
  const [who, setWho] = useState((user && user.full_name) || '');
  const [phone, setPhone] = useState('');
  const [concern, setConcern] = useState('');
  const [busy, setBusy] = useState([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => { busySlots(astro.id).then((d) => setBusy(d.busy || [])).catch(() => setBusy([])); }, [astro.id]);

  const rate = Number(astro.price_per_minute) || 0;
  const total = Math.round(rate * duration * 100) / 100;
  const short = signedIn && balanceReady && total > 0 && balance < total;

  const state = useMemo(() => SLOTS.map((t) => {
    const start = slotStart(date, t);
    const end = new Date(start.getTime() + duration * 60000);
    if (start.getTime() <= Date.now() + 5 * 60000) return { t, why: c.bookPast };
    if (busy.some((b) => start < new Date(b.end) && new Date(b.start) < end)) return { t, why: c.bookBusy };
    return { t, why: '' };
  }), [date, duration, busy, c]);

  useEffect(() => { if (time && state.find((s) => s.t === time && s.why)) setTime(''); }, [state, time]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!who.trim()) { setError(c.bookNameRequired); return; }
    if (phone && !/^\d{10}$/.test(phone.replace(/[\s-]/g, ''))) { setError(c.bookPhoneInvalid); return; }
    if (!time) { setError(c.bookTimeRequired); return; }
    setWorking(true);
    try {
      const r = await createBooking({
        astrologer_id: astro.id, user_name: who.trim(), user_phone: phone.replace(/[\s-]/g, '') || undefined,
        scheduled_at: `${date}T${time}:00+05:30`, duration_minutes: duration, mode, concern: concern.trim() || undefined,
      });
      setDone(r);
      onBooked && onBooked(r);
    } catch (err) {
      setError(errorText(c, err));
    }
    setWorking(false);
  };

  return (
    <Modal labelledBy="cr-book-h" onClose={onClose} wide>
        <button type="button" className="cr-x" onClick={onClose} aria-label={c.close}>×</button>
        <h2 id="cr-book-h">{c.bookTitle} {name}</h2>
        {done ? (
          <div className="cr-done" role="status">
            <div className="cr-namaste" aria-hidden="true">🙏</div>
            <p><b>{c.bookDone}</b></p>
            <p>{new Date(done.scheduled_at).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST · {done.duration_minutes} {c.minutes}</p>
            <p>{c.bookTotal}: <b>{money(done.total_amount)}</b> · {c.bookId}: <code>{String(done.booking_id).slice(0, 8)}</code></p>
            <button type="button" className="cr-btn primary" onClick={onClose}>{c.close}</button>
          </div>
        ) : !signedIn ? (
          <div className="cr-done">
            <p>{c.bookSignIn}</p>
            <button type="button" className="cr-btn primary" onClick={onSignIn}>{c.signIn}</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <fieldset className="cr-field"><legend>{c.bookMode}</legend>
              <div className="cr-seg">{[['call', c.modeCall], ['video', c.modeVideo], ['chat', c.modeChat]].map(([k, l]) => <button key={k} type="button" className={mode === k ? 'on' : ''} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}</div>
            </fieldset>
            <div className="cr-grid2">
              <label className="cr-field">{c.bookDate}<input type="date" value={date} min={istToday()} max={istPlus(30)} onChange={(e) => setDate(e.target.value || istToday())} /></label>
              <label className="cr-field">{c.bookDuration}<select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>{DURATIONS.map((d) => <option key={d} value={d}>{d} {c.minutes}</option>)}</select></label>
            </div>
            <fieldset className="cr-field"><legend>{c.bookTime}</legend>
              <div className="cr-slots">{state.map((s) => <button key={s.t} type="button" disabled={!!s.why} className={time === s.t ? 'on' : ''} aria-pressed={time === s.t} title={s.why} onClick={() => setTime(s.t)}>{s.t}</button>)}</div>
            </fieldset>
            <div className="cr-grid2">
              <label className="cr-field">{c.bookName}<input value={who} maxLength={80} onChange={(e) => setWho(e.target.value)} autoComplete="name" /></label>
              <label className="cr-field">{c.bookPhone}<input value={phone} inputMode="tel" maxLength={14} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
            </div>
            <label className="cr-field">{c.bookConcern}<input value={concern} maxLength={160} onChange={(e) => setConcern(e.target.value)} /></label>
            <div className="cr-bill">
              <span>{c.bookTotal}<b>{money(total)}</b><small>{money(rate)}{c.perMin} × {duration}</small></span>
              <span>{c.bookBalance}<b>{balanceReady ? money(balance) : c.balanceUnavailable}</b></span>
            </div>
            {short && <div className="cr-warn" role="alert">{c.bookShort} <button type="button" className="cr-linkbtn" onClick={onRecharge}>{c.recharge}</button></div>}
            {error && <div className="cr-warn" role="alert">{error}</div>}
            <button type="submit" className="cr-btn primary" disabled={working || short}>{working ? c.booking : c.bookConfirm}</button>
          </form>
        )}
    </Modal>
  );
}
