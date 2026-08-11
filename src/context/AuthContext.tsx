import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserRole, Farm } from "../types";
import { initialFarm } from "../data/mockData";
import { farmService } from "../services/api";

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeFarm: Farm;
  setActiveFarm: (farm: Farm) => void;
  allFarms: Farm[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>("farmer");
  const [activeFarm, setActiveFarm] = useState<Farm>(initialFarm);
  const [allFarms, setAllFarms] = useState<Farm[]>([initialFarm]);

  useEffect(() => {
    farmService
      .getAllFarms()
      .then((farms) => {
        if (farms.length > 0) {
          setAllFarms(farms);
          setActiveFarm((current) => {
            const stillExists = farms.find((f) => f.id === current.id);
            return stillExists || farms[0];
          });
        }
      })
      .catch(() => {
        // Backend unavailable — keep initial mock farm for offline/demo fallback
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        activeFarm,
        setActiveFarm,
        allFarms,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
