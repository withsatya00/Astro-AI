// Prefers individually generated photos (assets/portraits/individual/<slug>.webp) when they exist.
// Every profile has its own file; the same astrologer may legitimately appear in several sections,
// so duplicates are NOT replaced (that made real photos show up as initials on the home page).
(function () {
  const PORTRAIT = /assets\/portraits\/(?:individual\/)?([a-z0-9-]+)\.(?:jpg|webp|png|svg)/i;
  const FALLBACK_BG = ['#4a1b9a', '#B45309', '#0F766E', '#BE185D', '#1D4ED8', '#4D7C0F'];

  function initialsAvatar(name, seed) {
    const letters = (name || '?').replace(/^(pt|dr|acharya|vidushi|jyotishi)\.?\s+/i, '').trim().split(/\s+/)
      .slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '🕉';
    const bg = FALLBACK_BG[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % FALLBACK_BG.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${bg}"/>` +
      `<text x="50" y="62" font-family="Georgia,serif" font-size="38" fill="#fff" text-anchor="middle">${letters}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Listing of generated photos: assets/portraits/individual/index.json -> ["slug", ...]
  let manifest = null;
  function probeIndividual(slug) {
    if (!manifest) {
      manifest = fetch('/assets/portraits/individual/index.json', { cache: 'no-cache' })
        .then(r => (r.ok ? r.json() : []))
        .then(list => new Set(Array.isArray(list) ? list : []))
        .catch(() => new Set());
    }
    return manifest.then(set => set.has(slug));
  }

  function isVisible(img) {
    return !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length);
  }

  function priority(img) {
    return img.matches('.card-portrait-img, .astrologer-avatar-img, .calling-avatar img') ? 0 : 1;
  }

  async function upgrade(img) {
    const m = PORTRAIT.exec(img.getAttribute('src') || '');
    if (!m || /individual\//.test(img.src) || m[1] === 'default-avatar') return;
    if (await probeIndividual(m[1])) {
      // A slow manifest request must not overwrite a different profile's newer image.
      const current = PORTRAIT.exec(img.getAttribute('src') || '');
      if (current && current[1] === m[1]) img.src = `/assets/portraits/individual/${img.closest('.astrologer-card') ? 'sm/' : ''}${m[1]}.webp`;
    }
  }

  // Kept for tooling; intentionally not run automatically.
  function dedupe() {
    const seen = new Map();
    // While the call screen is open it covers the page, so only its portrait counts.
    const call = document.getElementById('modal-live-audio-call');
    const scope = call && call.style.display !== 'none' && call.classList.contains('active') ? call : document;
    const srcOf = img => img.dataset.portraitOriginal || img.getAttribute('src') || '';
    const imgs = [...scope.querySelectorAll('img')].filter(img => PORTRAIT.test(srcOf(img)) && isVisible(img));
    imgs.sort((a, b) => priority(a) - priority(b));
    for (const img of imgs) {
      const key = PORTRAIT.exec(srcOf(img))[1].toLowerCase();
      if (key === 'default-avatar') continue;
      if (!seen.has(key)) {
        seen.set(key, img);
        if (img.dataset.portraitOriginal) { img.src = img.dataset.portraitOriginal; delete img.dataset.portraitOriginal; }
        continue;
      }
      if (!img.dataset.portraitOriginal) img.dataset.portraitOriginal = img.getAttribute('src');
      img.src = initialsAvatar(img.alt, key);
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      restore();
      document.querySelectorAll('img[src*="assets/portraits/"]').forEach(upgrade);
    });
  }

  function restore() {
    document.querySelectorAll('img[data-portrait-original]').forEach(img => { img.src = img.dataset.portraitOriginal; delete img.dataset.portraitOriginal; });
  }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  window.PortraitGuard = { run: schedule };
})();
