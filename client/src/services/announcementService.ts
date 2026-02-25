import api from '../lib/axios';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  clubId: string;
  authorId: string;
  author: { id: string; name: string };
}

export const getAnnouncements = async (): Promise<Announcement[]> => {
  const res = await api.get<Announcement[]>('/announcements');
  return res.data;
};

export const createAnnouncement = async (title: string, content: string): Promise<Announcement> => {
  const res = await api.post<Announcement>('/announcements', { title, content });
  return res.data;
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await api.delete(`/announcements/${id}`);
};
