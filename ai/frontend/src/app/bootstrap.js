/**
 * AI Astrology Consultation Application Bootstrapper
 * Asynchronously loads and mounts modular consultation components from their semantic HTML templates.
 */

import { ConsultationHeaderComponent } from '../components/ConsultationHeader/ConsultationHeader.js';
import { DashaQuickStripComponent } from '../components/DashaQuickStrip/DashaQuickStrip.js';
import { MessageListComponent } from '../components/MessageList/MessageList.js';
import { AnalyzingIndicatorComponent } from '../components/AnalyzingIndicator/AnalyzingIndicator.js';
import { MessageComposerComponent } from '../components/MessageComposer/MessageComposer.js';
import { KundliBottomSheetComponent } from '../components/KundliBottomSheet/KundliBottomSheet.js';
import { ModalsComponent } from '../pages/Modals/Modals.js';

export class AIBootstrap {
  static async init() {
    console.log('[AIBootstrap] Initializing AI Consultation modular interface...');

    try {
      // Concurrently load and mount all consultation components from their .html templates
      await Promise.all([
        ConsultationHeaderComponent.mount('#consultation-header-mount'),
        DashaQuickStripComponent.mount('#dasha-quick-strip-mount'),
        MessageListComponent.mount('#message-list-mount'),
        AnalyzingIndicatorComponent.mount('#analyzing-indicator-mount'),
        MessageComposerComponent.mount('#message-composer-mount'),
        KundliBottomSheetComponent.mount('#kundli-bottom-sheet-mount'),
        ModalsComponent.mount('#modals-container')
      ]);

      console.log('[AIBootstrap] All AI Consultation components loaded and mounted.');

      // Initialize controllers and event handlers
      if (window.App && typeof window.App.init === 'function') {
        window.App.init();
      }
      if (window.ChatController && typeof window.ChatController.init === 'function') {
        window.ChatController.init();
      }
    } catch (err) {
      console.error('[AIBootstrap] Component initialization error:', err);
    }
  }
}

// Auto-boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AIBootstrap.init());
} else {
  AIBootstrap.init();
}

export default AIBootstrap;
