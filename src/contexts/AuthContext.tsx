'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AuthState, getAuthStorage, setAuthStorage, clearAuthStorage } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface AuthContextType {
  auth: AuthState;
  setAuth: (auth: AuthState) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Decode JWT payload without external libraries.
 * Returns the payload object or null if invalid.
 */
function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Returns milliseconds until the token expires.
 * Returns 0 if already expired or invalid.
 */
function msUntilExpiry(token: string): number {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return 0;
  const expiresAt = payload.exp * 1000; // exp is in seconds
  const remaining = expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
    instituciones: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setAuthState({
      accessToken: null,
      refreshToken: null,
      user: null,
      instituciones: null,
    });
    clearAuthStorage();
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);

  /**
   * Attempt to refresh the access token.
   * On success, updates auth state. On failure, logs out.
   */
  const tryRefresh = useCallback(async (refreshToken: string, currentAuth: AuthState) => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        console.warn('Refresh token inválido o expirado, cerrando sesión');
        logout();
        return;
      }

      const data = await res.json();
      const newAuth: AuthState = {
        ...currentAuth,
        accessToken: data.accessToken,
      };
      setAuthState(newAuth);
      setAuthStorage(newAuth);
    } catch (err) {
      console.warn('Error al refrescar token:', err);
      logout();
    }
  }, [logout]);

  /**
   * Schedule a timer to refresh the token 30 seconds before it expires.
   * If the token is already expired, attempt refresh immediately.
   */
  const scheduleTokenRefresh = useCallback((currentAuth: AuthState) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!currentAuth.accessToken || !currentAuth.refreshToken) return;

    const remaining = msUntilExpiry(currentAuth.accessToken);

    if (remaining === 0) {
      // Already expired → try refresh immediately
      tryRefresh(currentAuth.refreshToken, currentAuth);
      return;
    }

    // Refresh 30 seconds before expiry (minimum 5 seconds)
    const refreshIn = Math.max(remaining - 30_000, 5_000);

    timerRef.current = setTimeout(() => {
      if (currentAuth.refreshToken) {
        tryRefresh(currentAuth.refreshToken, currentAuth);
      } else {
        logout();
      }
    }, refreshIn);
  }, [tryRefresh, logout]);

  // On mount: load from storage
  useEffect(() => {
    const stored = getAuthStorage();
    if (stored) {
      setAuthState(stored);
    }
    setIsLoading(false);
  }, []);

  // Whenever auth changes, reschedule the refresh timer
  useEffect(() => {
    scheduleTokenRefresh(auth);
  }, [auth, scheduleTokenRefresh]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Listen for 401 responses globally (catches any fetch that gets rejected)
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Sesión expirada') ||
          event.reason?.message?.includes('Token expirado')) {
        logout();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, [logout]);

  const setAuth = (newAuth: AuthState) => {
    setAuthState(newAuth);
    setAuthStorage(newAuth);
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
