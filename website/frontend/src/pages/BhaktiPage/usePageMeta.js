// Per-page <title>, meta description and canonical link for the Bhakti pages (the app shell ships one static title for every route).
import { useEffect } from 'react';

const SITE = 'Astro Jyotish';

function metaTag(name) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
  return el;
}
function canonicalTag() {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  return el;
}

// The page's own head values are saved when the first hook mounts and put back when the last one unmounts. Layout and detail pages both call this,
// and their cleanups run in an order we do not control, so restoring per-hook snapshots would leave a stale title behind.
let users = 0;
let base = null;

// A falsy title is ignored, so a detail page can call this before its data has loaded.
export function usePageMeta(title, description) {
  useEffect(() => {
    if (!title) return undefined;
    const desc = metaTag('description');
    const canon = canonicalTag();
    if (users === 0) base = { title: document.title, desc: desc.getAttribute('content'), canon: canon.getAttribute('href') };
    users += 1;
    document.title = `${title} | ${SITE}`;
    if (description) desc.setAttribute('content', description.replace(/\s+/g, ' ').trim().slice(0, 160));
    canon.setAttribute('href', `${window.location.origin}${window.location.pathname}`);
    return () => {
      users -= 1;
      if (users > 0 || !base) return;
      document.title = base.title;
      if (base.desc === null) desc.removeAttribute('content'); else desc.setAttribute('content', base.desc);
      if (base.canon === null) canon.removeAttribute('href'); else canon.setAttribute('href', base.canon);
    };
  }, [title, description]);
}
