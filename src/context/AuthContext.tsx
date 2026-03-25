import React, { createContext, useContext, useState, useRef } from 'react';

export type UserRole = 'member' | 'coach' | 'manager' | null;

export interface AuthUser {
  role: UserRole;
  name: string;
  email: string;
  group?: string;
  paymentSetup: boolean;
  paymentMethod?: 'card' | 'link';
}

interface LoginAttempt {
  count: number;
  lockedUntil: number | null;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000;

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole, name: string, email: string, group?: string) => void;
  signUp: (name: string, email: string, role?: 'member' | 'coach') => void;
  completePaymentSetup: () => void;
  logout: () => void;
  recordLoginFailure: (email: string) => void;
  resetLoginAttempts: (email: string) => void;
  getLoginLockStatus: (email: string) => { locked: boolean; remainingSeconds: number };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  signUp: () => {},
  completePaymentSetup: () => {},
  logout: () => {},
  recordLoginFailure: () => {},
  resetLoginAttempts: () => {},
  getLoginLockStatus: () => ({ locked: false, remainingSeconds: 0 }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const loginAttemptsRef = useRef<Record<string, LoginAttempt>>({});

  const recordLoginFailure = (email: string) => {
    const key = email.toLowerCase();
    const now = Date.now();
    const prev = loginAttemptsRef.current[key] ?? { count: 0, lockedUntil: null };
    const newCount = prev.count + 1;
    loginAttemptsRef.current[key] = {
      count: newCount,
      lockedUntil: newCount >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION_MS : null,
    };
  };

  const resetLoginAttempts = (email: string) => {
    delete loginAttemptsRef.current[email.toLowerCase()];
  };

  const getLoginLockStatus = (email: string): { locked: boolean; remainingSeconds: number } => {
    const record = loginAttemptsRef.current[email.toLowerCase()];
    if (!record?.lockedUntil) return { locked: false, remainingSeconds: 0 };
    const remaining = record.lockedUntil - Date.now();
    if (remaining <= 0) {
      delete loginAttemptsRef.current[email.toLowerCase()];
      return { locked: false, remainingSeconds: 0 };
    }
    return { locked: true, remainingSeconds: Math.ceil(remaining / 1000) };
  };

  const login = (role: UserRole, name: string, email: string, group?: string) => {
    const paymentSetup = role === 'coach' || role === 'manager';
    setUser({ role, name, email, group, paymentSetup });
  };

  const signUp = (name: string, email: string, role: 'member' | 'coach' = 'member') => {
    // コーチは月謝設定不要
    const paymentSetup = role === 'coach';
    setUser({ role, name, email, paymentSetup });
  };

  const completePaymentSetup = () => {
    setUser(prev => prev ? { ...prev, paymentSetup: true } : null);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{
      user, login, signUp, completePaymentSetup, logout,
      recordLoginFailure, resetLoginAttempts, getLoginLockStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
