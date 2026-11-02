import React from 'react';
import { Link } from 'react-router-dom';

export default function GauSewaBanner() {
  return (
    <section className="home-ref-gausewa-banner" aria-labelledby="gausewa-title">
      <div className="home-ref-gausewa-inner">
        <div className="home-ref-gausewa-left">
          <img
            src="/assets/img/gausewa/cow-mother-calf.webp"
            alt="Gau Seva Cow Care"
            className="home-ref-gausewa-art"
            width="72"
            height="54"
            loading="lazy"
            decoding="async"
          />
          <div>
            <h2 id="gausewa-title" className="home-ref-gausewa-title" style={{ color: '#F8D882' }}>
              <span>🕉</span> Gau Seva (पवित्र गौ सेवा)
            </h2>
            <p className="home-ref-gausewa-sub" style={{ color: '#FFF9EF', opacity: 0.95 }}>
              Help care for cows at a gaushala. Choose green fodder, medical aid, or daily seva with transparent sankalp.
            </p>
          </div>
        </div>
        <Link to="/gau-sewa" className="home-ref-gausewa-btn no-underline">
          Contribute Now →
        </Link>
      </div>
    </section>
  );
}
