import api from '../lib/axios';

export interface Category {
  id: string;
  name: string;
  color?: string | null;
  _count?: {
    sportifs: number;
    coaches: number;
  };
}

export const getCategories = async () => {
  const response = await api.get<Category[]>('/categories');
  return response.data;
};

export const createCategory = async (name: string, color?: string) => {
  const response = await api.post<Category>('/categories', { name, color });
  return response.data;
};

export const deleteCategory = async (id: string) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

export const updateCategory = async (id: string, name: string, color?: string | null) => {
    const response = await api.put<Category>(`/categories/${id}`, { name, color });
    return response.data;
};
