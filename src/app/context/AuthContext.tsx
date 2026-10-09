import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { normalizeRoleKey } from '../utils/roles';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (token exists)
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('userData');
    if (token && userData) {
      try {
        const storedUser = JSON.parse(userData) as User;
        const normalizedUser: User = { ...storedUser, role: normalizeRoleKey(storedUser.role) as User['role'] };
        if (normalizedUser.role !== storedUser.role) localStorage.setItem('userData', JSON.stringify(normalizedUser));
        setCurrentUser(normalizedUser);
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await authApi.login(email, password);
      const { token, refreshToken, user } = response.data.data;
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      const normalizedUser: User = { ...user, role: normalizeRoleKey(user.role) as User['role'] };
      localStorage.setItem('userData', JSON.stringify(normalizedUser));
      setCurrentUser(normalizedUser);
      return normalizedUser;
    } catch {
      return null;
    }
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
