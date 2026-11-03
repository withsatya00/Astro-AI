import React from 'react';
import HeroSection from './HeroSection.jsx';
import HomeMetricsBar from './HomeMetricsBar.jsx';
import QuickShortcuts from './QuickShortcuts.jsx';
import FeaturedAstrologers from './FeaturedAstrologers.jsx';
import AstroPlusBanner from './AstroPlusBanner.jsx';
import AstrologyServices from './AstrologyServices.jsx';
import PanchangAndHoroscope from './PanchangAndHoroscope.jsx';
import WhyChooseAndHowItWorks from './WhyChooseAndHowItWorks.jsx';
import TestimonialsAndFAQ from './TestimonialsAndFAQ.jsx';

export default function HomePage() {
  return (
    <div className="home-page-container bg-[#FAF7F2] min-h-screen">
      {/* 1. Exact Reference Hero Section with Sage Artwork */}
      <HeroSection />

      {/* 2. 4-Item Metrics & Stats Bar */}
      <HomeMetricsBar />

      {/* 3. 5 Quick Service Feature Cards (Desktop Grid / Mobile Row) */}
      <QuickShortcuts />

      {/* 4. Featured Astrologers with exact 4 reference profiles */}
      <FeaturedAstrologers />

      {/* 5. Astro Plus Premium Membership Banner */}
      <AstroPlusBanner />

      {/* 6. Explore Sacred Astrology Services */}
      <AstrologyServices />

      {/* 7. Today's Panchang & Daily Horoscope Split */}
      <PanchangAndHoroscope />

      {/* 8. Why Choose Us & How It Works */}
      <WhyChooseAndHowItWorks />

      {/* 9. Client Testimonials & Interactive FAQs */}
      <TestimonialsAndFAQ />
    </div>
  );
}
