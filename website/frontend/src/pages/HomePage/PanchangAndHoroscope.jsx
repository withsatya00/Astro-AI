import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ZODIAC_SIGNS = [
  { name: 'Aries', hindi: 'Mesh', glyph: '♈' },
  { name: 'Taurus', hindi: 'Vrishabh', glyph: '♉' },
  { name: 'Gemini', hindi: 'Mithun', glyph: '♊' },
  { name: 'Cancer', hindi: 'Kark', glyph: '♋' },
  { name: 'Leo', hindi: 'Singh', glyph: '♌' },
  { name: 'Virgo', hindi: 'Kanya', glyph: '♍' },
  { name: 'Libra', hindi: 'Tula', glyph: '♎' },
  { name: 'Scorpio', hindi: 'Vrishchik', glyph: '♏' },
  { name: 'Sagittarius', hindi: 'Dhanu', glyph: '♐' },
  { name: 'Capricorn', hindi: 'Makar', glyph: '♑' },
  { name: 'Aquarius', hindi: 'Kumbh', glyph: '♒' },
  { name: 'Pisces', hindi: 'Meen', glyph: '♓' },
];

export default function PanchangAndHoroscope() {
  const [selectedSign, setSelectedSign] = useState(ZODIAC_SIGNS[0]);
  const navigate = useNavigate();

  const todayStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const handleSignChange = (e) => {
    const sign = ZODIAC_SIGNS.find((s) => s.name === e.target.value) || ZODIAC_SIGNS[0];
    setSelectedSign(sign);
  };

  const handleHoroscopeSubmit = (e) => {
    e.preventDefault();
    navigate(`/rashiphal?sign=${selectedSign.name.toLowerCase()}`);
  };

  return (
    <section className="home-ref-split-sec">
      <div className="home-ref-split-grid">
        
        {/* 1. Today's Vedic Panchang Card */}
        <div className="home-ref-panchang-card" id="panchang-preview-component">
          <div>
            <div className="home-ref-panchang-top">
              <div>
                <div className="home-ref-panchang-eyebrow">
                  <span>✦</span> <span>TODAY'S VEDIC PANCHANG</span> <span>✦</span>
                </div>
                <div className="home-ref-panchang-date" id="home-panchang-date">
                  {todayStr}
                </div>
              </div>
              <Link to="/panchang" className="home-ref-panchang-link no-underline">
                View Full Panchang →
              </Link>
            </div>

            {/* 5 Metrics: Tithi, Nakshatra, Yoga, Karan, Aaj ka Muhurat */}
            <div className="home-ref-panchang-metrics">
              <div className="home-ref-panchang-box">
                <div className="home-ref-panchang-box-lbl">Tithi</div>
                <div className="home-ref-panchang-box-val">Shukla Chaturthi</div>
              </div>
              <div className="home-ref-panchang-box">
                <div className="home-ref-panchang-box-lbl">Nakshatra</div>
                <div className="home-ref-panchang-box-val">Dhanishtha</div>
              </div>
              <div className="home-ref-panchang-box">
                <div className="home-ref-panchang-box-lbl">Yoga</div>
                <div className="home-ref-panchang-box-val">Shobhana</div>
              </div>
              <div className="home-ref-panchang-box">
                <div className="home-ref-panchang-box-lbl">Karan</div>
                <div className="home-ref-panchang-box-val">Balav</div>
              </div>
              <div className="home-ref-panchang-box home-ref-panchang-box--highlight">
                <div className="home-ref-panchang-box-lbl" style={{ color: '#92400E' }}>
                  Aaj ka Muhurat
                </div>
                <div className="home-ref-panchang-box-val" style={{ color: '#78350F' }}>
                  04:22 PM - 06:10 PM
                </div>
              </div>
            </div>
          </div>

          <div className="home-ref-panchang-bottom">
            <div className="home-ref-panchang-tags">
              Choghadiya | Shubh Muhurat | Rahukaal
            </div>
            <Link to="/panchang" className="home-ref-panchang-btn no-underline">
              View Choghadiya &amp; Muhurat →
            </Link>
          </div>
        </div>

        {/* 2. Your Daily Horoscope Card */}
        <div className="home-ref-horoscope-card" id="daily-horoscope-component">
          <div>
            <h3 className="home-ref-horoscope-title">Your Daily Horoscope</h3>
            <p className="home-ref-horoscope-sub">Read accurate personalized horoscope for your day.</p>
          </div>

          <div className="home-ref-horoscope-glyph-wrap">
            <div className="home-ref-horoscope-glyph" id="home-horoscope-glyph" aria-hidden="true">
              {selectedSign.glyph}
            </div>
          </div>

          <form onSubmit={handleHoroscopeSubmit} className="home-ref-horoscope-controls">
            <select
              className="home-ref-horoscope-select"
              id="home-horoscope-select"
              value={selectedSign.name}
              onChange={handleSignChange}
              aria-label="Select Zodiac Sign"
            >
              {ZODIAC_SIGNS.map((sign) => (
                <option key={sign.name} value={sign.name}>
                  {sign.name} ({sign.hindi})
                </option>
              ))}
            </select>

            <button type="submit" className="home-ref-horoscope-btn cursor-pointer">
              Get personalized prediction →
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}

