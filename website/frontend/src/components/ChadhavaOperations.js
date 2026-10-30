import { api, esc, money, downloadFile } from '../utils/shop.js';
const BASE='/api/v1/mandir/chadhava';
const send=(path,data,method='POST')=>api(BASE+path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
const localDate=(days,hour)=>{const d=new Date();d.setDate(d.getDate()+days);d.setHours(hour,0,0,0);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};

export class ChadhavaOperations {
  static async open(host){
    const generation=host.authGeneration||0;
    this.host=host;
    const access=await api(BASE+'/access');this.admin=access.admin;
    const [events,orders]=await Promise.all([api(BASE+'/staff/events'),api(BASE+'/staff/orders')]);
    this.events=events.events;this.orders=orders.orders;
    this.temples=this.admin?(await api('/api/v1/mandir/temples?lang=en')).temples:[];
    if(generation!==(host.authGeneration||0))return;
    host.shell('Chadhava · Temple-team dashboard',`<p>Paid bookings only enter fulfilment after server verification. Follow each step in order and attach evidence to the correct order.</p><p><button type="button" class="shop-btn shop-btn--line" data-ops="refresh">Refresh</button></p>${this.admin?this.adminForms():''}<label>Event<select data-ops-event-filter><option value="">All events</option>${this.events.map(e=>`<option value="${esc(e.id)}">${esc(e.title)} · ${esc(e.temple.name)} · ${esc(new Date(e.starts_at).toLocaleDateString())}</option>`).join('')}</select></label><p><button class="shop-btn shop-btn--line" type="button" data-ops="export">Download selected event fulfilment list (CSV)</button></p><div data-ops-orders>${this.orderCards(this.orders)}</div>`);
    host.modal.onclick=e=>{const b=e.target.closest('[data-ops]');if(b)this.click(b);};
    host.modal.onsubmit=e=>{const f=e.target.closest('[data-ops-form]');if(f){e.preventDefault();this.submit(f);}};
    host.modal.onchange=e=>{
      if(e.target.name==='temple_id'&&e.target.closest('[data-ops-form="event"]'))this.offeringFields(e.target.value);
      if(e.target.matches('[data-ops-event-filter]'))this.filter(e.target.value);
    };
    if(this.admin&&this.temples.length)this.offeringFields(this.temples[0].id);
  }
  static adminForms(){
    return `<details><summary>Create a chadhava event</summary><form class="ch-admin-form" data-ops-form="event"><label>Temple<select name="temple_id">${this.temples.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></label><label>Event type<select name="kind"><option value="chadhava">Chadhava (devotees pick items such as flowers, diya, bhog)</option><option value="puja">Puja (devotees pick a package: individual / couple / family)</option></select></label><label>Event title<input name="title" minlength="3" maxlength="180" required></label><label>Hindi title (optional)<input name="title_hi" maxlength="180"></label><label>What will be offered / performed?<textarea name="description" minlength="10" maxlength="2000" required></textarea></label><label>Hindi description (optional)<textarea name="description_hi" maxlength="2000"></textarea></label><div class="ch-fields"><label>Seva date & time (your local time)<input type="datetime-local" name="starts_at" value="${localDate(3,9)}" required></label><label>Booking deadline<input type="datetime-local" name="deadline" value="${localDate(2,20)}" required></label><label>Self-cancellation deadline<input type="datetime-local" name="cancellation_deadline" value="${localDate(2,18)}" required></label><label>Maximum bookings<input type="number" name="capacity" value="100" min="1" max="100000" required></label><label>Seva type<select name="mode"><option value="collective">Collective</option><option value="individual">Individual</option></select></label><label>Video delivery estimate (hours after seva)<input type="number" name="video_hours" value="72" min="1" max="336" required></label></div><label>Puja benefits, one per line (puja only)<textarea name="benefits_en" rows="3" maxlength="800"></textarea></label><label>Hindi benefits, one per line (optional)<textarea name="benefits_hi" rows="3" maxlength="800"></textarea></label><fieldset data-ops-offerings><legend>Available offerings</legend></fieldset><label class="ch-check"><input type="checkbox" name="unknown_gotra_allowed">Temple accepts devotees who do not know their gotra</label><label class="ch-check"><input type="checkbox" name="partner_confirmed">I confirm the temple team has agreed to perform this event and provide its video</label><label class="ch-check"><input type="checkbox" name="published">Open this event for bookings</label><button class="shop-btn shop-btn--gold">Create event</button></form></details><details><summary>Manage publication and temple-team access</summary><div class="ch-admin-form">${this.events.map(e=>`<p><strong>${esc(e.title)}</strong> · ${esc(e.temple.name)}<br>${e.published?'Published':'Unpublished'} · ${e.remaining} remaining <button class="shop-btn shop-btn--line" type="button" data-ops="publish" data-id="${esc(e.id)}" data-published="${!e.published}">${e.published?'Close bookings':'Publish'}</button></p>`).join('')}</div><form class="ch-admin-form" data-ops-form="staff"><label>Existing staff account user ID<input name="user_id" required></label><label>Temple<select name="temple_id">${this.temples.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('')}</select></label><button class="shop-btn shop-btn--gold">Assign access</button><button class="shop-btn shop-btn--line" type="button" data-ops="revoke">Revoke access</button></form></details>`;
  }
  static offeringFields(templeId){
    const temple=this.temples.find(t=>t.id===templeId);const root=this.host.modal.querySelector('[data-ops-offerings]');
    if(root)root.innerHTML='<legend>Puja packages (tick all for a puja) and special sevas. Single chadhava items such as flowers and diya are always included.</legend>'+[...(temple?.tiers||[]),...(temple?.offerings||[])].map(o=>`<label class="ch-check"><input type="checkbox" name="offering_ids" value="${esc(o.id)}">${esc(o.title)} · ${money(o.price)}</label>`).join('');
  }
  static orderCards(orders){
    return orders.map(o=>{
      const s=o.snapshot,stages=['CONFIRMED','SCHEDULED','PERFORMED','VIDEO_AVAILABLE','COMPLETED'],next=stages[stages.indexOf(o.service_status)+1];
      return `<article class="ch-order" data-ops-order="${esc(o.id)}"><strong>${esc(o.booking_number||o.id)}</strong><h3>${esc(s.title)}</h3><p>${esc(s.temple_name)} · ${esc(new Date(s.starts_at).toLocaleString())}</p><p>${esc(s.devotee_name)} · Gotra: ${esc(s.gotra)}<br>Phone: ${esc(s.phone)}<br>Family: ${esc(s.family_members)}<br>Sankalp: ${esc(s.purpose)}</p><ul>${s.items.map(i=>`<li>${esc(i.title)} × ${i.quantity}</li>`).join('')}</ul><p>Payment: <strong>${esc(o.payment_status)}</strong> · ${money(o.amount_paise/100)}<br>Seva: <strong>${esc(o.service_status)}</strong></p><div class="ch-staff-status">${o.payment_status==='PAID'&&stages.includes(o.service_status)&&next?`<button class="shop-btn shop-btn--gold" type="button" data-ops="advance" data-id="${esc(o.id)}" data-status="${next}">Mark ${next}</button>`:''}${o.service_status==='PERFORMED'?`<label>Evidence video (MP4/WebM/MOV, max 50 MB)<input data-ops-video type="file" accept="video/mp4,video/webm,video/quicktime"></label><button type="button" class="shop-btn shop-btn--line" data-ops="video" data-id="${esc(o.id)}">Upload video for this order</button>`:''}${this.admin&&['PAID','REFUND_PENDING'].includes(o.payment_status)?`<button class="shop-btn shop-btn--line" type="button" data-ops="refund" data-id="${esc(o.id)}">${o.payment_status==='REFUND_PENDING'?'Reconcile refund':'Cancel / resolve missed seva & refund'}</button>`:''}</div></article>`;
    }).join('')||'<p>No orders in this selection.</p>';
  }
  static async filter(eventId){
    try{const d=await api(BASE+'/staff/orders'+(eventId?'?event_id='+encodeURIComponent(eventId):''));this.host.modal.querySelector('[data-ops-orders]').innerHTML=this.orderCards(d.orders);}catch(e){this.host.message(e.message);}
  }
  static async click(b){
    b.disabled=true;
    try{
      const a=b.dataset.ops,id=b.dataset.id;
      if(a==='refresh')await this.open(this.host);
      else if(a==='advance'){await send('/staff/orders/'+id,{status:b.dataset.status},'PATCH');await this.filter(this.host.modal.querySelector('[data-ops-event-filter]').value);this.host.message('Seva status updated.');}
      else if(a==='video'){
        const file=b.closest('[data-ops-order]').querySelector('[data-ops-video]').files[0];if(!file)throw new Error('Choose the video recorded for this order');
        const data=new FormData();data.append('file',file);await api(BASE+'/staff/orders/'+id+'/video',{method:'POST',body:data});this.host.message('Video attached. Mark VIDEO_AVAILABLE to publish it to the devotee.');
      }else if(a==='export'){
        const event=this.host.modal.querySelector('[data-ops-event-filter]').value;if(!event)throw new Error('Select an event before exporting');await downloadFile(BASE+'/staff/export.csv?event_id='+encodeURIComponent(event),'chadhava-fulfilment.csv');
      }else if(a==='publish'){await send('/admin/events/'+id,{published:b.dataset.published==='true'},'PATCH');await this.open(this.host);this.host.load();}
      else if(a==='revoke'){const form=b.closest('form');if(!form.reportValidity())return;await send('/admin/staff',Object.fromEntries(new FormData(form)),'DELETE');this.host.message('Temple-team access revoked.');}
      else if(a==='refund'){const reason=prompt('Reason for refund / reconciliation (at least 10 characters):');if(!reason)return;const result=await send('/admin/orders/'+id+'/refund',{reason});this.host.message('Refund status: '+result.payment_status);await this.filter(this.host.modal.querySelector('[data-ops-event-filter]').value);}
    }catch(e){this.host.message(e.message);}finally{if(b.isConnected)b.disabled=false;}
  }
  static async submit(form){
    const button=form.querySelector('button');button.disabled=true;
    try{
      const data=Object.fromEntries(new FormData(form));
      if(form.dataset.opsForm==='staff'){await send('/admin/staff',data,'PUT');this.host.message('Temple-team access assigned.');}
      else if(form.dataset.opsForm==='event'){
        data.offering_ids=[...form.querySelectorAll('[name="offering_ids"]:checked')].map(i=>i.value);
        const lines=v=>String(v||'').split(/[\r\n]+/).map(x=>x.trim()).filter(Boolean);data.benefits_en=lines(data.benefits_en);data.benefits_hi=lines(data.benefits_hi);
        for(const k of ['starts_at','deadline','cancellation_deadline'])data[k]=new Date(data[k]).toISOString();
        for(const k of ['capacity','video_hours'])data[k]=+data[k];
        for(const k of ['partner_confirmed','published','unknown_gotra_allowed'])data[k]=form.elements[k].checked;
        await send('/admin/events',data);await this.open(this.host);this.host.load();this.host.message('Chadhava event created.');
      }
    }catch(e){this.host.message(e.message);}finally{if(button.isConnected)button.disabled=false;}
  }
}
