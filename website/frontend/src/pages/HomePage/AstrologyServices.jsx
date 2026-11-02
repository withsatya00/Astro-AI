import React from 'react';
import { Link } from 'react-router-dom';

export default function AstrologyServices() {
  const services = [
    {
      title: 'Kundli Milan',
      sub: 'For Happy Marriage',
      icon: '💖',
      to: '/calculators/kundali-milan',
    },
    {
      title: 'Numerology',
      sub: 'Life Path & Destiny',
      icon: '🔢',
      to: '/calculators/numerology',
    },
    {
      title: 'Mangal Dosha',
      sub: 'Checks & Remedies',
      icon: '🔥',
      to: '/calculators/mangal-dosha',
    },
    {
      title: 'Shani Sade Sati',
      sub: 'Timeline & Remedies',
      icon: '🪐',
      to: '/calculators/sade-sati',
    },
    {
      title: 'Career Prediction',
      sub: 'Professional Guidance',
      icon: '💼',
      to: '/astrologers?specialty=Career',
    },
    {
      title: 'Love & Marriage',
      sub: 'Compatibility',
      icon: '❤️',
      to: '/astrologers?specialty=Marriage',
    },
  ];

  return (
    <section className="home-ref-services-sec" id="feature-shortcuts-section">
      <div className="home-ref-astrologers-header">
        <div>
          <h2 className="home-ref-section-title">Explore Our Astrology Services</h2>
          <p className="home-ref-section-sub">Discover accurate insights for every important aspect of your life.</p>
        </div>
        <Link to="/calculators" className="home-ref-btn-outline no-underline">
          <span>View All Services</span>
          <span>→</span>
        </Link>
      </div>

      <div className="home-ref-services-grid">
        {services.map((item, index) => (
          <Link key={index} to={item.to} className="home-ref-service-card no-underline">
            <div className="home-ref-service-icon" aria-hidden="true">{item.icon}</div>
            <h3 className="home-ref-service-title">{item.title}</h3>
            <p className="home-ref-service-sub">{item.sub}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
