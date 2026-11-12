import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ALL_ASTROLOGERS } from './astrologersData.js';
import HelpMeChooseModal from './HelpMeChooseModal.jsx';
import './directory-v2.css';

const concerns = ['Career','Marriage','Finance','Health','Kundli','Remedies'];
const languages = ['Hindi','English','Sanskrit','Marathi','Gujarati','Bengali','Tamil','Punjabi'];
const expertise = ['Vedic Astrology','Kundli','Marriage','Career','Finance','Health','Vastu','Tarot','Numerology','Remedies'];

export default function DirectoryPage(){
  const [params,setParams]=useSearchParams(), navigate=useNavigate();
  const [query,setQuery]=useState(params.get('search')||''),[specialty,setSpecialty]=useState(params.get('specialty')||params.get('concern')||''),[language,setLanguage]=useState(params.get('language')||''),[availability,setAvailability]=useState(''),[experience,setExperience]=useState(''),[price,setPrice]=useState(''),[rating,setRating]=useState(''),[sort,setSort]=useState('recommended'),[page,setPage]=useState(1),[filtersOpen,setFiltersOpen]=useState(false),[helpOpen,setHelpOpen]=useState(false);
  const [bookmarks,setBookmarks]=useState(()=>{try{return JSON.parse(localStorage.getItem('astro_bookmarks')||'[]')}catch{return[]}});
  const pageSize=9;

  useEffect(()=>{setQuery(params.get('search')||'');setSpecialty(params.get('specialty')||params.get('concern')||'');setLanguage(params.get('language')||'');setPage(1)},[params]);
  useEffect(()=>{document.body.classList.toggle('dir-sheet-open',filtersOpen);return()=>document.body.classList.remove('dir-sheet-open')},[filtersOpen]);

  const filtered=useMemo(()=>ALL_ASTROLOGERS.filter(a=>{
    const hay=[a.name,a.title,...(a.specialties||[]),...(a.languages||[])].join(' ').toLowerCase(), q=query.trim().toLowerCase();
    if(q&&!hay.includes(q))return false;
    if(specialty&&!(a.specialties||[]).some(x=>x.toLowerCase().includes(specialty.toLowerCase())))return false;
    if(language&&!(a.languages||[]).some(x=>x.toLowerCase()===language.toLowerCase()))return false;
    if(availability==='online'&&a.availability!=='online')return false;
    if(experience&&Number(a.experience_years)<Number(experience))return false;
    if(price==='under40'&&Number(a.price_per_minute)>=40)return false;
    if(price==='40to50'&&(Number(a.price_per_minute)<40||Number(a.price_per_minute)>50))return false;
    if(price==='above50'&&Number(a.price_per_minute)<=50)return false;
    if(rating&&Number(a.rating)<Number(rating))return false;
    return true;
  }).sort((a,b)=>sort==='rating'?b.rating-a.rating:sort==='experience'?b.experience_years-a.experience_years:sort==='price-low'?a.price_per_minute-b.price_per_minute:sort==='popular'?b.review_count-a.review_count:0),[query,specialty,language,availability,experience,price,rating,sort]);
  const expertiseCounts=useMemo(()=>Object.fromEntries(expertise.map(x=>[x,ALL_ASTROLOGERS.filter(a=>(a.specialties||[]).some(s=>s.toLowerCase().includes(x.toLowerCase()))).length])),[]);
  const pages=Math.max(1,Math.ceil(filtered.length/pageSize)), visible=filtered.slice((page-1)*pageSize,page*pageSize);
  const active=[specialty&&['Expertise',specialty,()=>setSpecialty('')],language&&['Language',language,()=>setLanguage('')],availability&&['Availability','Online',()=>setAvailability('')],experience&&['Experience',`${experience}+ years`,()=>setExperience('')],price&&['Price',price==='under40'?'Under ₹40':price==='40to50'?'₹40–₹50':'Above ₹50',()=>setPrice('')],rating&&['Rating',`${rating}+`,()=>setRating('')]].filter(Boolean);
  const clear=()=>{setQuery('');setSpecialty('');setLanguage('');setAvailability('');setExperience('');setPrice('');setRating('');setPage(1);setParams({})};
  const toggleBookmark=id=>setBookmarks(prev=>{const next=prev.includes(id)?prev.filter(x=>x!==id):[...prev,id];localStorage.setItem('astro_bookmarks',JSON.stringify(next));return next});
  const submit=e=>{e.preventDefault();const next={};if(query.trim())next.search=query.trim();if(specialty)next.specialty=specialty;if(language)next.language=language;setParams(next);setPage(1)};

  return <div className="dir-v2">
    <section className="dirv2-hero"><div className="dirv2-hero-copy"><span>✦ Verified · Experienced · Trusted ✦</span><h1>Find the right Vedic astrologer<br/>for your concern</h1><p>Get personalised, authentic guidance for Love, Career, Marriage, Finance, Health and more from verified Vedic astrologers.</p><ul className="dirv2-trust"><li><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6l-7-3Zm-1.2 12.2-3-3 1.2-1.2 1.8 1.8 4.2-4.2 1.2 1.2-5.4 5.4Z"/></svg></i><span><b>Verified</b> Astrologers</span></li><li><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8-2a3 3 0 0 1 6 0v2H9V7Zm4 9.7V18h-2v-1.3a2 2 0 1 1 2 0Z"/></svg></i><span><b>Private &amp; Secure</b> Consultations</span></li><li><i><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v12H8l-4 4V4Zm3 4v2h10V8H7Zm0 3v2h7v-2H7Z"/></svg></i><span><b>Chat &amp; Call</b> on Your Terms</span></li></ul></div><img src="/assets/img/vedic-sage-hero.webp" alt="Vedic astrologer studying a birth chart" width="900" height="500" fetchPriority="high"/></section>

    <section className="dirv2-discovery">
      <form className="dirv2-search" onSubmit={submit}><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search astrologer by name, expertise or concern..." aria-label="Search astrologers"/><button>Search →</button></form><button className="dirv2-help" onClick={()=>setHelpOpen(true)}>✦ <span><b>I&apos;m not sure</b><small>Help me choose</small></span>→</button>
      <div className="dirv2-top-filters"><Select label="Expertise" value={specialty} set={setSpecialty} options={expertise}/><Select label="Language" value={language} set={setLanguage} options={languages}/><Select label="Availability" value={availability} set={setAvailability} options={[['online','Online now']]}/><Select label="Experience" value={experience} set={setExperience} options={[['5','5+ years'],['10','10+ years'],['15','15+ years'],['20','20+ years']]}/><Select label="Price" value={price} set={setPrice} options={[['under40','Under ₹40/min'],['40to50','₹40–₹50/min'],['above50','Above ₹50/min']]}/><Select label="Rating" value={rating} set={setRating} options={[['4.5','4.5 & above'],['4.8','4.8 & above']]}/></div>
      {active.length>0&&<div className="dirv2-active"><b>Active filters:</b>{active.map(([k,v,remove])=><button key={k} onClick={remove}>{v} ×</button>)}<button className="clear" onClick={clear}>Clear all</button></div>}
    </section>

    <nav className="dirv2-concerns" aria-label="Quick search by concern"><b>Quick search:</b>{concerns.map(c=><button className={specialty===c?'active':''} onClick={()=>{setSpecialty(specialty===c?'':c);setPage(1)}} key={c}>{iconFor(c)} {c}</button>)}</nav>
    <div className="dirv2-mobile-tools"><strong>{filtered.length} astrologers</strong><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort astrologers"><option value="recommended">Recommended</option><option value="popular">Most Popular</option><option value="rating">Top Rated</option><option value="experience">Experience</option><option value="price-low">Price: Low</option></select><button onClick={()=>setFiltersOpen(true)}>⌁ Filters</button></div>

    <section className="dirv2-results">
      <aside className={`dirv2-sidebar ${filtersOpen?'open':''}`}><div className="dirv2-sheet-head"><h2>Filters</h2><button onClick={()=>setFiltersOpen(false)} aria-label="Close filters">×</button></div><FilterGroup title="Expertise">{expertise.slice(0,7).map(x=><Check key={x} label={`${x} (${expertiseCounts[x]||0})`} checked={specialty===x} onChange={()=>setSpecialty(specialty===x?'':x)}/>)}</FilterGroup><FilterGroup title="Language"><Select label="All languages" value={language} set={setLanguage} options={languages}/></FilterGroup><FilterGroup title="Availability"><Check label="Online now" checked={availability==='online'} onChange={()=>setAvailability(availability==='online'?'':'online')}/></FilterGroup><FilterGroup title="Experience"><Select label="Any experience" value={experience} set={setExperience} options={[['5','5+ years'],['10','10+ years'],['15','15+ years'],['20','20+ years']]}/></FilterGroup><FilterGroup title="Price (₹/min)"><Select label="Any price" value={price} set={setPrice} options={[['under40','Under ₹40'],['40to50','₹40–₹50'],['above50','Above ₹50']]}/></FilterGroup><FilterGroup title="Rating"><Select label="Any rating" value={rating} set={setRating} options={[['4.5','4.5 & above'],['4.8','4.8 & above']]}/></FilterGroup><div className="dirv2-sheet-actions"><button onClick={clear}>Reset</button><button onClick={()=>setFiltersOpen(false)}>Show {filtered.length} results</button></div></aside>{filtersOpen&&<button className="dirv2-backdrop" onClick={()=>setFiltersOpen(false)} aria-label="Close filters"/>}
      <div className="dirv2-main"><header className="dirv2-results-head"><div><span>✦ Explore specialists</span><h2>Find the right astrologer for your concern</h2><p>Compare expertise, language, availability and fee before you connect.</p><strong className="dirv2-count" aria-live="polite">{filtered.length} astrologers found</strong></div><label>Sort by <select value={sort} onChange={e=>setSort(e.target.value)}><option value="recommended">Recommended</option><option value="popular">Most Popular</option><option value="rating">Top Rated</option><option value="experience">Experience</option><option value="price-low">Price: Low to High</option></select></label></header>
        {visible.length?<div className="dirv2-grid">{visible.map(a=><AstrologerCard key={a.id} a={a} saved={bookmarks.includes(a.id)} toggle={()=>toggleBookmark(a.id)} navigate={navigate}/>)}</div>:<div className="dirv2-empty"><h3>No astrologers found</h3><p>Try changing or clearing your filters.</p><button onClick={clear}>Clear filters</button></div>}
        {pages>1&&<nav className="dirv2-pages" aria-label="Pagination"><button disabled={page===1} onClick={()=>setPage(page-1)}>←</button>{Array.from({length:Math.min(pages,5)},(_,i)=>i+1).map(n=><button className={page===n?'active':''} onClick={()=>setPage(n)} key={n}>{n}</button>)}<button disabled={page===pages} onClick={()=>setPage(page+1)}>→</button></nav>}
      </div>
    </section>
    <HelpMeChooseModal isOpen={helpOpen} onClose={()=>setHelpOpen(false)} astrologers={ALL_ASTROLOGERS}/>
  </div>
}

function AstrologerCard({a,saved,toggle,navigate}){const online=a.availability==='online',slug=a.slug||a.id;return <article className="dirv2-card"><button className={`dirv2-save ${saved?'saved':''}`} onClick={toggle} aria-label={saved?'Remove bookmark':'Save astrologer'}>{saved?'♥':'♡'}</button><div className="dirv2-card-top"><Link to={`/astrologers/${slug}`} className="dirv2-avatar"><img src={a.avatar} alt={a.name} width="96" height="96" loading="lazy" decoding="async" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src=a.fallbackAvatar||'/assets/portraits/default-avatar.svg'}}/><i className={online?'online':''}/></Link><div><h3><Link to={`/astrologers/${slug}`}>{a.name}</Link><svg className="dirv2-verified" viewBox="0 0 20 20" role="img" aria-label="Verified astrologer"><circle cx="10" cy="10" r="10"/><path d="m5.6 10.4 2.9 2.9 5.9-6.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></h3><p>{a.title}</p><span>{(a.languages||[]).slice(0,2).join(', ')} <em/> {a.experience_years} yrs</span></div></div><div className="dirv2-card-meta"><span>★ {Number(a.rating).toFixed(1)} <small>({(Number(a.review_count)||0).toLocaleString('en-IN')})</small></span><b>{a.price_per_minute?`₹${a.price_per_minute}/min`:'Fee on request'}</b></div><div className={`dirv2-status ${online?'online':''}`}>● {online?'Available now':a.statusLabel||'View schedule'}</div><div className="dirv2-card-actions"><button onClick={()=>navigate(`/consultation/${slug}`)}>▢ Chat</button><button onClick={()=>navigate(`/consultation/${slug}?call=true`)}>☎ Call</button><Link className="dirv2-profile-link" to={`/astrologers/${slug}`}>View profile →</Link></div></article>}
function Select({label,value,set,options}){return <select value={value} onChange={e=>set(e.target.value)}><option value="">{label}</option>{options.map(o=>{const [v,l]=Array.isArray(o)?o:[o,o];return <option value={v} key={v}>{l}</option>})}</select>}
function FilterGroup({title,children}){return <div className="dirv2-filter-group"><h3>{title}</h3>{children}</div>}
function Check({label,checked,onChange}){return <label className="dirv2-check"><input type="checkbox" checked={checked} onChange={onChange}/><span>{label}</span></label>}
function iconFor(c){return {Career:'▣',Marriage:'♡',Finance:'▤',Health:'♢',Kundli:'▧',Remedies:'♨'}[c]}
