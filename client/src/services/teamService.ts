import api from '../lib/axios';

export interface TeamSportif {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  teamId?: string | null;
}

export interface Team {
  id: string;
  name: string;
  categoryId: string;
  createdAt: string;
  sportifs: TeamSportif[];
}

export const getTeamsByCategory = async (categoryId: string) => {
  const res = await api.get<Team[]>(`/teams/category/${categoryId}`);
  return res.data;
};

export const createTeam = async (categoryId: string, name: string) => {
  const res = await api.post<Team>(`/teams/category/${categoryId}`, { name });
  return res.data;
};

export const deleteTeam = async (id: string) => {
  const res = await api.delete(`/teams/${id}`);
  return res.data;
};

export const assignSportifToTeam = async (sportifId: string, teamId: string | null) => {
  const res = await api.put<TeamSportif>(`/teams/sportif/${sportifId}`, { teamId });
  return res.data;
};
