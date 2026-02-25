import api from '../lib/axios';
import { User } from './authService';

export const getUsers = async () => {
  const response = await api.get<User[]>('/users');
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Add create/update if needed for full admin management
export const createUser = async (userData: any) => {
    const response = await api.post('/users', userData);
    return response.data;
};

export const updateUser = async (id: string, userData: any) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
};
