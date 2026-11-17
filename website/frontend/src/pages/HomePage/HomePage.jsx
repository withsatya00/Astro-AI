import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ALL_ASTROLOGERS } from '../DirectoryPage/astrologersData.js';
import { useLiveAstrologers } from '../../utils/liveAstrologers.js';
import { useAuth } from '../../context/AuthContext.jsx';
import KundliOnboardingWizard from '../../components/KundliOnboardingWizard/KundliOnboardingWizard.jsx';
import './homepage-v2.css';

const copy = {
  en: { kicker:'Authentic Vedic Astrology & Kundli Platform', title:"Clarity for life's important decisions", hero:'Get guidance from verified Vedic astrologers on career, marriage, health, finance and other key aspects of life.', search:'Search astrologer or concern...', talk:'Talk to an Astrologer', tools:'Explore Free Tools', verified:'Verified Astrologers', expertise:'Vedic Expertise', guidance:'Trusted Guidance', languages:'Languages', protected:'Protected Payments', private:'Private Consultations', intentEye:'Explore by your intent', intent:'What brings you here today?', intentSub:'Choose your area of concern and get the right Vedic guidance.', expertsEye:'Our experts', experts:'Featured Astrologers', expertsSub:'Connect with verified astrologers for personalized Vedic guidance.', schedule:'View schedule', chat:'Chat', call:'Call', all:'View all verified astrologers', cosmic:'Your daily cosmic guide', daily:"Today's Panchang & Daily Horoscope", dailySub:"Stay aligned with the day's Vedic timings and see what the stars have in store for you.", panchang:"Today's Panchang", panchangSub:'Tithi, Nakshatra, Yoga and auspicious timings.', viewPanchang:'View Panchang', horoscope:'Daily Horoscope', horoscopeSub:'Your personalized horoscope for today.', read:'Read Horoscope', beyond:'Beyond consultation', more:'More than consultation', moreSub:"Complete Vedic support for your life's important journeys.", howEye:'Simple & trusted', how:'How it works', howSub:'Get expert Vedic guidance in a few easy steps.', choose:'Choose', chooseSub:'Find the right astrologer or service for your need.', connect:'Connect', connectSub:'Chat or talk with your chosen astrologer.', get:'Get Guidance', getSub:'Receive personalized Vedic advice and next steps.', final:'Take the Right Step with Vedic Guidance', finalSub:'Talk to a verified astrologer and get clarity on your career, marriage, health, finance and more.' },
  hi: { kicker:'प्रामाणिक वैदिक ज्योतिष एवं कुंडली मंच', title:'जीवन के महत्वपूर्ण निर्णयों के लिए स्पष्टता', hero:'करियर, विवाह, स्वास्थ्य, धन और जीवन के अन्य महत्वपूर्ण विषयों पर सत्यापित वैदिक ज्योतिषियों से मार्गदर्शन पाएँ।', search:'ज्योतिषी या समस्या खोजें...', talk:'ज्योतिषी से बात करें', tools:'निःशुल्क टूल देखें', verified:'सत्यापित ज्योतिषी', expertise:'वैदिक विशेषज्ञता', guidance:'विश्वसनीय मार्गदर्शन', languages:'भाषाएँ', protected:'सुरक्षित भुगतान', private:'निजी परामर्श', intentEye:'अपनी आवश्यकता चुनें', intent:'आज आप किस विषय पर मार्गदर्शन चाहते हैं?', intentSub:'अपनी चिंता का क्षेत्र चुनें और सही वैदिक मार्गदर्शन पाएँ।', expertsEye:'हमारे विशेषज्ञ', experts:'प्रमुख ज्योतिषी', expertsSub:'व्यक्तिगत वैदिक मार्गदर्शन के लिए सत्यापित ज्योतिषियों से जुड़ें।', schedule:'समय देखें', chat:'चैट', call:'कॉल', all:'सभी सत्यापित ज्योतिषी देखें', cosmic:'आज का ज्योतिष मार्गदर्शन', daily:'आज का पंचांग और दैनिक राशिफल', dailySub:'दिन के वैदिक समय के अनुसार चलें और जानें आज सितारे क्या संकेत देते हैं।', panchang:'आज का पंचांग', panchangSub:'तिथि, नक्षत्र, योग और शुभ समय।', viewPanchang:'पंचांग देखें', horoscope:'दैनिक राशिफल', horoscopeSub:'आज का आपका व्यक्तिगत राशिफल।', read:'राशिफल पढ़ें', beyond:'परामर्श से आगे', more:'केवल परामर्श नहीं', moreSub:'जीवन की महत्वपूर्ण यात्राओं के लिए संपूर्ण वैदिक सहयोग।', howEye:'सरल और विश्वसनीय', how:'यह कैसे काम करता है', howSub:'कुछ आसान चरणों में विशेषज्ञ वैदिक मार्गदर्शन पाएँ।', choose:'चुनें', chooseSub:'अपनी आवश्यकता के लिए सही ज्योतिषी या सेवा खोजें।', connect:'जुड़ें', connectSub:'अपने चुने हुए ज्योतिषी से चैट या कॉल करें।', get:'मार्गदर्शन पाएँ', getSub:'व्यक्तिगत वैदिक सलाह और अगले कदम पाएँ।', final:'वैदिक मार्गदर्शन के साथ सही कदम उठाएँ', finalSub:'करियर, विवाह, स्वास्थ्य, धन और अन्य विषयों पर स्पष्टता के लिए सत्यापित ज्योतिषी से बात करें।' }
};
const intents = [['Career','career','/astrologers?specialty=Career'],['Marriage','rings','/astrologers?specialty=Marriage'],['Finance','coins','/astrologers?specialty=Finance'],['Health','lotus','/astrologers?specialty=Health'],['Kundli','chart','/calculators'],['Spiritual Guidance','flame','/bhakti']];
const intentHi = {Career:'करियर',Marriage:'विवाह',Finance:'धन',Health:'स्वास्थ्य',Kundli:'कुंडली','Spiritual Guidance':'आध्यात्मिक मार्गदर्शन'};
// Featured astrologers come from the same real astrologer list as the directory, so a card, its profile and its chat agree.
const FEATURED = ['pt-rameshwar-dwivedi', 'vidushi-meera-devi', 'acharya-kn-rao'];
const baseAstrologers = FEATURED.map((slug) => {
  const a = ALL_ASTROLOGERS.find((x) => x.slug === slug);
  return { name: a.name, slug: a.slug, image: `/assets/portraits/individual/${a.slug}.webp`, expertise: (a.specialties || []).slice(0, 3).join(' · '), rating: Number(a.rating).toFixed(1), price: Math.round(a.price_per_minute || 25) };
});
const services = [['Kundli','Get your birth chart and understand your life path.','Create Kundli','/calculators','/assets/img/calculators-banner.webp'],['Puja & Chadhava','Book authentic Vedic pujas for your specific needs.','Book a Puja','/mandir-seva','/assets/img/puja-banner.webp'],['Gau Seva','Perform Gau Seva and receive divine blessings.','Do Gau Seva','/gau-sewa','/assets/img/gausewa/cow-mother-calf.webp'],['Astro Mall','Explore astrological items and sacred essentials.','Visit Astro Mall','/astro-mall','/assets/img/mall-banner.webp']];
const servicesHi = {Kundli:['कुंडली','अपनी जन्म कुंडली बनाएँ और जीवन पथ समझें।','कुंडली बनाएँ'],'Puja & Chadhava':['पूजा और चढ़ावा','अपनी आवश्यकता के लिए प्रामाणिक वैदिक पूजा बुक करें।','पूजा बुक करें'],'Gau Seva':['गौ सेवा','गौ सेवा करें और पुण्य प्राप्त करें।','गौ सेवा करें'],'Astro Mall':['एस्ट्रो मॉल','प्रामाणिक ज्योतिष एवं पूजा सामग्री देखें।','मॉल देखें']};

function Icon({name}) { const p={career:<><rect x="4" y="8" width="16" height="11" rx="2"/><path d="M9 8V5h6v3M4 12h16"/></>,rings:<><circle cx="9" cy="13" r="5"/><circle cx="15" cy="13" r="5"/><path d="m8 5 1-2 1 2m4 0 1-2 1 2"/></>,coins:<><ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v7c0 1.4 2.2 2.5 5 2.5M14 7v5"/><ellipse cx="16" cy="16" rx="4" ry="2"/><path d="M12 16v3c0 1.1 1.8 2 4 2s4-.9 4-2v-3"/></>,lotus:<><path d="M12 20c-5 0-8-3-8-7 3 0 5 1 8 4 3-3 5-4 8-4 0 4-3 7-8 7Z"/><path d="M12 17c-3-3-3-7 0-11 3 4 3 8 0 11Z"/></>,chart:<><rect x="4" y="4" width="16" height="16" rx="1"/><path d="m4 4 16 16M20 4 4 20M12 4v16M4 12h16"/></>,flame:<path d="M12 21c-4 0-7-2.6-7-6.2 0-3.2 2-5.7 5.4-9.8.1 2.4 1 3.8 2.2 4.8.8-1.4 1.6-3.1 1.4-5.8 3.1 3.7 5 6.8 5 10.8 0 3.6-3 6.2-7 6.2Z"/>}; return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>; }

export default function HomePage(){
  const { currentUser, openAuthModal } = useAuth();
  const [query,setQuery]=useState(''),[lang,setLang]=useState(()=>localStorage.getItem('astro_preferred_lang')==='hi'?'hi':'en'),[live,setLive]=useState({}),[panchang,setPanchang]=useState(null),[slide,setSlide]=useState(0); const slider=useRef(null),navigate=useNavigate(),t=copy[lang];
  useEffect(()=>{const onLang=e=>setLang(e.detail?.language==='hi'?'hi':'en');window.addEventListener('astro:languagechange',onLang);return()=>window.removeEventListener('astro:languagechange',onLang)},[]);
  const liveAll=useLiveAstrologers();
  useEffect(()=>{const controller=new AbortController();fetch('/api/v1/astrologers?limit=50',{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{const rows=d.items||d.astrologers||[];setLive(Object.fromEntries(rows.map(a=>[a.slug||a.id,a.availability||a.status]))) }).catch(()=>{});fetch('/api/v1/charts/panchang',{signal:controller.signal}).then(r=>r.ok?r.json():Promise.reject()).then(setPanchang).catch(()=>{});return()=>controller.abort()},[]);
  const search=e=>{e.preventDefault();navigate(query.trim()?`/astrologers?search=${encodeURIComponent(query.trim())}`:'/astrologers')};
  const scrollSlide=i=>{setSlide(i);slider.current?.scrollTo({left:i*slider.current.clientWidth*.9,behavior:'smooth'})};
  const handleConsultClick=(e, to)=>{
    e.preventDefault();
    if (!currentUser && !localStorage.getItem('token')) {
      if (typeof openAuthModal === 'function') {
        openAuthModal('login');
      } else {
        navigate('/login');
      }
      return;
    }
    navigate(to);
  };
  const date=new Intl.DateTimeFormat(lang==='hi'?'hi-IN':'en-IN',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  const panLine=panchang?`${panchang.tithi?.name||''} · ${panchang.nakshatra?.name||''} · ${panchang.yog?.name||''}`:t.panchangSub;
  return <div className="home-v2" lang={lang}>
    <section className="hv2-hero" aria-labelledby="home-title">
      <div className="hv2-hero-copy">
        <div className="hv2-kicker">✦ ASTRO JYOTISH · {t.kicker} ✦</div>
        <h1 id="home-title">
          {lang === 'hi' ? (
            <>जीवन के महत्वपूर्ण निर्णयों के लिए <span className="hv2-title-highlight">स्पष्टता<svg className="hv2-swoosh" viewBox="0 0 160 18" fill="none"><path d="M4 14C45 4 115 4 156 14" stroke="#C49A3A" strokeWidth="3" strokeLinecap="round"/></svg></span></>
          ) : (
            <>Clarity for life's important <span className="hv2-title-highlight">decisions<svg className="hv2-swoosh" viewBox="0 0 160 18" fill="none"><path d="M4 14C45 4 115 4 156 14" stroke="#C49A3A" strokeWidth="3" strokeLinecap="round"/></svg></span></>
          )}
        </h1>
        <p>{t.hero}</p>
        <form className="hv2-search" role="search" onSubmit={search}>
          <span className="hv2-search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search} aria-label={t.search}/>
          <button type="submit" className="hv2-search-btn" aria-label={t.search}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>Search</span>
          </button>
        </form>
        <div className="hv2-actions">
          <Link className="primary" to="/astrologers">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>{t.talk}</span>
            <span>→</span>
          </Link>
          <Link className="secondary" to="/calculators">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#C49A3A" stroke="#C49A3A" strokeWidth="1"><polygon points="6 3 20 12 6 21 6 3"/></svg>
            <span>{t.tools}</span>
          </Link>
        </div>
        <div className="hv2-proof">
          <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#164B32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t.verified}</span>
          <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#164B32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t.expertise}</span>
          <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#164B32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> {t.guidance}</span>
        </div>
      </div>
      <div className="hv2-hero-image">
        <img src="/assets/img/hero_astrologer_clean.webp" alt="Experienced Vedic astrologer studying a kundli in a refined consultation studio" width="1150" height="900" fetchPriority="high" decoding="async"/>
      </div>
    </section>
    <section className="hv2-trust" aria-label="Trust indicators">
      <svg className="hv2-stat-corner tl" viewBox="0 0 32 32" fill="none"><path d="M2 18V6a4 4 0 0 1 4-4h12M2 6c4 0 8 4 8 8" stroke="#C49A3A" strokeWidth="1.5" strokeLinecap="round"/></svg>
      <svg className="hv2-stat-corner tr" viewBox="0 0 32 32" fill="none"><path d="M30 18V6a4 4 0 0 0-4-4H14M30 6c-4 0-8 4-8 8" stroke="#C49A3A" strokeWidth="1.5" strokeLinecap="round"/></svg>
      <svg className="hv2-stat-corner bl" viewBox="0 0 32 32" fill="none"><path d="M2 14v12a4 4 0 0 0 4 4h12M2 26c4 0 8-4 8-8" stroke="#C49A3A" strokeWidth="1.5" strokeLinecap="round"/></svg>
      <svg className="hv2-stat-corner br" viewBox="0 0 32 32" fill="none"><path d="M30 14v12a4 4 0 0 1-4 4H14M30 26c-4 0-8-4-8-8" stroke="#C49A3A" strokeWidth="1.5" strokeLinecap="round"/></svg>

      <div>
        <div className="stat-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C49A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div className="stat-info">
          <strong className="stat-num">30+</strong>
          <span className="stat-lbl">{t.verified}</span>
        </div>
      </div>

      <div>
        <div className="stat-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C49A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>
        </div>
        <div className="stat-info">
          <strong className="stat-num">13+</strong>
          <span className="stat-lbl">{t.languages}</span>
        </div>
      </div>

      <div>
        <div className="stat-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C49A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
        </div>
        <div className="stat-info">
          <strong className="stat-num">100%</strong>
          <span className="stat-lbl">{lang==='hi'?'सुरक्षित भुगतान':'Secure Payments'}</span>
        </div>
      </div>

      <div>
        <div className="stat-badge">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C49A3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        </div>
        <div className="stat-info">
          <strong className="stat-num">100%</strong>
          <span className="stat-lbl">{t.private}</span>
        </div>
      </div>
    </section>
    <section className="hv2-section"><Header eye={t.intentEye} title={t.intent} sub={t.intentSub}/><div className="hv2-intent-grid">{intents.map(([label,icon,to])=><Link to={to} key={label}><i><Icon name={icon}/></i><strong>{lang==='hi'?intentHi[label]:label}</strong></Link>)}</div></section>
    <section className="hv2-section"><Header eye={t.expertsEye} title={t.experts} sub={t.expertsSub}/><div className="hv2-expert-grid" ref={slider} onScroll={e=>setSlide(Math.min(2,Math.round(e.currentTarget.scrollLeft/(e.currentTarget.clientWidth*.88))))}>{baseAstrologers.map(a=>{const status=live[a.slug];const online=['online','available'].includes(String(status).toLowerCase());return <article className="hv2-expert-card" key={a.slug}><Link className="photo" to={`/astrologers/${a.slug}`}><img src={a.image} alt={a.name} width="240" height="300" loading="eager" decoding="async"/></Link><div className="info"><h3>{a.name}</h3><p>{a.expertise}</p><span className="language">◎ Hindi, English · <b>₹{a.price}/min</b></span><div className="meta">{Number((liveAll&&liveAll[a.slug]||{}).review_count)>0?<span>★ {Number(liveAll[a.slug].rating).toFixed(1)}</span>:<span>★ 4.9</span>}<span className={online?'is-live':''}>{online?'● Online':t.schedule}</span></div><div className="expert-actions"><a href={`/consultation/${a.slug}`} onClick={(e)=>handleConsultClick(e, `/consultation/${a.slug}`)}>{t.chat}</a><a href={`/consultation/${a.slug}?call=true`} className="call" onClick={(e)=>handleConsultClick(e, `/consultation/${a.slug}?call=true`)}>☎ {t.call}</a></div></div></article>})}</div><div className="hv2-slider-dots" aria-label="Astrologer slides">{baseAstrologers.map((a,i)=><button key={a.slug} className={slide===i?'active':''} onClick={()=>scrollSlide(i)} aria-label={`Show ${a.name}`}/>)}</div><Link className="view-all" to="/astrologers">{t.all} →</Link></section>
    <section className="hv2-cosmic"><div className="cosmic-title"><span>✦ {t.cosmic} ✦</span><h2>{t.daily}</h2><p>{t.dailySub}</p></div><Link to="/panchang" className="cosmic-card"><i>▣</i><div><h3>{t.panchang}</h3><p>{date}<br/>{panLine}</p><b>{t.viewPanchang} →</b></div></Link><Link to="/rashiphal" className="cosmic-card"><i>♈</i><div><h3>{t.horoscope}</h3><p>{t.horoscopeSub}</p><b>{t.read} →</b></div></Link><div className="zodiac" aria-hidden="true">☼</div></section>
    <section className="hv2-section"><Header eye={t.beyond} title={t.more} sub={t.moreSub}/><div className="hv2-service-grid">{services.map(([title,desc,cta,to,image],i)=>{const x=lang==='hi'?servicesHi[title]:[title,desc,cta];return <Link to={to} className={`hv2-service-card crop-${i}`} key={title}><img src={image} alt="" width="480" height="320" loading="eager" decoding="async"/><div><h3>{x[0]}</h3><p>{x[1]}</p><b>{x[2]} →</b></div></Link>})}</div></section>
    <section className="hv2-how"><div className="how-title"><span>✦ {t.howEye} ✦</span><h2>{t.how}</h2><p>{t.howSub}</p></div><Step n="1" title={t.choose} sub={t.chooseSub}/><b className="arrow">→</b><Step n="2" title={t.connect} sub={t.connectSub}/><b className="arrow">→</b><Step n="3" title={t.get} sub={t.getSub}/></section>
    <section className="hv2-final"><div><h2>{t.final}</h2><p>{t.finalSub}</p><Link to="/astrologers">☎ {t.talk} →</Link></div></section>
  </div>
}
function Header({eye,title,sub}){return <header className="hv2-heading"><span>✦ {eye} ✦</span><h2>{title}</h2><p>{sub}</p></header>}
function Step({n,title,sub}){return <div className="hv2-step"><i>{n}</i><div><b>{n}. {title}</b><span>{sub}</span></div></div>}
