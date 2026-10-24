const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8015';
(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  try {
    const page = await browser.newPage({viewport: {width:390,height:844}, isMobile:true});
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    await page.addInitScript(url=>window.__API_BASE__=url, base+'/api/v1');
    await page.goto(base);
    await page.waitForFunction(()=>window.__bootstrap_mounted__);
    await page.evaluate(()=>App.openAuthModal('login'));
    await page.waitForTimeout(100);
    for (const id of ['login-email', 'login-password']) {
      assert.equal(await page.locator('#'+id).inputValue(), '');
      assert.equal(await page.locator('#'+id).getAttribute('autocomplete'), 'off');
    }
    await page.locator('#login-email').fill('previous-visitor@example.com');
    await page.locator('#login-password').fill('PreviousVisitorPassword');
    await page.evaluate(()=>{App.closeModal('modal-user-account');App.openAuthModal('login')});
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#login-email').inputValue(), '');
    assert.equal(await page.locator('#login-password').inputValue(), '');
    console.log('PASS login opens empty and reopening clears both fields; no shared credentials.');
    await page.evaluate(()=>App.openAuthModal('register'));
    await page.waitForTimeout(100);
    const email=`consult-test-${Date.now()}@example.com`;
    await page.locator('#reg-name').fill('Consultation Test');
    await page.locator('#reg-email').fill(email);
    await page.locator('#reg-password').fill('Password123!');
    await page.locator('#reg-phone').fill('9876543210');
    await page.locator('#auth-panel-register button[type=submit]').click();
    await page.waitForFunction(()=>!!App.currentUser);
    assert.ok(await page.evaluate(()=>!!localStorage.getItem('astro_access_token')));
    const profile=await page.evaluate(()=>API.getMe()); assert.equal(profile.phone,'9876543210');
    await page.evaluate(()=>{API.logout();App.currentUser=null;App.renderUserAccountModal()});
    await page.locator('#login-email').fill(email);
    await page.locator('#login-password').fill('WrongPassword!');
    await page.locator('#auth-panel-login button[type=submit]').click();
    await page.waitForFunction(()=>!!document.querySelector('.auth-error')?.textContent);
    assert.equal(await page.locator('#auth-panel-login button[type=submit]').isEnabled(),true);
    await page.locator('#login-password').fill('Password123!');
    await page.locator('#auth-panel-login button[type=submit]').click();
    await page.waitForFunction(()=>!!App.currentUser);
    console.log('PASS registration, phone persistence, invalid password, login retry and token storage.');
    await page.evaluate(()=>{
      App.closeModal('modal-user-account');Router.navigate('/consultation/new');
      document.getElementById('welcome-screen')?.remove();document.getElementById('chat-intake-form')?.remove();
      ChatController.selectedAstrologer='test';ChatController.astrologers=[{id:'test',name:'Pt. Rameshwar Dwivedi',type:'ai'}];
      ChatController.updateAstrologerUI(ChatController.astrologers[0]);
      ChatController.loadSessions=()=>{};ChatController.playTempleChime=()=>{};
      document.querySelector('.toast-container').innerHTML='';
    });
    await page.waitForTimeout(500);
    for(const scenario of [{width:390,useSession:true,short:false},{width:1440,useSession:false,short:false},
                           {width:390,useSession:false,short:true},{width:1440,useSession:true,short:true}]) {
      await page.setViewportSize({width:scenario.width,height:844});
      await page.evaluate(({useSession,short})=>{
        const simulate=async (...args)=>{
          const [, ,session,delta,done]=useSession?args:[null,...args];
          session({session_id:'test-session',consultation_id:'test-session'});
          window.testDelta=delta;window.testDone=()=>{done({session_id:'test-session',content:window.testContent});window.finishStream()};
          await new Promise(resolve=>window.finishStream=resolve);
        };
        if(useSession) API.streamConsultationSession=simulate;
        else {API.streamConsultationSession=null;API.streamConsultation=simulate;}
        window.testContent=short ? 'Your career question has been answered. Keep reading at your own pace.'
          : 'The answer starts here.\n\n'+('This is a long response for reading. '.repeat(150));
        void ChatController.sendMessage('Kya videsh jane ka yog hai?');
      },scenario);
      await page.waitForFunction(()=>!!window.testDelta);
      const before=await page.locator('#chat-messages-container').evaluate(e=>e.scrollTop);
      await page.evaluate(()=>testDelta(testContent));
      await page.waitForTimeout(100);
      const after=await page.locator('#chat-messages-container').evaluate(e=>e.scrollTop);
      assert.ok(Math.abs(before-after)<3,`stream moved viewport ${before} -> ${after}`);
      const start=await page.locator('#active-streaming-bubble').evaluate(e=>e.getBoundingClientRect().top);
      const viewport=await page.locator('#chat-messages-container').evaluate(e=>e.getBoundingClientRect().top);
      const question=await page.locator('.message-row.user').last().evaluate(e=>e.getBoundingClientRect().top);
      assert.ok(Math.abs(question-viewport)<25,'Sent question must remain at the reading anchor');
      assert.ok(start>question && start-viewport<180,'Answer start must remain visible below the question');
      await page.locator('#chat-messages-container').evaluate(e=>e.scrollTop+=100);
      const manual=await page.locator('#chat-messages-container').evaluate(e=>e.scrollTop);
      await page.evaluate(()=>testDone());await page.waitForTimeout(100);
      assert.ok(Math.abs(manual-await page.locator('#chat-messages-container').evaluate(e=>e.scrollTop))<3,'Completion moved user scroll position');
      assert.equal(await page.locator('.vedic-remedy-card,.muhurat-timeline-bar').count(),0);
      await page.evaluate(()=>{document.querySelectorAll('[id^="active-streaming-"]').forEach(e=>e.removeAttribute('id'));window.testDelta=null});
    }
    console.log('PASS desktop/mobile, short/long replies on both streaming routes: no token/completion scroll; manual reading preserved.');
    for(const width of [360,390,430,768,1280,1920]) {
      await page.setViewportSize({width,height:844});await page.waitForTimeout(100);
      const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,header:document.querySelector('#consultation-unified-header').getBoundingClientRect().top,composer:document.querySelector('.composer-wrapper').getBoundingClientRect().bottom}));
      assert.equal(geometry.overflow,false,`horizontal page overflow at ${width}`);
      assert.ok(Math.abs(geometry.header)<2,`header moved at ${width}`);
      assert.ok(geometry.composer<=845,`composer outside viewport at ${width}`);
      const edges=await page.evaluate(()=>{
        const assistant=[...document.querySelectorAll('.message-row.assistant')].at(-1);
        const user=[...document.querySelectorAll('.message-row.user')].at(-1);
        return {assistantLeft:assistant.getBoundingClientRect().left,
          userRight:innerWidth-user.querySelector('.user-bubble').getBoundingClientRect().right,
          dateWidth:document.querySelector('.chat-date-pill')?.getBoundingClientRect().width || 0};
      });
      assert.ok(edges.assistantLeft<=28,`assistant row is centred instead of left-aligned at ${width}`);
      assert.ok(edges.userRight<=40,`user bubble is centred instead of right-aligned at ${width}`);
      assert.ok(edges.dateWidth<200,`date pill stretches across the page at ${width}`);
    }
    await page.setViewportSize({width:1440,height:900});
    await page.evaluate(()=>ChatController.anchorAnswerStart([...document.querySelectorAll('.message-row.user')].at(-1)));
    await page.screenshot({path:'scratch/consultation-desktop-verified.png'});
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>ChatController.anchorAnswerStart([...document.querySelectorAll('.message-row.user')].at(-1)));
    await page.screenshot({path:'scratch/consultation-mobile-verified.png'});
    assert.deepEqual(errors,[]);
    console.log('PASS 360/390/430/768/1280/1920px: messages connect to opposite screen edges, compact date pill, fixed header/composer, no page overflow.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
