import { esc, mediaUrl } from '../utils/shop.js';
import { currentLang } from '../utils/shop-i18n.js';
let manifest={},pending;
export async function loadSevaGalleries(){
  if(!document.getElementById('seva-gallery-css')){const css=document.createElement('link');css.id='seva-gallery-css';css.rel='stylesheet';css.href='/src/styles/seva-gallery.css';document.head.append(css);}
  if(!pending)pending=fetch('/assets/seva-galleries.json').then(r=>{if(!r.ok)throw Error('Gallery unavailable');return r.json();}).then(data=>manifest=data).catch(()=>{pending=null;return {};});
  return pending;
}
export function galleryPhotos(key,fallback){
  const photos=manifest[key]||[];
  return photos.length?photos.slice(0,5):fallback?[{src:fallback,title:key,license:''}]:[];
}
export function sevaGallery(key,fallback,label,illustrative=false){
  const photos=galleryPhotos(key,fallback),hi=currentLang()==='hi';
  if(!photos.length)return '';
  return `<section class="seva-gallery" data-seva-gallery role="region" aria-roledescription="carousel" aria-label="${esc(label)}"><div class="seva-gallery-stage">${photos.map((p,i)=>`<figure data-gallery-slide="${i}" ${i?'hidden':''}><img src="${esc(mediaUrl(p.src))}" alt="${esc(p.title||label)}" ${i?'loading="lazy"':''}><figcaption>${esc(label)} ${illustrative?esc(hi?'· प्रतीकात्मक फोटो':'· Illustrative photo'):''}</figcaption></figure>`).join('')}${photos.length>1?`<button type="button" data-gallery-move="-1" class="seva-gallery-prev" aria-label="${hi?'पिछली फोटो':'Previous photo'}">‹</button><button type="button" data-gallery-move="1" class="seva-gallery-next" aria-label="${hi?'अगली फोटो':'Next photo'}">›</button>`:''}<span class="seva-gallery-counter" aria-live="polite">1 / ${photos.length}</span></div><div class="seva-gallery-thumbs">${photos.map((p,i)=>`<button type="button" data-gallery-index="${i}" aria-label="${esc(hi?`फोटो ${i+1} देखें`:`View photo ${i+1}`)}" aria-pressed="${!i}"><img src="${esc(mediaUrl(p.src))}" alt="" loading="lazy"></button>`).join('')}</div><details class="seva-gallery-credits"><summary>${hi?'फोटो स्रोत और लाइसेंस':'Photo credits & licences'}</summary>${photos.filter(p=>p.source).map(p=>`<p><a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.title)}</a> · ${esc(p.license)} · ${esc(String(p.author||'').replace(/<[^>]*>/g,''))}</p>`).join('')||esc(hi?'मंदिर कैटलॉग फोटो':'Temple catalogue photo')}</details></section>`;
}
export function bindSevaGalleries(root){
 root.querySelectorAll('[data-seva-gallery]').forEach(gallery=>{
  if(gallery.dataset.bound)return;gallery.dataset.bound='true';let current=0;
  const slides=[...gallery.querySelectorAll('[data-gallery-slide]')];
  const show=index=>{current=(index+slides.length)%slides.length;slides.forEach((slide,i)=>slide.hidden=i!==current);gallery.querySelectorAll('[data-gallery-index]').forEach((button,i)=>button.setAttribute('aria-pressed',i===current));gallery.querySelector('.seva-gallery-counter').textContent=`${current+1} / ${slides.length}`;};
  gallery.addEventListener('click',event=>{const button=event.target.closest('[data-gallery-index],[data-gallery-move]');if(!button)return;show(button.hasAttribute('data-gallery-index')?+button.dataset.galleryIndex:current+ +button.dataset.galleryMove);});
  gallery.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1));}});
 });
}
