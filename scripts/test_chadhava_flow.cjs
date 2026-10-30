// Start `python scripts/preview_chadhava.py` first. All mutations stay in its isolated scratch database.
const {chromium,request}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin='http://127.0.0.1:8016';
const fixture=JSON.parse(fs.readFileSync('scratch/chadhava-preview.json','utf8'));
async function contextFor(browser,identity){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.addInitScript(({origin,identity})=>{
    window.__API_BASE__=origin+'/api/v1';window.ASTRO_BACKEND_ORIGIN=origin;
    localStorage.setItem('astro_access_token',identity.token);localStorage.setItem('astro_user',JSON.stringify(identity.user));
  },{origin,identity});return context;
}
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const http=await request.newContext({baseURL:origin});
  const errors=[];
  try{
    const context=await contextFor(browser,fixture.devotee);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/mandir-seva',{waitUntil:'domcontentloaded'});
    await page.locator(`[data-ch-action="event"][data-id="${fixture.event_id}"]`).waitFor();
    fs.mkdirSync('scratch/chadhava-flow',{recursive:true});
    for(const width of [375,768,1440]){
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'listing overflow '+width);
      await page.screenshot({path:`scratch/chadhava-flow/events-${width}.png`,fullPage:true});
    }
    await page.locator(`[data-ch-action="event"][data-id="${fixture.event_id}"]`).click();
    const modal=page.locator('#chadhava-event-modal');await modal.locator('[data-offering]').first().fill('2');await modal.locator('[data-offering]').nth(1).fill('1');
    await modal.locator('[data-ch-submit]').click();
    await modal.locator('[name="devotee_name"]').fill('Asha Sharma');await modal.locator('[name="phone"]').fill('9876543210');await modal.locator('[name="gotra_unknown"]').check();
    await modal.locator('[name="family_members"]').fill('Rahul Sharma');await modal.locator('[name="purpose"]').fill('Family peace');await modal.locator('[data-ch-submit]').click();
    await modal.locator('[data-ch-review] .ch-total').waitFor();assert.ok((await modal.locator('[data-ch-review] .ch-total').textContent()).includes('203'));
    await page.setViewportSize({width:375,height:1000});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'checkout overflow');await page.screenshot({path:'scratch/chadhava-flow/review-mobile.png',fullPage:true});
    await modal.locator('[data-ch-submit]').click();await modal.locator('.ch-order').waitFor();assert.ok((await modal.locator('.ch-order').textContent()).includes('Booking confirmed'));
    const orders=await (await http.get('/api/v1/mandir/chadhava/orders',{headers:{Authorization:'Bearer '+fixture.devotee.token}})).json();const order=orders.orders[0];assert.equal(order.amount_paise,20300);assert.equal(order.payment_status,'PAID');
    await modal.locator('[data-ch-action="close"]').click();
    // Assignment and sequential staff operations use the real backend.
    const adminHeaders={Authorization:'Bearer '+fixture.admin.token};
    const assignment=await http.put('/api/v1/mandir/chadhava/admin/staff',{headers:adminHeaders,data:{user_id:fixture.staff.id,temple_id:fixture.temple_id}});assert.equal(assignment.status(),200);
    const staffContext=await contextFor(browser,fixture.staff);const staff=await staffContext.newPage();staff.on('pageerror',e=>errors.push(e.message));
    await staff.goto(origin+'/mandir-seva',{waitUntil:'domcontentloaded'});await staff.locator('[data-ch-action="staff"]').click();
    const card=staff.locator(`[data-ops-order="${order.id}"]`);await card.waitFor();assert.ok((await card.textContent()).includes('Asha Sharma'));
    await card.locator('[data-ops="advance"]').click();await staff.waitForFunction(id=>document.querySelector(`[data-ops-order="${id}"] [data-status="PERFORMED"]`),order.id);
    // A future event cannot be marked performed. UI must show the server's rejection.
    await card.locator('[data-ops="advance"]').click();await staff.locator('[data-ch-message]').filter({hasText:'before its scheduled time'}).waitFor();
    await staff.screenshot({path:'scratch/chadhava-flow/temple-team.png',fullPage:true});
    // A second booking exercises the customer cancellation/refund path.
    await page.setViewportSize({width:1440,height:1000});await page.locator(`[data-ch-action="event"][data-id="${fixture.event_id}"]`).click();
    await modal.locator('[data-offering]').first().fill('1');await modal.locator('[data-ch-submit]').click();await modal.locator('[name="devotee_name"]').fill('Asha Sharma');await modal.locator('[name="phone"]').fill('9876543210');await modal.locator('[name="gotra"]').fill('Kashyap');await modal.locator('[data-ch-submit]').click();await modal.locator('[data-ch-submit]').click();await modal.locator('.ch-order').waitFor();
    page.once('dialog',d=>d.accept());await modal.locator('[data-ch-action="cancel"]').click();await modal.locator('.ch-tag').filter({hasText:'Refunded'}).waitFor();
    assert.deepEqual(errors,[]);console.log('PASS chadhava: dated event listing, mobile/tablet/desktop layout, multi-offering checkout, unknown gotra, wallet payment, staff access/sequential scheduling, future-performance rejection, cancellation and refund.');
  }finally{await browser.close();await http.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
