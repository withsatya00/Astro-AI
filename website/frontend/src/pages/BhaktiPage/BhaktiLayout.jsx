import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './bhakti.css';

const NAMES = {
  'naam-jaap': 'Naam Jaap', 'my-bhakti': 'My Bhakti', 'aarti-chalisa': 'Aarti & Chalisa', shankaracharya: 'Shankaracharya',
  vedanta: 'Vedanta', 'bhagavad-gita': 'Bhagavad Gita', 'bhajan-radio': 'Bhajan Radio', 'mandir-darshan': 'Mandir Darshan',
  'puja-vidhi': 'Puja Vidhi', festivals: 'Festivals',
};

export default function BhaktiLayout() {
  const { pathname } = useLocation();
  const sub = pathname.replace(/^\/bhakti\/?/, '').split('/')[0];
  return (
    <div className="bh">
      <div className="bh-wrap">
        <nav className="bh-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">›</span>
          {sub ? <><Link to="/bhakti">Bhakti</Link><span aria-hidden="true">›</span><b>{NAMES[sub] || sub}</b></> : <b>Bhakti</b>}
        </nav>
        <Outlet />
      </div>
    </div>
  );
}
