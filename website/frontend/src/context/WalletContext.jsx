import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import WalletModal from '../components/WalletModal/WalletModal.jsx';
import { walletService } from '../services/walletService.js';
import { useAuth } from './AuthContext.jsx';

const WalletContext = createContext(null);

const EMPTY_WALLET = { balance: 0, transactions: [], isTestMode: false, paymentsAvailable: false };

export const formatRupees = (amount) => `₹${Number(amount || 0).toFixed(2)}`;

export function WalletProvider({ children }) {
  const { user, isSignedIn, openAuth } = useAuth();
  const [wallet, setWallet] = useState(EMPTY_WALLET);
  const [isOpen, setIsOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await walletService.getStatus();
      setWallet({
        balance: Number(data.balance) || 0,
        transactions: data.transactions || [],
        isTestMode: !!data.is_test_mode,
        paymentsAvailable: !!data.payments_available,
      });
    } catch (e) {
      // Keep the last known balance; the modal shows an error when the user acts.
    }
  }, []);

  // Balance belongs to the signed-in account: reload on sign-in, clear on sign-out.
  useEffect(() => {
    if (isSignedIn) refresh();
    else setWallet(EMPTY_WALLET);
  }, [user, isSignedIn, refresh]);

  const recharge = useCallback(async (amount, paymentMethod) => {
    const result = await walletService.recharge(amount, paymentMethod);
    await refresh();
    return result;
  }, [refresh]);

  // Recharging needs an account, so guests are asked to sign in first.
  const openWallet = useCallback(() => {
    if (!isSignedIn) {
      openAuth('login');
      return;
    }
    setIsOpen(true);
    refresh();
  }, [isSignedIn, openAuth, refresh]);

  const value = useMemo(() => ({
    ...wallet,
    formattedBalance: formatRupees(wallet.balance),
    refresh,
    recharge,
    openWallet,
  }), [wallet, refresh, recharge, openWallet]);

  return (
    <WalletContext.Provider value={value}>
      {children}
      <WalletModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used inside <WalletProvider>');
  return ctx;
}
