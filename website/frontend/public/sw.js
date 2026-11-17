// Service worker: installable app shell with an offline fallback.
// - API calls and uploads are never cached, so balances, orders and bookings are always live.
// - App code (js/css/src) is network-first: users get the newest release when online and a working shell when offline.
// - Images and fonts are served from cache while a fresh copy is fetched in the background.
// A new worker waits until the page asks it to take over (see PwaInstall.js), so a release never swaps code mid-session.
const VERSION = 'astro-v5';
const CODE = `${VERSION}-code`;
const MEDIA = `${VERSION}-media`;
const SHELL_KEY = '/__shell';
const OFFLINE = '/offline.html';
const MEDIA_LIMIT = 150;

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch (_) { /* generic notification */ }
  event.waitUntil(self.registration.showNotification(data.title || 'Astro Jyotish', {
    body: data.body || 'You have a new reminder', icon: '/assets/brand/icon-192.png',
    data: { url: '/dashboard' }, tag: 'astro-reminder'
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const tab = tabs.find(t => new URL(t.url).origin === self.location.origin);
    if (tab) { await tab.navigate('/dashboard'); return tab.focus(); }
    return self.clients.openWindow('/dashboard');
  })());
});

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CODE);
    await cache.add(OFFLINE).catch(() => {});
    try { const res = await fetch('/', { cache: 'no-cache' }); if (res.ok) await cache.put(SHELL_KEY, res); } catch (e) { /* offline during install */ }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([CODE, MEDIA]);
    await Promise.all((await caches.keys()).filter(k => !keep.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => { if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting(); });

const withTimeout = (promise, ms) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);

async function networkFirst(request, cacheName, timeout) {
  const cache = await caches.open(cacheName);
  try {
    const res = await withTimeout(fetch(request), timeout);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw e;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(request);
  const fresh = fetch(request).then(async (res) => {
    if (res && res.ok) {
      await cache.put(request, res.clone());
      const keys = await cache.keys();
      if (keys.length > MEDIA_LIMIT) await Promise.all(keys.slice(0, keys.length - MEDIA_LIMIT).map(k => cache.delete(k)));
    }
    return res;
  }).catch(() => hit);
  return hit || fresh;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const path = url.pathname;
  if (path.startsWith('/api/') || path.startsWith('/uploads/') || path === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(request);
        if (res.ok && res.headers.get('content-type')?.includes('text/html')) (await caches.open(CODE)).put(SHELL_KEY, res.clone());
        return res;
      } catch (e) {
        const cache = await caches.open(CODE);
        return (await cache.match(SHELL_KEY)) || (await cache.match(OFFLINE)) || Response.error();
      }
    })());
    return;
  }
  if (/^\/(js|css|src)\//.test(path) || path === '/manifest.webmanifest') {
    event.respondWith(networkFirst(request, CODE, 4000));
  } else if (path.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
