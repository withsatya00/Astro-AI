// Run against an isolated development database: ADVANCED_TEST_URL=http://127.0.0.1:8015
const { chromium, request } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = process.env.ADVANCED_TEST_URL || 'http://127.0.0.1:8015';
(async () => {
  const http = await request.newContext({baseURL:origin});
  const registration = await http.post('/api/v1/auth/register',{data:{email:`advanced-${Date.now()}@example.com`,password:'AdvancedTest123!',full_name:'Advanced Test'}});
  assert.equal(registration.status(),201,await registration.text());
  const account = await registration.json();
  const headers = {Authorization:`Bearer ${account.access_token}`};
  const response = await http.post('/api/v1/charts/calculate',{headers,data:{name:'Family profile',date_of_birth:'1992-05-14',time_of_birth:'08:30:00',latitude:28.6139,longitude:77.209,timezone_offset:5.5,city:'Delhi'}});
  assert.equal(response.status(),200,await response.text());
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(({origin,token,user})=>{
      window.__API_BASE__=origin+'/api/v1';window.ASTRO_BACKEND_ORIGIN=origin;
      localStorage.setItem('astro_access_token',token);
      if(user)localStorage.setItem('astro_user',JSON.stringify(user));
    },{origin,token:account.access_token,user:account.user});
    await page.goto(origin+'/dashboard',{waitUntil:'domcontentloaded'});
    await page.locator('[data-dashboard-tab="advanced"]').waitFor({timeout:20000});
    await page.locator('[data-dashboard-tab="advanced"]').click();
    await page.locator('.adv-periods button').first().waitFor();
    assert.ok((await page.locator('.adv-periods button').count())>=9);
    await page.locator('.adv-chart svg').waitFor();
    await page.setViewportSize({width:375,height:1000});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'timeline overflow');
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('[data-tab="family"]').click();
    const family=page.locator('[data-adv-form="family"]').first();
    await family.locator('[name="relationship"]').selectOption('parent');
    await family.locator('[name="label"]').fill('Mother');await family.locator('button').first().click();
    await page.getByRole('status').filter({hasText:'Updated.'}).waitFor();
    await page.locator('[data-tab="memory"]').click();
    await page.locator('[name="content"]').fill('Prefer brief career guidance');
    await page.locator('[name="enabled"]').check();
    await page.locator('[data-adv-form="memory"] button').first().click();
    await page.getByRole('status').filter({hasText:'Updated.'}).waitFor();
    await page.locator('[data-tab="evidence"]').click();await page.locator('.adv-scroll tbody tr').first().waitFor();
    await page.locator('[data-tab="memory"]').click();assert.equal(await page.locator('[name="content"]').inputValue(),'Prefer brief career guidance');
    await page.locator('[data-advanced-action="delete-memory"]').click();await page.waitForFunction(()=>document.querySelector('[name="content"]')?.value==='');
    await page.locator('[data-tab="muhurat"]').click();await page.locator('[data-adv-form="muhurat"] button').click();
    await page.locator('[data-adv-result] details').waitFor();
    await page.locator('[data-tab="uncertainty"]').click();await page.locator('[data-adv-form="uncertainty"] button').click();
    await page.locator('.adv-comparison article').first().waitFor();assert.equal(await page.locator('.adv-comparison article').count(),5);
    fs.mkdirSync('scratch/advanced-workspace',{recursive:true});
    for(const width of [375,768,1440]){
      await page.setViewportSize({width,height:1000});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`page overflow at ${width}`);
      await page.screenshot({path:`scratch/advanced-workspace/uncertainty-${width}.png`,fullPage:true});
    }
    await page.locator('[data-tab="reminders"]').click();await page.locator('[data-adv-form="reminder"]').waitFor();
    const due = new Date(Date.now()+86400000);const local=new Date(due.getTime()-due.getTimezoneOffset()*60000).toISOString().slice(0,16);
    await page.locator('[data-adv-form="reminder"] [name="title"]').fill('Daily practice');
    await page.locator('[name="due_at"]').fill(local);await page.locator('[data-adv-form="reminder"] button').click();
    await page.locator('[data-advanced-action="delete-reminder"]').waitFor();await page.locator('[data-advanced-action="delete-reminder"]').click();
    await page.waitForFunction(()=>!document.querySelector('[data-advanced-action="delete-reminder"]'));
    await page.evaluate(()=>{
      CallingAgentService.callLog={transcript:['Seeker: Career question','Astrologer: Traditional guidance']};
      CallingAgentService.renderFullTranscript();
      const row=document.createElement('div');row.innerHTML='<div class="message-bubble"></div>';
      ChatController.attachReadingEvidence(row,[{source:'Test source',excerpt:'<script>window.bad=true</script>'}],true);
      if(row.querySelector('script'))throw new Error('Unsafe source rendering');
    });
    assert.ok((await page.locator('#call-full-transcript').textContent()).includes('Career question'));
    const download=page.waitForEvent('download');
    await page.evaluate(()=>CallingAgentService.downloadTranscript());
    assert.equal((await download).suggestedFilename(),'astro-consultation-transcript.txt');
    assert.deepEqual(errors,[]);
    console.log('PASS advanced workspace: family labels, consent memory save/delete, timeline, evidence, muhurat, uncertainty, reminder CRUD; no browser errors or overflow at 375/768/1440.');
  } finally {await browser.close();await http.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
