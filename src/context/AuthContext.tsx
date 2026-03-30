/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Uses simulated Firebase service for authentication.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  loginAsAdmin as firebaseLoginAsAdmin,
  isAdmin as checkIsAdmin,
} from '@/services/firebaseService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  loginAsAdmin: () => Promise<{ error: string | null }>;
  register: (email: string, password: string, displayName: string, role?: 'business' | 'user') => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const result = await loginUser(email, password);
    if (result.user) {
      setUser(result.user);
    }
    setIsLoading(false);
    return { error: result.error };
  };

  const loginAsAdmin = async () => {
    setIsLoading(true);
    const result = await firebaseLoginAsAdmin();
    if (result.user) {
      setUser(result.user);
    }
    setIsLoading(false);
    return { error: result.error };
  };

  const register = async (email: string, password: string, displayName: string, role: User['role'] = 'business') => {
    setIsLoading(true);
    const result = await registerUser(email, password, displayName, role);
    if (result.user) {
      setUser(result.user);
    }
    setIsLoading(false);
    return { error: result.error };
  };

  const logout = async () => {
    setIsLoading(true);
    await logoutUser();
    setUser(null);
    setIsLoading(false);
  };

  const isAdminUser = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: isAdminUser,
        login,
        loginAsAdmin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
