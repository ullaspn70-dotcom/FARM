import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserRole, Farm } from "../types";
import { initialFarm } from "../data/mockData";
import { farmService, authService } from "../services/api";

const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string }> = {
  farmer: { email: "farmer@bioshield.local", password: "farmer123" },
  veterinarian: { email: "vet@bioshield.local", password: "vet123" },
  officer: { email: "officer@bioshield.local", password: "officer123" },
};

async function loginDemoRole(nextRole: UserRole) {
  const creds = DEMO_CREDENTIALS[nextRole];
  await authService.login(creds.email, creds.password);
}

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeFarm: Farm;
  setActiveFarm: (farm: Farm) => void;
  allFarms: Farm[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>("farmer");
  const [activeFarm, setActiveFarm] = useState<Farm>(initialFarm);
  const [allFarms, setAllFarms] = useState<Farm[]>([initialFarm]);

  const loadFarms = async () => {
    const farms = await farmService.getAllFarms();
    if (farms.length > 0) {
      setAllFarms(farms);
      setActiveFarm((current) => {
        const stillExists = farms.find((f) => f.id === current.id);
        return stillExists || farms[0];
      });
    }
  };

  useEffect(() => {
    loginDemoRole("farmer")
      .then(() => loadFarms())
      .catch(() => {
        // Backend unavailable — keep initial mock farm for offline/demo fallback
      });
  }, []);

  const setRole = async (nextRole: UserRole) => {
    setRoleState(nextRole);
    try {
      await loginDemoRole(nextRole);
      await loadFarms();
    } catch (err) {
      console.error("Demo login failed:", err);
    }
  };

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
