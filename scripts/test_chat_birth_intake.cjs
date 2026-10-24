const assert=require('node:assert/strict');
const {chromium}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8016';
  await page.addInitScript(url=>window.__API_BASE__=url,base+'/api/v1');
  await page.goto(base);
  await page.waitForFunction(()=>window.__bootstrap_mounted__);
  await page.evaluate(()=>{
   Router.navigate('/consultation/new');
   document.getElementById('welcome-screen')?.remove();
   document.getElementById('chat-intake-form')?.remove();
   ChatController.forceDemoMode=true;
   ChatController.selectedAstrologer='acharya-kn-rao';
   ChatController.activeConsultation=null;
  });
  async function send(text){
   await page.locator('#chat-input').fill(text);
   await page.locator('#btn-send-chat').click();
   await page.waitForFunction(()=>!ChatController.isSubmitting);
   const answer=await page.locator('.message-row.assistant').last().innerText();return answer;
  }
  const first=await send('Mera career kaisa rahega?');
  assert.match(first,/janm|birth/i);
  await send('DOB 02-03-2004, time 12:00 PM, place Tirupati');
  await page.waitForFunction(()=>!!App.currentChart && App.currentChart.id===ChatController.activeChartId);
  const chart=await page.evaluate(()=>({id:App.currentChart.id,city:App.currentChart.city}));
  assert.equal(chart.city,'Tirupati');
  const answer=await page.locator('.message-row.assistant').last().innerText();
  assert.doesNotMatch(answer,/marriage|vivah|shaadi|shadi/i);
  const next=await send('Mere career mein promotion kab milega?');
  assert.doesNotMatch(next,/details.*batayein|share.*birth|janm tareekh/i);
  assert.equal(await page.evaluate(()=>App.currentChart.id),chart.id);
  assert.equal(await page.locator('#linked-profile-chip').isVisible(),true);
  await page.reload();
  await page.waitForFunction(()=>window.__bootstrap_mounted__ && !!App.currentChart);
  assert.equal(await page.evaluate(()=>App.currentChart.id),chart.id);
  assert.deepEqual(errors,[]);
  console.log('PASS actual browser chat: career -> typed DOB/time/Tirupati -> career answer, chart adopted by UI, follow-up retains chart, reload restores chart.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
