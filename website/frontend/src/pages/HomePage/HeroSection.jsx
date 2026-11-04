import React from 'react';
import { Link } from 'react-router-dom';
import './hero-section.css';

export default function HeroSection() {
  return <section className="hp-hero">
    <div className="hp-hero-shell">
      <div className="hp-hero-copy">
        <div className="hp-hero-kicker"><span /> VEDIC ASTROLOGY FOR MODERN LIFE <span /></div>
        <h1>Ancient wisdom.<br /><em>Personal guidance.</em></h1>
        <p>Consult trusted, experienced Vedic astrologers for clarity on life, relationships, career, health and more.</p>
        <div className="hp-hero-actions">
          <Link to="/astrologers" className="hp-hero-primary">Consult an Astrologer <span>→</span></Link>
          <Link to="/calculators/kundali-milan" className="hp-hero-secondary"><span>▣</span> Create Free Kundli</Link>
        </div>
        <div className="hp-hero-proof">
          <div><b>♦</b><strong>Verified Astrologers</strong></div>
          <div><b>♟</b><strong>Private &amp; Secure</strong></div>
          <div><b>★</b><strong>Trusted by 10L+ Users</strong></div>
        </div>
      </div>
      <div className="hp-hero-visual">
        <img src="/assets/img/vedic-sage-hero.webp" alt="Experienced Vedic astrology scholar" fetchPriority="high" />
      </div>
    </div>
  </section>;
}
