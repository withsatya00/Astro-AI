const {chromium}=require('@playwright/test');
const path=require('node:path');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const errors=[];
  for(const config of [{name:'desktop',width:1440,height:1024},{name:'mobile',width:390,height:844}]){
    const page=await browser.newPage({viewport:{width:config.width,height:config.height}});
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('file:///'+path.resolve(__dirname,'index.html').replaceAll('\\','/'));
    await page.waitForTimeout(250);
    await page.screenshot({path:path.join(__dirname,`${config.name}-homepage.png`),fullPage:true});
    const broken=await page.locator('img').evaluateAll(images=>images.filter(image=>!image.complete||!image.naturalWidth).map(image=>image.src));
    if(broken.length) throw Error(`Broken images (${config.name}): ${broken.join(', ')}`);
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)) throw Error(`Horizontal overflow on ${config.name}`);
    await page.locator('.primary').click();
    if(await page.locator('#toast').getAttribute('hidden')!==null) throw Error(`CTA interaction failed on ${config.name}`);
    await page.close();
  }
  if(errors.length) throw Error(errors.join('\n'));
  console.log('PASS: desktop/mobile responsive layout, all images, CTA interaction, no overflow or JS errors.');
  await browser.close();
})().catch(error=>{console.error(error);process.exitCode=1});
