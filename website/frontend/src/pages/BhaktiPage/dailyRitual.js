// Daily ritual helpers: which deity the weekday belongs to, and a small per-day checklist kept on this device.
import { useCallback, useEffect, useState } from 'react';
import { track } from '../../analytics.jsx';

// Traditional weekday association. index = Date#getDay() (0 = Sunday).
export const WEEKDAY = [
  { slug: 'ram', day: 'Sunday', day_hi: 'रविवार', name: 'Shri Ram', name_hi: 'श्री राम', line_en: 'Sunday is dedicated to Surya Dev and Shri Ram', line_hi: 'रविवार — भगवान सूर्य देव एवं श्री राम का पावन दिन', mall: 'mala' },
  { slug: 'shiva', day: 'Monday', day_hi: 'सोमवार', name: 'Lord Shiva', name_hi: 'भोलेनाथ शिव', line_en: 'Monday is dedicated to Lord Shiva', line_hi: 'सोमवार — देवाधिदेव महादेव शिव का पावन दिन', mall: 'rudraksha' },
  { slug: 'hanuman', day: 'Tuesday', day_hi: 'मंगलवार', name: 'Hanuman Ji', name_hi: 'हनुमान जी', line_en: 'Tuesday is dedicated to Lord Hanuman', line_hi: 'मंगलवार — संकटमोचन श्री हनुमान जी का पावन दिन', mall: 'puja_essentials' },
  { slug: 'ganesh', day: 'Wednesday', day_hi: 'बुधवार', name: 'Lord Ganesha', name_hi: 'श्री गणेश', line_en: 'Wednesday is dedicated to Lord Ganesha', line_hi: 'बुधवार — विघ्नहर्ता श्री गणेश जी का पावन दिन', mall: 'puja_essentials' },
  { slug: 'krishna', day: 'Thursday', day_hi: 'गुरुवार', name: 'Lord Vishnu & Krishna', name_hi: 'भगवान विष्णु व श्रीकृष्ण', line_en: 'Thursday is dedicated to Lord Vishnu and Krishna', line_hi: 'गुरुवार — जगतपालक भगवान विष्णु व श्री कृष्ण का पावन दिन', mall: 'mala' },
  { slug: 'durga', day: 'Friday', day_hi: 'शुक्रवार', name: 'Maa Durga & Lakshmi', name_hi: 'माँ दुर्गा व लक्ष्मी जी', line_en: 'Friday is dedicated to Divine Mother Durga and Lakshmi', line_hi: 'शुक्रवार — जगदम्बा माँ दुर्गा व महालक्ष्मी का पावन दिन', mall: 'yantra' },
  { slug: 'hanuman', day: 'Saturday', day_hi: 'शनिवार', name: 'Hanuman Ji & Shani Dev', name_hi: 'हनुमान जी व शनि देव', line_en: 'Saturday is dedicated to Lord Hanuman and Shani Dev', line_hi: 'शनिवार — श्री हनुमान जी एवं शनि देव का पावन दिन', mall: 'puja_essentials' },
];

export const MALL_FOR_DEITY = { shiva: 'rudraksha', hanuman: 'puja_essentials', ganesh: 'puja_essentials', durga: 'yantra', krishna: 'mala', vishnu: 'mala', ram: 'mala' };

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const KEY = 'bhakti_daily_ritual_v1';
const EVENT = 'bhakti-ritual-change';

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && v.date === todayKey() ? v : { date: todayKey(), done: {} };
  } catch (e) { return { date: todayKey(), done: {} }; }
};
const write = (v) => {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* storage unavailable: tick stays for this visit only */ }
  window.dispatchEvent(new Event(EVENT));
};

// Pages call this when the person has really done a step (e.g. opened an aarti).
export function markRitual(step, on = true) {
  const cur = read();
  if (!!cur.done[step] === on) return;
  if (on) track('bhakti_ritual_step', { step });
  write({ ...cur, done: { ...cur.done, [step]: on } });
}

export function useRitual() {
  const [state, setState] = useState(read);
  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const toggle = useCallback((step) => markRitual(step, !read().done[step]), []);
  return { done: state.done, toggle };
}

// Milestones are earned from the person's real jaap numbers; nothing is invented.
export const BADGES = [
  { id: 'streak7', ic: '🔥', label: '7 din ki streak', test: (s) => s.streak >= 7 },
  { id: 'streak21', ic: '🪔', label: '21 din ki streak', test: (s) => s.streak >= 21 },
  { id: 'mala1', ic: '📿', label: 'Pehli poorn mala', test: (s) => s.malas >= 1 },
  { id: 'jaap10k', ic: '🕉️', label: '10,000 jaap', test: (s) => s.lifetime >= 10000 },
  { id: 'jaap1l', ic: '🌸', label: '1 lakh jaap', test: (s) => s.lifetime >= 100000 },
];
