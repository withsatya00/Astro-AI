/**
 * Website Shared Global Layout Component
 * Unifies shared Navbar, dynamic page outlet, and shared Global Footer
 * across all public pages (Home, Astrologers, Panchang, Calculators, Rashiphal).
 */

import { NavbarComponent } from '../components/Navbar/Navbar.js';
import { GlobalFooterComponent } from '../components/GlobalFooter/GlobalFooter.js';

export class SharedLayout {
  constructor(options = {}) {
    this.options = options;
    this.navbar = new NavbarComponent(options);
    this.footer = new GlobalFooterComponent(options);
  }

  /**
   * Render the complete page shell wrapping page outlet
   * @param {string} outletHtml - HTML content of the active route
   * @param {string} activeRoute - Current clean route path
   * @returns {string} Fully assembled HTML page shell
   */
  render(outletHtml = '', activeRoute = '/') {
    this.navbar.activeRoute = activeRoute;
    const isConsultation = activeRoute.startsWith('/consultation/');

    if (isConsultation) {
      // Consultation requires dedicated full-screen workspace without public header/footer
      return `
        <div class="site-layout-shell consultation-shell">
          <main class="site-layout-outlet full-screen">
            ${outletHtml}
          </main>
        </div>
      `;
    }

    return `
      <div class="site-layout-shell">
        ${this.navbar.render()}
        <main class="site-layout-outlet" id="site-layout-outlet">
          ${outletHtml}
        </main>
        ${this.footer.render()}
      </div>
    `;
  }
}

export default SharedLayout;
