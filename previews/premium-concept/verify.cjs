const {chromium}=require('@playwright/test');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+path.resolve(__dirname,'index.html').replaceAll('\\','/'));
  for(const mode of ['light','dark']){
    await page.getByRole('button',{name:mode==='light'?'Light':'Dark',exact:true}).click();
    await page.waitForTimeout(350);
    await page.screenshot({path:path.join(__dirname,`desktop-${mode}.png`),fullPage:true});
  }
  await page.getByRole('button',{name:'Mobile',exact:true}).click();
  await page.waitForTimeout(500);
  for(const mode of ['dark','light']){
    await page.getByRole('button',{name:mode==='light'?'Light':'Dark',exact:true}).click();
    await page.waitForTimeout(350);
    await page.locator('#viewport').screenshot({path:path.join(__dirname,`mobile-${mode}.png`),style:".preview-bar{display:none!important}"});
  }
  await page.locator('.bottom-nav button[data-page="chat"]').click();
  await page.locator('#message-input').fill('Career question');
  await page.locator('.composer button').click();await page.waitForTimeout(2100);
  if(!(await page.locator('#messages').innerText()).includes('sample response'))throw Error('Chat demo failed');
  await page.locator('.bottom-nav button[data-page="home"]').click();
  await page.locator('.plus-banner button').click();await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Loading demo',exact:true}).click();
  if(await page.locator('#home-cards .skeleton').count()!==4)throw Error('Skeleton missing');
  await page.waitForTimeout(2300);
  const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));
  if(broken.length)throw Error('Broken images: '+broken.join(','));
  if(await page.locator('.viewport').evaluate(el=>el.scrollWidth>el.clientWidth+1))throw Error('Mobile layout overflows');
  await page.setViewportSize({width:390,height:844});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw Error('Phone viewport overflows');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: photos, light/dark, mobile layout, chat, Plus modal, skeleton loading; no JS errors.');
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
