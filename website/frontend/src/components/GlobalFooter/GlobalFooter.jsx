import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './GlobalFooter.css';

export default function GlobalFooter() {
  // Mobile accordion states (default collapsed on mobile to avoid endless scrolling)
  const [openSections, setOpenSections] = useState({
    quickLinks: false,
    services: false,
    support: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
    <footer className="site-global-footer bg-[#1a060d] text-slate-300 pt-10 pb-8 border-t border-[#3B0612]" id="site-global-footer">
      <div className="site-footer-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Brand Banner at Top of Footer */}
        <div className="footer-brand-strip flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
          <Link to="/" aria-label="Astro Jyotish home" className="footer-brand flex items-center gap-2.5 no-underline">
            <img
              src="/assets/brand/logo-full-v2-720.webp"
              width="180"
              height="147"
              alt="Astro Jyotish - Guidance Today, Brighter Tomorrow"
              className="footer-logo-full"
              loading="lazy"
              decoding="async"
            />
          </Link>
          <p className="footer-brand-desc text-slate-400 text-xs sm:text-sm text-center sm:text-right max-w-md m-0">
            Authentic Vedic Astrology &amp; Kundli Platform. Guiding your life with wisdom, precision, and sacred tradition.
          </p>
        </div>

        {/* Links Grid: Responsive 3 Columns on Desktop, Accordions on Mobile */}
        <div className="footer-columns-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Col 1: Quick Links */}
          <div className="footer-col-section border-b border-white/5 md:border-b-0 pb-3 md:pb-0">
            <button
              type="button"
              className="footer-accordion-header flex items-center justify-between w-full text-left md:pointer-events-none cursor-pointer bg-transparent border-0 p-0"
              onClick={() => toggleSection('quickLinks')}
              aria-expanded={openSections.quickLinks}
            >
              <h4 className="footer-heading font-semibold text-sm text-[#F8D882] tracking-wide m-0">Quick Links</h4>
              <span className="footer-accordion-chevron md:hidden text-xs text-[#F8D882]">
                {openSections.quickLinks ? '▲' : '▼'}
              </span>
            </button>
            <ul className={`footer-links space-y-2 text-xs text-slate-400 mt-3 ${openSections.quickLinks ? 'block' : 'hidden md:block'}`}>
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/astrologers" className="hover:text-white transition-colors">Astrologers</Link></li>
              <li><Link to="/rashiphal" className="hover:text-white transition-colors">Rashiphal (Daily Horoscope)</Link></li>
              <li><Link to="/calculators" className="hover:text-white transition-colors">17 Vedic Calculators</Link></li>
              <li><Link to="/panchang" className="hover:text-white transition-colors">Aaj Ka Panchang</Link></li>
              <li><Link to="/mall" className="hover:text-white transition-colors">Astro Mall &amp; Remedies</Link></li>
              <li><Link to="/mandir-seva" className="hover:text-white transition-colors">Mandir Seva &amp; Pujas</Link></li>
              <li><Link to="/gau-sewa" className="hover:text-white transition-colors">Gau Sewa Support</Link></li>
            </ul>
          </div>

          {/* Col 2: Our Services */}
          <div className="footer-col-section border-b border-white/5 md:border-b-0 pb-3 md:pb-0">
            <button
              type="button"
              className="footer-accordion-header flex items-center justify-between w-full text-left md:pointer-events-none cursor-pointer bg-transparent border-0 p-0"
              onClick={() => toggleSection('services')}
              aria-expanded={openSections.services}
            >
              <h4 className="footer-heading font-semibold text-sm text-[#F8D882] tracking-wide m-0">Our Services</h4>
              <span className="footer-accordion-chevron md:hidden text-xs text-[#F8D882]">
                {openSections.services ? '▲' : '▼'}
              </span>
            </button>
            <ul className={`footer-links space-y-2 text-xs text-slate-400 mt-3 ${openSections.services ? 'block' : 'hidden md:block'}`}>
              <li>
                <Link to="/calculators" onClick={() => handleCalculatorModal('kundali-milan')} className="hover:text-white transition-colors">
                  Kundli Milan &amp; Matching
                </Link>
              </li>
              <li>
                <Link to="/calculators" onClick={() => handleCalculatorModal('numerology')} className="hover:text-white transition-colors">
                  Vedic Numerology
                </Link>
              </li>
              <li>
                <Link to="/astrologers" className="hover:text-white transition-colors">
                  Career &amp; Business Guidance
                </Link>
              </li>
              <li>
                <Link to="/calculators" onClick={() => handleCalculatorModal('love-compat')} className="hover:text-white transition-colors">
                  Love &amp; Marriage Compatibility
                </Link>
              </li>
              <li>
                <Link to="/calculators" onClick={() => handleCalculatorModal('gemstone')} className="hover:text-white transition-colors">
                  Gemstone &amp; Shanti Remedies
                </Link>
              </li>
              <li>
                <Link to="/mandir-seva/temple/mahakaleshwar-ujjain" className="hover:text-white transition-colors">
                  Mahakaleshwar Bhasma Aarti Puja
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Help */}
          <div className="footer-col-section pb-2 md:pb-0">
            <button
              type="button"
              className="footer-accordion-header flex items-center justify-between w-full text-left md:pointer-events-none cursor-pointer bg-transparent border-0 p-0"
              onClick={() => toggleSection('support')}
              aria-expanded={openSections.support}
            >
              <h4 className="footer-heading font-semibold text-sm text-[#F8D882] tracking-wide m-0">Support &amp; Legal</h4>
              <span className="footer-accordion-chevron md:hidden text-xs text-[#F8D882]">
                {openSections.support ? '▲' : '▼'}
              </span>
            </button>
            <ul className={`footer-links space-y-2 text-xs text-slate-400 mt-3 ${openSections.support ? 'block' : 'hidden md:block'}`}>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('about')}>
                  About Astro Jyotish
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('contact')}>
                  Contact Support 24x7
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('privacy')}>
                  Privacy Policy &amp; Confidentiality
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('terms')}>
                  Terms of Service
                </button>
              </li>
              <li>
                <button type="button" className="footer-info-link" onClick={() => handleServiceInfo('refund')}>
                  Cancellations &amp; 100% Refund Policy
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

        {/* Compact Trust Row */}
        <div className="footer-trust-row" aria-label="Why people trust Astro Jyotish">
          <div className="footer-trust-item">
            <span aria-hidden="true" className="footer-trust-icon">🔒</span>
            <div className="footer-trust-copy">
              <b>Secure Payments</b>
              <small>Verified UPI, Cards &amp; Wallet</small>
            </div>
          </div>
          <div className="footer-trust-item">
            <span aria-hidden="true" className="footer-trust-icon">✅</span>
            <div className="footer-trust-copy">
              <b>Verified Astrologers</b>
              <small>Certified Vedic Scholars</small>
            </div>
          </div>
          <div className="footer-trust-item">
            <span aria-hidden="true" className="footer-trust-icon">🛡️</span>
            <div className="footer-trust-copy">
              <b>Private by Design</b>
              <small>100% Confidential Consultation</small>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Made in India Bar */}
        <div className="footer-bottom-bar pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
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
