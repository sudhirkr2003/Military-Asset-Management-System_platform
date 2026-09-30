import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('mams_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('mams_token') || null);
  // Non-blocking: If token & user exist in localStorage, load immediately (0ms)
  const [loading, setLoading] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mams_token');
    localStorage.removeItem('mams_user');
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('mams_token');
      if (savedToken) {
        try {
          // Verify session in background without blocking UI
          const res = await api.get('/auth/me', { noBackgroundRevalidate: true });
          if (res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('mams_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          // If explicitly unauthorized (401), logout
          if (err?.response?.status === 401) {
            logout();
          }
        }
      }
    };

    initAuth();
  }, [logout]);

  const login = useCallback(async (usernameOrEmail, password) => {
    const res = await api.post('/auth/login', { usernameOrEmail, password });
    if (res.data?.data) {
      const { accessToken, user: userData } = res.data.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('mams_token', accessToken);
      localStorage.setItem('mams_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error('Invalid response structure from server');
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role || null,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      logout,
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
