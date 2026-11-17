import { apiRequest, storeSession } from './http.js';

// Browser-side leftovers of the previous person must not carry over to whoever signs in or out next.
const USER_SCOPED_KEYS = [
  'astroai_active_consultation',
  'astroai_chat_draft',
  'astroai_user_remedies',
  'astro_my_chart_ids',
  'astroai_astrologer_slug',
];

function clearUserScopedState() {
  try {
    USER_SCOPED_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem('astro_session_expired');
  } catch (e) { /* ignore */ }
}

// After sign-in, what this browser did as a guest (charts, chats) moves into the account.
async function claimGuestData() {
  try {
    await apiRequest('/auth/claim-guest', { method: 'POST', signal: AbortSignal.timeout(5000) });
  } catch (e) { /* best effort */ }
}

async function startSession(path, payload, fallbackError) {
  const data = await apiRequest(path, {
    method: 'POST',
    body: payload,
    signal: AbortSignal.timeout(30000),
    fallbackError,
  });
  if (!data || !data.access_token || !data.user) {
    throw new Error('Invalid sign-in response. Please try again.');
  }
  storeSession(data.access_token, data.user);
  await claimGuestData();
  return data.user;
}

export const authService = {
  login: ({ email, password }) => startSession('/auth/login', { email, password }, 'Invalid email or password'),

  register: ({ email, password, fullName, phone }) =>
    startSession(
      '/auth/register',
      { email, password, full_name: fullName || null, phone: phone || null },
      'Registration failed',
    ),

  me: () => apiRequest('/auth/me', { fallbackError: 'Could not load your account' }),

  logout() {
    storeSession(null, null);
    clearUserScopedState();
  },
};
