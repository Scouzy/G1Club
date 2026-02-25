import React, { createContext, useContext, useEffect, useState } from 'react';
import { ClubSettings, getClubSettings } from '../services/clubService';

interface ClubContextValue {
  club: ClubSettings;
  setClub: (s: ClubSettings) => void;
}

const DEFAULT: ClubSettings = { id: '', clubName: 'G1Club' };

const ClubContext = createContext<ClubContextValue>({
  club: DEFAULT,
  setClub: () => {},
});

const getInitialClub = (): ClubSettings => {
  try {
    const stored = localStorage.getItem('club');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { id: parsed.id || '', clubName: parsed.clubName || parsed.name || 'G1Club', logoUrl: parsed.logoUrl };
    }
  } catch {}
  return DEFAULT;
};

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [club, setClubState] = useState<ClubSettings>(getInitialClub);

  const setClub = (s: ClubSettings) => {
    setClubState(s);
    localStorage.setItem('club', JSON.stringify(s));
  };

  const refreshClub = () => {
    const token = localStorage.getItem('token');
    if (token) {
      getClubSettings()
        .then(data => {
          setClubState(data);
          localStorage.setItem('club', JSON.stringify(data));
        })
        .catch(() => {});
    } else {
      setClubState(DEFAULT);
      localStorage.removeItem('club');
    }
  };

  useEffect(() => {
    // Always fetch fresh from API on mount (optionalAuth now decodes token server-side)
    refreshClub();

    // Listen for storage events (login/logout in same or other tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token') refreshClub();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ClubContext.Provider value={{ club, setClub }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => useContext(ClubContext);
