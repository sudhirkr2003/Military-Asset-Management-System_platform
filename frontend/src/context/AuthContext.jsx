import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('mams_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('mams_user', JSON.stringify(res.data.data));
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (usernameOrEmail, password) => {
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
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mams_token');
    localStorage.removeItem('mams_user');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
