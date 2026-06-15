'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, getAuthStorage, setAuthStorage, clearAuthStorage } from '@/lib/auth';

interface AuthContextType {
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
    instituciones: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getAuthStorage();
    if (stored) {
      setAuthState(stored);
    }
    setIsLoading(false);
  }, []);

  const setAuth = (newAuth: AuthState) => {
    setAuthState(newAuth);
    setAuthStorage(newAuth);
  };

  const logout = () => {
    setAuthState({
      accessToken: null,
      refreshToken: null,
      user: null,
      instituciones: null,
    });
    clearAuthStorage();
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
}
