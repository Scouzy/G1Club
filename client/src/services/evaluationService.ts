import api from '../lib/axios';

export interface Evaluation {
  id: string;
  date: string;
  type: 'TECHNIQUE' | 'PHYSIQUE' | 'TACTIQUE' | 'MENTAL' | 'GLOBAL';
  ratings: string; // JSON string from DB
  comment?: string;
  sportifId: string;
  coachId: string;
  trainingId?: string | null;
  coach?: { user: { name: string } };
  training?: {
    id: string;
    date: string;
    type: string;
    opponent?: string | null;
    result?: string | null;
  } | null;
}

export const getEvaluations = async (sportifId: string) => {
  const response = await api.get<Evaluation[]>('/evaluations', { params: { sportifId } });
  return response.data;
};

export const createEvaluation = async (data: Omit<Evaluation, 'id' | 'date' | 'coachId'>) => {
  const response = await api.post<Evaluation>('/evaluations', data);
  return response.data;
};

export const updateEvaluation = async (id: string, data: { ratings: any; comment?: string; trainingId?: string | null }) => {
  const response = await api.put<Evaluation>(`/evaluations/${id}`, data);
  return response.data;
};

export const deleteEvaluation = async (id: string) => {
  const response = await api.delete(`/evaluations/${id}`);
  return response.data;
};
