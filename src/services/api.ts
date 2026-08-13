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
  RiskSummary,
  SpatialRiskResponse,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

function parseApiError(text: string, status: number): string {
  try {
    const payload = JSON.parse(text) as {
      error?: { message?: string };
      detail?: string | { msg?: string }[];
    };
    if (payload.error?.message) return payload.error.message;
    if (typeof payload.detail === "string") return payload.detail;
    if (Array.isArray(payload.detail) && payload.detail[0]?.msg) {
      return payload.detail.map((d) => d.msg).join(", ");
    }
  } catch {
    // plain text error body
  }
  if (text) return text;
  return `Request failed (${status})`;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetchForm<T>(path: string, formData: FormData, method = "POST"): Promise<T> {
  const response = await fetch(`${API_V1}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(parseApiError(text, response.status));
  }

  return response.json() as Promise<T>;
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
    throw new Error(parseApiError(text, response.status));
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
    newIncident: Omit<IncidentReport, "id" | "status" | "severity">,
    evidenceFile?: File | null
  ): Promise<IncidentReport> {
    if (evidenceFile) {
      const form = new FormData();
      form.append("farm_id", newIncident.farmId);
      form.append("incident_type", newIncident.incidentType);
      form.append("animal_type", newIncident.animalType);
      form.append("number_affected", String(newIncident.numberAffected));
      form.append("date_time", newIncident.dateTime);
      form.append("description", newIncident.description);
      form.append("location", newIncident.location);
      form.append("evidence", evidenceFile);
      return apiFetchForm<IncidentReport>("/incidents", form);
    }

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
    evidence: { file: File; notes: string; location: string }
  ): Promise<CorrectiveAction> {
    const form = new FormData();
    form.append("file", evidence.file);
    form.append("notes", evidence.notes);
    form.append("location", evidence.location);
    return apiFetchForm<CorrectiveAction>(`/corrective-actions/${actionId}/evidence`, form);
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

  async getRiskSummary(farmId: string): Promise<RiskSummary> {
    return apiFetch<RiskSummary>(`/risk/farms/${farmId}/summary`);
  },
};

export const gisService = {
  async getGisMapNodes(farmType?: string, riskLevel?: string): Promise<GisMapNode[]> {
    const params = new URLSearchParams();
    if (farmType && farmType !== "all") params.set("farmType", farmType);
    if (riskLevel && riskLevel !== "all") params.set("riskLevel", riskLevel);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiFetch<GisMapNode[]>(`/gis/nodes${query}`);
  },

  async getSpatialRisk(farmId: string, radiusKm = 15): Promise<SpatialRiskResponse> {
    return apiFetch<SpatialRiskResponse>(
      `/gis/spatial-risk?farmId=${encodeURIComponent(farmId)}&radiusKm=${radiusKm}`
    );
  },
};

export const officerService = {
  async getOfficerStats(): Promise<OfficerStats> {
    return apiFetch<OfficerStats>("/officer/stats");
  },

  async getInspectionPriority(): Promise<Farm[]> {
    return apiFetch<Farm[]>("/officer/inspection-priority");
  },

  async scheduleInspection(
    farmId: string,
    scheduledAt: string,
    notes?: string
  ): Promise<{ id: string }> {
    return apiFetch<{ id: string }>("/officer/inspections", {
      method: "POST",
      body: JSON.stringify({ farmId, scheduledAt, notes }),
    });
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
