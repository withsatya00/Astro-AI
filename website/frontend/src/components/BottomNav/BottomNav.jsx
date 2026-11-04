import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, openAuthModal, openUserAccountModal } = useAuth();
  const currentPath = location.pathname;

  // Hide tabbar in consultation chat room
  const inConsult = currentPath.startsWith('/consultation') || currentPath.startsWith('/consult');
  if (inConsult) return null;

  // Determine active tab
  const isHome = currentPath === '/' || currentPath === '';
  const isAstrologers = currentPath.startsWith('/astrologers');
  const isSeva = currentPath.startsWith('/mandir-seva') || currentPath.startsWith('/gau-sewa') || currentPath.startsWith('/chadhava');
  const isMall = currentPath.startsWith('/astro-mall') || currentPath.startsWith('/mall') || currentPath === '/my-orders';
  const isBhakti = currentPath.startsWith('/bhakti');
  const isProfile = currentPath.startsWith('/profile');

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (currentUser) {
      openUserAccountModal();
    } else {
      openAuthModal('login');
    }
  };

  return (
    <nav className="pm-tabbar" aria-label="Primary Mobile Navigation">
      {/* 1. Home */}
      <NavLink
        data-tab="home"
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
        data-tab="astrologers"
        to="/astrologers"
        className={({ isActive }) => `pm-tab ${isActive || isAstrologers ? 'active' : ''}`}
        aria-current={isAstrologers ? 'page' : undefined}
      >
        <span className="pi" data-ic="astrologer" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4" />
            <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            <path d="M12 3v-2M9 4.5l-1.5-1.5M15 4.5l1.5-1.5" />
          </svg>
        </span>
        <span translate="no">Astrologers</span>
      </NavLink>

      {/* 3. Seva */}
      <NavLink
        data-tab="seva"
        to="/mandir-seva"
        className={({ isActive }) => `pm-tab ${isActive || isSeva ? 'active' : ''}`}
        aria-current={isSeva ? 'page' : undefined}
      >
        <span className="pi" data-ic="diya" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2c0 2-2 4-2 6a2 2 0 0 0 4 0c0-2-2-4-2-6z" fill="#D97706" stroke="none" />
            <path d="M3 13c1 5 5 8 9 8s8-3 9-8H3z" />
            <path d="M6 13c0-3 3-5 6-5s6 2 6 5" />
          </svg>
        </span>
        <span translate="no">Seva</span>
      </NavLink>

      {/* 4. Bhakti */}
      <NavLink
        to="/bhakti"
        className={({ isActive }) => `pm-tab ${isActive || isBhakti ? 'active' : ''}`}
        aria-current={isBhakti ? 'page' : undefined}
      >
        <span className="pi" data-ic="bhakti" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3c2 3 2 6 0 9-2-3-2-6 0-9z" />
            <path d="M12 12c2-3 5-4 8-3-1 4-4 6-8 6M12 12c-2-3-5-4-8-3 1 4 4 6 8 6" />
            <path d="M6 20h12" />
          </svg>
        </span>
        <span translate="no">Bhakti</span>
      </NavLink>

      {/* 5. Astro Mall */}
      <NavLink
        data-tab="mall"
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

      {/* 6. Profile */}
      <a
        data-tab="profile"
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
        <span translate="no" className="pm-tab-name">{currentUser ? ((currentUser.full_name || '').trim().split(/\s+/)[0] || 'Profile') : 'Profile'}</span>
      </a>
    </nav>
  );
}
