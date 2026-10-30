// Isolated browser regression: every service API is a fixture; no real orders/payments.
const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const image='/assets/img/temples/kashi-vishwanath-varanasi.jpg';
const temple={id:'review-temple',slug:'kashi-vishwanath-varanasi',name:'Kashi Vishwanath',city:'Varanasi',state:'Uttar Pradesh',description:'A sacred temple on the banks of the Ganga.',image_url:image,starting_price:51,offerings:[]};
const base={temple,temple_slug:temple.slug,temple_id:temple.id,image_url:image,description:'A temple-led sankalp for you and your family.',starts_at:'2026-12-01T04:00:00Z',deadline:'2026-11-30T16:00:00Z',cancellation_deadline:'2026-11-29T16:00:00Z',video_hours:48,unknown_gotra_allowed:true,mode:'collective',joined:0,bookable:true,benefits:['Sankalp in your name and gotra','Scheduled temple seva']};
const offerings=[{id:'flowers',category:'item',title:'Flowers',description:'Fresh flowers offered at the temple.',price:51},{id:'diya',category:'item',title:'Diya seva',description:'A diya offered in your name.',price:101}];
Object.assign(temple,{deity:'Shiva',aarti_timings:[],priests:[],offerings:[
  {...offerings[0],title:'Flowers, Bilva leaves & lamp offering'},
  {id:'panchamrit',title:'Panchamrit Abhishek & Bhasma offering sankalp',description:'Milk, curd, honey, sugar, ghee and sacred bhasma.',price:251},
  {id:'anushthan',title:'Special Mahamrityunjaya Shanti Anushthan',description:'Mahamrityunjaya chanting and protective sankalp.',price:1100},
]});
const events=[{...base,id:'review-chadhava',kind:'chadhava',title:'A heartfelt offering at Kashi',offerings},{...base,id:'review-puja',kind:'puja',title:'Shiva sankalp puja',offerings:[{id:'single',category:'puja_tier',title:'Individual sankalp',description:'One participant, name and gotra sankalp, seva video.',price:501,max_members:1},{id:'family',category:'puja_tier',title:'Family sankalp',description:'Up to four participants, name and gotra sankalp, seva video.',price:901,max_members:4},...offerings]},{...base,id:'closed-event',kind:'puja',title:'Closed puja fixture',bookable:false,offerings:[]}];
const gaushalas=[{id:'g-one',name:'Ganga Gaushala',location:'Varanasi',introduction:'Daily fodder and care for cows.',beneficiary_name:'Ganga Gaushala Trust',beneficiary_details:'Contribution to gaushala care.',accepting_donations:true,photos:[]},{id:'g-two',name:'Seva Gaushala',location:'Mathura',beneficiary_name:'Seva Gaushala Trust',accepting_donations:true,photos:[]}];
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'America/Los_Angeles'});
  page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
  let updatesFail=true,receiptStatus='PENDING',donationPayload,bookingCount=0;
  let confirmedOrder;
  await page.addInitScript(()=>localStorage.setItem('astro_lang','en'));
  await page.route('**/api/v1/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let json={};let status=200;
    if(path.endsWith('/mandir/chadhava/events'))json={events,razorpay_available:false};
    else if(path.endsWith('/mandir/temples'))json={temples:[temple]};
    else if(path.includes('/mandir/temples/'))json=temple;
    else if(path.endsWith('/mandir/chadhava/quote')){
      const payload=route.request().postDataJSON(),event=events.find(e=>e.id===payload.event_id);
      const items=payload.items.map(i=>({...i,title:event.offerings.find(o=>o.id===i.offering_id).title,total_paise:event.offerings.find(o=>o.id===i.offering_id).price*i.quantity*100}));
      json={items,amount_paise:items.reduce((n,i)=>n+i.total_paise,0),members_max:payload.items.some(i=>i.offering_id==='family')?4:1};
    }
    else if(path.endsWith('/mandir/chadhava/orders')&&route.request().method()==='POST'){
      bookingCount++;const payload=route.request().postDataJSON();
      const event=events.find(e=>e.id===payload.event_id);
      confirmedOrder={id:'test-order',booking_number:'SEVA-TEST-001',payment_status:'PAID',service_status:'CONFIRMED',amount_paise:payload.expected_amount_paise,can_cancel:true,video_due_at:'2026-12-03T04:00:00Z',snapshot:{kind:event.kind,title:event.title,temple_name:temple.name,starts_at:event.starts_at,devotee_name:payload.devotee_name,gotra:payload.gotra_unknown?'Unknown gotra accepted':payload.gotra,items:payload.items.map(i=>({...i,title:event.offerings.find(o=>o.id===i.offering_id).title,total_paise:event.offerings.find(o=>o.id===i.offering_id).price*i.quantity*100}))}};
      json=confirmedOrder;
    }
    else if(path.endsWith('/test-order/cancel')){confirmedOrder={...confirmedOrder,payment_status:'REFUNDED',can_cancel:false};json=confirmedOrder;}
    else if(path.endsWith('/test-order/timeline'))json={events:[{status:'CONFIRMED',time:'2026-10-30T10:00:00Z',note:'Confirmed in isolated test'}]};
    else if(path.endsWith('/mandir/chadhava/orders'))json={orders:confirmedOrder?[confirmedOrder]:[]};
    else if(path.endsWith('/test-order'))json=confirmedOrder;
    else if(path.endsWith('/gau-sewa/config'))json={available:true,min_amount:11,max_amount:100000,presets:[101,501,1100]};
    else if(path.endsWith('/gau-sewa/gaushalas'))json={gaushalas};
    else if(path.endsWith('/gau-sewa/updates')){status=updatesFail?503:200;json=updatesFail?{detail:'Fixture unavailable'}:{updates:[{title:'Fodder seva update',body:'This week’s gaushala update.',published_at:'2026-10-29T10:00:00Z',gaushala_id:'g-two',photos:[]}]};}
    else if(path.endsWith('/gau-sewa/donations/order')){donationPayload=route.request().postDataJSON();status=503;json={detail:'Test checkout unavailable'};}
    else if(path.includes('/gau-sewa/donations/receipt/'))json={reference:'GS-TEST-001',amount:777,purpose:'general',recipient_name:'Seva Gaushala Trust',status:receiptStatus,created_at:'2026-10-30T10:00:00Z',receipt_available:receiptStatus==='SUCCESS'};
    else if(path.endsWith('/auth/me')){status=401;json={detail:'Sign in required'};}
    else if(path.startsWith('/api/v1/cart'))json={items:[]};
    else if(path.startsWith('/api/v1/wishlist'))json={product_ids:[]};
    else if(path.endsWith('/mandir/packages'))json={packages:[]};
    else if(path.endsWith('/notifications'))json={notifications:[]};
    return route.fulfill({status,json});
  });
  fs.mkdirSync('scratch/seva-refresh',{recursive:true});
  const capture=async file=>{
    await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode().catch(()=>{});})));
    await page.screenshot({path:file,fullPage:true});
  };
  try{
    await page.goto('http://localhost:3000/mandir-seva/puja',{waitUntil:'domcontentloaded'});
    await page.locator('[data-ch-action=event][data-id=review-puja]').waitFor();
    assert.equal(await page.locator('.mandir-subhead:not([hidden]) .service-banner__copy>p').last().evaluate(el=>getComputedStyle(el).color),'rgb(245, 232, 223)');
    assert.equal(await page.locator('.ch-bookings-bar [data-ch-action=orders]').isVisible(),true);
    assert.equal(await page.locator('.ch-confirmed').innerText().then(t=>t.includes('Closed puja fixture')),false);
    await page.locator('.ch-closed-events summary').click();
    assert.equal(await page.getByText('Closed puja fixture',{exact:true}).isVisible(),true);
    await page.locator('.ch-closed-events summary').click();
    await capture('scratch/seva-refresh/puja-desktop.png');
    await page.locator('[data-ch-action=event][data-id=review-puja]').click();
    await page.waitForURL('**/puja/event/review-puja');
    await page.locator('.ch-inline-detail h1').waitFor();
    assert.equal(await page.locator('.ch-inline-detail').getAttribute('role'),'region');
    assert.equal(await page.locator('.ch-modal-footer').count(),0);
    assert.match(await page.locator('.ch-detail-summary').innerText(),/1 Dec 2026, 9:30 am IST/i);
    await capture('scratch/seva-refresh/puja-detail-desktop.png');
    await page.locator('.ch-detail-summary [data-ch-action=packages]').click();
    await page.locator('[name=tier][value=family]').check();
    await page.locator('[data-ch-submit]').click();
    await page.locator('[data-step="1.1"]:not([hidden])').waitFor();
    await page.locator('[data-ch-action=add-offering][data-id=flowers]').click();
    assert.match(await page.locator('[data-ch-total]').innerText(),/952/);
    await page.locator('[data-ch-action=back]').click();
    assert.equal(await page.locator('[name=tier][value=family]').isChecked(),true);
    await page.locator('[data-ch-action=packages-close]').click();
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.ch-inline-detail h1').waitFor();
    await page.locator('.pp-crumbs a[href="/mandir-seva/puja"]').click();
    await page.locator('.ch-puja-catalogue').waitFor({state:'visible'});
    await page.goBack();await page.locator('.ch-inline-detail h1').waitFor();
    await page.goForward();await page.locator('.ch-puja-catalogue').waitFor({state:'visible'});
    await page.locator('[data-ch-search]').fill('not-a-real-puja');
    assert.equal(await page.getByText('No pujas match your filters',{exact:true}).isVisible(),true);
    await page.locator('.ch-empty [data-ch-action=catalogue-clear]').click();
    await page.locator('[data-ch-action=calendar-detail]').first().click();
    await page.locator('.ch-inline-detail .ch-section-tabs').waitFor();
    await page.locator('.ch-section-tabs a[href="#cd-faq"]').click();
    await page.locator('#cd-faq details').nth(1).locator('summary').click();
    assert.doesNotMatch(await page.locator('#cd-faq').innerText(),/use Kashyap/);
    await page.goto('http://localhost:3000/mandir-seva/puja/event/review-puja',{waitUntil:'domcontentloaded'});
    await page.locator('.ch-detail-summary [data-ch-action=packages]').click();
    await page.evaluate(()=>localStorage.setItem('astro_access_token','isolated-test-token'));
    await page.locator('[data-ch-submit]').click();
    await page.locator('[data-ch-action=skip]').click();
    await page.locator('[name=devotee_name]').fill('Test devotee');
    await page.locator('[name=phone]').fill('9876543210');
    await page.locator('[name=gotra_unknown]').check();
    assert.equal(await page.locator('[name=gotra]').isDisabled(),true);
    await page.locator('[data-ch-submit]').click();
    await page.locator('[data-ch-review] .ch-total').waitFor();
    assert.match(await page.locator('[data-ch-review]').innerText(),/Unknown gotra accepted/);
    await page.locator('[data-ch-submit]').click();
    await page.locator('.ch-order').waitFor();
    assert.match(await page.locator('.ch-order').innerText(),/SEVA-TEST-001/);assert.equal(bookingCount,1);
    await page.locator('[data-ch-action=close]').click();
    await page.locator('.ch-bookings-bar [data-ch-action=orders]').click();
    await page.locator('.ch-order').waitFor();
    page.once('dialog',d=>d.accept());
    await page.locator('[data-ch-action=cancel]').click();
    await page.locator('.ch-tag').filter({hasText:'Refunded'}).waitFor();
    await page.locator('[data-ch-action=close]').click();
    await page.goto('http://localhost:3000/mandir-seva/kashi-vishwanath-varanasi',{waitUntil:'domcontentloaded'});
    await page.locator('.tp-offer__buy img').first().waitFor();
    const itemImages=await page.locator('.tp-offer__buy img').evaluateAll(images=>images.map(img=>img.getAttribute('src')));
    assert.deepEqual(itemImages,['/assets/img/offerings/flowers.webp','/assets/img/offerings/panchamrit.webp','/assets/img/offerings/havan.webp']);
    await page.locator('.tp-offer__buy img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
    for(const width of [1440,390]){
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'temple offering photos overflow');
      await page.locator('.tp-offers').screenshot({path:'scratch/seva-refresh/offering-photos-'+width+'.png'});
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.goto('http://localhost:3000/mandir-seva/chadhava',{waitUntil:'domcontentloaded'});
    await page.locator('[data-ch-action=event][data-id=review-chadhava]').waitFor();
    await capture('scratch/seva-refresh/chadhava-desktop.png');
    await page.locator('[data-ch-action=event][data-id=review-chadhava]').click();
    await page.locator('[data-offering=flowers]').waitFor();
    await page.locator('[data-ch-action=add-offering][data-id=flowers]').click();
    assert.match(await page.locator('[data-ch-total]').innerText(),/51/);
    assert.equal(await page.locator('.ch-offering-photo-row').first().locator('img').getAttribute('src'),'/assets/img/offerings/flowers.webp');
    await page.locator('[data-ch-action=dec][data-id=flowers]').click();
    assert.equal(await page.locator('[data-ch-action=add-offering][data-id=flowers]').isVisible(),true);
    await page.locator('[data-ch-action=add-offering][data-id=flowers]').click();
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await capture('scratch/seva-refresh/chadhava-detail-mobile.png');
    await page.goto('http://localhost:3000/gau-sewa',{waitUntil:'domcontentloaded'});
    await page.locator('#gs-custom').waitFor();
    assert.equal(await page.locator('[data-gs-updates-retry]').isVisible(),true);
    assert.equal(await page.locator('.gs-form [type=submit]').isEnabled(),true);
    assert.equal(await page.locator('.gs-hero .gs-btn').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 249, 239)');
    const positions=await page.locator('.gs-purpose-section,.gs-donation-column,.gs-main-column').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));
    await capture('scratch/seva-refresh/gau-mobile-order.png');
    assert.ok(positions[0]<positions[1]&&positions[1]<positions[2]);
    await page.locator('#gs-custom').fill('777');
    await page.locator('#gs-name').fill('Test donor');
    await page.locator('#gs-recipient').selectOption('g-two');
    assert.match(await page.locator('.gs-recipient').innerText(),/Seva Gaushala Trust/);
    assert.equal(await page.locator('#gs-custom').inputValue(),'777');
    await page.locator('[data-gs-purpose=general]').click();
    updatesFail=false;
    await page.locator('[data-gs-updates-retry]').click();
    await page.getByText('Fodder seva update',{exact:true}).waitFor();
    assert.equal(await page.locator('#gs-custom').inputValue(),'777');
    await capture('scratch/seva-refresh/gau-mobile.png');
    await page.setViewportSize({width:1440,height:1000});
    await capture('scratch/seva-refresh/gau-desktop.png');
    await page.locator('.gs-form [type=submit]').click();
    await page.waitForFunction(()=>document.querySelector('.gs-notice--error'));
    assert.equal(donationPayload.gaushala_id,'g-two');assert.equal(donationPayload.amount,777);
    await page.goto('http://localhost:3000/gau-sewa/receipt/test-receipt-token',{waitUntil:'domcontentloaded'});
    await page.locator('[data-gs-check]').click();
    receiptStatus='SUCCESS';
    await page.locator('[data-gs-check]').click();
    await page.locator('[data-gs-print]').waitFor();
    assert.equal(await page.locator('[data-gs-download]').innerText(),'Download receipt (HTML)');
    await capture('scratch/seva-refresh/receipt-desktop.png');
    await page.evaluate(()=>window.I18n.setLanguage('hi',false));
    assert.equal(await page.locator('[data-gs-print]').innerText(),'प्रिंट / PDF में सेव करें');
    for(const route of ['/gau-sewa','/mandir-seva/chadhava','/mandir-seva/puja']){
      await page.goto('http://localhost:3000'+route,{waitUntil:'domcontentloaded'});
      for(const width of [360,390,768,1024,1440]){
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' overflow at '+width);
      }
      await page.evaluate(()=>{document.documentElement.dataset.theme='dark';});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      if(route==='/gau-sewa')await capture('scratch/seva-refresh/gau-dark-hindi.png');
      await page.evaluate(()=>{document.documentElement.dataset.theme='light';});
    }
    await page.evaluate(()=>localStorage.removeItem('astro_access_token'));
    for(const route of ['/mandir-seva','/mandir-seva/puja','/mandir-seva/chadhava','/gau-sewa','/astro-mall','/astrologers','/calculators']){
      await page.goto('http://localhost:3000'+route,{waitUntil:'domcontentloaded'});
      const banner=page.locator('.service-banner:visible').first();await banner.waitFor();
      await banner.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode().catch(()=>{}))));
      for(const width of [1440,390]){
        await page.setViewportSize({width,height:1000});
        assert.equal(await banner.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(62, 11, 24)',route);
        assert.equal(await banner.locator('h1').evaluate(el=>getComputedStyle(el).color),'rgb(255, 249, 239)',route);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' banner overflow');
        await banner.screenshot({path:'scratch/seva-refresh/banner-'+route.replaceAll('/','-').slice(1)+'-'+width+'.png'});
      }
    }
    assert.deepEqual(errors,[]);
    console.log('PASS isolated seva journeys: open/closed events, direct detail/refresh, Back/Forward, package totals, filters, unknown gotra, review/payment/booking/tracking/refund fixtures, responsive layouts, partial API retry, recipient payload, pending refresh, printable receipt, Hindi and dark theme.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
