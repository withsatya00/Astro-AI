/**
 * HomePage Page Component
 * Composes Hero, TrustStats, Categories, Featured Astrologers, Shortcuts,
 * Horoscope, Panchang, Testimonials, FAQ, and App Promo components.
 */

import { loadTemplate } from '../../utils/templateLoader.js';
import { HeroComponent } from '../../components/Hero/Hero.js';
import { TrustStatsComponent } from '../../components/TrustStats/TrustStats.js';
import { CategoryCardComponent } from '../../components/CategoryCard/CategoryCard.js';
import { FeaturedAstrologersComponent } from '../../components/FeaturedAstrologers/FeaturedAstrologers.js';
import { FeatureShortcutsComponent } from '../../components/FeatureShortcuts/FeatureShortcuts.js';
import { DailyHoroscopeComponent } from '../../components/DailyHoroscope/DailyHoroscope.js';
import { PanchangPreviewComponent } from '../../components/PanchangPreview/PanchangPreview.js';
import { WhyChooseComponent } from '../../components/WhyChoose/WhyChoose.js';
import { TestimonialsComponent } from '../../components/Testimonials/Testimonials.js';
import { FAQAccordionComponent } from '../../components/FAQAccordion/FAQAccordion.js';

export class HomePageComponent {
  static templatePath = '/src/pages/HomePage/HomePage.html';

  static async loadTemplate() {
    return await loadTemplate(HomePageComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;

    // 1. Mount HomePage shell
    target.innerHTML = await this.loadTemplate();

    // 2. Concurrently mount all child components into their dedicated slots
    await Promise.all([
      HeroComponent.mount('#mount-hero'),
      TrustStatsComponent.mount('#mount-trust-stats'),
      CategoryCardComponent.mount('#mount-categories'),
      FeaturedAstrologersComponent.mount('#mount-featured-astrologers'),
      FeatureShortcutsComponent.mount('#mount-feature-shortcuts'),
      DailyHoroscopeComponent.mount('#mount-daily-horoscope'),
      PanchangPreviewComponent.mount('#mount-panchang-preview'),
      WhyChooseComponent.mount('#mount-why-choose'),
      TestimonialsComponent.mount('#mount-testimonials'),
      FAQAccordionComponent.mount('#mount-faq')
    ]);

    return target;
  }
}

export default HomePageComponent;
