/**
 * Astro Jyotish Clean URL Router (HTML5 History API)
 * Replaces hash-based routing (#/...) with clean, semantic URLs:
 * - / (Home)
 * - /astrologers (Directory)
 * - /astrologers/:slug (Profile)
 * - /consultation/:id (Consultation Workspace)
 * - /rashiphal (Daily & Monthly Horoscope)
 * - /calculators (Kundali Milan & Doshas)
 * - /panchang (Aaj Ka Panchang)
 * 
 * Supports:
 * - Browser back / forward navigation (popstate)
 * - Direct page refresh and bookmarks
 * - Backward compatibility with legacy hash URLs by auto-migrating them to clean URLs
 * - Global click interception for [data-nav-link] and internal <a> links
 */

const Router = {
  routes: {},
  currentRoute: null,
  currentParams: {},

  init() {
    // 1. Intercept internal link clicks across the document
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;
      if (link.hasAttribute('download')) return;
      if (href === '#') { e.preventDefault(); return; }
      if (href.startsWith('#') && !href.startsWith('#/')) {
        try { if (document.getElementById(decodeURIComponent(href.slice(1)))) return; } catch {}
      }

      // Allow external links, downloads, or target="_blank"
      if (link.target === '_blank' || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      // Check if it's an internal application route
      if (href.startsWith('/') || href.startsWith('#')) {
        e.preventDefault();
        this.navigate(href);
      }
    });

    // 2. Listen to browser history navigation (Back / Forward)
    window.addEventListener('popstate', () => this.handleRouting());

    // 3. Handle legacy hash migration (#/astrologers -> /astrologers)
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.slice(1);
      window.history.replaceState({}, '', cleanPath + window.location.search);
    }

    // 4. Initial route resolution
    this.handleRouting();
  },

  navigate(path) {
    if (!path) return;

    // Normalize legacy hash paths
    if (path.startsWith('#/')) {
      path = path.slice(1);
    } else if (path.startsWith('#')) {
      path = '/' + path.slice(1);
    }

    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Push state to browser history if path is changing
    const currentFull = window.location.pathname + window.location.search;
    if (currentFull !== path) {
      window.history.pushState({}, '', path);
    }

    this.handleRouting();
  },

  handleRouting() {
    window.ChadhavaExperience?.closeRouted?.();
    window.GauSewaPageComponent?.stopPolling?.();
    let pathname = window.location.pathname || '/';

    // Fallback for static file serving servers where pathname may end in index.html
    if (pathname.endsWith('index.html')) {
      pathname = pathname.replace(/index\.html$/, '') || '/';
    }

    // Check if there is still a legacy hash to respect
    if (window.location.hash && window.location.hash.startsWith('#/')) {
      pathname = window.location.hash.slice(1);
      window.history.replaceState({}, '', pathname + window.location.search);
    }

    // Strip trailing slash if present (except root '/')
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    // Shared links are often typed or auto-capitalised (/Astrologers); every route and slug here is lowercase.
    pathname = pathname.toLowerCase();

    const searchParams = new URLSearchParams(window.location.search);
    this.currentRoute = pathname;
    const firstRoute = !this.hasRouted;
    this.hasRouted = true;
    if (window.Seo) window.Seo.update(pathname);

    // Route Matching Engine
    if (pathname === '/' || pathname === '/home') {
      this.switchView('view-home');
      const app = window.App || (typeof App !== 'undefined' ? App : null);
      if (app && app.loadHomeFeatured) {
        app.loadHomeFeatured();
      }
      this.updateNavbarActive('nav-link-home');
    } 
    else if (pathname === '/dashboard' || pathname === '/my-account') {
      this.switchView('view-dashboard');
      this.updateNavbarActive(null);
      window.DashboardPageComponent?.open();
    }
    else if (pathname === '/astrologers') {
      this.switchView('view-directory');
      const app = window.App || (typeof App !== 'undefined' ? App : null);
      if (app && app.loadAstrologerDirectory) {
        app.loadAstrologerDirectory();
      }
      this.updateNavbarActive('nav-link-astrologers');
    } 
    else if (pathname.startsWith('/astrologers/') || pathname.startsWith('/astrologer/')) {
      const slug = pathname.startsWith('/astrologers/') 
        ? pathname.replace('/astrologers/', '') 
        : pathname.replace('/astrologer/', '');
      this.switchView('view-profile');
      const app = window.App || (typeof App !== 'undefined' ? App : null);
      if (app && app.renderProfilePage) {
        app.renderProfilePage(decodeURIComponent(slug));
      }
      this.updateNavbarActive('nav-link-astrologers');
    } 
    else if (pathname === '/consultation' || pathname.startsWith('/consultation/') || pathname.startsWith('/consultations/')) {
      let consultationId = '';
      if (pathname.startsWith('/consultations/')) {
        consultationId = pathname.replace('/consultations/', '');
      } else if (pathname.startsWith('/consultation/')) {
        consultationId = pathname.replace('/consultation/', '');
      }
      this.switchView('view-consultation');
      const astroParam = searchParams.get('astrologer') || searchParams.get('astro');
      const chat = window.ChatController || (typeof ChatController !== 'undefined' ? ChatController : null);
      if (astroParam && chat) {
        if (chat.selectAstrologer) {
          chat.selectAstrologer(astroParam);
        } else if (chat.switchAstrologer) {
          chat.switchAstrologer(astroParam);
        }
      }
      if (consultationId && consultationId !== 'new') {
        if (chat && chat.resumeConsultationById) {
          chat.resumeConsultationById(consultationId);
        }
      }
      this.updateNavbarActive('nav-link-consultation');
    } 
    else if (pathname === '/rashiphal' || pathname === '/horoscope' || pathname === '/rashifal') {
      this.switchView('view-horoscope');
      const app = window.App || (typeof App !== 'undefined' ? App : null);
      if (app && app.fetchAndRenderHoroscope) {
        setTimeout(() => app.fetchAndRenderHoroscope(), 50);
      }
      this.updateNavbarActive('nav-link-horoscope');
    } 
    else if (pathname === '/calculators' || pathname === '/calculator' || pathname.startsWith('/calculators/')) {
      const parts = pathname.split('/');
      // A specific tool (e.g. from the Vedic Tools menu) opens as a dialog over the page the visitor is on;
      // only a cold load of that URL needs the calculators page behind it.
      if (!parts[2] || firstRoute) {
        this.switchView('view-calculators');
        this.updateNavbarActive('nav-link-calculators');
      }
      if (parts[2]) {
        const subCalc = parts[2];
        const app = window.App || (typeof App !== 'undefined' ? App : null);
        if (app && app.openCalculatorsModal) {
          setTimeout(() => app.openCalculatorsModal(subCalc), 80);
        }
      }
    } 
    else if (pathname === '/mandir-seva' || pathname === '/mandir' || pathname === '/chadawa'
      || pathname.replace(/\/+$/, '') === '/mandir-seva/chadhava' || pathname.replace(/\/+$/, '') === '/mandir-seva/puja') {
      this.switchView('view-mandir');
      this.updateNavbarActive('nav-link-mandir');
      const mode = pathname.includes('/chadhava') ? 'chadhava' : pathname.includes('/puja') ? 'puja' : 'home';
      window.ChadhavaExperience?.closeRouted?.();
      if (window.MandirSevaPageComponent) {
        window.MandirSevaPageComponent.mode = mode;
        if (window.MandirSevaPageComponent.applyMode) window.MandirSevaPageComponent.applyMode();
        if (window.MandirSevaPageComponent.loadTemples) setTimeout(() => window.MandirSevaPageComponent.loadTemples(), 50);
      }
    } 
    else if (pathname === '/astro-mall' || pathname === '/mall' || pathname === '/samagri') {
      this.switchView('view-mall');
      this.updateNavbarActive('nav-link-mall');
      if (window.AstroMallPageComponent && window.AstroMallPageComponent.loadProducts) {
        setTimeout(() => window.AstroMallPageComponent.loadProducts(), 50);
      }
    } 
    else if (pathname.startsWith('/astro-mall/product/')) {
      this.switchView('view-product');
      this.updateNavbarActive('nav-link-mall');
      const id = pathname.replace('/astro-mall/product/', '').replace(/\/+$/, '');
      if (window.ProductPageComponent) setTimeout(() => window.ProductPageComponent.open(id), 30);
    }
    else if (/^\/mandir-seva\/(puja|chadhava)\/event\/[\w-]+\/?$/.test(pathname)) {
      this.switchView('view-mandir');this.updateNavbarActive('nav-link-mandir');
      const id=pathname.split('/event/')[1].replace(/\/+$/, '');
      const kind=pathname.split('/')[2],page=window.MandirSevaPageComponent;
      if(page){page.mode=kind;page.applyMode?.();}
      window.ChadhavaExperience?.openEvent?.(id);
    }
    else if (/^\/mandir-seva\/puja\/[\w-]+\/?$/.test(pathname)) {
      // A puja detail page: the puja list sits behind it, the detail opens over it and has its own shareable URL.
      this.switchView('view-mandir');
      this.updateNavbarActive('nav-link-mandir');
      const id = pathname.replace('/mandir-seva/puja/', '').replace(/\/+$/, '');
      const page = window.MandirSevaPageComponent;
      if (page) { page.mode = 'puja'; if (page.applyMode) page.applyMode(); }
      setTimeout(() => window.ChadhavaExperience?.calendarDetail?.(id), 150);
    }
    else if (pathname.startsWith('/mandir-seva/')) {
      this.switchView('view-temple');
      this.updateNavbarActive('nav-link-mandir');
      const slug = pathname.replace('/mandir-seva/', '').replace(/\/+$/, '');
      if (window.TemplePageComponent) setTimeout(() => window.TemplePageComponent.open(slug), 30);
    }
    else if (pathname === '/rewards' || pathname === '/my-rewards') {
      this.switchView('view-rewards');
      if (window.RewardsPageComponent) setTimeout(() => window.RewardsPageComponent.open(), 30);
    }
    else if (pathname === '/gifts' || pathname === '/gift-cards' || pathname === '/festival-packs') {
      this.switchView('view-gifts');
      this.updateNavbarActive(null);
      if (window.GiftsPageComponent) setTimeout(() => window.GiftsPageComponent.open(pathname === '/festival-packs' ? 'packs' : 'cards'), 30);
    }
    else if (pathname.startsWith('/gau-sewa/receipt/')) {
      this.switchView('view-gau-sewa');
      this.updateNavbarActive('nav-link-gau-sewa');
      // The receipt token is case-sensitive, so it is read from the original (not lower-cased) path.
      const token = decodeURIComponent((window.location.pathname.split('/gau-sewa/receipt/')[1] || '').replace(/\/+$/, ''));
      if (window.GauSewaPageComponent) setTimeout(() => window.GauSewaPageComponent.openReceipt(token), 30);
    }
    else if (pathname === '/gau-sewa') {
      this.switchView('view-gau-sewa');
      this.updateNavbarActive('nav-link-gau-sewa');
      if (window.GauSewaPageComponent) setTimeout(() => window.GauSewaPageComponent.open(), 30);
    }
    else if (pathname === '/seller' || pathname === '/seller-dashboard') {
      this.switchView('view-seller');
      if (window.SellerPageComponent) setTimeout(() => window.SellerPageComponent.open(), 30);
    }
    else if (pathname.startsWith('/verify/')) {
      this.switchView('view-verify');
      const code = pathname.replace('/verify/', '').replace(/\/+$/, '');
      if (window.VerifyPageComponent) setTimeout(() => window.VerifyPageComponent.open(code), 30);
    }
    else if (pathname === '/admin') {
      this.switchView('view-admin');
      if (window.AdminPageComponent && window.AdminPageComponent.open) {
        setTimeout(() => window.AdminPageComponent.open(), 50);
      }
    }
    else if (pathname === '/panchang' || pathname === '/aaj-ka-panchang') {
      this.switchView('view-panchang');
      this.updateNavbarActive('nav-link-panchang');
      const app = window.App || (typeof App !== 'undefined' ? App : null);
      if (app && app.loadPanchangPage) {
        setTimeout(() => app.loadPanchangPage(), 50);
      }
    } 
    else if (pathname === '/login' || pathname === '/register') {
      this.switchView('view-home');
      this.updateNavbarActive('nav-link-home');
      const app = window.App || (typeof App !== 'undefined' ? App : null);
      if (app && app.openAuthModal) {
        setTimeout(() => app.openAuthModal(pathname === '/register' ? 'register' : 'login'), 120);
      }
    }
    else if (pathname === '/milan' || pathname === '/kundali-milan') {
      this.switchView('view-calculators');
      this.updateNavbarActive('nav-link-calculators');
      const app = window.App || (typeof App !== 'undefined' ? App : null);
      if (app && app.openKundaliMilanModal) {
        setTimeout(() => app.openKundaliMilanModal(), 80);
      }
    } 
    else {
      // Clean 404 handling or fallback to home
      console.warn('Unknown clean route, defaulting to Home:', pathname);
      this.switchView('view-home');
      this.updateNavbarActive('nav-link-home');
    }

    // Scroll to top on route change (unless active consultation)
    if (!pathname.startsWith('/consultation')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  switchView(viewId) {
    const views = ['view-dashboard', 'view-home', 'view-directory', 'view-profile', 'view-consultation', 'view-horoscope', 'view-calculators', 'view-panchang', 'view-mandir', 'view-mall', 'view-admin', 'view-product', 'view-temple', 'view-rewards', 'view-gifts', 'view-gau-sewa', 'view-seller', 'view-verify'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) {
        if (v === viewId) {
          el.style.display = '';
          el.classList.add('active');
        } else {
          el.style.display = 'none';
          el.classList.remove('active');
        }
      }
    });

    // Control visibility of global site navbar and footer
    const isConsultation = viewId === 'view-consultation';
    const siteNavbar = document.getElementById('site-navbar');
    const globalFooter = document.getElementById('site-global-footer');

    if (siteNavbar) {
      siteNavbar.style.display = isConsultation ? 'none' : '';
    }
    if (globalFooter) {
      globalFooter.style.display = isConsultation ? 'none' : '';
    }

    // Apply translations across active view elements
    if (window.I18n && typeof window.I18n.applyTranslations === 'function') {
      setTimeout(() => window.I18n.applyTranslations(), 30);
    }
  },

  updateNavbarActive(activeNavId) {
    const navLinks = ['nav-link-home', 'nav-link-astrologers', 'nav-link-horoscope', 'nav-link-calculators', 'nav-link-panchang', 'nav-link-mall', 'nav-link-mandir', 'nav-link-gau-sewa'];
    navLinks.forEach(id => {
      const link = document.getElementById(id);
      if (link) {
        link.classList.toggle('active', id === activeNavId);
      }
    });
  }
};

// Global Exposure
window.Router = Router;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}
