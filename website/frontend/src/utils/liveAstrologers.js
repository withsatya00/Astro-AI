// Live figures (rating, review count, availability) for the astrologers listed in the directory.
// The directory file is a static snapshot, so these numbers are read from the backend when it is reachable;
// if it is not, the snapshot is shown unchanged.
import { useEffect, useState } from 'react';

let cache = null;
const STATUS = { online: 'Online', busy: 'Busy right now', offline: 'Offline' };

const load = () => {
  if (!cache) {
    cache = fetch('/api/v1/astrologers?limit=50')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => Object.fromEntries((d.items || []).map((a) => [a.slug, a])))
      .catch(() => { cache = null; return {}; });
  }
  return cache;
};

// Forget what was loaded, e.g. after a review changed a rating.
export const refreshLive = () => { cache = null; };

export function withLive(a, live) {
  const l = live && live[a.slug];
  if (!l) return a;
  return {
    ...a,
    rating: l.rating,
    review_count: l.review_count,
    availability: l.availability,
    statusLabel: STATUS[l.availability] || a.statusLabel,
    is_ai: l.is_ai,
  };
}

export function useLiveAstrologers() {
  const [live, setLive] = useState(null);
  useEffect(() => {
    let on = true;
    load().then((m) => { if (on) setLive(m); });
    return () => { on = false; };
  }, []);
  return live;
}

export const hasReviews = (a) => Number(a && a.review_count) > 0;
