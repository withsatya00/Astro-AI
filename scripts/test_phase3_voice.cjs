const { chromium } = require('@playwright/test');

async function testPhase3() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNTU3NTMzYy0xMWRmLTQ5M2ItYWIxNy1jZDhkOTM5ZGI3NmIiLCJlbWFpbCI6InRlc3RfZTRkZmZlNTZAYXN0cm9haS5jb20iLCJyb2xlIjoiY2xpZW50IiwiZXhwIjoxNzk0OTA2ODQ5fQ.0CfuCnXtwYWSoAns-Fps4oyX8yPERhLcQFsmvCkiZf4';

  await page.addInitScript((jwt) => {
    localStorage.setItem('astro_user', JSON.stringify({
      id: 'a557533c-11df-493b-ab17-cd8d939db76b',
      name: 'आदित्य शर्मा',
      full_name: 'आदित्य शर्मा',
      email: 'test_e4dffe56@astroai.com',
      role: 'client'
    }));
    localStorage.setItem('astro_access_token', jwt);
  }, token);

  console.log('Navigating to consultation room with Acharya Shastri...');
  await page.goto('http://localhost:3000/consultation/acharya-shastri', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Capture chat room with Listen buttons and Microphone dictation button
  await page.screenshot({ path: 'phase3_chat_listen_and_mic.png' });
  console.log('Saved phase3_chat_listen_and_mic.png');

  // Verify mic button is present
  const micBtn = page.locator('.cr-mic-btn');
  const micVisible = await micBtn.isVisible();
  console.log('Composer Microphone Button Visible:', micVisible);

  // Click on Call button to trigger VoiceCallModal
  const callBtn = page.locator('.cr-pill.call');
  const callVisible = await callBtn.isVisible();
  console.log('Top Bar Call Button Visible:', callVisible);

  if (callVisible) {
    console.log('Clicking Call button...');
    await callBtn.click();
    await page.waitForTimeout(1000);

    // Capture VoiceCallModal
    await page.screenshot({ path: 'phase3_voice_call_modal.png' });
    console.log('Saved phase3_voice_call_modal.png');
  }

  await browser.close();
  console.log('Phase 3 Voice AI testing completed successfully!');
}

testPhase3().catch(err => {
  console.error('Error during Phase 3 test:', err);
  process.exit(1);
});
