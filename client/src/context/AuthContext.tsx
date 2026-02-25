import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, getCurrentUser, login as authLogin, logout as authLogout, register as authRegister } from '../services/authService';
import { ClubSettings } from '../services/clubService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  impersonateRole: (role: 'ADMIN' | 'COACH' | 'SPORTIF') => void;
  originalRole: 'ADMIN' | 'COACH' | 'SPORTIF' | null;
  clubId: string | null;
  club: Pick<ClubSettings, 'id' | 'clubName' | 'logoUrl'> | null;
  isSuperAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [originalRole, setOriginalRole] = useState<'ADMIN' | 'COACH' | 'SPORTIF' | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [club, setClub] = useState<Pick<ClubSettings, 'id' | 'clubName' | 'logoUrl'> | null>(null);
  const SUPER_ADMIN_EMAIL = 'admin@sportemergence.com';
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
      if (!originalRole) setOriginalRole(storedUser.role as any);
      const cid = (storedUser as any).clubId;
      if (cid) setClubId(cid);
      // Detect super admin by email (works even with old tokens)
      if ((storedUser as any).isSuperAdmin || storedUser.email === SUPER_ADMIN_EMAIL) setIsSuperAdmin(true);
      const storedClub = localStorage.getItem('club');
      if (storedClub) {
        try { setClub(JSON.parse(storedClub)); } catch {}
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const data = await authLogin(credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setOriginalRole(data.user.role);
      setIsSuperAdmin(data.user.isSuperAdmin === true || data.user.email === SUPER_ADMIN_EMAIL);
      if (data.user.clubId) {
        setClubId(data.user.clubId);
      }
      if (data.user.club) {
        const c = { id: data.user.club.id, clubName: data.user.club.name || data.user.club.clubName || '', logoUrl: data.user.club.logoUrl };
        setClub(c);
        localStorage.setItem('club', JSON.stringify(c));
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const impersonateRole = (role: 'ADMIN' | 'COACH' | 'SPORTIF') => {
    if (user && originalRole === 'ADMIN') { // Only true Admins can switch
      setUser({ ...user, role });
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      await authRegister(userData);
      // Optional: Auto login after register or redirect to login
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authLogout();
    localStorage.removeItem('club');
    setUser(null);
    setClubId(null);
    setClub(null);
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        impersonateRole,
        originalRole,
        clubId,
        club,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
