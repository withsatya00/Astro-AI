import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <div className="react-app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* React App Header / Shell */}
        <header className="react-shell-header" style={{
          backgroundColor: '#3E0B18',
          color: '#FFF9EF',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(217, 164, 65, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🕉</span>
            <span style={{ fontFamily: 'Cinzel, Georgia, serif', fontWeight: 700, fontSize: '18px', color: '#F8D882' }}>
              Astro Jyotish (React Engine)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
            <span style={{ color: '#A7F3D0', fontWeight: 600 }}>● React 19 Active</span>
            <span style={{ color: '#EBD8BA' }}>Vite Powered</span>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="*" element={<PlaceholderView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function PlaceholderView() {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
      <h2 style={{ fontFamily: 'Cinzel, serif', color: '#3E0B18', fontSize: '24px', marginBottom: '8px' }}>
        React Migration Step 1 Complete
      </h2>
      <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
        React 19 and Vite tooling are now configured and operational in <code>website/frontend</code>.
      </p>
    </div>
  );
}
