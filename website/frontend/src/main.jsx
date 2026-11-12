import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// The site-wide translation engine (js/i18n.js) has to be started once. It restores the saved language on load,
// translates text as React renders it, and reacts to the language picker. Without this call the picker does nothing.
if (typeof window !== 'undefined' && window.I18n && typeof window.I18n.init === 'function') {
  try { window.I18n.init(); } catch (e) { console.warn('Language engine failed to start:', e); }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.warn('React root element #root not found.');
}

