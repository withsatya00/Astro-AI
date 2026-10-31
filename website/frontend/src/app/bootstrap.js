/**
 * Astro Jyotish Application Bootstrapper
 * Dynamically loads and mounts modular UI components, page views, and layouts.
 */

import { NavbarComponent } from '../components/Navbar/Navbar.js';
import { GlobalFooterComponent } from '../components/GlobalFooter/GlobalFooter.js';
import { AstrologerCardComponent } from '../components/AstrologerCard/AstrologerCard.js?v=r4';
import { Favourites } from '../components/premium/Favourites.js?v=r1';
import { DirectoryChips } from '../components/premium/DirectoryChips.js?v=r1';
import { HomePageComponent } from '../pages/HomePage/HomePage.js';
import { DirectoryPageComponent } from '../pages/DirectoryPage/DirectoryPage.js';
import { ProfilePageComponent } from '../pages/ProfilePage/ProfilePage.js';
import { HoroscopePageComponent } from '../pages/HoroscopePage/HoroscopePage.js';
import { CalculatorsPageComponent } from '../pages/CalculatorsPage/CalculatorsPage.js';
import { PanchangPageComponent } from '../pages/PanchangPage/PanchangPage.js';
import { ConsultationPageComponent } from '../pages/ConsultationPage/ConsultationPage.js';
import { ModalsComponent } from '../pages/Modals/Modals.js';
import { MandirSevaPageComponent } from '../pages/MandirSevaPage/MandirSevaPage.js?v=r18';
import { AstroMallPageComponent } from '../pages/AstroMallPage/AstroMallPage.js?v=r16';
import { AdminPageComponent } from '../pages/AdminPage/AdminPage.js?v=r16';
import { ProductPageComponent } from '../pages/ProductPage/ProductPage.js?v=r23';
import { TemplePageComponent } from '../pages/TemplePage/TemplePage.js?v=r23';
import { PujaDetailPageComponent } from '../pages/PujaDetailPage/PujaDetailPage.js?v=r1';
import { RewardsPageComponent } from '../pages/RewardsPage/RewardsPage.js?v=r24';
import { SellerPageComponent } from '../pages/SellerPage/SellerPage.js?v=r23';
import { VerifyPageComponent } from '../pages/VerifyPage/VerifyPage.js?v=r23';
import { NotificationBell } from '../components/NotificationBell/NotificationBell.js?v=r16';
import { ChadawaModal } from '../components/ChadawaModal/ChadawaModal.js?v=r16';
import { DashboardPageComponent } from '../pages/DashboardPage/DashboardPage.js?v=r24';
import { GiftsPageComponent } from '../pages/GiftsPage/GiftsPage.js?v=r24';
import { GauSewaPageComponent } from '../pages/GauSewaPage/GauSewaPage.js?v=2';
import { PwaInstall } from '../components/premium/PwaInstall.js?v=r24';
import { Discovery } from '../components/shop/Discovery.js';
import { CartStore } from '../utils/cart-store.js';
import { ServiceInfo } from '../components/ServiceInfo.js';
import { GlobalSearch } from '../components/GlobalSearch.js';
import { initMediaUI } from '../utils/media-ui.js';

// Shared toast entry point used by the Mandir Seva, Astro Mall and Admin pages.
if (!window.Toast) {
  window.Toast = {
    show(message, type = 'info') {
      if (window.App && typeof window.App.showToast === 'function') window.App.showToast(message, type);
      else console.log(`[Toast:${type}] ${message}`);
    }
  };
}

export class Bootstrap {
  static async init() {
    console.log('[Bootstrap] Initializing component-based application shell...');

    const appRoot = document.getElementById('app-root');
    if (!appRoot) {
      console.error('[Bootstrap] #app-root element not found.');
      return;
    }

    try {
      // 1. Mount Global Navbar
      await NavbarComponent.mount('#site-navbar-mount');
      DashboardPageComponent.mount('#view-dashboard');
      Discovery.init();
      ServiceInfo.init();
      GlobalSearch.init();
      initMediaUI();
      PwaInstall.init();
      Favourites.init();
      window.addEventListener('astro:authchange', () => CartStore.sync());

      // 2. Concurrently mount all Page Views (each loads its own template & child components)
      await Promise.all([
        HomePageComponent.mount('#view-home'),
        DirectoryPageComponent.mount('#view-directory'),
        ProfilePageComponent.mount('#view-profile'),
        HoroscopePageComponent.mount('#view-horoscope'),
        CalculatorsPageComponent.mount('#view-calculators'),
        PanchangPageComponent.mount('#view-panchang'),
        ConsultationPageComponent.mount('#view-consultation'),
        MandirSevaPageComponent.mount('#view-mandir'),
        AstroMallPageComponent.mount('#view-mall'),
        AdminPageComponent.mount('#view-admin'),
        ProductPageComponent.mount('#view-product'),
        TemplePageComponent.mount('#view-temple'),
        PujaDetailPageComponent.mount('#view-puja-detail'),
        RewardsPageComponent.mount('#view-rewards'),
        SellerPageComponent.mount('#view-seller'),
        VerifyPageComponent.mount('#view-verify'),
        GiftsPageComponent.mount('#view-gifts'),
        GauSewaPageComponent.mount('#view-gau-sewa')
      ]);

      DirectoryChips.init();
      window.DirectoryChips = DirectoryChips;

      // 3. Mount Global Footer
      await GlobalFooterComponent.mount('#site-footer-mount');
      window.dispatchEvent(new Event('astro:componentsmounted'));

      // 4. Mount Global Modals
      await ModalsComponent.mount('#modals-container');
      // Appends to the container, so it must run after ModalsComponent (which replaces its contents).
      await ChadawaModal.mount('#modals-container');
      NotificationBell.mount();

      window.__bootstrap_mounted__ = true;
      console.log('[Bootstrap] All component templates loaded and mounted successfully.');

      // 5. Initialize application business controllers
      if (window.App && typeof window.App.init === 'function') {
        await window.App.init();
      }

      // 6. Apply full-site translations across newly mounted components
      if (window.I18n && typeof window.I18n.applyTranslations === 'function') {
        window.I18n.applyTranslations();
      }

      // 7. Route to current path now that all templates and controllers are mounted
      if (window.Router && typeof window.Router.handleRouting === 'function') {
        window.Router.handleRouting();
      }
    } catch (err) {
      console.error('[Bootstrap] Failed to mount components:', err);
      window.__bootstrap_error__ = err;
    }
  }
}

if (typeof window !== 'undefined') {
  window.Bootstrap = Bootstrap;
}

// Auto-boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Bootstrap.init());
} else {
  Bootstrap.init();
}

export default Bootstrap;
