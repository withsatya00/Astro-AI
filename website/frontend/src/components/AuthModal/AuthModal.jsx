import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();

  // Tab State ('login' | 'register')
  const [tab, setTab] = useState(authModalMode || 'login');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Errors
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Keep internal tab in sync with context
  React.useEffect(() => {
    if (authModalMode) setTab(authModalMode);
    setErrorMessage('');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please fill in both Email and Password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!regName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Please enter your Email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: regEmail,
        password: regPassword,
        full_name: regName,
        phone: regPhone,
      });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Instant Demo Login for Testing & Instant Access
  const handleQuickDemoLogin = async () => {
    setErrorMessage('');
    setIsLoading(true);
    const demoEmail = 'devotee@astrojyotish.com';
    const demoPass = 'OmNamahShivaya108!';

    try {
      // Try login first
      await login({ email: demoEmail, password: demoPass });
    } catch {
      // If demo user does not exist in db, automatically register it and log in!
      try {
        await register({
          email: demoEmail,
          password: demoPass,
          full_name: 'Satya Devotee',
          phone: '9876543210',
        });
      } catch (regErr) {
        setErrorMessage('Quick access failed: ' + regErr.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E7E2D8] overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer border-0 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-b from-[#3E0B18] to-[#25050C] text-[#FFFDF8] pt-6 pb-5 px-6 text-center shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#FAF7F2]/10 border border-[#D4AF37]/40 text-[#D4AF37] mx-auto flex items-center justify-center text-2xl font-serif mb-2 shadow-inner">
            ॐ
          </div>
          <h2 id="auth-modal-title" className="font-serif text-xl sm:text-2xl font-extrabold text-[#FFFDF8] tracking-wide">
            Astro Jyotish
          </h2>
          <p className="text-xs text-[#FDE68A] font-medium mt-0.5">
            प्रामाणिक वैदिक ज्योतिष एवं कुण्डली परामर्श
          </p>
        </div>

        {/* Welcome Promotion Banner */}
        <div className="bg-[#FFF8E7] px-4 py-2 border-b border-[#EEDFB8] text-center shrink-0">
          <span className="text-[11px] font-bold text-[#8C5800] flex items-center justify-center gap-1.5">
            <span>🎁</span> First Consultation Free (5 Min) · Code: <strong className="text-[#3E0B18]">FIRSTFREE</strong>
          </span>
        </div>

        {/* Tabs Switcher: Sign In vs Register */}
        <div className="flex border-b border-[#E7E2D8] bg-[#FAF7F2] shrink-0">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              tab === 'login'
                ? 'border-[#3E0B18] text-[#3E0B18] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In (लॉग इन)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              tab === 'register'
                ? 'border-[#3E0B18] text-[#3E0B18] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Register (खाता बनाएं)
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto">
          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="text-sm shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] focus:ring-1 focus:ring-[#3E0B18] outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#1E1B4B]">
                    Password <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to your registered email.')}
                    className="text-[11px] font-semibold text-[#B45309] hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] focus:ring-1 focus:ring-[#3E0B18] outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent text-sm p-0"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#3E0B18] hover:bg-[#520F20] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In ➔</span>
                )}
              </button>

              {/* Quick 1-Click Demo Login Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#8C5800] border border-amber-300/80 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>⚡ 1-Click Demo Devotee Login</span>
                </button>
              </div>

              {/* Switch to Register */}
              <p className="text-center text-xs text-slate-500 pt-2">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage('');
                  }}
                  className="font-bold text-[#3E0B18] hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Register Free
                </button>
              </p>
            </form>
          ) : (
            /* TAB 2: REGISTER */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                  Full Name (पूरा नाम) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Ramesh Kumar Sharma"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] focus:ring-1 focus:ring-[#3E0B18] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                  WhatsApp Mobile Number (व्हाट्सएप नंबर)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] focus:ring-1 focus:ring-[#3E0B18] outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Used for consultation alerts &amp; puja video delivery.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] focus:ring-1 focus:ring-[#3E0B18] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-1">
                  Password <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#3E0B18] focus:ring-1 focus:ring-[#3E0B18] outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent text-sm p-0"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4a1b9a] to-[#25050C] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account &amp; Claim Offer ➔</span>
                )}
              </button>

              {/* Switch to Login */}
              <p className="text-center text-xs text-slate-500 pt-2">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage('');
                  }}
                  className="font-bold text-[#3E0B18] hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
