import React from 'react';
import { Link } from 'react-router-dom';
import ArticleList from './ArticleList.jsx';

export default function VedantaPage() {
  return (
    <div>
      <div className="bh-sec-title"><h1 className="bh-title">Vedanta (वेदांत)</h1></div>
      <p className="bh-small" style={{ marginTop: 0 }}>Plain-language learning articles on Advaita Vedanta. Each one lists its sources and the date it was last reviewed. They are introductions, not a substitute for studying the texts with a teacher.</p>
      <ArticleList section="vedanta" kind="article" />
      <div className="bh-sec-title"><h2 style={{ fontSize: 18 }}>Questions and answers</h2></div>
      <ArticleList section="vedanta" kind="qa" />
      <div className="bh-row"><Link className="bh-btn bh-btn-ghost" to="/bhakti/shankaracharya">About Adi Shankaracharya →</Link><Link className="bh-btn bh-btn-ghost" to="/bhakti/bhagavad-gita">Bhagavad Gita →</Link></div>
    </div>
  );
}
