import React from 'react';
import { Link } from 'react-router-dom';

export default function FourStepJourney() {
  return (
    <section className="home-ref-journey-sec" aria-labelledby="journey-title">
      <div className="home-ref-journey-head">
        <span className="home-ref-section-eyebrow">✦ YOUR JOURNEY ✦</span>
        <h2 id="journey-title" className="home-ref-section-title">From guidance to action, in four steps</h2>
        <p className="home-ref-section-sub">
          Speak with an astrologer, understand your chart, perform a puja and choose supportive seva, all in one place.
        </p>
      </div>

      <div className="home-ref-journey-grid">
        {/* Step 1: Consult an astrologer */}
        <Link to="/astrologers" className="home-ref-journey-card no-underline">
          <span className="home-ref-journey-num" aria-hidden="true">1</span>
          <div className="home-ref-journey-icon" aria-hidden="true">🧑‍🏫</div>
          <h3 className="home-ref-journey-title">Consult an astrologer</h3>
          <p className="home-ref-journey-desc">Get authentic and personalized astrologer guidance for life decisions.</p>
          <span className="home-ref-journey-link">Find an Astrologer <span>→</span></span>
        </Link>

        {/* Step 2: Kundli & Vedic tools */}
        <Link to="/calculators" className="home-ref-journey-card no-underline">
          <span className="home-ref-journey-num" aria-hidden="true">2</span>
          <div className="home-ref-journey-icon" aria-hidden="true">📜</div>
          <h3 className="home-ref-journey-title">Kundli &amp; Vedic tools</h3>
          <p className="home-ref-journey-desc">Match kundli, check doshas, run Panchang, Dasha and 17 Vedic calculators.</p>
          <span className="home-ref-journey-link">Open Tools <span>→</span></span>
        </Link>

        {/* Step 3: Mandir Seva */}
        <Link to="/mandir-seva" className="home-ref-journey-card no-underline">
          <span className="home-ref-journey-num" aria-hidden="true">3</span>
          <div className="home-ref-journey-icon" aria-hidden="true">🛕</div>
          <h3 className="home-ref-journey-title">Mandir Seva</h3>
          <p className="home-ref-journey-desc">Book a sacred puja at 12 Jyotirlingas and ancient Vedic temples.</p>
          <span className="home-ref-journey-link">Explore Temples <span>→</span></span>
        </Link>

        {/* Step 4: Astro Mall */}
        <Link to="/mall" className="home-ref-journey-card no-underline">
          <span className="home-ref-journey-num" aria-hidden="true">4</span>
          <div className="home-ref-journey-icon" aria-hidden="true">🛍️</div>
          <h3 className="home-ref-journey-title">Astro Mall</h3>
          <p className="home-ref-journey-desc">Shop authentic energised spiritual and astrological products with trust.</p>
          <span className="home-ref-journey-link">Shop Astro Mall <span>→</span></span>
        </Link>
      </div>
    </section>
  );
}

