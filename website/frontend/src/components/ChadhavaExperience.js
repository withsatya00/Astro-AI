import { api, esc, money, mediaUrl, backendOrigin, requireLogin, openModal, closeModal, downloadFile, goTo, postJson, isSignedIn } from '../utils/shop.js';
import { currentLang } from '../utils/shop-i18n.js';
import { proofLineHtml, reviewsSectionHtml } from './sampleProof.js';
import { pujaCalendar, deityImages, deityPhoto, calendarSources } from './puja-calendar.js';
import { loadSevaGalleries, sevaGallery, bindSevaGalleries } from './SevaGallery.js';
import { sevaIcon } from './SevaIcons.js';
import { offeringPhoto } from '../utils/offering-images.js';

const BASE = '/api/v1/mandir/chadhava';
const text = (en,hi) => currentLang() === 'hi' ? hi : en;
const dt = value => new Date(value).toLocaleString(currentLang()==='hi'?'hi-IN':'en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}) + ' IST';
const send = (path,data,method='POST') => api(BASE+path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
const status = value => ({PENDING:text('Awaiting payment','भुगतान बाकी'),PAID:text('Paid','भुगतान हो गया'),EXPIRED:text('Reservation expired','आरक्षण समाप्त'),REFUND_PENDING:text('Refund processing','रिफंड प्रक्रिया में'),REFUNDED:text('Refunded','रिफंड हो गया'),CANCELLED:text('Cancelled','रद्द'),CONFIRMED:text('Booking confirmed','बुकिंग की पुष्टि'),SCHEDULED:text('Seva scheduled','सेवा निर्धारित'),PERFORMED:text('Offering performed','चढ़ावा अर्पित'),VIDEO_AVAILABLE:text('Video available','वीडियो उपलब्ध'),COMPLETED:text('Completed','पूर्ण'),AWAITING_PAYMENT:text('Awaiting payment','भुगतान बाकी'),PAYMENT_REVIEW:text('Payment received — support review','भुगतान प्राप्त — सहायता टीम की समीक्षा')})[value] || value;
const btn = (label,action,extra='') => `<button type="button" class="shop-btn shop-btn--line" data-ch-action="${action}" ${extra}>${esc(label)}</button>`;
const lineItems = items => `<div class="ch-lines">${items.map(i=>`<div><span>${esc(i.title)} × ${i.quantity}</span><strong>${money(i.total_paise/100)}</strong></div>`).join('')}</div>`;

const daysLeft = iso => {
  const ms = new Date(iso) - Date.now();
  if (ms <= 0) return text('Closing now', 'बुकिंग बंद हो रही है');
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5);
  return d >= 1 ? text(`${d} day${d > 1 ? 's' : ''} left to join`, `जुड़ने के लिए ${d} दिन बाकी`) : text(`${h}h left to join`, `जुड़ने के लिए ${h} घंटे बाकी`);
};
const isTier = o => o.category === 'puja_tier';
const isItem = o => o.category === 'item';

export class ChadhavaExperience {
  static async mount(root,kind) {
    this.root=root;this.fixedKind=kind||null;if(kind)this.tab=kind;
    if(!root)return;
    if(!document.getElementById('chadhava-css')){
      const css=document.createElement('link');css.id='chadhava-css';css.rel='stylesheet';css.href='/src/styles/chadhava.css';document.head.insertBefore(css,document.getElementById('sacred-premium-css'));
    }
    if(!this.modal){
      this.modal=document.createElement('div');this.modal.className='shop-modal ch-modal';this.modal.id='chadhava-event-modal';
      this.modal.setAttribute('role','dialog');this.modal.setAttribute('aria-modal','true');this.modal.setAttribute('aria-labelledby','ch-dialog-title');
      document.body.append(this.modal);
      this.modal.addEventListener('click',e=>{if(e.target===this.modal)this.close();else this.click(e);});
      this.modal.addEventListener('submit',e=>this.submit(e));
      this.modal.addEventListener('input',e=>{if(e.target.matches('[data-offering],[name="tier"]'))this.updateCart();});
      this.modal.addEventListener('change',e=>{
        if(e.target.name==='gotra_unknown'){const input=this.modal.querySelector('[name="gotra"]');input.disabled=e.target.checked;input.required=!e.target.checked;}
      });
      document.addEventListener('keydown',e=>{
        if(!this.modal.classList.contains('is-open'))return;
        if(e.key==='Escape'){if(this.modal.classList.contains('ch-package-open')){this.checkoutOpen=false;this.step=1;this.showStep();this.modal.querySelector('[data-ch-action="packages"]')?.focus();}else this.close();}
        if(e.key==='Tab'&&(!this.modal.classList.contains('ch-inline-detail')||this.checkoutOpen&&this.eventData?.kind==='puja')){
          const items=[...this.modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]')].filter(el=>el.getClientRects().length&&!el.closest('[inert]'));
          const first=items[0],last=items[items.length-1];
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
          else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
        }
      });
      window.addEventListener('astro:languagechange',()=>{this.load();if(this.modal.classList.contains('is-open'))this.refreshOrClose();});
      window.addEventListener('astro:authchange',()=>{this.authGeneration=(this.authGeneration||0)+1;if(!this.modal.querySelector('[data-ch-form=checkout]')||!this.modal.classList.contains('is-open'))this.refreshOrClose();this.load();});
    }
    root.addEventListener('click',e=>this.click(e));
    root.addEventListener('input',e=>{const box=e.target.closest('[data-ch-search]');if(!box)return;const at=box.selectionStart;this.pujaFilters={...this.pujaFilters,q:box.value};this.catalogueLimit=18;this.hub(this.access||{});const next=root.querySelector('[data-ch-search]');if(next){next.focus();try{next.setSelectionRange(at,at);}catch(_){}}});
    root.addEventListener('change',e=>{const sel=e.target.closest('[data-ch-filter]');if(!sel)return;this.pujaFilters={...this.pujaFilters,[sel.dataset.chFilter]:sel.value};this.catalogueLimit=18;this.hub(this.access||{});});
    await this.load();
  }
  static async load(){
    const request=this.loadRequest=(this.loadRequest||0)+1;
    try{
      const d=await api(BASE+'/events?lang='+currentLang());
      await loadSevaGalleries();
      if(request!==this.loadRequest)return;
      this.events=d.events;this.gateway=d.razorpay_available;
      let access={};
      if(window.App?.currentUser){try{access=await api(BASE+'/access');}catch(_){/* guest */}}
      this.access=access;
      if(request!==this.loadRequest)return;
      if(!['puja','chadhava'].includes(this.tab))this.tab=this.events.some(e=>e.kind==='puja')?'puja':'chadhava';
      this.hub(access);
    }catch(e){this.root.innerHTML=`<p role="alert">${esc(e.message)}</p>${btn(text('Retry','फिर कोशिश करें'),'reload')}`;}
  }
  static hub(access={}){
    const puja=this.tab==='puja',all=this.events.filter(e=>e.kind===this.tab),list=all.filter(e=>e.bookable),closed=all.filter(e=>!e.bookable);
    const tabs=[['puja','🛕',text('Puja','पूजा')],['chadhava','🪔',text('Chadhava','चढ़ावा')]].map(([k,i,l])=>`<button type="button" role="tab" aria-selected="${k===this.tab}" class="ch-tab ${k===this.tab?'is-active':''}" data-ch-action="tab" data-kind="${k}">${i} ${esc(l)} <span>${this.events.filter(e=>e.kind===k).length}</span></button>`).join('');
    const steps=puja?[text('Choose puja & package','पूजा और पैकेज चुनें'),text('Add names & gotra','नाम और गोत्र भरें'),text('Review & pay','समीक्षा और भुगतान'),text('Get puja video','पूजा का वीडियो पाएं')]
      :[text('Choose event & offerings','कार्यक्रम और चढ़ावा चुनें'),text('Add name & gotra','नाम और गोत्र भरें'),text('Review & pay','समीक्षा और भुगतान'),text('Track seva & video','सेवा और वीडियो देखें')];
    this.root.innerHTML=`<header class="ch-heading"${this.fixedKind?' hidden':''}><div><span class="ch-eyebrow">${esc(puja?text('PUJA SEVA','पूजा सेवा'):text('CHADHAVA SEVA','चढ़ावा सेवा'))}</span><h2>${esc(puja?text('Upcoming Online Pujas','आगामी ऑनलाइन पूजा'):text('Offer in your name, from home','अपने नाम से चढ़ावा अर्पित करें'))}</h2><p>${esc(puja?text('Book a puja in your name and gotra, and receive its video after the temple seva.','अपने नाम और गोत्र से पूजा बुक करें और मंदिर सेवा के बाद उसका वीडियो पाएं।'):text('Choose a scheduled temple event, offer anything from a flower to a full bhog and follow the seva through to its video.','मंदिर का कार्यक्रम चुनें, फूल से लेकर भोग तक कुछ भी चढ़ाएं और सेवा का वीडियो पाएं।'))}</p></div>${btn(text('My bookings & videos','मेरी बुकिंग और वीडियो'),'orders')}</header>${this.fixedKind?`<div class="ch-bookings-bar"><span>${esc(text('Your seva, every step of the way','आपकी सेवा, हर चरण की जानकारी'))}</span>${btn(text('My bookings & videos','मेरी बुकिंग और वीडियो'),'orders')}</div>`:`<div class="ch-tabs" role="tablist">${tabs}</div>`}${puja?'':`<ol class="ch-how">${steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`}${list.length?`<section class="ch-confirmed"><span class="ch-eyebrow">${esc(text('BOOKING OPEN','बुकिंग खुली है'))}</span><div class="ch-events">${list.map(e=>this.card(e)).join('')}</div></section>`:(puja?'':`<div class="ch-empty"><h3>${esc(text('Upcoming events will appear here','आगामी कार्यक्रम यहां दिखेंगे'))}</h3><p>${esc(text('The temple team must confirm the date and offerings before bookings open. You can explore temples below.','बुकिंग खुलने से पहले मंदिर टीम तारीख और चढ़ावा तय करेगी। नीचे मंदिर देखें।'))}</p></div>`)}${closed.length?`<details class="ch-closed-events"><summary>${esc(text('Past & closed events','पुराने और बंद कार्यक्रम'))} (${closed.length})</summary><div class="ch-events">${closed.map(e=>this.card(e)).join('')}</div></details>`:''}${puja?this.calendarMarkup():''}${access.admin||access.temple_ids?.length?`<p>${btn(text('Temple-team dashboard','मंदिर टीम डैशबोर्ड'),'staff')}</p>`:''}`;
  }
  static calendarMarkup(){
    const all=pujaCalendar();
    if(!all.length)return '';
        const filters=[['all',text('All pujas','सभी पूजा')],['festival',text('Festival specials','त्योहार विशेष')],['shiva',text('Shiva','शिव')],['vishnu',text('Vishnu','विष्णु')],['devi',text('Devi','देवी')],['ganesh',text('Ganesh','गणेश')],['weekly',text('Weekly pujas','साप्ताहिक पूजा')]];
    const f={deity:'all',month:'all',type:'all',when:'all',q:'',...this.pujaFilters};
    const todayIso=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}),plus=n=>new Date(new Date(todayIso+'T00:00:00Z').getTime()+n*864e5).toISOString().slice(0,10),query=f.q.trim().toLowerCase();
    const monthName=date=>new Date(date+'T12:00:00+05:30').toLocaleDateString(currentLang()==='hi'?'hi-IN':'en-IN',{timeZone:'Asia/Kolkata',month:'long',year:'numeric'});
    const months=[...new Map(all.map(r=>[r.date.slice(0,7),monthName(r.date)])).entries()];
    const rows=all.filter(row=>(f.deity==='all'||row.deity===f.deity)&&(f.month==='all'||row.date.slice(0,7)===f.month)&&(f.type==='all'||(f.type==='weekly')===row.weekly)&&(f.when==='all'||(f.when==='today'?row.date===todayIso:row.date<=plus(f.when==='week'?7:30)))&&(!query||`${row.en} ${row.hi} ${row.deity} ${row.date}`.toLowerCase().includes(query)));
    const select=(key,label,opts)=>`<label class="ch-select"><span>${esc(label)}</span><select data-ch-filter="${key}">${opts.map(([v,l])=>`<option value="${esc(v)}" ${f[key]===v?'selected':''}>${esc(l)}</option>`).join('')}</select></label>`;
    const filterBar=`<div class="ch-filterbar"><label class="ch-search"><span class="sr-only">${esc(text('Search pujas','पूजा खोजें'))}</span><input type="search" data-ch-search value="${esc(f.q)}" placeholder="${esc(text('Search puja, deity or festival','पूजा, देवता या त्योहार खोजें'))}" autocomplete="off"></label><span class="ch-filterbar__lead">${esc(text('Filter','फ़िल्टर'))}</span>${select('deity',text('Deity','देवता'),[['all',text('All deities','सभी देवता')],['shiva',text('Shiva','शिव')],['vishnu',text('Vishnu','विष्णु')],['devi',text('Devi','देवी')],['ganesh',text('Ganesh','गणेश')],['hanuman',text('Hanuman','हनुमान')],['shani',text('Shani','शनि')],['surya',text('Surya','सूर्य')]])}${select('month',text('Month','महीना'),[['all',text('All months','सभी महीने')],...months])}${select('when',text('When','कब'),[['all',text('Any date','कोई भी तारीख')],['today',text('Today','आज')],['week',text('Next 7 days','अगले 7 दिन')],['month30',text('Next 30 days','अगले 30 दिन')]])}${select('type',text('Type','प्रकार'),[['all',text('All pujas','सभी पूजा')],['festival',text('Festival specials','त्योहार विशेष')],['weekly',text('Weekly pujas','साप्ताहिक पूजा')]])}${f.deity!=='all'||f.month!=='all'||f.type!=='all'||f.when!=='all'||f.q?`<button type="button" class="ch-filterbar__clear" data-ch-action="catalogue-clear">${esc(text('Clear','हटाएं'))}</button>`:''}</div>`;
    const limit=this.catalogueLimit||18,visible=rows.slice(0,limit);
    const dateLabel=(date,options)=>new Date(date+'T12:00:00+05:30').toLocaleDateString(currentLang()==='hi'?'hi-IN':'en-IN',{timeZone:'Asia/Kolkata',...options});
    const benefits={shiva:text('Peace, protection and inner strength','शांति, रक्षा और आंतरिक शक्ति'),vishnu:text('Prosperity, harmony and divine grace','समृद्धि, सामंजस्य और कृपा'),devi:text('Abundance, courage and family wellbeing','समृद्धि, साहस और परिवार कल्याण'),ganesh:text('Obstacle removal and auspicious beginnings','विघ्न निवारण और शुभ शुरुआत'),hanuman:text('Courage, protection and confidence','साहस, रक्षा और आत्मविश्वास'),shani:text('Relief, discipline and karmic balance','राहत, अनुशासन और कर्म संतुलन'),surya:text('Health, vitality and success','स्वास्थ्य, ऊर्जा और सफलता')};
    const cards=visible.map(row=>`<article class="ch-event ch-calendar-card"><div class="ch-event-media"><img src="${esc(deityPhoto(row.deity,row.id))}" alt="${esc(text('Illustrative puja image','प्रतीकात्मक पूजा चित्र'))}" loading="lazy"><span class="ch-tag">${esc(row.weekly?text('Weekly seva','साप्ताहिक सेवा'):text('Festival special','त्योहार विशेष'))}</span></div><div class="ch-event-copy"><p class="ch-card-kicker">${esc(dateLabel(row.date,{day:'numeric',month:'short',weekday:'long'}))}</p><h3>${esc(currentLang()==='hi'?row.hi:row.en)}</h3><p class="ch-card-benefit">${esc(benefits[row.deity]||benefits.shiva)}</p><ul class="ch-card-meta"><li>${esc(text('Temple venue will be announced','मंदिर की घोषणा जल्द होगी'))}</li><li>${esc(dateLabel(row.date,{day:'numeric',month:'long',year:'numeric'}))} · IST</li></ul><div class="ch-event-foot"><button class="shop-btn shop-btn--gold" data-ch-action="calendar-detail" data-id="${row.id}">${esc(text('Explore puja','पूजा का विवरण'))} →</button></div></div></article>`).join('');
    return `<section class="ch-calendar ch-puja-catalogue"><header><span class="ch-eyebrow">${esc(text('EXPLORE THE SACRED CALENDAR','पावन तिथियों का कैलेंडर'))}</span><h2>${esc(text('Upcoming puja calendar','आगामी पूजा कैलेंडर'))}</h2><p>${esc(text('Choose an upcoming puja and explore its ritual, benefits and participation flow. Booking opens only after the temple team confirms the venue, muhurat and packages.','आगामी पूजा चुनें और उसकी विधि, लाभ व भाग लेने की प्रक्रिया देखें। मंदिर, मुहूर्त और पैकेज की पुष्टि के बाद ही बुकिंग खुलेगी।'))}</p></header>${filterBar}<div class="ch-catalogue-count"><span>${visible.length} ${esc(text('of','में से'))} ${rows.length} ${esc(text('pujas','पूजा'))}</span><span class="ch-status-key">● ${esc(text('Booking opens soon','बुकिंग जल्द खुलेगी'))}</span></div><div class="ch-events">${cards || `<div class="ch-empty"><h3>${esc(text('No pujas match your filters','इन फ़िल्टर से कोई पूजा नहीं मिली'))}</h3>${btn(text('Clear filters','फ़िल्टर हटाएं'),'catalogue-clear')}</div>`}</div>${rows.length>limit?`<div class="ch-load-more"><button class="shop-btn shop-btn--line" data-ch-action="catalogue-more">${esc(text('View more pujas','और पूजा देखें'))}</button></div>`:''}<p class="ch-hint">${esc(text('Dates use New Delhi / IST. Local observance and temple muhurat may differ; images are illustrative.','तारीखें नई दिल्ली / भारतीय समय पर आधारित हैं। स्थानीय परंपरा और मंदिर मुहूर्त अलग हो सकते हैं; चित्र प्रतीकात्मक हैं।'))} <a href="${calendarSources[0]}" target="_blank" rel="noopener">${esc(text('Calendar reference','कैलेंडर संदर्भ'))}</a></p><details class="ch-journey"><summary><span class="ch-eyebrow">${esc(text('MANDIR SEVA EXPERIENCE','मंदिर सेवा अनुभव'))}</span><h2>${esc(text('A simple, transparent puja journey','सरल और पारदर्शी पूजा यात्रा'))}</h2><span class="ch-journey-hint">${esc(text('View the steps','चरण देखें'))} ▾</span></summary><div class="ch-trust-grid"><article><b>01</b><strong>${esc(text('Name & gotra sankalp','नाम और गोत्र से संकल्प'))}</strong><p>${esc(text('Your details are shared for the ritual sankalp.','पूजा संकल्प के लिए आपकी जानकारी ली जाती है।'))}</p></article><article><b>02</b><strong>${esc(text('Temple-led ritual','मंदिर द्वारा अनुष्ठान'))}</strong><p>${esc(text('The confirmed temple team performs the seva.','पुष्ट मंदिर टीम पूजा संपन्न करती है।'))}</p></article><article><b>03</b><strong>${esc(text('Clear booking updates','स्पष्ट बुकिंग अपडेट'))}</strong><p>${esc(text('Follow every stage from booking to completion.','बुकिंग से पूर्णता तक हर चरण देखें।'))}</p></article><article><b>04</b><strong>${esc(text('Puja video','पूजा वीडियो'))}</strong><p>${esc(text('Watch the uploaded seva video in your bookings.','अपनी बुकिंग में अपलोड किया गया वीडियो देखें।'))}</p></article></div><div class="ch-how-panel"><div><h2>${esc(text('How does online puja work?','ऑनलाइन पूजा कैसे काम करती है?'))}</h2><ol class="ch-how">${[text('Choose your puja','पूजा चुनें'),text('Select a package','पैकेज चुनें'),text('Add name & gotra','नाम और गोत्र भरें'),text('Review, pay & track','समीक्षा, भुगतान और ट्रैक करें')].map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div><div class="ch-how-art" aria-hidden="true"><span>ॐ</span><small>${esc(text('Sankalp · Seva · Video','संकल्प · सेवा · वीडियो'))}</small></div></div></details></section>`;
  }
  static calendarDetail(id){
    const row=pujaCalendar().find(row=>row.id===id);if(!row)return;
    const hi=currentLang()==='hi',title=hi?row.hi:row.en,tz={timeZone:'Asia/Kolkata'};
    const when=new Date(row.date+'T12:00:00+05:30'),loc=hi?'hi-IN':'en-IN';
    const full=when.toLocaleDateString(loc,{...tz,weekday:'long',day:'numeric',month:'long',year:'numeric'});
    const today=new Date(new Date().toLocaleDateString('en-CA',tz)+'T00:00:00Z'),days=Math.max(0,Math.round((new Date(row.date+'T00:00:00Z')-today)/864e5));
    const deities={shiva:['Lord Shiva','भगवान शिव','Peace, protection and inner strength','शांति, रक्षा और आंतरिक शक्ति'],vishnu:['Lord Vishnu','भगवान विष्णु','Prosperity, harmony and divine grace','समृद्धि, सामंजस्य और कृपा'],devi:['Goddess Lakshmi / Devi','देवी लक्ष्मी / माँ','Abundance, courage and family wellbeing','समृद्धि, साहस और परिवार कल्याण'],ganesh:['Lord Ganesh','भगवान गणेश','Obstacle removal and auspicious beginnings','विघ्न निवारण और शुभ शुरुआत'],hanuman:['Lord Hanuman','भगवान हनुमान','Courage, protection and confidence','साहस, रक्षा और आत्मविश्वास'],shani:['Shani Dev','शनि देव','Relief, discipline and karmic balance','राहत, अनुशासन और कर्म संतुलन'],surya:['Surya Dev','सूर्य देव','Health, vitality and success','स्वास्थ्य, ऊर्जा और सफलता']};
    const d=deities[row.deity]||deities.shiva,deity=hi?d[1]:d[0],tagline=hi?d[3]:d[2];
    const benefits=[[text('Spiritual merit & peace','आध्यात्मिक पुण्य और शांति'),text(`Prayers offered to ${d[0]} on a sacred day are believed to bring inner calm and spiritual merit for you and your family.`,`पावन तिथि पर ${d[1]} को अर्पित प्रार्थना से आपके और परिवार के लिए मानसिक शांति और पुण्य की मान्यता है।`)],[text('Family wellbeing','परिवार का कल्याण'),text('The sankalp is taken in your name and gotra, so the blessings are directed to you and the family members you name.','संकल्प आपके नाम और गोत्र से लिया जाता है, इसलिए आशीर्वाद आपके और बताए गए परिवारजनों के लिए होता है।')],[text('Guided from home','घर बैठे सहभागिता'),text('Join from home: receive the mantras and simple steps to follow, without travelling to the temple.','घर से जुड़ें: मंत्र और सरल विधि प्राप्त करें, मंदिर जाए बिना।')]];
    const steps=[[text('Introduction & Sankalp','परिचय और संकल्प'),text('The priest begins with the puja introduction and takes the sankalp with your name and gotra.','पुजारी पूजा का परिचय देकर आपके नाम और गोत्र से संकल्प लेते हैं।')],[text('Ganesh Pujan & Kalash Sthapana','गणेश पूजन व कलश स्थापना'),text('Ganesh Pujan, Kalash Sthapana and Navagraha invocation precede the main ritual.','मुख्य अनुष्ठान से पहले गणेश पूजन, कलश स्थापना और नवग्रह आवाहन होता है।')],[text(`Main puja of ${d[0]}`,`${d[1]} की मुख्य पूजा`),text('The principal ritual, mantra chanting and offerings are performed.','मुख्य अनुष्ठान, मंत्र जाप और अर्पण संपन्न होते हैं।')],[text('Aarti, Bhog & Completion','आरती, भोग व पूर्णाहुति'),text('Aarti and bhog are offered and the puja is concluded with prayers for your family.','आरती और भोग अर्पित कर परिवार के लिए प्रार्थना के साथ पूजा पूर्ण होती है।')]];
    const includes=[text('Your name and gotra recited by an experienced pandit during the puja','पूजा के दौरान अनुभवी पंडित द्वारा आपका नाम और गोत्र'),text('A video of the puja shared in your bookings after the seva','सेवा के बाद आपकी बुकिंग में पूजा का वीडियो'),text('Guided mantras and simple steps to follow from home','घर से करने के लिए मंत्र और सरल विधि'),text('Prasad or Aashirwad Box, where the confirmed package includes it','पुष्ट पैकेज में शामिल होने पर प्रसाद या आशीर्वाद बॉक्स')];
    const packages=[[text('Individual Puja','व्यक्तिगत पूजा'),text('1 devotee','1 भक्त')],[text('Partner Puja','जोड़ी पूजा'),text('2 devotees','2 भक्त')],[text('Family Puja','परिवार पूजा'),text('Up to 4 devotees','4 भक्त तक')],[text('Individual + Remedy','व्यक्तिगत + उपाय'),text('With astrologer remedy call','ज्योतिषी उपाय परामर्श सहित')]];
    const faqs=[[text('Why can I not book this puja yet?','मैं यह पूजा अभी बुक क्यों नहीं कर सकता?'),text('This is a calendar observance. Booking opens only after the temple team confirms the venue, muhurat and package prices.','यह कैलेंडर की तिथि है। मंदिर टीम द्वारा स्थान, मुहूर्त और पैकेज मूल्य तय होने के बाद ही बुकिंग खुलती है।')],[text('I do not know my gotra. What should I do?','मुझे अपना गोत्र नहीं पता, क्या करें?'),text('Choose ‘I do not know my gotra’ when offered by the temple. The booking form explains whether the temple accepts an unknown gotra; contact support if you need guidance.','मंदिर में उपलब्ध होने पर ‘मुझे अपना गोत्र नहीं पता’ चुनें। बुकिंग फ़ॉर्म में मंदिर का नियम मिलेगा; मार्गदर्शन के लिए सहायता टीम से संपर्क करें।')],[text('How will I know the puja was done in my name?','मुझे कैसे पता चलेगा कि पूजा मेरे नाम से हुई?'),text('Once booking is open, you can track each stage and watch the video in My bookings.','बुकिंग खुलने पर आप मेरी बुकिंग में हर चरण देख सकते हैं और वीडियो देख सकते हैं।')]];
    const sec=(sid,h,inner)=>`<section id="${sid}"><h2>${esc(h)}</h2>${inner}</section>`;
    this.shell(title,`<nav class="pp-crumbs" aria-label="Breadcrumb"><a href="/">${esc(text('Home','होम'))}</a> / <a href="/mandir-seva">${esc(text('Mandir Seva','मंदिर सेवा'))}</a> / <a href="/mandir-seva/puja">${esc(text('Puja','पूजा'))}</a> / <span aria-current="page">${esc(title)}</span></nav><div class="ch-detail-hero">${sevaGallery('ritual-'+row.deity,deityImages[row.deity],title,true)}<div class="ch-detail-summary"><span class="ch-eyebrow">${esc(row.weekly?text('WEEKLY PUJA','साप्ताहिक पूजा'):text('FESTIVAL SPECIAL','त्योहार विशेष'))}</span><h1>${esc(title)}</h1><p class="ch-detail-tagline"><strong>${esc(tagline)}</strong></p><ul class="ch-detail-facts"><li>${sevaIcon('temple')} ${esc(text('Temple venue will be announced','मंदिर की घोषणा जल्द होगी'))}</li><li>${sevaIcon('calendar')} ${esc(full)} · IST</li><li>🕉️ ${esc(deity)}</li></ul>${proofLineHtml()}<div class="ch-countdown-box"><small>${esc(text('Puja date in','पूजा की तिथि में'))}</small><b>${days}</b><span>${esc(days===1?text('day','दिन'):text('days','दिन'))}</span></div><span class="ch-tag">${esc(text('Booking opens soon','बुकिंग जल्द खुलेगी'))}</span><button type="button" class="shop-btn shop-btn--gold tp-green" data-ch-action="notify" data-id="${esc(row.id)}" data-date="${esc(row.date)}" data-title="${esc(title)}">🔔 ${esc(text('Notify me when booking opens','बुकिंग खुलने पर सूचित करें'))}</button><p class="ch-hint" data-ch-notify-note>${esc(text('Packages and prices appear here once the temple team confirms.','मंदिर टीम की पुष्टि के बाद पैकेज और मूल्य यहां दिखेंगे।'))}</p></div></div><div class="ch-rich-details"><nav class="ch-section-tabs"><a href="#cd-about">${esc(text('About Puja','पूजा के बारे में'))}</a><a href="#cd-benefits">${esc(text('Benefits','लाभ'))}</a><a href="#cd-process">${esc(text('Process','विधि'))}</a><a href="#cd-packages">${esc(text('Packages','पैकेज'))}</a>${reviewsSectionHtml()?`<a href="#cd-reviews">${esc(text('Reviews','समीक्षाएं'))}</a>`:''}<a href="#cd-faq">${esc(text('FAQs','प्रश्न'))}</a></nav>`
    +sec('cd-about',text('About this puja','इस पूजा के बारे में'),`<p class="ch-lead">${esc(text('A spiritual step taken at the right time can change the direction of your life.','सही समय पर उठाया गया आध्यात्मिक कदम जीवन की दिशा बदल सकता है।'))}</p><p>${esc(text(`${title} is observed on ${full}. It is dedicated to ${d[0]} and focuses on: ${d[2].toLowerCase()}. This calendar entry is not yet a confirmed temple event; the temple team will confirm the venue, ritual, packages and exact muhurat before bookings open.`,`${title} ${full} को मनाई जाती है। यह ${d[1]} को समर्पित है और इसका उद्देश्य है: ${d[3]}। यह कैलेंडर प्रविष्टि अभी पुष्ट मंदिर कार्यक्रम नहीं है; बुकिंग खुलने से पहले मंदिर टीम स्थान, विधि, पैकेज और मुहूर्त तय करेगी।`))}</p>`)
    +sec('cd-benefits',text('Puja benefits','पूजा के लाभ'),`<div class="ch-benefit-cards">${benefits.map(([h,b])=>`<article><span aria-hidden="true">${sevaIcon('shield')}</span><div><strong>${esc(h)}</strong><p>${esc(b)}</p></div></article>`).join('')}</div><p class="ch-hint">${esc(text('Benefits reflect traditional belief and are not a guaranteed outcome.','लाभ पारंपरिक मान्यता पर आधारित हैं, परिणाम की गारंटी नहीं।'))}</p>`)
    +sec('cd-process',text('Puja process','पूजा की विधि'),`<ol class="ch-process-grid ch-process-grid--2">${steps.map(([h,b])=>`<li><div><strong>${esc(h)}</strong><br>${esc(b)}</div></li>`).join('')}</ol>`)
    +sec('cd-packages',text('All puja packages include','सभी पैकेज में शामिल'),`<ul class="ch-includes">${includes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h3 class="ch-sub">${esc(text('Select your puja package','अपना पूजा पैकेज चुनें'))}</h3><div class="ch-package-preview">${packages.map(([n,s])=>`<article><strong>${esc(n)}</strong><small>${esc(s)}</small><b>${esc(text('Price after confirmation','पुष्टि के बाद मूल्य'))}</b></article>`).join('')}</div><p>${esc(text('No payment is collected for this calendar listing.','इस कैलेंडर प्रविष्टि के लिए कोई भुगतान नहीं लिया जाता।'))}</p>${btn(text('Back to pujas','पूजा सूची पर लौटें'),'close')}`)
    +reviewsSectionHtml()
    +sec('cd-faq',text('Frequently asked questions','अक्सर पूछे जाने वाले प्रश्न'),`<div class="ch-faq-list">${faqs.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`)
    +`</div>`,true);
    this.syncNotify(row.id);
    this.spySections();
  }
  // Highlights the section tab for whatever the reader is currently looking at.
  static spySections(){
    const body=this.modal?.querySelector('.shop-modal__body'),tabs=[...this.modal?.querySelectorAll('.ch-section-tabs a')||[]];
    if(!body||!tabs.length||!('IntersectionObserver' in window))return;
    const sections=tabs.map(a=>body.querySelector(a.getAttribute('href'))).filter(Boolean);
    const mark=id=>tabs.forEach(a=>a.classList.toggle('is-active',a.getAttribute('href')==='#'+id));
    // The active tab is the last section whose top has passed the sticky bar.
    const inline=this.modal.classList.contains('ch-inline-detail');
    const update=()=>{const line=inline?170:body.getBoundingClientRect().top+110;let current=sections[0];sections.forEach(s=>{if(s.getBoundingClientRect().top<=line)current=s;});const atEnd=inline?window.scrollY+innerHeight>=document.documentElement.scrollHeight-4:body.scrollTop+body.clientHeight>=body.scrollHeight-4;if(atEnd)current=sections[sections.length-1];if(current)mark(current.id);};
    let raf=0;this.spyCleanup?.();const scrollTarget=inline?window:body;const onScroll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update);};scrollTarget.addEventListener('scroll',onScroll,{passive:true});this.spyCleanup=()=>{scrollTarget.removeEventListener('scroll',onScroll);cancelAnimationFrame(raf);};update();
    tabs.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();body.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}));
  }
  // Shows whether the signed-in devotee already follows this calendar puja.
  static async syncNotify(calendarId){
    if(!isSignedIn())return;
    try{const d=await api(BASE+'/interest');this.paintNotify(calendarId,d.calendar_ids.includes(calendarId));}catch(_){}
  }
  static paintNotify(calendarId,following){
    const b=this.modal?.querySelector(`[data-ch-action="notify"][data-id="${calendarId}"]`);if(!b)return;
    b.dataset.following=following?'1':'';b.textContent=following?'✓ '+text('You will be notified · Undo','सूचना चालू है · बंद करें'):'🔔 '+text('Notify me when booking opens','बुकिंग खुलने पर सूचित करें');
  }
  static card(e){
    const puja=e.kind==='puja',tiers=e.offerings.filter(isTier),pool=puja?tiers:e.offerings,from=pool.length?Math.min(...pool.map(o=>o.price)):null;
    const tag=puja?text('Puja','पूजा'):(e.mode==='collective'?text('Collective seva','सामूहिक सेवा'):text('Individual seva','व्यक्तिगत सेवा'));
    const bullets=puja&&e.benefits?.length?`<ul class="ch-benefits">${e.benefits.slice(0,2).map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:'';
    const joined=e.joined>0?`<span class="ch-joined">👥 ${esc(text(`${e.joined} devotee${e.joined>1?'s':''} joined`,`${e.joined} भक्त जुड़े`))}</span>`:'';
    return `<article class="ch-event ch-event--${esc(e.kind)}"><div class="ch-event-media"><img src="${esc(mediaUrl(e.image_url||''))}" alt="${esc(e.temple.name)}" loading="lazy"><span class="ch-date"><b>${new Date(e.starts_at).toLocaleString('en-IN',{day:'numeric',timeZone:'Asia/Kolkata'})}</b>${esc(new Date(e.starts_at).toLocaleString(currentLang()==='hi'?'hi-IN':'en-IN',{month:'short',timeZone:'Asia/Kolkata'}))}</span><span class="ch-tag">${esc(tag)}</span></div><div class="ch-event-copy"><h3>${esc(e.title)}</h3><p>${esc(e.temple.name)} · ${esc(e.temple.city)}</p><p><strong>${esc(dt(e.starts_at))}</strong></p>${bullets}<small>${esc(text('Booking closes','बुकिंग बंद होगी'))}: ${esc(dt(e.deadline))} · <b class="ch-countdown">${esc(daysLeft(e.deadline))}</b></small>${joined}<p>${esc(text('Video within','वीडियो समय'))}: ${e.video_hours} ${esc(text('hours after seva','घंटे सेवा के बाद'))}</p><div class="ch-event-foot"><strong>${from==null?'':esc(text('From ','से '))+money(from)}</strong><button class="shop-btn shop-btn--gold" type="button" data-ch-action="event" data-id="${esc(e.id)}" ${e.bookable?'':'disabled'}>${esc(e.bookable?(puja?text('Participate','भाग लें'):text('Offer chadhava','चढ़ावा चढ़ाएं')):text('Booking closed','बुकिंग बंद'))}</button></div></div></article>`;
  }
  static shell(title,body,page=false){
    this.modal.classList.toggle('ch-modal--page',page);this.modal.classList.remove('ch-puja-detail','ch-package-open');
    if(!this.modal.classList.contains('is-open'))this.lastFocus=document.activeElement;
    this.modal.innerHTML=`<div class="shop-modal__panel shop-modal__panel--wide"><div class="shop-modal__head"><h2 id="ch-dialog-title">${esc(title)}</h2><button type="button" class="shop-modal__x" data-ch-action="close" aria-label="${esc(text('Close','बंद करें'))}">×</button></div><div class="shop-modal__body">${body}<p data-ch-message role="status"></p></div></div>`;
    const host=document.getElementById('view-mandir');
    const listing=host?.querySelector('.mandir-page');
    if(page&&host){
      host.append(this.modal);if(listing)listing.hidden=true;
      this.modal.classList.add('is-open','ch-inline-detail');
      this.modal.setAttribute('role','region');this.modal.removeAttribute('aria-modal');
      document.body.style.overflow='';window.scrollTo({top:0,behavior:'instant'});
    }else{
      document.body.append(this.modal);if(listing)listing.hidden=false;
      this.modal.classList.remove('ch-inline-detail');
      this.modal.setAttribute('role','dialog');this.modal.setAttribute('aria-modal','true');
      openModal(this.modal);
    }
    this.modal.querySelector('button,input,select')?.focus({preventScroll:true});
    bindSevaGalleries(this.modal);
  }
  static message(value){const p=this.modal.querySelector('[data-ch-message]');if(p)p.textContent=value;}
  // On a puja detail URL a language or sign-in change redraws the page; anywhere else it closes the dialog as before.
  static refreshOrClose(){const m=location.pathname.match(/^\/mandir-seva\/puja\/([\w-]+)\/?$/);if(m&&this.modal?.classList.contains('is-open'))this.calendarDetail(m[1]);else this.close();}
  // Back/forward onto the puja list: the detail overlay is closed without touching history.
  static closeRouted(){if(this.modal?.classList.contains('is-open')){this.routedClose=true;this.close();this.routedClose=false;}}
  static close(){if(!this.routedClose&&this.modal?.classList.contains('is-open')&&/^\/mandir-seva\/(?:puja\/[\w-]+|(?:puja|chadhava)\/event\/[\w-]+)\/?$/.test(location.pathname)){goTo(location.pathname.includes('/chadhava/')?'/mandir-seva/chadhava':'/mandir-seva/puja');return;}this.spyCleanup?.();this.checkoutOpen=false;this.modal?.classList.remove('ch-package-open');const listing=document.querySelector('#view-mandir > .mandir-page');if(listing)listing.hidden=false;if(this.videoBlob){URL.revokeObjectURL(this.videoBlob);this.videoBlob=null;}this.modal?.querySelector('video')?.pause();if(this.modal){closeModal(this.modal);this.modal.classList.remove('ch-inline-detail');document.body.append(this.modal);}if(this.lastFocus?.isConnected)this.lastFocus.focus();}
  static async openEvent(id){
    const requestedPath=location.pathname;
    if(!this.events?.some(e=>e.id===id))await this.load();
    if(location.pathname!==requestedPath)return;
    if(!this.events?.some(e=>e.id===id)){this.shell(text('Seva unavailable','सेवा उपलब्ध नहीं'),`<p>${esc(text('This event is no longer available. Please choose another seva.','यह कार्यक्रम उपलब्ध नहीं है। कृपया दूसरी सेवा चुनें।'))}</p><a class="shop-btn" href="/mandir-seva">${esc(text('Explore sevas','सेवाएं देखें'))}</a>`,true);return;}
    this.event(id);
  }
  static async openForTemple(temple){
    if(!this.modal) return;
    const d=await api(`${BASE}/events?temple_id=${encodeURIComponent(temple.id)}&lang=${currentLang()}`);
    const list=d.events.filter(e=>e.kind==='chadhava');
    this.events=[...(this.events||[]).filter(e=>e.temple_id!==temple.id),...d.events];
    this.gateway=d.razorpay_available;
    if(list.length===1&&list[0].bookable)return goTo('/mandir-seva/chadhava/event/'+encodeURIComponent(list[0].id));
    this.shell(temple.name,`<p>${esc(text('Choose a confirmed chadhava event at this temple.','इस मंदिर का चढ़ावा कार्यक्रम चुनें।'))}</p><div class="ch-events">${list.map(e=>this.card(e)).join('')||`<p>${esc(text('No scheduled chadhava event is open at this temple yet.','इस मंदिर में अभी कोई चढ़ावा कार्यक्रम बुकिंग के लिए उपलब्ध नहीं है।'))}</p>`}</div>`);
  }
  static async mountTemple(root,templeId){
    if(!root)return;
    try{
      const d=await api(`${BASE}/events?temple_id=${encodeURIComponent(templeId)}&lang=${currentLang()}`);
      if(!root.isConnected)return;
      this.events=[...(this.events||[]).filter(e=>e.temple_id!==templeId),...d.events];
      this.gateway=d.razorpay_available;
      root.innerHTML=`<h2>${esc(text('Upcoming chadhava events','आगामी चढ़ावा कार्यक्रम'))}</h2><div class="ch-events">${d.events.map(e=>this.card(e)).join('')||`<p>${esc(text('No scheduled chadhava bookings are open at this temple yet.','इस मंदिर में अभी कोई चढ़ावा बुकिंग खुली नहीं है।'))}</p>`}</div>`;
      root.addEventListener('click',e=>this.click(e));
    }catch(e){root.textContent=e.message;}
  }
  static offeringRow(o){
    const id=esc(o.id),bundle=!isItem(o);
    return `<div class="ch-item ch-offering-photo-row ${o.popular?'is-popular':''} ${bundle?'ch-item--bundle':''}" data-price="${o.price}"><span class="ch-item-copy"><strong>${esc(o.title)}</strong>${o.popular?`<em class="ch-badge">${esc(text('Most offered','सबसे ज़्यादा चढ़ाया'))}</em>`:''}<small>${esc(o.description)}</small></span><b class="ch-item-price">${money(o.price)}</b><div class="ch-item-buy"><img src="${esc(mediaUrl(offeringPhoto(o).src))}" alt="${esc(o.title)}" loading="lazy" width="112" height="96"><button type="button" class="ch-item-add" data-ch-action="add-offering" data-id="${id}" aria-label="${esc(text('Add','जोड़ें'))} ${esc(o.title)}">+ ${esc(text('Add','जोड़ें'))}</button><span class="ch-stepper"><button type="button" data-ch-action="dec" data-id="${id}" aria-label="${esc(text('Remove one','एक कम करें'))} ${esc(o.title)}">−</button><input type="number" name="qty-${id}" data-offering="${id}" min="0" max="99" value="0" inputmode="numeric" aria-label="${esc(o.title)} ${esc(text('quantity','मात्रा'))}"><button type="button" data-ch-action="inc" data-id="${id}" aria-label="${esc(text('Add one','एक और जोड़ें'))} ${esc(o.title)}">+</button></span></div></div>`;
  }
  static itemsBlock(e,intro){
    const items=e.offerings.filter(isItem),bundles=e.offerings.filter(o=>!isItem(o)&&!isTier(o));
    return `${intro?`<h3>${esc(intro)}</h3>`:''}${items.length?`<p class="ch-hint">${esc(text('Choose the offerings you wish to make. Each price is shown below, with no extras preselected.','अपनी इच्छा से चढ़ावा चुनें। हर वस्तु की कीमत नीचे है; कोई अतिरिक्त चढ़ावा पहले से नहीं चुना गया है।'))}</p><div class="ch-items">${items.map(o=>this.offeringRow(o)).join('')}</div>`:''}${bundles.length?`<h3 class="ch-sub">${esc(text('Special sevas','विशेष सेवाएं'))}</h3><div class="ch-items">${bundles.map(o=>this.offeringRow(o)).join('')}</div>`:''}`;
  }
  static offeringPhotoNote(){return `<p class="offering-photo-note">${esc(text('Offering photos are illustrative. Refer to each description for the included materials.','चढ़ावे के चित्र प्रतीकात्मक हैं। सेवा में शामिल सामग्री का विवरण देखें।'))}</p>`;}
  static event(id){
    const e=this.events.find(e=>e.id===id);if(!e)return;
    const puja=e.kind==='puja',tiers=e.offerings.filter(isTier);
    this.eventData=e;this.step=1;this.checkoutKey=null;this.pendingOrder=null;this.membersMax=1;
    this.selectionSteps=[1];
    if(puja&&e.offerings.some(isItem))this.selectionSteps.push(1.1);
    if(puja&&e.offerings.some(o=>!isItem(o)&&!isTier(o)))this.selectionSteps.push(1.2);
    this.checkoutSteps=[...this.selectionSteps,2,3];
    const info=`<div class="ch-event-info"><strong>${esc(puja?e.temple.name:e.title)}</strong><p>${esc(e.description)}</p>${puja&&e.benefits?.length?`<ul class="ch-benefits">${e.benefits.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}<p>${esc(dt(e.starts_at))} · <b class="ch-countdown">${esc(daysLeft(e.deadline))}</b>${e.joined>0?` · 👥 ${esc(text(`${e.joined} joined`,`${e.joined} भक्त जुड़े`))}`:''}</p><p>${esc(e.mode==='collective'?text('Collective: other devotees may participate in the same event.','सामूहिक: इसी कार्यक्रम में अन्य भक्त भी शामिल हो सकते हैं।'):text('Individual offering for your booking.','आपकी बुकिंग के लिए व्यक्तिगत चढ़ावा।'))}</p><p>${esc(text('Video delivery estimate','वीडियो मिलने का अनुमान'))}: ${e.video_hours} ${esc(text('hours after the scheduled seva','घंटे निर्धारित सेवा के बाद'))}</p></div>`;
    const step1=puja
      ?`<h3>${esc(text('Choose your puja package','अपना पूजा पैकेज चुनें'))}</h3><div class="ch-tiers">${tiers.map((t,i)=>`<label class="ch-tier"><input type="radio" name="tier" value="${esc(t.id)}" data-price="${t.price}" ${i===0?'checked':''}><span><strong>${esc(t.title)}</strong><small>${esc(t.description)}</small><small class="ch-package-members">${esc(text(`Up to ${t.max_members||1} participant(s)`,`\u0905\u0927\u093f\u0915\u0924\u092e ${t.max_members||1} \u0938\u0926\u0938\u094d\u092f`))}</small></span><b>${money(t.price)}</b><img class="ch-package-photo" src="${esc(mediaUrl(e.image_url||''))}" alt="" loading="lazy"></label>`).join('')}</div>`
      :this.itemsBlock(e,text('Select offerings and quantities','चढ़ावा और मात्रा चुनें'));
    const step2=`<h3>${esc((puja?text('Who is this puja for?','पूजा सेवा'):text('Who is this offering for?','चढ़ावा किसके नाम से है?')))}</h3><div class="ch-fields"><label>${esc(text('Devotee name','भक्त का नाम'))}<input name="devotee_name" minlength="2" maxlength="100" required autocomplete="name"></label><label>${esc(text('Phone number','फोन नंबर'))}<input name="phone" type="tel" minlength="7" maxlength="20" pattern="[+0-9 ]+" required autocomplete="tel"></label><label>${esc(text('Gotra','गोत्र'))}<input name="gotra" maxlength="100" required></label>${e.unknown_gotra_allowed?`<label class="ch-check"><input name="gotra_unknown" type="checkbox">${esc(text('I do not know my gotra (accepted by this temple)','मुझे अपना गोत्र नहीं पता (इस मंदिर में स्वीकार्य)'))}</label>`:''}${puja?'<div data-participants></div>':`<label>${esc(text('Family members (optional)','परिवार के सदस्य (वैकल्पिक)'))}<textarea name="family_members" maxlength="500" rows="2"></textarea></label>`}<label>${esc(text('Sankalp / purpose (optional)','संकल्प / उद्देश्य (वैकल्पिक)'))}<textarea name="purpose" maxlength="255" rows="2"></textarea></label></div>`;
    const hero=`<nav class="pp-crumbs" aria-label="Breadcrumb"><a href="/mandir-seva">${esc(text('Mandir Seva','मंदिर सेवा'))}</a> / <a href="/mandir-seva/${puja?'puja':'chadhava'}">${esc(puja?text('Puja','पूजा'):text('Chadhava','चढ़ावा'))}</a> / <span aria-current="page">${esc(e.title)}</span></nav><div class="ch-bookings-bar">${btn(text('My bookings & videos','मेरी बुकिंग और वीडियो'),'orders')}</div><div class="ch-detail-hero">${sevaGallery(e.temple_slug,e.image_url,e.temple.name)}<div class="ch-detail-summary"><span class="ch-eyebrow">${esc(puja?text('TEMPLE PUJA','मंदिर पूजा'):text('CHADHAVA SEVA','चढ़ावा सेवा'))}</span><h1>${esc(e.title)}</h1><p>${esc(e.temple.name)} · ${esc(e.temple.city)}</p><p>${esc(dt(e.starts_at))}</p><span class="ch-tag">${esc(daysLeft(e.deadline))}</span><p>${esc(text('Video delivery estimate','वीडियो मिलने का अनुमान'))}: ${e.video_hours} ${esc(text('hours after seva','घंटे सेवा के बाद'))}</p>${puja?btn(text('Select puja package','पूजा पैकेज चुनें'),'packages'):btn(text('Choose an offering','चढ़ावा चुनें'),'selection')}</div></div>`;
    this.shell(puja?e.title:e.temple.name,`${hero}${this.detailOverview(e)}${this.richDetails(e)}${info}<form data-ch-form="checkout" novalidate ${puja?'role="dialog" aria-modal="true" aria-label="Puja package and checkout"':''}>${puja?btn(text('Back to puja details','\u092a\u0942\u091c\u093e \u0915\u0940 \u091c\u093e\u0928\u0915\u093e\u0930\u0940'),'packages-close'):''}${this.progressMarkup(puja)}<section data-step="1" id="ch-selection">${step1}${this.offeringPhotoNote()}${this.detailFaq(e)}</section>${this.suggestionMarkup(e)}<section data-step="2" hidden>${step2}</section><section data-step="3" hidden><div data-ch-review></div><fieldset><legend>${esc(text('Payment method','भुगतान का तरीका'))}</legend><label class="ch-check"><input type="radio" name="payment_method" value="wallet" checked>${esc(text('Account wallet','खाते का वॉलेट'))}</label><label class="ch-check"><input type="radio" name="payment_method" value="razorpay" ${this.gateway?'':'disabled'}>${esc(text('UPI / card / netbanking','UPI / कार्ड / नेटबैंकिंग'))}${this.gateway?'':` — ${esc(text('currently unavailable','अभी उपलब्ध नहीं'))}`}</label></fieldset>${btn(text('Recharge wallet','वॉलेट रिचार्ज करें'),'wallet')}</section><div class="ch-cart" data-ch-cart><span data-ch-count></span><strong data-ch-total></strong></div><div class="ch-form-actions">${btn(text('Back','पीछे'),'back','hidden')}${btn(text('Skip this step','\u092f\u0939 \u091a\u0930\u0923 \u091b\u094b\u095c\u0947\u0902'),'skip','hidden')}<button class="shop-btn shop-btn--gold" type="submit" data-ch-submit>${esc(text('Continue','आगे बढ़ें'))}</button></div></form>`,true);
    this.modal.classList.toggle('ch-puja-detail',puja);this.checkoutOpen=!puja;
    this.showStep();this.updateCart();
  }
  static progressMarkup(puja){
    const labels={1:puja?text('Package','पैकेज'):text('Offerings','चढ़ावा'),1.1:text('Offerings','चढ़ावा'),1.2:text('Additional seva','अतिरिक्त सेवा'),2:text('Your details','आपकी जानकारी'),3:text('Review & pay','समीक्षा और भुगतान')};
    return `<ol class="ch-progress">${this.checkoutSteps.map((step,i)=>`<li data-step-label="${step}"><span>${i+1}.</span> ${esc(labels[step])}</li>`).join('')}</ol>`;
  }
  static suggestionMarkup(e){
    if(e.kind!=='puja')return '';
    return this.selectionSteps.filter(step=>step!==1).map(step=>{
      const offerings=e.offerings.filter(o=>step===1.1?isItem(o):!isItem(o)&&!isTier(o));
      return `<section data-step="${step}" class="ch-suggestions" hidden><span class="ch-eyebrow">${esc(text('OPTIONAL · YOUR CHOICE','वैकल्पिक · आपकी इच्छा'))}</span><h3>${esc(step===1.1?text('Add an offering to your puja','अपनी पूजा में चढ़ावा जोड़ें'):text('Would you like to include an additional seva?','क्या आप अतिरिक्त सेवा जोड़ना चाहेंगे?'))}</h3><p class="ch-hint">${esc(text('These are available for this temple event. Add only what you wish; your puja package is complete without these extras. You can skip this step.','ये सेवाएं इस मंदिर के कार्यक्रम में उपलब्ध हैं। केवल अपनी इच्छा से जोड़ें; आपका पूजा पैकेज इनके बिना भी पूरा है। आप यह चरण छोड़ सकते हैं।'))}</p><div class="ch-selected-package" data-ch-package-summary></div><div class="ch-items">${offerings.map(o=>this.offeringRow(o)).join('')}</div>${this.offeringPhotoNote()}</section>`;
    }).join('');
  }
  static async skipSuggestions(){
    if(![1.1,1.2].includes(this.step))return;
    const section=this.modal.querySelector(`[data-step="${this.step}"]`);
    section.querySelectorAll('[data-offering]').forEach(input=>input.value='0');
    this.updateCart();
    const form=this.modal.querySelector('[data-ch-form]');
    await this.submit({target:form,preventDefault(){}});
  }
  static richDetails(e){
    const puja=e.kind==='puja';
    const stages=puja?[text('Choose your package','अपना पैकेज चुनें'),text('Optional offerings & seva','वैकल्पिक चढ़ावा और सेवा'),text('Name & gotra sankalp details','नाम और गोत्र की जानकारी'),text('Review and secure payment','समीक्षा और भुगतान'),text('Temple team performs the ritual','मंदिर की टीम पूजा करेगी'),text('Track your booking & watch video','बुकिंग और वीडियो देखें')]:[text('Choose offerings','चढ़ावा चुनें'),text('Add your name & gotra','नाम और गोत्र भरें'),text('Review and pay','समीक्षा और भुगतान'),text('Track seva and video','सेवा और वीडियो देखें')];
    return `<div class="ch-rich-details"><nav class="ch-section-tabs" aria-label="${esc(text('Explore this seva','सेवा की जानकारी'))}"><a href="#ch-about">${esc(text('About','परिचय'))}</a><a href="#ch-temple">${esc(text('Temple details','मंदिर'))}</a><a href="#ch-benefits">${esc(text('Highlights','विशेषताएं'))}</a><a href="#ch-process">${esc(text('Process','प्रक्रिया'))}</a>${puja?btn(text('Packages','पैकेज'),'packages'):btn(text('Offerings','चढ़ावा'),'selection')}</nav><section id="ch-temple"><h2>${esc(e.temple.name)}</h2><div class="ch-temple-overview">${sevaGallery(e.temple_slug,e.image_url,e.temple.name)}<div><p>${esc(e.temple.description||e.description)}</p><p>${esc(e.temple.city)}${e.temple.state?', '+esc(e.temple.state):''}</p></div></div></section><section id="ch-benefits"><h2>${esc(text('Seva highlights','सेवा की विशेषताएं'))}</h2><div class="ch-highlight-grid">${(e.benefits?.length?e.benefits:[text('Sankalp in your name and gotra','आपके नाम और गोत्र से संकल्प'),text('Scheduled temple seva','निर्धारित मंदिर सेवा'),text('Video available in your bookings','मेरी बुकिंग में वीडियो')]).map((benefit,i)=>`<article><span>${i+1}</span><p>${esc(benefit)}</p></article>`).join('')}</div></section><section id="ch-process"><h2>${esc(text('How your seva works','सेवा की प्रक्रिया'))}</h2><ol class="ch-process-grid">${stages.map(stage=>`<li>${esc(stage)}</li>`).join('')}</ol></section><section><h2>${esc(text('Puja & ritual photos','पूजा और अनुष्ठान की तस्वीरें'))}</h2><p class="ch-hint">${esc(text('Illustrative ritual photographs; these are not recordings of your booked ceremony.','प्रतीकात्मक अनुष्ठान फोटो; ये आपकी बुक की गई पूजा के रिकॉर्ड नहीं हैं।'))}</p>${sevaGallery(this.ritualKey(e),e.image_url,text('Ritual gallery','अनुष्ठान गैलरी'),true)}</section></div>`;
  }
  static ritualKey(e){
    const deity=String(e.temple?.deity||e.title||'').toLowerCase();
    return 'ritual-'+(/ganesh|गणेश/.test(deity)?'ganesh':/hanuman|हनुमान/.test(deity)?'hanuman':/shani|शनि/.test(deity)?'shani':/lakshmi|durga|kali|devi|लक्ष्मी|देवी/.test(deity)?'devi':/vishnu|krishna|ram|विष्णु|कृष्ण|राम/.test(deity)?'vishnu':/surya|सूर्य/.test(deity)?'surya':'shiva');
  }
  static detailOverview(e){
    const puja=e.kind==='puja';
    const features=[text('Name & gotra sankalp','नाम और गोत्र से संकल्प'),text('Performed by the temple team','मंदिर की टीम द्वारा सेवा'),text('Private seva video','सेवा का निजी वीडियो')];
    return `<div class="ch-detail-intro"><span class="ch-eyebrow">${esc(puja?text('PUJA SEVA','पूजा सेवा'):text('CHADHAVA SEVA','चढ़ावा सेवा'))}</span><h3>${esc(e.title)}</h3><p>${esc(e.temple.name)} &middot; ${esc(e.temple.city||'')}</p><div class="ch-assurances">${features.map((x,i)=>`<span><b aria-hidden="true">${['01','02','03'][i]}</b>${esc(x)}</span>`).join('')}</div><nav class="ch-detail-nav" aria-label="${esc(text('Seva details','सेवा की जानकारी'))}"><a href="#ch-about">${esc(text('About seva','सेवा के बारे में'))}</a>${btn(puja?text('View packages','पैकेज देखें'):text('Choose offerings','चढ़ावा चुनें'),puja?'packages':'selection')}<a href="#ch-faq">${esc(text('FAQs','सवाल-जवाब'))}</a></nav><section id="ch-about"><h3>${esc(puja?text('A puja for you and your family','आपके और परिवार के लिए पूजा'):text('Your offering, at the temple','आपका चढ़ावा, मंदिर में'))}</h3><p>${esc(puja?text('Explore the scheduled ritual, choose a package for your participants and add optional offerings. Your names and gotra are collected before payment for the sankalp.','निर्धारित पूजा देखें, सदस्यों के लिए पैकेज चुनें और वैकल्पिक चढ़ावा जोड़ें। संकल्प के लिए नाम और गोत्र भुगतान से पहले लिए जाएंगे।'):text('Choose the offerings you wish to make and set their quantities. The temple team performs the scheduled seva on your behalf; follow its progress and video in My bookings.','अपना चढ़ावा और मात्रा चुनें। मंदिर की टीम आपके नाम से निर्धारित सेवा करेगी। मेरी बुकिंग में स्थिति और वीडियो देखें।'))}</p></section></div>`;
  }
  static detailFaq(e){
    return `<section class="ch-faq" id="ch-faq"><h3>${esc(text('Before you book','बुकिंग से पहले'))}</h3><details><summary>${esc(text('When will I receive the video?','वीडियो कब मिलेगा?'))}</summary><p>${esc(text('The estimated delivery is','वीडियो मिलने का अनुमान'))} ${e.video_hours} ${esc(text('hours after the scheduled seva. View it in My bookings once the temple team uploads it.','घंटे निर्धारित सेवा के बाद है। टीम द्वारा अपलोड किए जाने पर मेरी बुकिंग में देखें।'))}</p></details><details><summary>${esc(text('Is prasad delivered to my home?','क्या प्रसाद घर आएगा?'))}</summary><p>${esc(text('Home delivery of prasad or a blessing box is not included in this event.','इस कार्यक्रम में प्रसाद या आशीर्वाद बॉक्स की होम डिलीवरी शामिल नहीं है।'))}</p></details><details><summary>${esc(text('Can I cancel my booking?','क्या बुकिंग रद्द कर सकते हैं?'))}</summary><p>${esc(text('Full refund before','पूर्ण रिफंड की अंतिम तारीख'))} ${esc(dt(e.cancellation_deadline))} ${esc(text('while the seva is unscheduled. After scheduling, contact support.','जब तक सेवा निर्धारित न हुई हो। उसके बाद सहायता टीम से संपर्क करें।'))}</p></details></section>`;
  }
  static updateCart(){
    const f=this.modal?.querySelector('[data-ch-form="checkout"]');if(!f)return;
    let total=0,count=0;
    f.querySelectorAll('.ch-item').forEach(row=>{const q=+row.querySelector('[data-offering]').value||0;total+=q*+row.dataset.price;count+=q;row.classList.toggle('is-selected',q>0);});
    const tier=f.querySelector('[name="tier"]:checked');if(tier)total+=+tier.dataset.price;
    const selected=this.eventData.offerings.find(o=>o.id===tier?.value);
    f.querySelectorAll('[data-ch-package-summary]').forEach(el=>el.textContent=selected?`${text('Your package','आपका पैकेज')}: ${selected.title} · ${money(selected.price)}`:'');
    f.querySelector('[data-ch-count]').textContent=count?text(`${count} item${count>1?'s':''} selected`,`${count} वस्तुएं चुनी`):(tier?text('Package selected','पैकेज चुना गया'):text('Nothing selected yet','अभी कुछ नहीं चुना'));
    f.querySelector('[data-ch-total]').textContent=total?money(total):'';
  }
  static bump(id,delta){
    const input=this.modal.querySelector(`[data-offering="${CSS.escape(id)}"]`);if(!input)return;
    input.value=Math.max(0,Math.min(99,(+input.value||0)+delta));this.updateCart();
  }
  static participants(){
    const box=this.modal.querySelector('[data-participants]');if(!box)return;
    const saved=Object.fromEntries([...box.querySelectorAll('input')].map(input=>[input.name,input.value]));
    const extra=Math.max(0,this.membersMax-1);
    box.innerHTML=extra?`<h4>${esc(text(`Other devotees in this package (up to ${extra})`,`इस पैकेज के अन्य भक्त (अधिकतम ${extra})`))}</h4>${Array.from({length:extra},(_,i)=>`<div class="ch-participant"><label>${esc(text('Name','नाम'))} ${i+2}<input name="pname-${i}" maxlength="80"></label><label>${esc(text('Gotra','गोत्र'))}<input name="pgotra-${i}" maxlength="60"></label></div>`).join('')}`:'';
    box.querySelectorAll('input').forEach(input=>input.value=saved[input.name]||'');
  }
  static familyMembers(f){
    if(this.eventData?.kind!=='puja')return f.elements.family_members?.value.trim()||'';
    const lines=[];
    for(let i=0;i<Math.max(0,this.membersMax-1);i++){
      const name=f.elements['pname-'+i]?.value.trim(),gotra=f.elements['pgotra-'+i]?.value.trim();
      if(name)lines.push(gotra?`${name} (${gotra})`:name);
    }
    return lines.join('\n');
  }
  static showStep(){
    const puja=this.eventData?.kind==='puja';
    this.modal.querySelectorAll('[data-step]').forEach(e=>e.hidden=+e.dataset.step!==this.step);
    this.modal.querySelectorAll('[data-step-label]').forEach(e=>e.setAttribute('aria-current',+e.dataset.stepLabel===this.step?'step':'false'));
    this.modal.querySelector('[data-ch-action="back"]').hidden=this.step===1;
    const optional=[1.1,1.2].includes(this.step);
    this.modal.querySelector('[data-ch-action="skip"]').hidden=!optional;
    this.modal.querySelector('[data-ch-cart]').hidden=false;
    this.modal.querySelector('[data-ch-submit]').textContent=this.step===3?(puja?text('Pay & book puja','भुगतान करके पूजा बुक करें'):text('Pay & confirm chadhava','भुगतान करके चढ़ावा बुक करें')):text('Continue','आगे बढ़ें');
    if(optional)this.modal.querySelector('[data-ch-submit]').textContent=text('Keep selections & continue','चयन रखें और आगे बढ़ें');
    if(this.step===3&&this.quote)this.modal.querySelector('[data-ch-total]').textContent=money(this.quote.amount_paise/100);
    this.modal.querySelectorAll('[data-step-label]').forEach(el=>el.classList.toggle('is-complete',this.checkoutSteps.indexOf(+el.dataset.stepLabel)<this.checkoutSteps.indexOf(this.step)));
    this.modal.querySelectorAll('.ch-detail-intro,.ch-page-hero,.ch-event-info').forEach(el=>el.hidden=this.step!==1);
    this.modal.querySelectorAll('.ch-detail-hero,.ch-rich-details').forEach(el=>el.hidden=this.step!==1);
    this.modal.querySelectorAll('.ch-section-tabs a').forEach(a=>a.onclick=event=>{event.preventDefault();this.modal.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'start'});});
    const checkout=this.modal.querySelector('[data-ch-form]');
    checkout.hidden=puja&&!this.checkoutOpen;
    this.modal.classList.toggle('ch-package-open',!!(puja&&this.checkoutOpen));
    const body=this.modal.querySelector('.shop-modal__body');
    const message=this.modal.querySelector('[data-ch-message]');
    if(this.modal.classList.contains('ch-inline-detail'))document.body.style.overflow=puja&&this.checkoutOpen?'hidden':'';
    if(puja&&this.checkoutOpen&&message&&!checkout.contains(message))checkout.append(message);
    const head=this.modal.querySelector('.shop-modal__head');if(head)head.inert=!!(puja&&this.checkoutOpen);
    [...body.children].forEach(child=>{child.inert=!!(puja&&this.checkoutOpen&&child!==checkout&& !child.hasAttribute('data-ch-message'));});
    this.modal.querySelector('.shop-modal__body').scrollTop=0;
    this.message('');
  }
  static async submit(event){
    const f=event.target;if(f.dataset.chForm!=='checkout')return;
    event.preventDefault();if(this.submitting)return;this.submitting=true;const button=f.querySelector('[data-ch-submit]');button.disabled=true;
    try{
      if(this.selectionSteps.includes(this.step)){
        const inputs=[...f.querySelectorAll('[data-offering]')];
        if(inputs.some(i=>!i.checkValidity()))throw new Error(text('Use whole quantities from 0 to 99.','मात्रा 0 से 99 के बीच रखें।'));
        this.items=inputs.filter(i=>+i.value>0).map(i=>({offering_id:i.dataset.offering,quantity:+i.value}));
        const tier=f.querySelector('[name="tier"]:checked');
        if(tier)this.items.unshift({offering_id:tier.value,quantity:1});
        if(!this.items.length)throw new Error(this.eventData.kind==='puja'?text('Choose a puja package.','पूजा पैकेज चुनें।'):text('Select at least one offering.','कम से कम एक चढ़ावा चुनें।'));
        this.quote=await send('/quote?lang='+currentLang(),{event_id:this.eventData.id,items:this.items});
        const next=this.checkoutSteps[this.checkoutSteps.indexOf(this.step)+1];
        if(next===2){if(!requireLogin('auth.neededBooking'))return;this.membersMax=this.quote.members_max||1;this.participants();}
        this.step=next;
      }else if(this.step===2){
        for(const input of f.querySelectorAll('[data-step="2"] input,[data-step="2"] textarea')){if(!input.disabled&&!input.reportValidity())return;}
        this.participant={devotee_name:f.elements.devotee_name.value.trim(),phone:f.elements.phone.value.trim(),gotra:f.elements.gotra.value.trim(),gotra_unknown:!!f.elements.gotra_unknown?.checked,family_members:this.familyMembers(f),purpose:f.elements.purpose.value.trim()};
        this.quote=await send('/quote?lang='+currentLang(),{event_id:this.eventData.id,items:this.items});
        this.checkoutKey=crypto.randomUUID();
        const puja=this.eventData.kind==='puja';
        this.modal.querySelector('[data-ch-review]').innerHTML=`<h3>${esc(puja?text('Review your puja','अपनी पूजा की समीक्षा करें'):text('Review your chadhava','अपने चढ़ावे की समीक्षा करें'))}</h3><p>${esc(this.participant.devotee_name)} · ${esc(this.participant.gotra_unknown?text('Unknown gotra accepted','अज्ञात गोत्र स्वीकार्य'):this.participant.gotra)}</p><p>${esc(this.participant.family_members).replace(/\n/g,'<br>')}</p>${lineItems(this.quote.items)}<p class="ch-total">${esc(text('Total','कुल'))}<strong>${money(this.quote.amount_paise/100)}</strong></p><p>${esc(text('Cancellation: full refund before','रद्द करना: पूर्ण रिफंड की अंतिम तारीख'))} ${esc(dt(this.eventData.cancellation_deadline))} ${esc(text('while the seva is unscheduled. After scheduling, contact support.','जब तक सेवा निर्धारित नहीं हुई है। निर्धारित होने पर सहायता टीम से संपर्क करें।'))}</p><p>${esc(text('Prasad delivery is not included in this event.','इस कार्यक्रम में प्रसाद डिलीवरी शामिल नहीं है।'))}</p>`;
        this.step=3;
      }else{
        const method=f.elements.payment_method.value;
        const order=await send('/orders?lang='+currentLang(),{...this.participant,event_id:this.eventData.id,items:this.items,payment_method:method,idempotency_key:this.checkoutKey,expected_amount_paise:this.quote.amount_paise});
        if(order.payment_status==='PAID'){this.showOrder(order);this.refresh();return;}
        if(order.payment_status!=='PENDING')throw new Error(text('This checkout has ended. Start a new booking.','यह चेकआउट समाप्त हो गया है। नई बुकिंग शुरू करें।'));
        await this.pay(order);return;
      }
      this.showStep();
    }catch(e){this.message(e.message);}
    finally{this.submitting=false;if(button.isConnected)button.disabled=false;}
  }
  static async pay(order){
    const generation=this.authGeneration||0;
    if(!window.Razorpay){
      await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=resolve;script.onerror=()=>reject(new Error('Payment checkout could not load'));document.head.append(script);});
    }
    const checkout=new window.Razorpay({key:order.razorpay_key_id,order_id:order.provider_order_id,amount:order.amount_paise,currency:'INR',name:'Astro Jyotish',description:order.snapshot.title,
      prefill:{name:order.snapshot.devotee_name,contact:order.snapshot.phone},
      handler:async result=>{try{const confirmed=await send(`/orders/${order.id}/verify`,result);if(generation!==(this.authGeneration||0))return;this.showOrder(confirmed);this.refresh();}catch(e){this.message(e.message+' '+text('Your booking will update after server verification. Open My chadhava to check.','सर्वर सत्यापन के बाद बुकिंग अपडेट होगी। मेरे चढ़ावे में देखें।'));}},
      modal:{ondismiss:()=>{if(generation!==(this.authGeneration||0))return;this.showOrder(order);this.message(text('Payment was not confirmed. You can retry while the reservation is valid.','भुगतान की पुष्टि नहीं हुई। आरक्षण के दौरान फिर कोशिश कर सकते हैं।'));}}});
    checkout.open();
  }
  static journey(o){
    const stages=['CONFIRMED','SCHEDULED','PERFORMED','VIDEO_AVAILABLE','COMPLETED'];const rank=stages.indexOf(o.service_status);
    return `<ol class="ch-journey">${stages.map((s,i)=>`<li class="${i<=rank?'is-done':''}" ${i===rank?'aria-current="step"':''}><span>${i<rank?'✓':i+1}</span>${esc(status(s))}</li>`).join('')}</ol>`;
  }
  static orderCard(o){
    const s=o.snapshot;
    return `<article class="ch-order"><div class="ch-order-head"><strong>${esc(o.booking_number||o.id)}</strong><span class="ch-tag">${esc(status(o.payment_status))}</span></div><h3>${esc(s.title)}</h3><p>${esc(s.temple_name)} · ${esc(dt(s.starts_at))}</p><p>${esc(s.devotee_name)} · ${esc(s.gotra)}</p>${lineItems(s.items)}<p class="ch-total">${esc(text('Amount','राशि'))}<strong>${money(o.amount_paise/100)}</strong></p><p>${esc(text('Seva status','सेवा की स्थिति'))}: <strong>${esc(status(o.service_status))}</strong></p>${this.journey(o)}<p>${esc(text('Video expected by','वीडियो मिलने का अनुमान'))}: ${esc(dt(o.video_due_at))}</p><div class="ch-form-actions">${['PAID','REFUND_PENDING','REFUNDED'].includes(o.payment_status)?btn(text('Payment receipt','भुगतान रसीद'),'receipt',`data-id="${esc(o.id)}"`):''}${btn(text('View tracking','स्थिति देखें'),'order',`data-id="${esc(o.id)}"`)}${o.payment_status==='PENDING'?btn(text('Retry payment','भुगतान फिर करें'),'pay',`data-id="${esc(o.id)}"`):''}${o.can_cancel?btn(text('Cancel & refund','रद्द करें और रिफंड लें'),'cancel',`data-id="${esc(o.id)}"`):''}${['VIDEO_AVAILABLE','COMPLETED'].includes(o.service_status)?btn(text('Watch seva video','सेवा का वीडियो देखें'),'video',`data-id="${esc(o.id)}"`):''}</div>${o.payment_status==='REFUND_PENDING'?`<p>${esc(text('Refund is being processed. The payment status will update after provider confirmation.','रिफंड प्रक्रिया में है। भुगतान प्रदाता की पुष्टि के बाद स्थिति अपडेट होगी।'))}</p>`:''}</article>`;
  }
  static showOrder(o){this.shell(o.snapshot.kind==='puja'?text('Your puja booking','आपकी पूजा बुकिंग'):text('Your chadhava booking','आपकी चढ़ावा बुकिंग'),this.orderCard(o)+`<div data-ch-timeline></div>`);this.loadTimeline(o.id);}
  static async loadTimeline(id){try{const d=await api(`${BASE}/orders/${id}/timeline`);const el=this.modal.querySelector('[data-ch-timeline]');if(el)el.innerHTML=`<h3>${esc(text('Booking updates','बुकिंग अपडेट'))}</h3>${d.events.map(e=>`<p><strong>${esc(status(e.status))}</strong> · ${esc(dt(e.time))}<br>${esc(e.note)}</p>`).join('')}`;}catch(e){this.message(e.message);}}
  static async orders(){if(!requireLogin('auth.neededBookings'))return;const generation=this.authGeneration||0;try{const d=await api(BASE+'/orders');if(generation!==(this.authGeneration||0))return;this.shell(text('My pujas, chadhava & videos','मेरे चढ़ावे और वीडियो'),(d.orders.map(o=>this.orderCard(o)).join('')||`<p>${esc(text('No seva bookings yet.','अभी कोई चढ़ावा बुकिंग नहीं है।'))}</p>`)+btn(text('Previous seva bookings','पुरानी सेवा बुकिंग'),'legacy'));}catch(e){this.shell(text('My chadhava','मेरे चढ़ावे'),`<p>${esc(e.message)}</p>`);}}
  static refresh(){window.App?.refreshWalletUI?.();window.NotificationBell?.refresh?.();this.load();}
  static async click(event){
    const b=event.target.closest('[data-ch-action]');if(!b)return;
    const a=b.dataset.chAction;const id=b.dataset.id;const generation=this.authGeneration||0;b.disabled=true;
    try{
      if(a==='close')this.close();
      else if(a==='reload')await this.load();
      else if(a==='catalogue-filter'){this.catalogueLimit=18;this.hub(this.access||{});}
      else if(a==='catalogue-clear'){this.pujaFilters={deity:'all',month:'all',type:'all',when:'all',q:''};this.catalogueLimit=18;this.hub(this.access||{});}
      else if(a==='catalogue-more'){this.catalogueLimit=(this.catalogueLimit||18)+18;this.hub(this.access||{});}
      else if(a==='notify'){
        if(!requireLogin('auth.neededBooking'))return;
        if(b.dataset.following){await api(BASE+'/interest/'+encodeURIComponent(id),{method:'DELETE'});this.paintNotify(id,false);this.message(text('Notification turned off.','सूचना बंद कर दी गई।'));}
        else{await postJson(BASE+'/interest',{calendar_id:id,date:b.dataset.date,title:b.dataset.title});this.paintNotify(id,true);this.message(text('Done. We will add a notification as soon as booking opens for this puja.','हो गया। इस पूजा की बुकिंग खुलते ही हम आपको सूचना देंगे।'));}
      }
      else if(a==='calendar-detail')goTo('/mandir-seva/puja/'+encodeURIComponent(id));
      else if(a==='event'){const e=this.events.find(e=>e.id===id);if(e)goTo('/mandir-seva/'+e.kind+'/event/'+encodeURIComponent(id));}
      else if(a==='packages'){this.checkoutOpen=true;this.showStep();this.modal.querySelector('[name="tier"]')?.focus();}
      else if(a==='packages-close'){this.checkoutOpen=false;this.step=1;this.showStep();this.modal.querySelector('[data-ch-action="packages"]')?.focus();}
      else if(a==='selection'){this.modal.querySelector('#ch-selection')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});this.modal.querySelector('#ch-selection input')?.focus({preventScroll:true});}
      else if(a==='tab'){this.tab=b.dataset.kind;this.hub(this.access||{});}
      else if(a==='inc'||a==='add-offering')this.bump(id,1);
      else if(a==='dec')this.bump(id,-1);
      else if(a==='back'){this.step=this.checkoutSteps[Math.max(0,this.checkoutSteps.indexOf(this.step)-1)];this.showStep();}
      else if(a==='skip'){await this.skipSuggestions();}
      else if(a==='wallet')window.App?.openWalletModal();
      else if(a==='orders')await this.orders();
      else if(a==='legacy'){this.close();window.MandirSevaPageComponent?.openMyBookings();}
      else if(a==='order'){const order=await api(BASE+'/orders/'+id);if(generation===(this.authGeneration||0))this.showOrder(order);}
      else if(a==='receipt')await downloadFile(BASE+'/orders/'+id+'/receipt',`chadhava-${id}-receipt.json`);
      else if(a==='pay')await this.pay(await api(BASE+'/orders/'+id));
      else if(a==='cancel'){if(!confirm(text('Cancel this seva and request the applicable refund?','सेवा रद्द करके रिफंड का अनुरोध करें?')))return;const o=await send(`/orders/${id}/cancel`,{});this.showOrder(o);this.refresh();}
      else if(a==='video'){
        const response=await fetch(backendOrigin()+BASE+`/orders/${id}/video`);if(!response.ok)throw new Error(text('Video is not available.','वीडियो उपलब्ध नहीं है।'));
        const blob=await response.blob();if(generation!==(this.authGeneration||0))return;
        if(this.videoBlob)URL.revokeObjectURL(this.videoBlob);this.videoBlob=URL.createObjectURL(blob);
        this.shell(text('Your seva video','आपकी सेवा का वीडियो'),`<video class="shop-video" src="${this.videoBlob}" controls playsinline></video><p>${esc(text('Private video for this booking.','इस बुकिंग का निजी वीडियो।'))}</p>`);
      }else if(a==='staff')await this.staff();
    }catch(e){this.message(e.message);if(!this.modal.classList.contains('is-open'))this.shell(text('Chadhava','चढ़ावा'),`<p>${esc(e.message)}</p>`);}
    finally{if(b.isConnected)b.disabled=false;}
  }
  static async staff(){
    const {ChadhavaOperations}=await import('./ChadhavaOperations.js');await ChadhavaOperations.open(this);
  }
}
window.ChadhavaExperience=ChadhavaExperience;
