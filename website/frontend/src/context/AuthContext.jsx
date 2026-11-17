import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AuthModal from '../components/AuthModal/AuthModal.jsx';
import { authService } from '../services/authService.js';
import { getStoredUser, getToken, setUnauthorizedHandler, storeSession } from '../services/http.js';

const AuthContext = createContext(null);

const readSession = () => (getToken() ? getStoredUser() : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);
  // 'login' | 'register' | null
  const [authMode, setAuthMode] = useState(null);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // An expired or revoked token drops the app back to guest mode.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      storeSession(null, null);
      setUser(null);
    });
  }, []);

  // Confirm the stored session with the server once on load.
  useEffect(() => {
    if (!getToken()) return;
    authService.me()
      .then((profile) => {
        storeSession(getToken(), profile);
        setUser(profile);
      })
      .catch((e) => {
        if (e.status === 401) logout();
      });
  }, [logout]);

  // Sign-in or sign-out in another tab.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'astro_access_token' || e.key === 'astro_user') setUser(readSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (credentials) => {
    const signedIn = await authService.login(credentials);
    setUser(signedIn);
    setAuthMode(null);
    return signedIn;
  }, []);

  const register = useCallback(async (details) => {
    const signedIn = await authService.register(details);
    setUser(signedIn);
    setAuthMode(null);
    return signedIn;
  }, []);

  const openAuth = useCallback((mode = 'login') => {
    setAuthMode(mode === 'register' ? 'register' : 'login');
  }, []);

  const closeAuth = useCallback(() => setAuthMode(null), []);

  const value = useMemo(() => ({
    user,
    isSignedIn: !!user,
    displayName: user ? (user.full_name || user.name || user.email) : '',
    login,
    register,
    logout,
    openAuth,
  }), [user, login, register, logout, openAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {authMode && (
        <AuthModal mode={authMode} onModeChange={setAuthMode} onClose={closeAuth} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
