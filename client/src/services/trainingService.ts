import api from '../lib/axios';
import { Category } from './categoryService';
import { Sportif } from './sportifService';

export interface Training {
  id: string;
  date: string;
  duration: number;
  type: string;
  objectives?: string;
  report?: string;
  location?: string;
  opponent?: string;
  result?: string;
  categoryId: string;
  category?: Category;
  coachId: string;
  coach?: {
      user: { name: string }
  };
  _count?: {
      attendances: number;
  }
}

export interface Attendance {
    id?: string;
    trainingId: string;
    sportifId: string;
    sportif?: Sportif;
    present: boolean;
    reason?: string;
}

export const getTrainings = async (filters?: { categoryId?: string, fromDate?: string, toDate?: string }) => {
  const response = await api.get<Training[]>('/trainings', { params: filters });
  return response.data;
};

export const getTrainingById = async (id: string) => {
  const response = await api.get<Training>(`/trainings/${id}`);
  return response.data;
};

export const createTraining = async (data: Omit<Training, 'id' | 'coachId'>) => {
  const response = await api.post<Training>('/trainings', data);
  return response.data;
};

export const updateTraining = async (id: string, data: Partial<Training>) => {
  const response = await api.put<Training>(`/trainings/${id}`, data);
  return response.data;
};

export const deleteTraining = async (id: string) => {
  const response = await api.delete(`/trainings/${id}`);
  return response.data;
};

export const updateAttendance = async (trainingId: string, attendances: Partial<Attendance>[]) => {
    const response = await api.put(`/trainings/${trainingId}/attendance`, { attendances });
    return response.data;
}
