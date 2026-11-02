import React, { useEffect } from 'react';
import Navbar from '../components/Navbar/Navbar.jsx';
import BottomNav from '../components/BottomNav/BottomNav.jsx';
import GlobalFooter from '../components/GlobalFooter/GlobalFooter.jsx';

export default function Layout({ children }) {
  useEffect(() => {
    // Enable bottom tabbar spacing rules globally on mobile
    document.body.classList.add('pm-has-tabbar');
    return () => {
      document.body.classList.remove('pm-has-tabbar');
    };
  }, []);

  return (
    <div id="app-root" className="site-layout-shell min-h-screen flex flex-col bg-[#FFFDF7] w-full max-w-full overflow-x-hidden">
      <Navbar />
      <main className="site-layout-outlet flex-1 w-full min-w-0 max-w-full" id="site-layout-outlet">
        {children}
      </main>
      <GlobalFooter />
      <BottomNav />
    </div>
  );
}

