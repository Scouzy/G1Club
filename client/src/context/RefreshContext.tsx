import React, { createContext, useContext, useState, useCallback } from 'react';

interface RefreshContextType {
  attendanceVersion: number;
  invalidateAttendance: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  attendanceVersion: 0,
  invalidateAttendance: () => {},
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [attendanceVersion, setAttendanceVersion] = useState(0);

  const invalidateAttendance = useCallback(() => {
    setAttendanceVersion(v => v + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ attendanceVersion, invalidateAttendance }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
