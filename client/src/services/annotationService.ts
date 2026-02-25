import api from '../lib/axios';

export interface Annotation {
  id: string;
  content: string;
  type: 'TECHNIQUE' | 'POINT_FORT' | 'POINT_FAIBLE' | 'RECOMMANDATION';
  createdAt: string;
  coachId: string;
  coach?: {
      user: { name: string }
  };
  sportifId: string;
}

export const getAnnotations = async (sportifId: string) => {
  const response = await api.get<Annotation[]>('/annotations', { params: { sportifId } });
  return response.data;
};

export const createAnnotation = async (data: Omit<Annotation, 'id' | 'createdAt' | 'coachId'>) => {
  const response = await api.post<Annotation>('/annotations', data);
  return response.data;
};

export const deleteAnnotation = async (id: string) => {
  const response = await api.delete(`/annotations/${id}`);
  return response.data;
};
