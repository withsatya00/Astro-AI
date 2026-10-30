/**
 * Astro Jyotish - premium polish layer (loaded last, additive).
 * - emoji -> inline SVG line icons (hero section and chat messages are left untouched)
 * - optional dark mode toggle (light stays the default)
 * - mobile bottom tab bar, tap feedback, pull-to-refresh
 * - verified/consultation trust row + "Plus" pill on astrologer cards
 * - live strip built from real directory data (no invented user activity)
 */
(function () {
  'use strict';

  // Phone browsers and in-app WebViews report a viewport taller than what is visible (address/tool bars), which
  // pushed the chat input and the End Call bar off-screen. Track the real visible height for CSS (--app-h).
  function setAppHeight() {
    const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    document.documentElement.style.setProperty('--app-h', Math.round(h) + 'px');
  }
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 250));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', setAppHeight);

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toast = (msg, type) => { if (window.App && App.showToast) App.showToast(msg, type || 'info'); };

  /* ------------------------------------------------------------------ icons */
  const P = {
    om: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/>',
    planet: '<circle cx="12" cy="12" r="4.5"/><path d="M3.2 15.5C1.6 13.4 6 8.6 12.8 6.6M20.8 8.5c1.6 2.1-2.8 6.9-9.6 8.9"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6M2 9h20"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    star: '<path d="M12 2.5l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18.3 5.8 21.6 7 14.7l-5-4.9 6.9-1z"/>',
    crystal: '<circle cx="12" cy="10.5" r="7"/><path d="M7 20.5h10M9 17.5l-1 3M15 17.5l1 3"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    globe: '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5a14 14 0 0 1 0 19 14 14 0 0 1 0-19z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M9 8.5h6M9 12h6M10 8.5c4 0 4 5 0 5l4 3"/>',
    briefcase: '<rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2.5 13h19"/>',
    ring: '<circle cx="12" cy="15" r="5.5"/><path d="M9 3h6l2 3-5 3-5-3z"/>',
    trend: '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    crown: '<path d="M3 18h18M4 16L2.5 7l5.5 4.5L12 5l4 6.5L21.5 7 20 16z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-3.5-7.5C14.5 9 13.5 10 12 10c0-3-1-5-3-8-1 4-4 6-4 12 0 4 3 8 7 8z"/>',
    hourglass: '<path d="M6 2h12M6 22h12M7 2c0 5 5 6 5 10s-5 5-5 10M17 2c0 5-5 6-5 10s5 5 5 10"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
    compass: '<circle cx="12" cy="12" r="9.5"/><path d="M15.8 8.2l-2 5.6-5.6 2 2-5.6z"/>',
    mic: '<rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5"/>',
    play: '<path d="M7 4.5l12 7.5-12 7.5z"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2.5h6v3H9zM9 11h6M9 15h4"/>',
    check: '<path d="M20 6.5L9 17.5l-5-5"/>',
    shield: '<path d="M12 2.5l8 3v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10v-6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    home: '<path d="M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6"/>',
    lamp: '<path d="M4 14h16l-2 6H6zM12 3c2 2.5 2.5 4.5 0 7-2.5-2.5-2-4.5 0-7z"/>'
  };
  const MAP = {
    '🕉': 'om', '🪐': 'planet', '💎': 'gem', '✨': 'sparkles', '⭐': 'star', '★': 'star', '🌟': 'star', '🔮': 'crystal',
    '💬': 'chat', '📞': 'phone', '👤': 'user', '🌐': 'globe', '🪙': 'coin', '💼': 'briefcase', '💍': 'ring',
    '📈': 'trend', '👑': 'crown', '☀': 'sun', '🌙': 'moon', '🔥': 'flame', '⏳': 'hourglass', '🔔': 'bell',
    '📅': 'calendar', '🧭': 'compass', '🎙': 'mic', '▶': 'play', '📋': 'clipboard', '🎉': 'sparkles',
    '🌍': 'globe', '🪔': 'lamp', '🛡': 'shield', '🏠': 'home'
  };
  const icon = (name, cls) =>
    `<span class="pi${cls ? ' ' + cls : ''}" data-ic="${name}" aria-hidden="true"><svg viewBox="0 0 24 24">${P[name]}</svg></span>`;

  const EMOJI_RE = new RegExp('(' + Object.keys(MAP).join('|') + ')[\\uFE0E\\uFE0F]?', 'g');
  // The hero keeps its original look; chat bubbles carry model text; the rest are form controls/code.
  const SKIP = '#hero-section, .message-bubble, .msg-row, .streaming-content-wrapper, [data-no-icons], .chakra-spinner, ' +
    'textarea, input, select, option, script, style, svg, .pm-ptr, #call-caption, .call-caption';

  function swapNode(textNode) {
    const text = textNode.nodeValue;
    if (!text || !EMOJI_RE.test(text)) { EMOJI_RE.lastIndex = 0; return; }
    EMOJI_RE.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let last = 0, m;
    while ((m = EMOJI_RE.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const span = document.createElement('span');
      span.innerHTML = icon(MAP[m[1]]);
      frag.appendChild(span.firstChild);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    textNode.parentNode.replaceChild(frag, textNode);
  }

  function iconify(root) {
    if (!root || root.nodeType !== 1 || root.closest(SKIP)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || n.nodeValue.length > 400 || !n.parentElement) return NodeFilter.FILTER_REJECT;
        return n.parentElement.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(swapNode);
  }

  /* ------------------------------------------------------------- dark mode */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#13111D' : '#1e0b44');
    document.querySelectorAll('.pm-theme-toggle').forEach(b => {
      b.innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      b.setAttribute('aria-pressed', String(t === 'dark'));
    });
  }
  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    store.set('astro_theme', next);
    applyTheme(next);
  }
  function mountThemeToggle() {
    const slots = [document.querySelector('.site-nav-actions'), document.querySelector('.mobile-nav-header')];
    slots.forEach(slot => {
      if (!slot || slot.querySelector('.pm-theme-toggle')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pm-theme-toggle';
      b.addEventListener('click', toggleTheme);
      slot.insertBefore(b, slot.firstChild);
    });
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }

  /* ------------------------------------------------------- bottom tab bar */
  let tabbar = null;
  function currentPath() { return location.pathname.replace(/\/+$/, '') || '/'; }
  function tabFor(path) {
    if (path === '/') return 'home';
    if (path.startsWith('/astrologer')) return 'astrologers';
    if (path.startsWith('/consultation')) return 'chat';
    if (['/my-account', '/dashboard'].includes(path)) return 'profile';
    if (path === '/mandir-seva' || path.startsWith('/mandir-seva/') || path === '/mandir' || path === '/chadawa') return 'seva';
    if (path === '/astro-mall' || path.startsWith('/astro-mall/') || path === '/mall' || path === '/samagri') return 'mall';
    return '';
  }
  const TAB_LABELS = { home: ['Home', 'मुखपृष्ठ'], astrologers: ['Astrologers', 'ज्योतिषी'], seva: ['Seva', 'सेवा'], mall: ['Mall', 'मॉल'], profile: ['Profile', 'प्रोफ़ाइल'] };
  const tabLabel = id => TAB_LABELS[id][(window.I18n && window.I18n.currentLang) === 'hi' ? 1 : 0];
  function updateTabbar() {
    const path = currentPath();
    const inChat = path.startsWith('/consultation');
    document.body.classList.toggle('in-consult', inChat);
    if (!tabbar) return;
    tabbar.classList.toggle('hidden', inChat);
    document.body.classList.toggle('pm-has-tabbar', !inChat);
    const active = tabFor(path);
    tabbar.querySelectorAll('.pm-tab').forEach(t => { t.lastElementChild.textContent = tabLabel(t.dataset.tab); });
    tabbar.querySelectorAll('.pm-tab').forEach(t => { const selected = t.dataset.tab === active; t.classList.toggle('active', selected); if (selected) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); });
  }
  function go(path) { if (window.Router && Router.navigate) Router.navigate(path); else location.href = path; }
  function mountTabbar() {
    if (tabbar) return;
    tabbar = document.createElement('nav');
    tabbar.className = 'pm-tabbar';
    tabbar.setAttribute('aria-label', 'Primary');
    tabbar.innerHTML = [
      ['home', 'home'], ['astrologers', 'crystal'], ['seva', 'lamp'], ['mall', 'gem'], ['profile', 'user']
    ].map(([id, ic]) => `<button type="button" class="pm-tab" data-tab="${id}">${icon(ic)}<span translate="no">${tabLabel(id)}</span></button>`).join('');
    tabbar.addEventListener('click', e => {
      const b = e.target.closest('.pm-tab');
      if (!b) return;
      const tab = b.dataset.tab;
      if (tab === 'home') go('/');
      else if (tab === 'astrologers') go('/astrologers');
      else if (tab === 'seva') go('/mandir-seva');
      else if (tab === 'mall') go('/astro-mall');
      else if (tab === 'profile' && window.App) {
        App.currentUser ? App.openUserAccountModal() : App.openAuthModal('login');
      }
    });
    document.body.appendChild(tabbar);
    window.addEventListener('astro:languagechange', updateTabbar);
    updateTabbar();
  }
  // remember the last astrologer slug so the Chat tab can resume
  function trackConsultationSlug() {
    const m = currentPath().match(/^\/consultations?\/([^/]+)/);
    if (m) store.set('astroai_astrologer_slug', m[1]);
  }
  function watchRoutes() {
    const fire = () => { trackConsultationSlug(); updateTabbar(); };
    ['pushState', 'replaceState'].forEach(fn => {
      const orig = history[fn];
      history[fn] = function () { const r = orig.apply(this, arguments); fire(); return r; };
    });
    window.addEventListener('popstate', fire);
    fire();
  }

  /* ----------------------------------------------------- tap / haptic feedback */
  function mountHaptics() {
    let last = 0;
    document.addEventListener('pointerdown', e => {
      if (reduceMotion || !navigator.vibrate) return;
      if (!e.target.closest('button, .chat-quick-chip, .dyn-chip, .pm-tab, [role="button"]')) return;
      const now = Date.now();
      if (now - last < 120) return;
      last = now;
      navigator.vibrate(8);
    }, { passive: true });
  }

  /* ---------------------------------------------------------- astrologer data */
  let directory = null;
  const normName = t => String(t || '').replace(/[✓√]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  function loadDirectory() {
    if (!directory) {
      // Same request the app makes, so the shared API cache serves it instead of a second round trip.
      directory = (window.API && window.API.getAstrologers ? window.API.getAstrologers({ limit: 50 }) : fetch('/api/v1/astrologers?limit=50').then(r => (r.ok ? r.json() : { items: [] })))
        .then(d => {
          const m = new Map();
          (d.items || []).forEach(a => { m.set(String(a.id), a); m.set('name:' + normName(a.name), a); });
          return m;
        })
        .catch(() => new Map());
    }
    return directory;
  }
  const compact = n => (n >= 1000 ? (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'k' : String(n));

  async function decorateCards(root) {
    const cards = (root.matches && root.matches('.astrologer-card') ? [root] : [...root.querySelectorAll('.astrologer-card')])
      .filter(c => !c.dataset.pmDone);
    if (!cards.length) return;
    cards.forEach(c => { c.dataset.pmDone = '1'; }); // claim synchronously: several observer batches can race here
    const byId = await loadDirectory();
    cards.forEach(card => {
      const h3 = card.querySelector('h3');
      // cards come in two markups; some carry data-id, all show the astrologer name in the heading
      const a = byId.get(String(card.dataset.id)) || (h3 && byId.get('name:' + normName(h3.textContent)));
      if (!a || !h3 || !h3.nextElementSibling || card.querySelector('.pm-trust')) return;
      const row = document.createElement('div');
      row.className = 'pm-trust';
      const consults = a.consultations_count || a.review_count || 0;
      row.innerHTML =
        (a.is_verified ? `<span>${icon('shield')}Verified<span class="pm-long"> by Astro Jyotish</span></span>` : '') +
        (consults ? `<span class="muted premium-num">${compact(consults)}+ consultations</span>` : '') +
        `<button type="button" class="pm-plus" data-plus>${icon('crown')}Plus</button>`;
      h3.nextElementSibling.insertAdjacentElement('afterend', row);
    });
  }

  /* --------------------------------------------------------------- Plus modal */
  function openPlus() {
    let ov = document.getElementById('pm-plus-modal');
    if (!ov) {
      ov = document.createElement('div');
      ov.className = 'pm-overlay';
      ov.id = 'pm-plus-modal';
      ov.innerHTML = `
        <div class="pm-sheet" role="dialog" aria-modal="true" aria-labelledby="pm-plus-title">
          <span class="pm-badge-soon">COMING SOON</span>
          <h3 id="pm-plus-title">Astro Jyotish Plus</h3>
          <p>A premium membership for seekers who consult regularly.</p>
          <ul>
            <li>${icon('crown')}Priority queue with top astrologers</li>
            <li>${icon('chat')}Unlimited chat consultations</li>
            <li>${icon('clipboard')}Kundli PDF reports included</li>
          </ul>
          <div class="pm-actions">
            <button type="button" class="pm-btn" data-close>Not now</button>
            <button type="button" class="pm-btn primary" data-join>Notify me</button>
          </div>
        </div>`;
      ov.addEventListener('click', e => {
        if (e.target === ov || e.target.closest('[data-close]')) ov.classList.remove('open');
        if (e.target.closest('[data-join]')) {
          store.set('astro_plus_waitlist', new Date().toISOString());
          ov.classList.remove('open');
          toast("You're on the Plus waitlist. We'll let you know at launch.", 'success');
        }
      });
      document.body.appendChild(ov);
    }
    ov.classList.add('open');
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-plus]')) { e.preventDefault(); e.stopPropagation(); openPlus(); }
  }, true);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('pm-plus-modal')?.classList.remove('open');
  });

  /* ---------------------------------------------------------------- live strip */
  async function mountLiveStrip() {
    const stats = document.querySelector('.trust-stats-section, .trust-stats-bar');
    if (!stats || document.getElementById('pm-live-strip')) return;
    const byId = await loadDirectory();
    if (document.getElementById('pm-live-strip')) return; // another call finished first
    const list = [...new Set(byId.values())];
    if (!list.length) return;
    const online = list.filter(a => a.availability === 'online').length;
    const top = list.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
    const langs = new Set(list.flatMap(a => a.languages || [])).size;
    const lines = [
      online ? `${online} astrologers are online right now` : null,
      top ? `Top rated: ${top.name} · ${Number(top.rating).toFixed(1)}★ from ${compact(top.review_count || 0)} reviews` : null,
      `${list.length} verified astrologers across ${langs} languages`,
      'First consultation free with code FIRSTFREE'
    ].filter(Boolean);
    const strip = document.createElement('div');
    strip.className = 'pm-live-strip';
    strip.id = 'pm-live-strip';
    strip.innerHTML = '<div class="pm-live-strip-inner" aria-live="polite"><span class="pm-live-dot"></span><span class="pm-live-text premium-num"></span></div>';
    stats.insertAdjacentElement('afterend', strip);
    const text = strip.querySelector('.pm-live-text');
    let i = 0;
    const show = () => { text.textContent = lines[i % lines.length]; i++; };
    show();
    if (!reduceMotion) {
      setInterval(() => {
        if (document.hidden) return;
        text.classList.add('out');
        setTimeout(() => { show(); text.classList.remove('out'); }, 350);
      }, 4200);
    }
  }

  /* ------------------------------------------------------------ pull to refresh */
  function mountPullToRefresh() {
    if (!('ontouchstart' in window)) return;
    const ind = document.createElement('div');
    ind.className = 'pm-ptr';
    ind.innerHTML = icon('sparkles');
    document.body.appendChild(ind);
    let startY = 0, pulling = false, dy = 0, busy = false;
    const reset = () => { ind.style.transform = ''; ind.classList.remove('spin'); pulling = false; dy = 0; };
    const refresher = () => {
      const path = currentPath();
      if (path === '/') return () => App.loadHomeFeatured && App.loadHomeFeatured();
      if (path.startsWith('/astrologers')) return () => App.loadAstrologerDirectory && App.loadAstrologerDirectory();
      return null;
    };
    window.addEventListener('touchstart', e => {
      if (busy || window.scrollY > 0 || e.touches.length !== 1 || !refresher()) return;
      if (e.target.closest('select, input, textarea, .pm-overlay, .app-modal-backdrop')) return;
      startY = e.touches[0].clientY;
      pulling = true;
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      if (!pulling) return;
      dy = e.touches[0].clientY - startY;
      if (dy <= 0) { reset(); return; }
      ind.style.transform = `translate(-50%, ${Math.min(dy * 0.45, 70) - 64 + 24}px)`;
    }, { passive: true });
    window.addEventListener('touchend', async () => {
      if (!pulling) return;
      const fn = dy > 110 ? refresher() : null;
      if (!fn) { reset(); return; }
      busy = true;
      ind.classList.add('spin');
      ind.style.transform = 'translate(-50%, 28px)';
      try { directory = null; await fn(); } catch (e) { /* the page reports its own load errors */ }
      setTimeout(() => { reset(); busy = false; }, 500);
    }, { passive: true });
  }

  /* --------------------------------------------------------------------- boot */
  let scheduled = false;
  const pending = new Set();
  function flush() {
    scheduled = false;
    observer.disconnect();
    pending.forEach(n => { if (n.isConnected) { iconify(n); decorateCards(n); } });
    pending.clear();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      const n = m.type === 'characterData' ? m.target.parentElement : m.target;
      if (n && n.nodeType === 1) pending.add(n);
      m.addedNodes.forEach(a => { if (a.nodeType === 1) pending.add(a); });
    }
    if (!scheduled) { scheduled = true; requestAnimationFrame(flush); }
  });

  function boot() {
    mountThemeToggle();
    mountTabbar();
    watchRoutes();
    mountHaptics();
    mountPullToRefresh();
    iconify(document.body);
    decorateCards(document.body);
    mountLiveStrip();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    // components mount asynchronously: pick up late navbar / home sections
    let tries = 0;
    const t = setInterval(() => {
      mountThemeToggle();
      mountLiveStrip();
      if (++tries > 20) clearInterval(t);
    }, 500);
  }

  window.PremiumUI = { icon, toggleTheme, openPlus };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
