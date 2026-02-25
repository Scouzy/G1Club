import api from '../lib/axios';

export interface GlobalStats {
  counts: {
    sportifs: number;
    coaches: number;
    trainings: number;
    categories: number;
  };
  attendanceRate: number;
  recentTrainings: any[];
  nextTrainings: any[];
  recentMatches: any[];
  activityData: { name: string; count: number }[];
}

export interface SportifStats {
    attendance: {
        global: number;
        recent: number;
        totalSessions: number;
        presentSessions: number;
    };
    nextTrainings: any[];
    recentEvaluations: any[];
    matchParticipations: number;
    sportif: any;
}

export const getGlobalStats = async () => {
  const response = await api.get<GlobalStats>('/stats/global');
  return response.data;
};

export const getCategoryStats = async () => {
    const response = await api.get<any[]>('/stats/categories');
    return response.data;
};

export const getSportifStats = async () => {
    const response = await api.get<SportifStats>('/stats/sportif');
    return response.data;
};
