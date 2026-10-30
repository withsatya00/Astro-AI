// Exercise the actual checkout controller with a DOM and a deterministic quote API.
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {document,window}=parseHTML('<html><body></body></html>');
const offerings=[
  {id:'single',category:'puja_tier',title:'Single',description:'One person',price:501,max_members:1},
  {id:'family',category:'puja_tier',title:'Family',description:'Four people',price:901,max_members:4},
  {id:'flowers',category:'item',title:'Flowers',description:'Temple flowers',price:5},
  {id:'seva',category:'bundle',title:'Additional seva',description:'Temple seva',price:101}
];
let loggedIn=true,requests=0;
const context={document,window,console,Date,crypto:require('node:crypto').webcrypto,
  sevaGallery:()=>'<div class="seva-gallery"></div>',bindSevaGalleries:()=>{},
  currentLang:()=> 'en',esc:v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
  money:n=>'INR '+n,mediaUrl:v=>v,requireLogin:()=>loggedIn,
  api:async(url,options)=>{
    assert.ok(url.includes('/quote'));requests++;
    const payload=JSON.parse(options.body),tier=payload.items.find(i=>i.offering_id==='single'||i.offering_id==='family');
    assert.ok(tier,'a package remains required');
    return {members_max:tier.offering_id==='family'?4:1,amount_paise:payload.items.reduce((n,i)=>n+offerings.find(o=>o.id===i.offering_id).price*i.quantity*100,0),items:payload.items.map(i=>({...i,title:i.offering_id,total_paise:offerings.find(o=>o.id===i.offering_id).price*i.quantity*100}))};
  }
};
let source=fs.readFileSync('website/frontend/src/components/ChadhavaExperience.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export class','class');
vm.runInNewContext(source,context);
const C=window.ChadhavaExperience;
C.shell=(title,body)=>{
  C.modal=document.createElement('div');C.modal.innerHTML='<div class="shop-modal__body">'+body+'</div><p data-ch-message></p>';document.body.replaceChildren(C.modal);
  const form=C.modal.querySelector('form');
  Object.defineProperty(form,'elements',{value:new Proxy({}, {get:(_,name)=>form.querySelector(`[name="${name}"]`)})});
  form.querySelectorAll('input,textarea').forEach(input=>{input.checkValidity=()=>Number.isInteger(+input.value)&&+input.value>=0&&+input.value<=99;input.reportValidity=()=>true;});
  // linkedom does not implement the browser's :checked pseudo-class for radios.
  const query=form.querySelector.bind(form);form.querySelector=selector=>selector==='[name="tier"]:checked'?query('[name="tier"][checked]'):query(selector);
};
const fixture={id:'event',kind:'puja',title:'Puja',temple:{name:'Temple',city:'Ujjain'},starts_at:'2026-12-10',deadline:'2026-12-09',cancellation_deadline:'2026-12-08',description:'Temple puja',video_hours:48,offerings};
function open(rows=offerings){C.events=[{...fixture,offerings:rows}];C.event('event');}
function form(){return C.modal.querySelector('form');}
function submit(){return C.submit({target:form(),preventDefault(){}});}
(async()=>{
  open();assert.deepEqual(Array.from(C.checkoutSteps),[1,1.1,1.2,2,3]);
  assert.equal(form().hidden,true,'puja details appear before package popup');
  await C.click({target:C.modal.querySelector('[data-ch-action="packages"]')});
  assert.equal(form().hidden,false);assert.ok(C.modal.classList.contains('ch-package-open'));
  assert.equal(C.modal.querySelector('[data-ch-action="skip"]').hidden,true);
  await submit();assert.equal(C.step,1.1);assert.equal(C.modal.querySelector('[data-ch-action="skip"]').hidden,false);
  C.modal.querySelector('[data-offering="flowers"]').value='2';C.updateCart();assert.equal(C.modal.querySelector('[data-ch-total]').textContent,'INR 511');
  await submit();assert.equal(C.step,1.2);
  C.modal.querySelector('[data-offering="seva"]').value='1';await C.skipSuggestions();assert.equal(C.step,2);
  assert.ok(C.items.some(i=>i.offering_id==='flowers'&&i.quantity===2));assert.ok(!C.items.some(i=>i.offering_id==='seva'));
  C.step=1.1;C.showStep();await C.skipSuggestions();assert.equal(C.step,1.2);assert.equal(C.modal.querySelector('[data-offering="flowers"]').value,'0');
  await C.skipSuggestions();assert.equal(C.quote.amount_paise,50100);
  const radios=form().querySelectorAll('[name="tier"]');radios[0].removeAttribute('checked');radios[1].setAttribute('checked','');
  C.step=1;await submit();await C.skipSuggestions();await C.skipSuggestions();assert.equal(C.membersMax,4);
  const family=C.modal.querySelector('[name="pname-0"]');family.value='Family member';C.participants();assert.equal(C.modal.querySelector('[name="pname-0"]').value,'Family member');
  open([offerings[0]]);assert.deepEqual(Array.from(C.checkoutSteps),[1,2,3]);await submit();assert.equal(C.step,2);
  open([offerings[0],offerings[3]]);assert.deepEqual(Array.from(C.checkoutSteps),[1,1.2,2,3]);await submit();assert.equal(C.step,1.2);
  loggedIn=false;await C.skipSuggestions();assert.equal(C.step,1.2,'login gate before personal details');
  assert.ok(requests>0);console.log('PASS sequential suggestions, totals, skip clears only current group, package-only flow, missing-category bypass, participant preservation and login gate.');
})().catch(e=>{console.error(e);process.exitCode=1;});
