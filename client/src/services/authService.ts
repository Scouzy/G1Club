import api from '../lib/axios';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COACH' | 'SPORTIF';
  clubId?: string | null;
  club?: { id: string; name?: string; clubName?: string; logoUrl?: string } | null;
  isSuperAdmin?: boolean;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  message: string;
  userId: string;
}

export const login = async (credentials: any) => {
  const response = await api.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

export const register = async (userData: any) => {
  const response = await api.post<RegisterResponse>('/auth/register', userData);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  return null;
};
