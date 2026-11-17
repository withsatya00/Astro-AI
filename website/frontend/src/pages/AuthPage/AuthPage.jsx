import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLang } from '../BhaktiPage/lang.js';

export default function AuthPage({ initialMode = 'login' }) {
  const { currentUser, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = useLang();
  const isHi = lang === 'hi';

  const [tab, setTab] = useState(
    location.pathname.includes('register') || location.pathname.includes('signup') || initialMode === 'register'
      ? 'register'
      : 'login'
  );

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
      const from = location.state?.from || '/profile';
      navigate(from, { replace: true });
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
      const from = location.state?.from || '/profile';
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || (isHi ? 'पंजीकरण असफल रहा। कृपया पुनः प्रयास करें।' : 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    const displayName = currentUser.full_name || currentUser.email?.split('@')[0] || (isHi ? 'साधक' : 'Devotee');
    return (
      <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-[80vh] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#DDEBD5] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#C49A3A] text-[#164B32] font-bold text-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#183C2B] mb-1">
            {isHi ? `नमस्ते, ${displayName}` : `Welcome, ${displayName}`}
          </h1>
          <p className="text-xs text-slate-500 mb-6">{currentUser.email}</p>
          <div className="space-y-3">
            <Link
              to="/profile"
              className="block w-full py-3 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider no-underline shadow-sm hover:brightness-110 transition-all"
            >
              {isHi ? 'मेरी प्रोफ़ाइल देखें' : 'View My Profile'}
            </Link>
            <Link
              to="/astrologers"
              className="block w-full py-3 rounded-full bg-amber-50 text-[#8C5800] border border-amber-300 font-bold text-xs uppercase tracking-wider no-underline hover:bg-amber-100 transition-all"
            >
              {isHi ? 'ज्योतिषी परामर्श लें' : 'Consult Astrologers'}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 rounded-full text-rose-600 text-xs font-bold hover:bg-rose-50 cursor-pointer border border-rose-200 transition-all"
            >
              {isHi ? 'लॉग आउट करें' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-[85vh] py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DDEBD5] overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-b from-[#164B32] to-[#25050C] text-[#FFFDF8] pt-8 pb-6 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FAF9F2]/10 border border-[#C49A3A]/50 text-[#C49A3A] mx-auto flex items-center justify-center text-3xl font-serif mb-2 shadow-inner">
            ॐ
          </div>
          <h1 className="font-serif text-2xl font-extrabold text-[#FFFDF8] tracking-wide">
            Astro Jyotish
          </h1>
          <p className="text-xs text-[#FDE68A] font-medium mt-1">
            {isHi ? 'प्रामाणिक वैदिक ज्योतिष एवं कुण्डली परामर्श' : 'Authentic Vedic Astrology & Kundli Guidance'}
          </p>
        </div>

        {/* Promo Bar */}
        <div className="bg-[#FFF8E7] px-4 py-2.5 border-b border-[#EEDFB8] text-center">
          <span className="text-xs font-bold text-[#8C5800] flex items-center justify-center gap-1.5">
            <span>🎁</span>
            <span>
              {isHi
                ? 'प्रथम परामर्श 5 मिनट निःशुल्क · कोड: '
                : 'First Consultation Free (5 Min) · Code: '}
              <strong className="text-[#164B32]">FIRSTFREE</strong>
            </span>
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#DDEBD5] bg-[#FAF9F2]">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`flex-1 py-3.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
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
            className={`flex-1 py-3.5 text-xs font-bold transition-all cursor-pointer border-b-2 ${
              tab === 'register'
                ? 'border-[#164B32] text-[#164B32] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isHi ? 'नया खाता बनाएं' : 'Register Account'}
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="text-sm shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1.5">
                  {isHi ? 'ईमेल पता' : 'Email Address'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
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
                    className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent text-sm p-0"
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#164B32] hover:bg-[#520F20] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1.5">
                  {isHi ? 'पूरा नाम' : 'Full Name'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={isHi ? 'उदा. रमेश कुमार शर्मा' : 'e.g. Ramesh Kumar Sharma'}
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1.5">
                  {isHi ? 'व्हाट्सएप मोबाइल नंबर' : 'WhatsApp Mobile Number'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder={isHi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {isHi ? 'परामर्श अलर्ट एवं पूजा वीडियो प्राप्ति हेतु उपयोग होगा।' : 'Used for consultation alerts & puja video delivery.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1.5">
                  {isHi ? 'ईमेल पता' : 'Email Address'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#183C2B] mb-1.5">
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
                    className="w-full px-4 py-3 text-xs rounded-xl border border-slate-300 focus:border-[#164B32] focus:ring-1 focus:ring-[#164B32] outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent text-sm p-0"
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-[#164B32] hover:bg-[#520F20] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
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
