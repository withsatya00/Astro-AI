import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import ArticleList from './ArticleList.jsx';
import { useLang, pick, other } from './lang.js';

export default function ShankaracharyaPage() {
  const lang = useLang();
  const [data, setData] = useState(null);
  useEffect(() => { api('/vedanta/peethas').then(setData).catch(() => {}); }, []);
  return (
    <div>
      <div className="bh-sec-title"><h1 className="bh-title">Shankaracharya (शंकराचार्य)</h1></div>
      <p className="bh-small" style={{ marginTop: 0 }}>This page is about the historical teacher Adi Shankaracharya and the tradition he is said to have founded. It does not list present-day office-holders.</p>

      <div className="bh-sec-title"><h2 style={{ fontSize: 18 }}>The Four Amnaya Peethas</h2></div>
      {data && (
        <>
          <div className="bh-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {data.peethas.map((p) => (
              <div key={p.name} className="bh-panel" style={{ margin: 0 }} translate="no">
                <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
                <p className="bh-small" style={{ margin: 0 }}>{p.place}, {p.state} · {p.direction}</p>
                <p className="bh-small" style={{ margin: '6px 0 0' }}>{p.veda} · {lang === 'hi' ? 'महावाक्य:' : 'Mahavakya:'} <b>{p.mahavakya}</b> ({p.mahavakya_source})</p>
              </div>
            ))}
          </div>
          <p className="bh-small" translate="no">{data.note}</p>
        </>
      )}

      <div className="bh-sec-title"><h2 style={{ fontSize: 18 }}>Life and tradition</h2></div>
      <ArticleList section="shankaracharya" kind="article" />
      <div className="bh-sec-title"><h2 style={{ fontSize: 18 }}>Questions</h2></div>
      <ArticleList section="shankaracharya" kind="qa" />

      <div className="bh-sec-title"><h2 style={{ fontSize: 18 }}>Pravachan library</h2></div>
      <div className="bh-panel bh-signin"><p className="bh-small" style={{ margin: 0 }}>Discourses will be listed here once recordings with clear permission to share are added.</p></div>
      <div className="bh-row"><Link className="bh-btn bh-btn-ghost" to="/bhakti/vedanta">Learn Advaita Vedanta →</Link></div>
    </div>
  );
}
