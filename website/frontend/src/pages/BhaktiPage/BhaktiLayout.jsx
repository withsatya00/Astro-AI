import React, { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { RadioProvider, MiniPlayer, useRadio } from './RadioContext.jsx';
import { api, ApiError } from './bhaktiApi.js';
import { usePageMeta } from './usePageMeta.js';
import { useLang } from './lang.js';
import './bhakti.css';

const DESCRIPTIONS = {
  '': 'Daily bhakti: naam jaap, aarti and chalisa, Bhagavad Gita, bhajan radio, temples, puja vidhi and festival calendar.',
  'naam-jaap': 'Digital mala and naam jaap counter with streaks and a private jaap record.',
  'aarti-chalisa': 'Aarti, chalisa and stotra for every deity, in Hindi and Roman with meaning.',
  'bhagavad-gita': 'Read the Bhagavad Gita chapter by chapter with Sanskrit, transliteration and meaning.',
  'bhajan-radio': 'Bhajan, kirtan, aarti and dhyan music.',
  'mandir-darshan': 'Famous temples with history, significance and darshan links.',
  'puja-vidhi': 'Step-by-step puja guides with samagri checklists and sources.',
  festivals: 'Ekadashi, Purnima, Amavasya, Pradosh and festival dates calculated for your city.',
  guide: 'Ask about the Gita, mantras, Vedanta and puja; answers cite the texts published here.',
  shankaracharya: 'Adi Shankaracharya: life, teachings and Advaita Vedanta.',
  vedanta: 'Vedanta articles and questions with sources.',
};

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

const HI_NAMES = {
  'naam-jaap': 'नाम जाप',
  'my-bhakti': 'मेरी भक्ति',
  'aarti-chalisa': 'आरती व चालीसा',
  'shankaracharya': 'शंकराचार्य',
  'vedanta': 'वेदांत दर्शन',
  'bhagavad-gita': 'श्रीमद्भगवद्गीता',
  'bhajan-radio': 'भजन रेडियो',
  'mandir-darshan': 'मंदिर दर्शन',
  'puja-vidhi': 'पूजा विधि',
  'festivals': 'त्योहार व व्रत',
  'guide': 'आध्यात्मिक मार्गदर्शक',
  'admin': 'व्यवस्थापक',
  'sadhana': 'मेरी साधना',
};

function Shell() {
  const lang = useLang();
  const isHi = lang === 'hi';
  const { pathname } = useLocation();
  const radio = useRadio();
  const { problem, check } = useServiceStatus();
  const [nonce, setNonce] = useState(0); // remounting the page makes every section fetch again
  const retry = () => { check(); setNonce((n) => n + 1); };
  const sub = pathname.replace(/^\/bhakti\/?/, '').split('/')[0];
  usePageMeta(NAMES[sub] ? `${NAMES[sub]} (Bhakti)` : 'Bhakti', DESCRIPTIONS[sub] || DESCRIPTIONS['']);
  return (
    <div className="bh">
      <div className={`bh-wrap${radio.current ? ' bh-wrap--playing' : ''}`}>
        <nav className="bh-crumbs" aria-label="Breadcrumb">
          <Link to="/">{isHi ? 'होम' : 'Home'}</Link><span aria-hidden="true">›</span>
          {sub ? (
            <>
              <Link to="/bhakti">{isHi ? 'भक्ति' : 'Bhakti'}</Link><span aria-hidden="true">›</span>
              <b translate="no">{(isHi ? HI_NAMES[sub] : NAMES[sub]) || NAMES[sub] || sub}</b>
            </>
          ) : (
            <b>{isHi ? 'भक्ति' : 'Bhakti'}</b>
          )}
        </nav>
        {problem && (
          <div className="bh-msg bh-service-msg" role="alert" data-detail={problem}>
            <span>
              {isHi
                ? 'भक्ति सामग्री लोड करने में समस्या आई। कृपया कुछ समय पश्चात पुनः प्रयास करें।'
                : 'Bhakti content could not be loaded at this moment. Please try again in a while.'}
            </span>
            <button type="button" className="bh-btn bh-btn-ghost" onClick={retry}>
              {isHi ? 'पुनः प्रयास करें' : 'Retry'}
            </button>
          </div>
        )}
        <React.Fragment key={nonce}><Outlet /></React.Fragment>
      </div>
      <MiniPlayer />
    </div>
  );
}

export default function BhaktiLayout() {
  return <RadioProvider><Shell /></RadioProvider>;
}
