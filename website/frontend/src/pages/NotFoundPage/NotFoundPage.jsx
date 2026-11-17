import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <span className="text-5xl block mb-4">🪐</span>
      <h2 className="font-serif text-2xl font-bold text-[#1E1B4B] mb-2">Page Not Found</h2>
      <p className="text-slate-600 text-sm mb-6">The cosmic coordinates you requested do not exist.</p>
      <Link to="/" className="inline-block bg-[#3E0B18] text-white font-bold text-xs px-5 py-2.5 rounded-full no-underline">
        Return to Home
      </Link>
    </div>
  );
}
