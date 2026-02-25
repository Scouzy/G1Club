import api from '../lib/axios';
import { Category } from './categoryService';

export interface Sportif {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  height?: number;
  weight?: number;
  position?: string;
  categoryId: string;
  category?: Category;
  userId?: string;
  user?: {
      email: string;
      name: string;
  };
}

export const getSportifs = async (categoryId?: string) => {
  const params = categoryId ? { categoryId } : {};
  const response = await api.get<Sportif[]>('/sportifs', { params });
  return response.data;
};

export const getSportifById = async (id: string) => {
  const response = await api.get<Sportif>(`/sportifs/${id}`);
  return response.data;
};

export const getMyself = async () => {
  const response = await api.get<Sportif>('/sportifs/me');
  return response.data;
};

export const createSportif = async (data: Omit<Sportif, 'id'>) => {
  const response = await api.post<Sportif>('/sportifs', data);
  return response.data;
};

export const updateSportif = async (id: string, data: Partial<Sportif>) => {
  const response = await api.put<Sportif>(`/sportifs/${id}`, data);
  return response.data;
};

export const deleteSportif = async (id: string) => {
  const response = await api.delete(`/sportifs/${id}`);
  return response.data;
};
