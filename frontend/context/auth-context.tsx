'use client';

import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  loginError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [loginError, setLoginError] = useState<string | null>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        return res.data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: any) => api.post('/auth/login', credentials),
    onSuccess: (response) => {
      setLoginError(null);
      const accessToken = response.data?.access_token;
      if (accessToken && typeof window !== 'undefined') {
        localStorage.setItem('access_token', accessToken);
      }
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message;
      setLoginError(Array.isArray(message) ? message.join(', ') : message || error?.message || 'Login failed');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }
      queryClient.setQueryData(['me'], null);
    },
  });

  const login = async (credentials: any) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, loginError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
