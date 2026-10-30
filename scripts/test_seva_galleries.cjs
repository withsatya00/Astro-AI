const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {document,window}=parseHTML('<html><head></head><body></body></html>');
const context={document,window,console,Date,currentLang:()=> 'en',esc:value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),mediaUrl:v=>v,fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('website/frontend/assets/seva-galleries.json','utf8'))})};
vm.createContext(context);
vm.runInContext(fs.readFileSync('website/frontend/src/components/SevaGallery.js','utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,''),context);
(async()=>{
 await vm.runInContext('loadSevaGalleries()',context);
 const root=document.createElement('div');root.innerHTML=vm.runInContext("sevaGallery('kashi-vishwanath-varanasi','','Kashi Vishwanath')",context);context.root=root;
 vm.runInContext('bindSevaGalleries(root)',context);
 const slides=root.querySelectorAll('[data-gallery-slide]');assert.ok(slides.length>=4&&slides.length<=5);
 root.querySelector('[data-gallery-move="1"]').click();assert.equal(slides[0].hidden,true);assert.equal(slides[1].hidden,false);assert.equal(root.querySelector('[data-gallery-index="1"]').getAttribute('aria-pressed'),'true');
 root.querySelector('[data-gallery-index="4"]')?.click();root.querySelector('[data-gallery-move="1"]').click();assert.equal(slides[0].hidden,false,'wrap around');
 const event=new window.Event('keydown');event.key='ArrowLeft';root.querySelector('[data-seva-gallery]').dispatchEvent(event);assert.equal(slides[slides.length-1].hidden,false);
 assert.ok(root.querySelector('.seva-gallery-credits a'));
 const all=JSON.parse(fs.readFileSync('website/frontend/assets/seva-galleries.json','utf8'));let photos=0;
 for(const gallery of Object.values(all))for(const photo of gallery){assert.ok(fs.existsSync('website/frontend'+photo.src),photo.src);assert.ok(photo.source&&photo.license);photos++;}
 const css=fs.readFileSync('website/frontend/src/styles/chadhava.css','utf8');assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));assert.ok(css.includes('.ch-package-open [data-ch-form]'));
 console.log('PASS gallery thumbnails, previous/next, wraparound, keyboard arrows, credits, '+photos+' image files and responsive layout rules.');
})().catch(error=>{console.error(error);process.exitCode=1;});
