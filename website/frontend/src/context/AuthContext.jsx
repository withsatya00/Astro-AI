import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('astro_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('astro_access_token') || null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [authToast, setAuthToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setAuthToast({ message, type });
    setTimeout(() => {
      setAuthToast(null);
    }, 4000);
  }, []);

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode === 'register' ? 'register' : 'login');
    setIsAuthModalOpen(true);
    setIsAccountModalOpen(false);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openUserAccountModal = useCallback(() => {
    setIsAccountModalOpen(true);
    setIsAuthModalOpen(false);
  }, []);

  const closeUserAccountModal = useCallback(() => {
    setIsAccountModalOpen(false);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    if (!res.ok) {
      let errorMsg = 'Invalid email or password.';
      try {
        const errData = await res.json();
        if (errData && errData.detail) errorMsg = errData.detail;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const userObj = data.user || { email, role: 'client' };
    const accessToken = data.access_token;

    try {
      localStorage.setItem('astro_access_token', accessToken);
      localStorage.setItem('astro_user', JSON.stringify(userObj));
    } catch {}

    setToken(accessToken);
    setCurrentUser(userObj);
    setIsAuthModalOpen(false);

    // Sync window.App
    if (window.App) {
      window.App.currentUser = userObj;
    }
    window.dispatchEvent(new CustomEvent('astro:user-updated', { detail: { user: userObj } }));
    showToast(`Welcome back, ${userObj.full_name || userObj.email.split('@')[0]}!`, 'success');

    return userObj;
  }, [showToast]);

  const register = useCallback(async ({ email, password, full_name, phone }) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        full_name: full_name?.trim() || '',
        phone: phone?.trim() || '',
      }),
    });

    if (!res.ok) {
      let errorMsg = 'Registration failed. Please check your details.';
      try {
        const errData = await res.json();
        if (errData && errData.detail) errorMsg = errData.detail;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await res.json();
    const userObj = data.user || { email, full_name, phone, role: 'client' };
    const accessToken = data.access_token;

    try {
      localStorage.setItem('astro_access_token', accessToken);
      localStorage.setItem('astro_user', JSON.stringify(userObj));
    } catch {}

    setToken(accessToken);
    setCurrentUser(userObj);
    setIsAuthModalOpen(false);

    // Sync window.App
    if (window.App) {
      window.App.currentUser = userObj;
    }
    window.dispatchEvent(new CustomEvent('astro:user-updated', { detail: { user: userObj } }));
    showToast(`Account created! Welcome to Astro Jyotish, ${userObj.full_name || 'Devotee'}!`, 'success');

    return userObj;
  }, [showToast]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('astro_access_token');
      localStorage.removeItem('astro_user');
    } catch {}

    setToken(null);
    setCurrentUser(null);
    setIsAccountModalOpen(false);

    if (window.App) {
      window.App.currentUser = null;
    }
    window.dispatchEvent(new CustomEvent('astro:user-updated', { detail: { user: null } }));
    showToast('Signed out successfully.', 'info');
  }, [showToast]);

  // Synchronize window.App so legacy JS & all modules can seamlessly trigger auth modals
  useEffect(() => {
    window.App = window.App || {};
    window.App.currentUser = currentUser;
    window.App.openAuthModal = openAuthModal;
    window.App.openUserAccountModal = openUserAccountModal;
    window.App.handleLogout = logout;
    window.App.showToast = showToast;
  }, [currentUser, openAuthModal, openUserAccountModal, logout, showToast]);

  // Listen to cross-module custom event
  useEffect(() => {
    const handleStorageUpdate = (e) => {
      if (e.key === 'astro_user') {
        try {
          setCurrentUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setCurrentUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        isAuthModalOpen,
        authModalMode,
        isAccountModalOpen,
        openAuthModal,
        closeAuthModal,
        openUserAccountModal,
        closeUserAccountModal,
        login,
        register,
        logout,
        showToast,
      }}
    >
      {children}

      {/* Global Toast Notification */}
      {authToast && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-fade-in transition-all text-xs font-semibold bg-white border-[#E7E2D8] text-[#1E1B4B]">
          <span className="text-base">
            {authToast.type === 'success' ? '✅' : authToast.type === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span className="flex-1">{authToast.message}</span>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
