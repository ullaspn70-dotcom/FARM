import type {
  Farm,
  BiosecurityPassport,
  IncidentReport,
  CorrectiveAction,
  RiskFactor,
  GisMapNode,
  OfficerStats,
  NotificationItem,
  UserRole,
  ChecklistItem,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_V1}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API error ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const farmService = {
  async getFarm(farmId: string): Promise<Farm> {
    return apiFetch<Farm>(`/farms/${farmId}`);
  },

  async getAllFarms(): Promise<Farm[]> {
    return apiFetch<Farm[]>("/farms");
  },

  async getChecklist(farmId: string): Promise<ChecklistItem[]> {
    return apiFetch<ChecklistItem[]>(`/farms/${farmId}/checklist`);
  },

  async updateChecklistItem(
    farmId: string,
    itemId: string,
    completed: boolean
  ): Promise<ChecklistItem> {
    return apiFetch<ChecklistItem>(`/farms/${farmId}/checklist/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
  },
};

export const passportService = {
  async getBiosecurityPassport(farmId: string): Promise<BiosecurityPassport> {
    return apiFetch<BiosecurityPassport>(`/farms/${farmId}/passport`);
  },
};

export const incidentService = {
  async getIncidents(farmId?: string): Promise<IncidentReport[]> {
    const query = farmId ? `?farm_id=${encodeURIComponent(farmId)}` : "";
    return apiFetch<IncidentReport[]>(`/incidents${query}`);
  },

  async submitIncident(
    newIncident: Omit<IncidentReport, "id" | "status" | "severity">
  ): Promise<IncidentReport> {
    return apiFetch<IncidentReport>("/incidents/json", {
      method: "POST",
      body: JSON.stringify({
        farmId: newIncident.farmId,
        incidentType: newIncident.incidentType,
        animalType: newIncident.animalType,
        numberAffected: newIncident.numberAffected,
        dateTime: newIncident.dateTime,
        description: newIncident.description,
        location: newIncident.location,
      }),
    });
  },

  async verifyIncident(
    incidentId: string,
    action: "validate" | "request_info" | "reject",
    notes?: string
  ): Promise<IncidentReport> {
    return apiFetch<IncidentReport>(`/incidents/${incidentId}/verify`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    });
  },
};

export const correctiveActionService = {
  async getActions(farmId?: string): Promise<CorrectiveAction[]> {
    const query = farmId ? `?farm_id=${encodeURIComponent(farmId)}` : "";
    return apiFetch<CorrectiveAction[]>(`/corrective-actions${query}`);
  },

  async submitEvidence(
    actionId: string,
    evidence: { fileUrl: string; fileName: string; notes: string; location: string }
  ): Promise<CorrectiveAction> {
    return apiFetch<CorrectiveAction>(`/corrective-actions/${actionId}/evidence/json`, {
      method: "POST",
      body: JSON.stringify(evidence),
    });
  },

  async verifyAction(actionId: string, approved: boolean): Promise<CorrectiveAction> {
    return apiFetch<CorrectiveAction>(`/corrective-actions/${actionId}/verify`, {
      method: "POST",
      body: JSON.stringify({ approved }),
    });
  },
};

export const riskService = {
  async getRiskFactors(farmId?: string): Promise<RiskFactor[]> {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : "";
    return apiFetch<RiskFactor[]>(`/risk/factors${query}`);
  },

  async getRiskHistory(farmId: string, days = 7): Promise<{ time: string; score: number }[]> {
    return apiFetch<{ time: string; score: number }[]>(
      `/risk/farms/${farmId}/history?days=${days}`
    );
  },
};

export const gisService = {
  async getGisMapNodes(): Promise<GisMapNode[]> {
    return apiFetch<GisMapNode[]>("/gis/nodes");
  },
};

export const officerService = {
  async getOfficerStats(): Promise<OfficerStats> {
    return apiFetch<OfficerStats>("/officer/stats");
  },
};

export const notificationService = {
  async getNotifications(role?: UserRole): Promise<NotificationItem[]> {
    const query = role ? `?role=${encodeURIComponent(role)}` : "";
    return apiFetch<NotificationItem[]>(`/notifications${query}`);
  },

  async markAsRead(id: string): Promise<void> {
    await apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" });
  },
};

export const authService = {
  async login(email: string, password: string) {
    const data = await apiFetch<{
      accessToken: string;
      refreshToken: string;
      user: { id: string; fullName: string; email: string; role: UserRole; farmIds: string[] };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    return data;
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};
