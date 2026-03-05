'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    name: string;
    password: string;
    email: string;
    gender: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = 'mini-board-token';
const REFRESH_KEY = 'mini-board-refresh';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const t = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api<User>('/users/me', { token: t });
      setUser(u);
      setToken(t);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setToken(null);
    };
    const onTokenUpdated = (e: Event) => {
      setToken((e as CustomEvent).detail);
    };
    window.addEventListener('auth-logout', onLogout);
    window.addEventListener('auth-token-updated', onTokenUpdated);
    return () => {
      window.removeEventListener('auth-logout', onLogout);
      window.removeEventListener('auth-token-updated', onTokenUpdated);
    };
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    setUser(res.user);
    setToken(res.accessToken);
  };

  const register = async (data: {
    username: string;
    name: string;
    password: string;
    email: string;
    gender: string;
  }) => {
    const res = await api<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    setUser(res.user);
    setToken(res.accessToken);
  };

  const logout = async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    try {
      await api('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refresh }),
      });
    } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      token: null,
      loading: false,
      login: async () => {},
      register: async () => {},
      logout: async () => {},
      refreshUser: async () => {},
    };
  }
  return ctx;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
