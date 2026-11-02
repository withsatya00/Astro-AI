import React from 'react';
import { Link } from 'react-router-dom';

export default function GlobalFooter() {
  const handleServiceInfo = (key) => {
    if (window.App && typeof window.App.openInfoModal === 'function') {
      window.App.openInfoModal(key);
    } else if (window.App && typeof window.App.showToast === 'function') {
      window.App.showToast(`Information: ${key}`, 'info');
    }
  };

  const handleCalculatorModal = (type) => {
    if (window.App && typeof window.App.openCalculatorsModal === 'function') {
      window.App.openCalculatorsModal(type);
    }
  };

  return (
    <footer className="site-global-footer bg-[#0D0B24] text-slate-300 pt-16 pb-10 border-t border-[#1E1B4B]" id="site-global-footer">
      <div className="site-footer-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="footer-columns-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">
          
          {/* Col 1: Brand & Social Links (lg:col-span-4) */}
          <div className="footer-col-brand lg:col-span-4 space-y-4">
            <Link to="/" aria-label="Astro Jyotish home" className="footer-brand flex items-center gap-2.5 no-underline">
              <img
                src="/assets/brand/logo-full-v2-720.webp"
                width="240"
                height="196"
                alt="Astro Jyotish - Guidance Today, Brighter Tomorrow"
                className="footer-logo-full"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="footer-brand-desc text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Authentic Vedic Astrology &amp; Kundli Platform. Guiding your life with wisdom, precision, and sacred tradition.
            </p>
          </div>

          {/* Col 2: Quick Links (lg:col-span-2) */}
          <div className="footer-col lg:col-span-2 space-y-3">
            <h4 className="footer-heading font-semibold text-sm text-white tracking-wide">Quick Links</h4>
            <ul className="footer-links space-y-2 text-xs text-slate-400">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/astrologers" className="hover:text-white transition-colors">Astrologers</Link></li>
              <li><Link to="/rashiphal" className="hover:text-white transition-colors">Rashiphal</Link></li>
              <li><Link to="/calculators" className="hover:text-white transition-colors">Calculators</Link></li>
              <li><Link to="/panchang" className="hover:text-white transition-colors">Aaj Ka Panchang</Link></li>
              <li><Link to="/gifts" className="hover:text-white transition-colors">Gifts &amp; Festival Packs</Link></li>
              <li><Link to="/gau-sewa" className="hover:text-white transition-colors">Gau Sewa</Link></li>
            </ul>
          </div>

          {/* Col 3: Our Services (lg:col-span-3) */}
          <div className="footer-col lg:col-span-3 space-y-3">
            <h4 className="footer-heading font-semibold text-sm text-white tracking-wide">Our Services</h4>
            <ul className="footer-links space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/calculators" onClick={() => handleCalculatorModal('kundali-milan')} className="hover:text-white transition-colors">
                  Kundli Milan
                </Link>
              </li>
              <li>
                <Link to="/calculators" onClick={() => handleCalculatorModal('numerology')} className="hover:text-white transition-colors">
                  Numerology
                </Link>
              </li>
              <li>
                <Link to="/astrologers" className="hover:text-white transition-colors">
                  Career Guidance
                </Link>
              </li>
              <li>
                <Link to="/calculators" onClick={() => handleCalculatorModal('love-compat')} className="hover:text-white transition-colors">
                  Love &amp; Marriage
                </Link>
              </li>
              <li>
                <Link to="/calculators" onClick={() => handleCalculatorModal('gemstone')} className="hover:text-white transition-colors">
                  Health &amp; Remedies
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Support (lg:col-span-3) */}
          <div className="footer-col lg:col-span-3 space-y-3">
            <h4 className="footer-heading font-semibold text-sm text-white tracking-wide">Support</h4>
            <ul className="footer-links space-y-2 text-xs text-slate-400">
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('about')}>
                  About Astro Jyotish
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('contact')}>
                  Contact Support
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('privacy')}>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('terms')}>
                  Terms of Service
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('refund')}>
                  Cancellations &amp; Refunds
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('help')}>
                  Help &amp; FAQs
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust row */}
        <div className="footer-trust-row" aria-label="Why people trust Astro Jyotish">
          <div>
            <span aria-hidden="true">🔒</span>
            <p>
              <b>Secure payments</b>
              Pay safely through wallet or verified UPI & cards.
            </p>
          </div>
          <div>
            <span aria-hidden="true">✅</span>
            <p>
              <b>Verified astrologers</b>
              Credentials, experience and live rates transparently displayed.
            </p>
          </div>
          <div>
            <span aria-hidden="true">🛡️</span>
            <p>
              <b>Private by design</b>
              Your birth charts and consultations remain 100% confidential.
            </p>
          </div>
        </div>

        {/* Bottom Copyright & Made in India Bar */}
        <div className="footer-bottom-bar pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="footer-copyright text-center sm:text-left">
            © 2026 Astro Jyotish. All rights reserved.
          </div>
          <div className="footer-made-in-india flex items-center gap-1.5 text-slate-300">
            <span>Made with</span>
            <span className="text-rose-500">❤️</span>
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

