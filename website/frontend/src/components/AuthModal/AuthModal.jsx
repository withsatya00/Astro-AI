import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLang } from '../../pages/BhaktiPage/lang.js';

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();
  const lang = useLang();
  const isHi = lang === 'hi';

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
      setErrorMessage(isHi ? 'कृपया ईमेल और पासवर्ड दोनों दर्ज करें।' : 'Please fill in both Email and Password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err) {
      setErrorMessage(err.message || (isHi ? 'लॉगिन असफल रहा। कृपया अपने विवरण जाँचें।' : 'Login failed. Please check your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!regName.trim()) {
      setErrorMessage(isHi ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your Full Name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage(isHi ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your Email address.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage(isHi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters long.');
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
      setErrorMessage(err.message || (isHi ? 'पंजीकरण असफल रहा। कृपया पुनः प्रयास करें।' : 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDEBD5] overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#FAF9F2] hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer border-0 transition-colors"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-b from-[#164B32] to-[#25050C] text-[#FFFDF8] pt-6 pb-5 px-6 text-center shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F2]/10 border border-[#C49A3A]/40 text-[#C49A3A] mx-auto flex items-center justify-center text-2xl font-serif mb-2 shadow-inner">
            ॐ
          </div>
          <h2 id="auth-modal-title" className="font-serif text-xl sm:text-2xl font-extrabold text-[#FFFDF8] tracking-wide">
            Astro Jyotish
          </h2>
          <p className="text-xs text-[#FDE68A] font-medium mt-0.5">
            {isHi ? 'प्रामाणिक वैदिक ज्योतिष एवं कुण्डली परामर्श' : 'Authentic Vedic Astrology & Kundli Guidance'}
          </p>
        </div>

        {/* Welcome Promotion Banner */}
        <div className="bg-[#FFF8E7] px-4 py-2 border-b border-[#EEDFB8] text-center shrink-0">
          <span className="text-[11px] font-bold text-[#8C5800] flex items-center justify-center gap-1.5">
            <span>🎁</span>
            <span>
              {isHi
                ? 'प्रथम परामर्श 5 मिनट निःशुल्क · कोड: '
                : 'First Consultation Free (5 Min) · Code: '}
              <strong className="text-[#164B32]">FIRSTFREE</strong>
            </span>
          </span>
        </div>

        {/* Tabs Switcher: Sign In vs Register */}
        <div className="flex border-b border-[#DDEBD5] bg-[#FAF9F2] shrink-0">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              tab === 'login'
                ? 'border-[#164B32] text-[#164B32] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isHi ? 'साइन इन करें' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              tab === 'register'
                ? 'border-[#164B32] text-[#164B32] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isHi ? 'नया खाता बनाएं' : 'Register Account'}
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
                <label className="block text-xs font-bold text-[#183C2B] mb-1">
                  {isHi ? 'ईमेल पता' : 'Email Address'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#183C2B]">
                    {isHi ? 'पासवर्ड' : 'Password'} <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => alert(isHi ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेजा गया है।' : 'Password reset link sent to your registered email.')}
                    className="text-[11px] font-semibold text-[#A77B25] hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    {isHi ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder={isHi ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none pr-10"
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
                className="w-full py-3 rounded-xl bg-[#164B32] hover:bg-[#520F20] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isHi ? 'साइन इन हो रहा है...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <span>{isHi ? 'साइन इन करें ➔' : 'Sign In ➔'}</span>
                )}
              </button>

              {/* Switch to Register */}
              <p className="text-center text-xs text-slate-500 pt-2">
                {isHi ? 'खाता नहीं है?' : "Don't have an account yet?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setErrorMessage('');
                  }}
                  className="font-bold text-[#164B32] hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  {isHi ? 'निःशुल्क रजिस्टर करें' : 'Register Free'}
                </button>
              </p>
            </form>
          ) : (
            /* TAB 2: REGISTER */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1">
                  {isHi ? 'पूरा नाम' : 'Full Name'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={isHi ? 'उदा. रमेश कुमार शर्मा' : 'e.g. Ramesh Kumar Sharma'}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1">
                  {isHi ? 'व्हाट्सएप मोबाइल नंबर' : 'WhatsApp Mobile Number'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder={isHi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isHi ? 'परामर्श अलर्ट एवं पूजा वीडियो प्राप्ति हेतु उपयोग होगा।' : 'Used for consultation alerts & puja video delivery.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1">
                  {isHi ? 'ईमेल पता' : 'Email Address'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1">
                  {isHi ? 'पासवर्ड' : 'Password'} <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder={isHi ? 'न्यूनतम 6 अक्षर' : 'Min 6 characters'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none pr-10"
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
                className="w-full py-3 rounded-xl bg-[#164B32] hover:bg-[#520F20] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isHi ? 'खाता बन रहा है...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <span>{isHi ? 'खाता बनाएं एवं ऑफर प्राप्त करें ➔' : 'Create Account & Claim Offer ➔'}</span>
                )}
              </button>

              {/* Switch to Login */}
              <p className="text-center text-xs text-slate-500 pt-2">
                {isHi ? 'पहले से पंजीकृत हैं?' : 'Already registered?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMessage('');
                  }}
                  className="font-bold text-[#164B32] hover:underline cursor-pointer bg-transparent border-0 p-0"
                >
                  {isHi ? 'साइन इन करें' : 'Sign In'}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
