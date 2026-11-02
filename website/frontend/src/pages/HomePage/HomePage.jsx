import React from 'react';
import HeroSection from './HeroSection.jsx';
import FourStepJourney from './FourStepJourney.jsx';
import GauSewaBanner from './GauSewaBanner.jsx';
import QuickShortcuts from './QuickShortcuts.jsx';
import FeaturedAstrologers from './FeaturedAstrologers.jsx';
import AstrologyServices from './AstrologyServices.jsx';
import PanchangAndHoroscope from './PanchangAndHoroscope.jsx';
import WhyChooseAndHowItWorks from './WhyChooseAndHowItWorks.jsx';
import TestimonialsAndFAQ from './TestimonialsAndFAQ.jsx';

export default function HomePage() {
  return (
    <div className="home-page-container">
      {/* 1. Hero Banner with Search, Trending Tags, CTA & Trust Stats Bar */}
      <HeroSection />

      {/* 2. Four-Step Journey Section */}
      <FourStepJourney />

      {/* 3. Gau Seva Cow Care Highlight Card */}
      <GauSewaBanner />

      {/* 4. Quick Action Service Cards */}
      <QuickShortcuts />

      {/* 5. Top Rated Astrologers Grid with Live Status & Chat/Call */}
      <FeaturedAstrologers />

      {/* 6. Explore Astrology Services */}
      <AstrologyServices />

      {/* 7. Today's Panchang & Daily Horoscope 2-Column Split */}
      <PanchangAndHoroscope />

      {/* 8. Why Choose Us & How It Works */}
      <WhyChooseAndHowItWorks />

      {/* 9. Client Testimonials & Interactive FAQs */}
      <TestimonialsAndFAQ />
    </div>
  );
}
