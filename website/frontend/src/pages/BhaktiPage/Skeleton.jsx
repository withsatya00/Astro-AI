import React from 'react';

// Placeholder block shown while a section loads, so the layout does not jump.
export function Skel({ w = '100%', h = 14, r = 8, style }) {
  return <span className="bh-skel" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkelLines({ n = 3, label = 'Loading' }) {
  return (
    <div role="status" aria-label={label} style={{ display: 'grid', gap: 10 }}>
      {Array.from({ length: n }, (_, i) => <Skel key={i} w={i === n - 1 ? '60%' : '100%'} />)}
    </div>
  );
}

// Stand-in for a whole page (reader, guide) while its first request is in flight.
export function SkelPage({ label = 'Loading' }) {
  return (
    <div className="bh-panel" role="status" aria-label={label}>
      <Skel w="55%" h={26} r={8} />
      <div style={{ height: 14 }} />
      <SkelLines n={5} label={label} />
    </div>
  );
}
