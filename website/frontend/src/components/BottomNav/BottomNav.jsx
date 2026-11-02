import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Hide tabbar in consultation chat room
  const inConsult = currentPath.startsWith('/consultation');
  if (inConsult) return null;

  // Determine active tab
  const isHome = currentPath === '/' || currentPath === '';
  const isAstrologers = currentPath.startsWith('/astrologers');
  const isSeva = currentPath.startsWith('/mandir-seva') || currentPath.startsWith('/gau-sewa');
  const isMall = currentPath.startsWith('/astro-mall');
  const isProfile = currentPath.startsWith('/profile');

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (window.App) {
      if (window.App.currentUser) {
        window.App.openUserAccountModal();
      } else {
        window.App.openAuthModal('login');
      }
    } else {
      navigate('/profile');
    }
  };

  return (
    <nav className="pm-tabbar" aria-label="Primary Mobile Navigation">
      {/* 1. Home */}
      <NavLink
        to="/"
        className={({ isActive }) => `pm-tab ${isActive || isHome ? 'active' : ''}`}
        aria-current={isHome ? 'page' : undefined}
      >
        <span className="pi" data-ic="home" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6" />
          </svg>
        </span>
        <span translate="no">Home</span>
      </NavLink>

      {/* 2. Astrologers */}
      <NavLink
        to="/astrologers"
        className={({ isActive }) => `pm-tab ${isActive || isAstrologers ? 'active' : ''}`}
        aria-current={isAstrologers ? 'page' : undefined}
      >
        <span className="pi" data-ic="crystal" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10.5" r="7" />
            <path d="M7 20.5h10M9 17.5l-1 3M15 17.5l1 3" />
          </svg>
        </span>
        <span translate="no">Astrologers</span>
      </NavLink>

      {/* 3. Seva */}
      <NavLink
        to="/mandir-seva"
        className={({ isActive }) => `pm-tab ${isActive || isSeva ? 'active' : ''}`}
        aria-current={isSeva ? 'page' : undefined}
      >
        <span className="pi" data-ic="lamp" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 14h16l-2 6H6zM12 3c2 2.5 2.5 4.5 0 7-2.5-2.5-2-4.5 0-7z" />
          </svg>
        </span>
        <span translate="no">Seva</span>
      </NavLink>

      {/* 4. Mall */}
      <NavLink
        to="/astro-mall"
        className={({ isActive }) => `pm-tab ${isActive || isMall ? 'active' : ''}`}
        aria-current={isMall ? 'page' : undefined}
      >
        <span className="pi" data-ic="gem" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h12l4 6-10 12L2 9z" />
            <path d="M11 3 8 9l4 12 4-12-3-6M2 9h20" />
          </svg>
        </span>
        <span translate="no">Mall</span>
      </NavLink>

      {/* 5. Profile */}
      <a
        href="/profile"
        onClick={handleProfileClick}
        className={`pm-tab ${isProfile ? 'active' : ''}`}
        aria-current={isProfile ? 'page' : undefined}
      >
        <span className="pi" data-ic="user" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
        </span>
        <span translate="no">Profile</span>
      </a>
    </nav>
  );
}
