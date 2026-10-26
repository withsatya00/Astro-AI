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
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

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

    // Route Matching Engine
    if (pathname === '/' || pathname === '/home') {
      this.switchView('view-home');
      const app = window.App || (typeof App !== 'undefined' ? App : null);
      if (app && app.loadHomeFeatured) {
        app.loadHomeFeatured();
      }
      this.updateNavbarActive('nav-link-home');
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
      this.switchView('view-calculators');
      this.updateNavbarActive('nav-link-calculators');
      const parts = pathname.split('/');
      if (parts[2]) {
        const subCalc = parts[2];
        const app = window.App || (typeof App !== 'undefined' ? App : null);
        if (app && app.openCalculatorsModal) {
          setTimeout(() => app.openCalculatorsModal(subCalc), 80);
        }
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
    const views = ['view-home', 'view-directory', 'view-profile', 'view-consultation', 'view-horoscope', 'view-calculators', 'view-panchang'];
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
    const navLinks = ['nav-link-home', 'nav-link-astrologers', 'nav-link-horoscope', 'nav-link-calculators', 'nav-link-panchang'];
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
