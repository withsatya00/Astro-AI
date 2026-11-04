import React, { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { RadioProvider, MiniPlayer, useRadio } from './RadioContext.jsx';
import { api, ApiError } from './bhaktiApi.js';
import './bhakti.css';

const NAMES = {
  'naam-jaap': 'Naam Jaap', 'my-bhakti': 'My Bhakti', 'aarti-chalisa': 'Aarti & Chalisa', shankaracharya: 'Shankaracharya',
  vedanta: 'Vedanta', 'bhagavad-gita': 'Bhagavad Gita', 'bhajan-radio': 'Bhajan Radio', 'mandir-darshan': 'Mandir Darshan',
  'puja-vidhi': 'Puja Vidhi', festivals: 'Festivals', guide: 'AI Spiritual Guide', admin: 'Admin',
  sadhana: 'My Sadhana',
};

// If the Bhakti API cannot be reached, say so plainly instead of leaving every page empty.
function useServiceStatus() {
  const [problem, setProblem] = useState('');
  const check = useCallback(() => {
    api('/deities').then(() => setProblem('')).catch((e) => {
      setProblem(e instanceof ApiError && e.status
        ? `The Bhakti service is not responding correctly (error ${e.status}).`
        : 'The server could not be reached.');
    });
  }, []);
  useEffect(() => { check(); }, [check]);
  return { problem, check };
}

function Shell() {
  const { pathname } = useLocation();
  const radio = useRadio();
  const { problem, check } = useServiceStatus();
  const sub = pathname.replace(/^\/bhakti\/?/, '').split('/')[0];
  return (
    <div className="bh">
      <div className={`bh-wrap${radio.current ? ' bh-wrap--playing' : ''}`}>
        <nav className="bh-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">›</span>
          {sub ? <><Link to="/bhakti">Bhakti</Link><span aria-hidden="true">›</span><b>{NAMES[sub] || sub}</b></> : <b>Bhakti</b>}
        </nav>
        {problem && (
          <div className="bh-msg" role="alert" style={{ marginBottom: 12 }}>
            {problem} Please try again in a moment. If you run this site yourself, restart the backend so the latest Bhakti tables and data are created.{' '}
            <button type="button" className="bh-btn bh-btn-ghost" style={{ minHeight: 32, padding: '0 12px' }} onClick={check}>Retry</button>
          </div>
        )}
        <Outlet />
      </div>
      <MiniPlayer />
    </div>
  );
}

export default function BhaktiLayout() {
  return <RadioProvider><Shell /></RadioProvider>;
}
