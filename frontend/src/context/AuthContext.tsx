import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  monthly_budget?: number;
  alert_at_80_percent?: boolean;
  alert_at_100_percent?: boolean;
  timezone?: string;
  personal_activity?: string | null;
  tastes?: string;
  monthly_income?: number;
  is_survey_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const data = await api.me();
        if (data.authenticated) {
          setUser(data.user);
          localStorage.setItem('finanz_user', JSON.stringify(data.user));
          localStorage.setItem('finanz_token', 'session_active');
        } else {
          setUser(null);
          localStorage.removeItem('finanz_user');
          localStorage.removeItem('finanz_token');
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem('finanz_user');
        localStorage.removeItem('finanz_token');
      } finally {
        setLoading(false);
      }
    };
    verifySession();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('finanz_token', token);
    localStorage.setItem('finanz_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Error logging out from backend:", err);
    }
    localStorage.removeItem('finanz_token');
    localStorage.removeItem('finanz_user');
    setUser(null);
  };

  const updateUser = (updatedData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedData };
      localStorage.setItem('finanz_user', JSON.stringify(newUser));
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
