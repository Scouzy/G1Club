import api from '../lib/axios';

export interface ClubSettings {
  id: string;
  clubName: string;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  plan?: 'STARTER' | 'PRO';
  stripeCustomerId?: string | null;
  memberCount?: number;
}

export const getClubSettings = async (): Promise<ClubSettings> => {
  const res = await api.get<ClubSettings>('/club');
  return res.data;
};

export const updateClubSettings = async (data: Partial<ClubSettings>): Promise<ClubSettings> => {
  const res = await api.put<ClubSettings>('/club', data);
  return res.data;
};
