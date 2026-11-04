// Daily ritual helpers: which deity the weekday belongs to, and a small per-day checklist kept on this device.
import { useCallback, useEffect, useState } from 'react';
import { track } from '../../analytics.jsx';

// Traditional weekday association. index = Date#getDay() (0 = Sunday).
export const WEEKDAY = [
  { slug: 'ram', day: 'Ravivaar', name: 'Shri Ram', line: 'Ravivaar Surya aur Shri Ram ka din hai', mall: 'mala' },
  { slug: 'shiva', day: 'Somvaar', name: 'Bhole Nath', line: 'Somvaar Bhagwan Shiv ka din hai', mall: 'rudraksha' },
  { slug: 'hanuman', day: 'Mangalvaar', name: 'Hanuman Ji', line: 'Mangalvaar Hanuman Ji ka din hai', mall: 'puja_essentials' },
  { slug: 'ganesh', day: 'Budhvaar', name: 'Ganesh Ji', line: 'Budhvaar Shri Ganesh ka din hai', mall: 'idols' },
  { slug: 'krishna', day: 'Guruvaar', name: 'Vishnu · Krishna', line: 'Guruvaar Bhagwan Vishnu ka din hai', mall: 'mala' },
  { slug: 'durga', day: 'Shukravaar', name: 'Maa Durga · Lakshmi', line: 'Shukravaar Devi Maa ka din hai', mall: 'yantra' },
  { slug: 'hanuman', day: 'Shanivaar', name: 'Hanuman Ji', line: 'Shanivaar Hanuman Ji aur Shani Dev ka din hai', mall: 'puja_essentials' },
];

export const MALL_FOR_DEITY = { shiva: 'rudraksha', hanuman: 'puja_essentials', ganesh: 'idols', durga: 'yantra', krishna: 'mala', vishnu: 'mala', ram: 'mala' };

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
