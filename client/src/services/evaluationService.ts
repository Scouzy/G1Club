import api from '../lib/axios';

export interface Evaluation {
  id: string;
  date: string;
  type: 'TECHNIQUE' | 'PHYSIQUE' | 'TACTIQUE' | 'MENTAL';
  ratings: string; // JSON string from DB
  comment?: string;
  sportifId: string;
  coachId: string;
  coach?: {
      user: { name: string }
  };
}

export const getEvaluations = async (sportifId: string) => {
  const response = await api.get<Evaluation[]>('/evaluations', { params: { sportifId } });
  return response.data;
};

export const createEvaluation = async (data: Omit<Evaluation, 'id' | 'date' | 'coachId'>) => {
  const response = await api.post<Evaluation>('/evaluations', data);
  return response.data;
};

export const deleteEvaluation = async (id: string) => {
  const response = await api.delete(`/evaluations/${id}`);
  return response.data;
};
