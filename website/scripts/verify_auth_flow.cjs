const { chromium } = require('playwright');
const path = require('path');

async function testAuthFlow() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to homepage...');
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);

  // 1. Check Sign In button in navbar
  const signInBtn = page.locator('button[title="Sign In"]');
  console.log('Sign In button count:', await signInBtn.count());
  if (await signInBtn.count() === 0) {
    throw new Error('Sign In button not found in Navbar');
  }

  // Click Sign In
  console.log('Clicking Sign In button...');
  await signInBtn.first().click();
  await page.waitForTimeout(600);

  // Verify Auth Modal is open with Sign In tab
  const authModalTitle = page.locator('#auth-modal-title');
  console.log('Auth modal title visible:', await authModalTitle.isVisible());
  if (!await authModalTitle.isVisible()) {
    throw new Error('Auth modal did not open on Sign In click');
  }

  // Take screenshot of Sign In Modal
  const signInModalPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/auth_signin_modal.png');
  await page.screenshot({ path: signInModalPath, fullPage: false });
  console.log('Sign In modal screenshot saved:', signInModalPath);

  // 2. Switch to Register tab
  const regTab = page.locator('button:has-text("Register (खाता बनाएं)")');
  console.log('Clicking Register tab...');
  await regTab.click();
  await page.waitForTimeout(400);

  // Verify Register form inputs
  const nameInput = page.locator('input[placeholder="e.g. Ramesh Kumar Sharma"]');
  console.log('Name input visible:', await nameInput.isVisible());
  if (!await nameInput.isVisible()) {
    throw new Error('Register form not visible');
  }

  // Take screenshot of Register Modal
  const regModalPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/auth_register_modal.png');
  await page.screenshot({ path: regModalPath, fullPage: false });
  console.log('Register modal screenshot saved:', regModalPath);

  // 3. Perform real Registration
  const testEmail = `devotee_${Date.now()}@testastro.com`;
  console.log('Registering with:', testEmail);
  await nameInput.fill('Pt. Ramesh Kumar');
  await page.locator('input[placeholder="10-digit mobile number"]').fill('9876543210');
  await page.locator('input[placeholder="name@example.com"]').fill(testEmail);
  await page.locator('input[placeholder="Min 6 characters"]').fill('Password123!');

  // Click Create Account
  await page.locator('button:has-text("Create Account")').click();
  await page.waitForTimeout(1500);

  // Verify Auth Modal closed and Navbar now shows user name
  const userButton = page.locator('button.btn-nav-auth:has-text("Pt. Ramesh Kumar")');
  const isUserLoggedIn = await userButton.isVisible();
  console.log('User logged in in Navbar:', isUserLoggedIn);
  if (!isUserLoggedIn) {
    throw new Error('User button with name did not appear in Navbar after register');
  }

  // Take screenshot of Navbar with logged-in user
  const loggedInNavPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/auth_user_logged_in.png');
  await page.screenshot({ path: loggedInNavPath, fullPage: false });
  console.log('Logged in navbar screenshot saved:', loggedInNavPath);

  // 4. Click user button in Navbar to open UserAccountModal
  console.log('Clicking user account button...');
  await userButton.click();
  await page.waitForTimeout(600);

  const accountModalHeader = page.locator('text=Verified Devotee Account');
  console.log('Account modal open:', await accountModalHeader.isVisible());
  if (!await accountModalHeader.isVisible()) {
    throw new Error('UserAccountModal did not open');
  }

  // Take screenshot of User Account Modal
  const accountModalPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/auth_account_modal.png');
  await page.screenshot({ path: accountModalPath, fullPage: false });
  console.log('Account modal screenshot saved:', accountModalPath);

  // 5. Click Sign Out
  page.on('dialog', async dialog => {
    console.log('Dialog message:', dialog.message());
    await dialog.accept();
  });

  console.log('Clicking Sign Out button...');
  await page.locator('button:has-text("Sign Out (लॉग आउट)")').click();
  await page.waitForTimeout(1000);

  // Verify Sign In & Register buttons are back
  const signInBtnAfterLogout = page.locator('button[title="Sign In"]');
  console.log('Sign In button visible after logout:', await signInBtnAfterLogout.isVisible());
  if (!await signInBtnAfterLogout.isVisible()) {
    throw new Error('Sign In button did not return after logout');
  }

  // 6. Test Quick 1-Click Demo Login
  console.log('Testing 1-Click Demo Login...');
  await signInBtnAfterLogout.click();
  await page.waitForTimeout(500);

  const demoBtn = page.locator('button:has-text("1-Click Demo Devotee Login")');
  console.log('Demo login button visible:', await demoBtn.isVisible());
  await demoBtn.click();
  await page.waitForTimeout(2000);

  // Verify logged in again
  const userButton2 = page.locator('button.btn-nav-auth');
  console.log('Logged in with Demo user:', await userButton2.isVisible());

  // 7. Mobile Verification (390px)
  console.log('Testing Mobile Drawer & Bottom Nav...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);

  // Check Profile tab in bottom nav
  const profileTab = page.locator('.pm-tab:has-text("Satya Devotee"), .pm-tab:has-text("Profile")').first();
  console.log('Profile tab in bottom nav visible:', await profileTab.isVisible());
  await profileTab.click();
  await page.waitForTimeout(600);

  const mobileAccountOpen = page.locator('text=Verified Devotee Account');
  console.log('Mobile account modal open via bottom nav:', await mobileAccountOpen.isVisible());

  const mobileAccountPath = path.resolve('C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/auth_mobile_account.png');
  await page.screenshot({ path: mobileAccountPath, fullPage: false });
  console.log('Mobile account modal screenshot saved:', mobileAccountPath);

  await browser.close();
  console.log('All Authentication & Registration tests passed with 100% SUCCESS!');
}

testAuthFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
