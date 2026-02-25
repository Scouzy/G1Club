import api from '../lib/axios';

export interface ClubSettings {
  id: string;
  clubName: string;
  logoUrl?: string;
  address?: string;
  city?: string;
  email?: string;
  phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  linkedin?: string;
}

export const getClubSettings = async (): Promise<ClubSettings> => {
  const res = await api.get<ClubSettings>('/club');
  return res.data;
};

export const updateClubSettings = async (data: Partial<ClubSettings>): Promise<ClubSettings> => {
  const res = await api.put<ClubSettings>('/club', data);
  return res.data;
};
