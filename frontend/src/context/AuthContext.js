import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { accountsApi } from '../api';

const AuthContext = createContext(null);

// Parse user from localStorage, clear storage if corrupted
const getStoredUser = () => {
  try {
    const savedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // If we have a user but missing tokens, clear everything
    if (savedUser && (!accessToken || !refreshToken)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return null;
    }
    
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return null;
  } catch (e) {
    // Corrupted data - clear everything and require re-login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Initialize from localStorage to avoid flash
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Only authenticated if we have both tokens AND valid user data
    const hasTokens = !!localStorage.getItem('accessToken') && !!localStorage.getItem('refreshToken');
    return hasTokens && !!getStoredUser();
  });

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const userData = await accountsApi.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        // Token invalid or expired and couldn't be refreshed
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const response = await accountsApi.login(credentials);
    
    // Validate tokens exist before storing
    if (!response.access || !response.refresh) {
      throw new Error('Invalid token response from server');
    }
    
    // JWT response has access and refresh tokens
    localStorage.setItem('accessToken', response.access);
    localStorage.setItem('refreshToken', response.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const register = async (userData) => {
    const response = await accountsApi.register(userData);
    
    // Validate tokens exist before storing
    if (!response.tokens?.access || !response.tokens?.refresh) {
      throw new Error('Invalid token response from server');
    }
    
    // JWT response has tokens object with access and refresh
    localStorage.setItem('accessToken', response.tokens.access);
    localStorage.setItem('refreshToken', response.tokens.refresh);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    setIsAuthenticated(true);
    return response;
  };

  const logout = async () => {
    try {
      await accountsApi.logout();
    } catch (error) {
      // Continue with local logout even if API call fails
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
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

export default AuthContext;
