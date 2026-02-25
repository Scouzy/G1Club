import api from '../lib/axios';
import { User } from './authService';
import { Category } from './categoryService';

export interface Coach {
  id: string;
  userId: string;
  user: User;
  phone?: string;
  address?: string;
  qualifications?: string;
  experience?: string;
  bio?: string;
  specialties?: string;
  photoUrl?: string;
  categories?: Category[];
}

export const getCoaches = async () => {
  const response = await api.get<Coach[]>('/coaches');
  return response.data;
};

export const getCoachProfile = async (id: string) => {
  const response = await api.get<Coach>(`/coaches/${id}`);
  return response.data;
};

export const getCurrentCoachProfile = async () => {
  const response = await api.get<Coach>('/coaches/me');
  return response.data;
};

export const updateCoachProfile = async (id: string, data: Partial<Coach>) => {
  const response = await api.put<Coach>(`/coaches/${id}`, data);
  return response.data;
};

export interface CreateCoachData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  qualifications?: string;
  experience?: string;
  bio?: string;
  specialties?: string;
}

export const createCoach = async (data: CreateCoachData) => {
  const response = await api.post<Coach>('/coaches', data);
  return response.data;
};

export const deleteCoach = async (id: string) => {
  const response = await api.delete(`/coaches/${id}`);
  return response.data;
};

export const updateCoachCategories = async (id: string, categoryIds: string[]) => {
  const response = await api.put<Coach>(`/coaches/${id}/categories`, { categoryIds });
  return response.data;
};
