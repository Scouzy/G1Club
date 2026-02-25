import api from '../lib/axios';

export interface TrainingSchedule {
  id: string;
  categoryId: string;
  dayOfWeek: number; // 1=Lundi ... 7=Dimanche
  startTime: string; // "HH:MM"
  duration: number;
  location?: string;
}

export const DAY_NAMES = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const getAllSchedules = async () => {
  const res = await api.get<TrainingSchedule[]>('/schedules');
  return res.data;
};

export const getSchedulesByCategory = async (categoryId: string) => {
  const res = await api.get<TrainingSchedule[]>(`/schedules/category/${categoryId}`);
  return res.data;
};

export const createSchedule = async (data: Omit<TrainingSchedule, 'id'>) => {
  const res = await api.post<TrainingSchedule>('/schedules', data);
  return res.data;
};

export const updateSchedule = async (id: string, data: Partial<TrainingSchedule>) => {
  const res = await api.put<TrainingSchedule>(`/schedules/${id}`, data);
  return res.data;
};

export const deleteSchedule = async (id: string) => {
  const res = await api.delete(`/schedules/${id}`);
  return res.data;
};
