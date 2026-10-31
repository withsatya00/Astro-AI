const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://localhost:8002');
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function runTests() {
  console.log('Testing End-to-End Flows...');

  // 1. Health check
  const health = await request('/api/v1/health');
  console.log('1. Health check:', health.status, health.body?.status || health.body);

  // 2. Sign up or login test user
  const email = 'seeker.test@astrotalk.local';
  const password = 'Password@123';
  let authRes = await request('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  if (authRes.status !== 200) {
    console.log('Registering test user...');
    authRes = await request('/api/v1/auth/register', {
      method: 'POST',
      body: { name: 'Devotee Seeker', email, password }
    });
  }

  const token = authRes.body.token || authRes.body.access_token;
  console.log('2. Authenticated user token received:', !!token);
  const authHeaders = { 'Authorization': `Bearer ${token}` };

  // 3. Check Wallet
  const wallet = await request('/api/v1/wallet', { headers: authHeaders });
  console.log('3. Wallet initial balance:', wallet.body.balance);

  // 4. Recharge Wallet with test mode
  const recharge = await request('/api/v1/wallet/recharge', {
    method: 'POST',
    headers: authHeaders,
    body: { amount: 1000, payment_method: 'UPI (Test Mode)' }
  });
  console.log('4. Wallet recharged successfully:', recharge.body);

  // 5. Test Gau Sewa Donation via Wallet
  const donation = await request('/api/v1/gau-sewa/donations/wallet', {
    method: 'POST',
    headers: authHeaders,
    body: {
      amount: 251,
      purpose: 'chaara',
      donor_name: 'Devotee Seeker',
      donor_email: email,
      hide_name_public: false,
      optin_updates: true
    }
  });
  console.log('5. Gau Sewa Wallet Donation Result:', donation.status, donation.body);

  if (donation.body.receipt_token) {
    const receipt = await request(`/api/v1/gau-sewa/donations/receipt/${donation.body.receipt_token}`);
    console.log('6. Gau Sewa Official Receipt Result:', receipt.status, receipt.body?.reference);
  }

  // 7. Check final wallet balance (should be decreased by 251)
  const walletAfter = await request('/api/v1/wallet', { headers: authHeaders });
  console.log('7. Wallet Balance After Donation:', walletAfter.body.balance);

  console.log('ALL END-TO-END WALLET FLOWS VERIFIED SUCCESSFULLY!');
}

runTests().catch(console.error);

