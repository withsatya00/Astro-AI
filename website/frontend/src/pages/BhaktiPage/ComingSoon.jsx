import React from 'react';
import { Link } from 'react-router-dom';

// Honest placeholder for sections whose verified content and backend are not live yet.
export default function ComingSoon({ title, hi, children }) {
  return (
    <div className="bh-panel bh-signin">
      <h2>{title}{hi ? ` (${hi})` : ''}</h2>
      <p>{children || 'This section is being prepared with verified, properly sourced content. It will open here soon.'}</p>
      <div className="bh-row">
        <Link className="bh-btn bh-btn-maroon" to="/bhakti/naam-jaap">Start Naam Jaap</Link>
        <Link className="bh-btn bh-btn-ghost" to="/bhakti">Back to Bhakti</Link>
      </div>
    </div>
  );
}
