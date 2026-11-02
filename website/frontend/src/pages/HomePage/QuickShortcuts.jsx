import React from 'react';
import { Link } from 'react-router-dom';

export default function QuickShortcuts() {
  const shortcuts = [
    {
      title: 'Chat with Astrologer',
      desc: 'Get instant guidance',
      icon: '💬',
      to: '/astrologers',
    },
    {
      title: 'Call Astrologer',
      desc: 'Talk to an astrologer',
      icon: '📞',
      to: '/astrologers',
    },
    {
      title: 'Daily Horoscope',
      desc: 'Get personalized predictions',
      icon: '📅',
      to: '/rashiphal',
    },
    {
      title: 'Janam Kundli',
      desc: 'Generate your birth chart and analyze',
      icon: '📜',
      to: '/calculators/kundali-milan',
    },
    {
      title: '17 Calculators',
      desc: 'Powerful Vedic calculators',
      icon: '🔢',
      to: '/calculators',
    },
    {
      title: 'Astro Mall',
      desc: 'Shop spiritual products & remedies',
      icon: '🛍️',
      to: '/mall',
    },
  ];

  return (
    <section className="home-ref-shortcuts-sec" id="service-categories-section">
      <div className="home-ref-shortcuts-grid">
        {shortcuts.map((item, index) => (
          <Link key={index} to={item.to} className="home-ref-shortcut-card no-underline">
            <div className="home-ref-shortcut-icon" aria-hidden="true">{item.icon}</div>
            <h3 className="home-ref-shortcut-title">{item.title}</h3>
            <p className="home-ref-shortcut-sub">{item.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

