import React from 'react';
import { ToastProvider } from '../context/ToastContext.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { WalletProvider } from '../context/WalletContext.jsx';

// Order matters: auth uses toasts, and the wallet follows the signed-in account.
export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <WalletProvider>{children}</WalletProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
