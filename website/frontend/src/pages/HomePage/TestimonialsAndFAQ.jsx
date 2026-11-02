import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    q: 'What information do I need for an accurate birth chart consultation?',
    a: 'You need your exact Date of Birth, Time of Birth, and Place of Birth (City, State, Country). Our astronomical calculations use NASA Swiss Ephemerides with Lahiri Ayanamsha for authentic Vedic planetary placement and dasha calculation.',
    category: 'consultation',
  },
  {
    q: 'How does the live consultation with astrologers work?',
    a: 'Simply choose an astrologer and click "Chat" or "Call". You will be connected in real-time in a 100% private and confidential room. You can ask questions about career, marriage, health, and remedies.',
    category: 'consultation',
  },
  {
    q: 'Can I book temple pujas online and receive video recordings?',
    a: 'Yes, our Mandir Seva lets you perform sacred rituals at 12 Jyotirlingas and ancient Vedic temples. The temple priest recites your name and gotra in the sankalp. A video recording is delivered within 72 hours.',
    category: 'puja',
  },
  {
    q: 'How does Gau Seva work and what do the cows receive?',
    a: 'Your contribution goes directly towards buying fresh green fodder, nutritious jaggery/grains, and routine medical care for sheltered cows at verified gaushalas with digital proof.',
    category: 'puja',
  },
  {
    q: 'Are all gemstone and spiritual products certified and energized?',
    a: 'Yes, all Astro Mall items (rudraksha, gemstones, yantras) are 100% authentic, accompanied by government-recognized gemological lab certificates and energized with Vedic mantras prior to dispatch.',
    category: 'mall',
  },
  {
    q: 'Is my personal and financial information secure?',
    a: 'Absolutely. Astro Jyotish adheres to end-to-end 256-bit encryption for payment gateway transactions and stores birth details under strict confidentiality standards.',
    category: 'consultation',
  },
];

export default function TestimonialsAndFAQ() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndices, setOpenIndices] = useState({ 0: true });

  const toggleAccordion = (index) => {
    setOpenIndices((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      {/* 1. Client Testimonials */}
      <section className="home-ref-testi-sec" id="testimonials-section">
        <div className="home-ref-astrologers-header">
          <div>
            <h2 className="home-ref-section-title">Real People, Real Guidance.</h2>
            <p className="home-ref-section-sub">Thousands of seekers have found clarity and confidence with Astro Jyotish.</p>
          </div>
          <Link to="/astrologers" className="home-ref-btn-outline no-underline">
            <span>View All Reviews</span>
            <span>→</span>
          </Link>
        </div>

        <div className="home-ref-testi-grid">
          <div className="home-ref-testi-card">
            <div>
              <div className="home-ref-testi-stars" aria-label="5 stars">★★★★★</div>
              <p className="home-ref-testi-quote">
                "Very accurate astrology guidance for my career. The consultation was clear, empathetic, and actionable."
              </p>
            </div>
            <div className="home-ref-testi-author">
              <div className="home-ref-testi-avatar-init">AS</div>
              <div className="home-ref-testi-author-info">
                <span className="home-ref-testi-name">Aditya Singh</span>
                <span className="home-ref-testi-role">Career Consultation</span>
              </div>
            </div>
          </div>

          <div className="home-ref-testi-card">
            <div>
              <div className="home-ref-testi-stars" aria-label="5 stars">★★★★★</div>
              <p className="home-ref-testi-quote">
                "My marriage matching report was very detailed and easy to understand. The astrologer was very patient."
              </p>
            </div>
            <div className="home-ref-testi-author">
              <div className="home-ref-testi-avatar-init">PS</div>
              <div className="home-ref-testi-author-info">
                <span className="home-ref-testi-name">Priya Sharma</span>
                <span className="home-ref-testi-role">Kundli Milan</span>
              </div>
            </div>
          </div>

          <div className="home-ref-testi-card">
            <div>
              <div className="home-ref-testi-stars" aria-label="5 stars">★★★★★</div>
              <p className="home-ref-testi-quote">
                "I found practical remedies that really worked for my financial stability. Sacred and transparent experience."
              </p>
            </div>
            <div className="home-ref-testi-author">
              <div className="home-ref-testi-avatar-init">VK</div>
              <div className="home-ref-testi-author-info">
                <span className="home-ref-testi-name">Vikram K.</span>
                <span className="home-ref-testi-role">Business Consultation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Frequently Asked Questions */}
      <section className="home-ref-faq-sec" id="faq-section">
        <span className="home-ref-section-eyebrow">✦ COMMON QUESTIONS ✦</span>
        <h2 className="home-ref-section-title">Frequently Asked Questions</h2>
        <p className="home-ref-section-sub">
          Everything you need to know about our astrology consultation, puja services, and Vedic products.
        </p>

        {/* Search Input */}
        <div className="home-ref-faq-search-box">
          <span className="home-ref-faq-search-icon">🔍</span>
          <input
            type="text"
            id="faq-search-input"
            className="home-ref-faq-search-input"
            placeholder="Search questions..."
            aria-label="Search questions"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="home-ref-faq-pills">
          {[
            { id: 'all', label: 'All (FAQs)' },
            { id: 'consultation', label: 'Consultation & Bookings' },
            { id: 'puja', label: 'Puja & Seva' },
            { id: 'mall', label: 'Astro Mall' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`home-ref-faq-pill faq-tab-btn cursor-pointer ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion List */}
        <div className="home-ref-faq-list" id="faq-accordion-list">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = !!openIndices[idx];
            return (
              <div key={idx} className="home-ref-faq-item faq-item">
                <button
                  type="button"
                  className="home-ref-faq-q-btn faq-question-btn cursor-pointer"
                  onClick={() => toggleAccordion(idx)}
                >
                  <span className="home-ref-faq-q-text">{faq.q}</span>
                  <span className={`home-ref-faq-chevron faq-chevron-circle transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="home-ref-faq-answer faq-answer-pane" style={{ display: 'block' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

