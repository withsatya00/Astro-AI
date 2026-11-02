import React from 'react';

export default function WhyChooseAndHowItWorks() {
  return (
    <>
      {/* 1. Why Choose Us (4 Pillars) */}
      <section className="home-ref-why-sec" id="home-why-choose">
        <div className="home-ref-why-head">
          <h2 className="home-ref-section-title">Why Choose Astro Jyotish?</h2>
          <p className="home-ref-section-sub">
            Authentic guidance, advanced calculators and a trusted platform for your life's journey.
          </p>
        </div>

        <div className="home-ref-why-grid">
          {/* Card 1 */}
          <div className="home-ref-why-card">
            <div className="home-ref-why-icon" aria-hidden="true">📜</div>
            <h3 className="home-ref-why-title">Authentic Vedic Methods</h3>
            <p className="home-ref-why-sub">Based on ancient shastras &amp; Lahiri Ayanamsha</p>
          </div>

          {/* Card 2 */}
          <div className="home-ref-why-card">
            <div className="home-ref-why-icon" aria-hidden="true">🎓</div>
            <h3 className="home-ref-why-title">Verified Astrologers</h3>
            <p className="home-ref-why-sub">With 10+ to 25+ years of verified practice</p>
          </div>

          {/* Card 3 */}
          <div className="home-ref-why-card">
            <div className="home-ref-why-icon" aria-hidden="true">⚙️</div>
            <h3 className="home-ref-why-title">Accurate Calculations</h3>
            <p className="home-ref-why-sub">NASA Swiss Ephemerides engine for precision</p>
          </div>

          {/* Card 4 */}
          <div className="home-ref-why-card">
            <div className="home-ref-why-icon" aria-hidden="true">🔒</div>
            <h3 className="home-ref-why-title">Private &amp; Secure</h3>
            <p className="home-ref-why-sub">100% confidential consultations &amp; birth data</p>
          </div>
        </div>
      </section>

      {/* 2. How Astro Jyotish Works (Parchment Banner) */}
      <section className="home-ref-how-sec" id="home-how-works">
        <div className="home-ref-how-banner">
          <div>
            <h2 className="home-ref-how-title">How Astro Jyotish works</h2>
            <p className="home-ref-how-sub">Plan, track and take action with confidence.</p>
            
            <div className="home-ref-how-checklist">
              <div className="home-ref-how-item">
                <span className="home-ref-how-check">✔</span>
                <span>17+ authentic Vedic tools &amp; birth chart analysis.</span>
              </div>
              <div className="home-ref-how-item">
                <span className="home-ref-how-check">✔</span>
                <span>Consult verified astrologers in real-time chat &amp; call.</span>
              </div>
              <div className="home-ref-how-item">
                <span className="home-ref-how-check">✔</span>
                <span>Book pujas at 12 Jyotirlingas &amp; receive video proof.</span>
              </div>
              <div className="home-ref-how-item">
                <span className="home-ref-how-check">✔</span>
                <span>Shop 100% lab-certified energised gemstones &amp; malas.</span>
              </div>
            </div>
          </div>

          <div className="home-ref-how-art">
            <div style={{ fontSize: '80px', filter: 'drop-shadow(0 6px 16px rgba(184,130,42,0.35))' }} aria-hidden="true">
              📜
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
