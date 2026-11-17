import { apiRequest } from './http.js';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const el = Object.assign(document.createElement('script'), {
      src: RAZORPAY_SCRIPT,
      onload: resolve,
      onerror: () => reject(new Error('Payment window could not load. Check your connection.')),
    });
    document.head.appendChild(el);
  });
}

async function payWithRazorpay(amount) {
  const order = await apiRequest('/wallet/razorpay/order', {
    method: 'POST',
    body: { amount },
    fallbackError: 'Could not start the payment',
  });
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: 'Astro Jyotish',
      description: 'Wallet recharge',
      handler: (response) => {
        apiRequest('/wallet/razorpay/verify', {
          method: 'POST',
          body: response,
          fallbackError: 'Payment could not be verified',
        }).then(resolve, reject);
      },
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    checkout.open();
  });
}

export const walletService = {
  /** { balance, currency, symbol, is_test_mode, payments_available, transactions[] } */
  getStatus: () => apiRequest('/wallet', { fallbackError: 'Failed to fetch wallet status' }),

  async getPaymentConfig() {
    try {
      return await apiRequest('/wallet/payment-config');
    } catch (e) {
      return { provider: 'unavailable' };
    }
  },

  /** Real payments (Razorpay) when the backend has keys; otherwise the backend's test-mode recharge. */
  async recharge(amount, paymentMethod) {
    const config = await this.getPaymentConfig();
    if (config.provider === 'razorpay') return payWithRazorpay(amount);
    if (config.provider === 'unavailable') throw new Error('Online payments are not available right now.');
    return apiRequest('/wallet/recharge', {
      method: 'POST',
      body: { amount, payment_method: paymentMethod },
      fallbackError: 'Wallet recharge failed',
    });
  },
};
