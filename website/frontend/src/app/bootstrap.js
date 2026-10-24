/**
 * Astro Jyotish Application Bootstrapper
 * Dynamically loads and mounts modular UI components, page views, and layouts.
 */

import { NavbarComponent } from '../components/Navbar/Navbar.js';
import { GlobalFooterComponent } from '../components/GlobalFooter/GlobalFooter.js';
import { AstrologerCardComponent } from '../components/AstrologerCard/AstrologerCard.js';
import { HomePageComponent } from '../pages/HomePage/HomePage.js';
import { DirectoryPageComponent } from '../pages/DirectoryPage/DirectoryPage.js';
import { ProfilePageComponent } from '../pages/ProfilePage/ProfilePage.js';
import { HoroscopePageComponent } from '../pages/HoroscopePage/HoroscopePage.js';
import { CalculatorsPageComponent } from '../pages/CalculatorsPage/CalculatorsPage.js';
import { PanchangPageComponent } from '../pages/PanchangPage/PanchangPage.js';
import { ConsultationPageComponent } from '../pages/ConsultationPage/ConsultationPage.js';
import { ModalsComponent } from '../pages/Modals/Modals.js';

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

      // 2. Concurrently mount all Page Views (each loads its own template & child components)
      await Promise.all([
        HomePageComponent.mount('#view-home'),
        DirectoryPageComponent.mount('#view-directory'),
        ProfilePageComponent.mount('#view-profile'),
        HoroscopePageComponent.mount('#view-horoscope'),
        CalculatorsPageComponent.mount('#view-calculators'),
        PanchangPageComponent.mount('#view-panchang'),
        ConsultationPageComponent.mount('#view-consultation')
      ]);

      // 3. Mount Global Footer
      await GlobalFooterComponent.mount('#site-footer-mount');

      // 4. Mount Global Modals
      await ModalsComponent.mount('#modals-container');

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
