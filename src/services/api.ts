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
  ScheduledInspection,
  RecommendedAction,
  ActionPlanItem,
  ScoreTimelineEvent,
} from "../types";

import { getDefaultRecommendedActions } from "../data/recommendedActions";
import { analyzeEvidenceLocally, isVeterinaryActionPlan, VET_PLAN_MARKER } from "../utils/evidenceAnalysis";
import type { EvidenceAnalysis } from "../types";

const PRODUCTION_API = "https://agrisentinel-api.onrender.com";

function isNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("404") || msg.includes("not found");
}

function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return PRODUCTION_API;
  }
  return "http://localhost:8000";
}

const API_BASE = resolveApiBase();
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
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : "";
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

  async getRecommendedActions(
    incidentId: string,
    incidentType?: string
  ): Promise<RecommendedAction[]> {
    try {
      return await apiFetch<RecommendedAction[]>(`/incidents/${incidentId}/recommended-actions`);
    } catch (err) {
      if (incidentType && isNotFoundError(err)) {
        return getDefaultRecommendedActions(incidentType);
      }
      throw err;
    }
  },

  async sendActionPlan(
    incidentId: string,
    farmId: string,
    actions: ActionPlanItem[]
  ): Promise<{ incidentId: string; actionsCreated: number; actionIds: string[] }> {
    try {
      return await apiFetch(`/incidents/${incidentId}/action-plan`, {
        method: "POST",
        body: JSON.stringify({ actions }),
      });
    } catch (err) {
      if (!isNotFoundError(err)) throw err;
      const actionIds: string[] = [];
      for (const action of actions) {
        const body = action.veterinaryNote
          ? `${action.description}\n\nVeterinary note: ${action.veterinaryNote}`
          : action.description;
        const created = await apiFetch<CorrectiveAction>("/corrective-actions", {
          method: "POST",
          body: JSON.stringify({
            farmId,
            incidentId,
            title: action.title,
            description: `${VET_PLAN_MARKER}\n${body}`,
            priority: action.priority,
            assignedPerson: action.assignedPerson || "Farm Owner",
            deadline: action.deadline,
            evidenceRequired: action.evidenceRequired,
          }),
        });
        actionIds.push(created.id);
      }
      return { incidentId, actionsCreated: actionIds.length, actionIds };
    }
  },
};

export const correctiveActionService = {
  attachEvidenceAnalysis(action: CorrectiveAction): CorrectiveAction {
    if (action.evidenceAnalysis || !action.submittedEvidence) return action;
    return { ...action, evidenceAnalysis: analyzeEvidenceLocally(action) };
  },

  sortEvidenceQueue(actions: CorrectiveAction[]): CorrectiveAction[] {
    return [...actions]
      .filter((a) => a.submittedEvidence?.fileUrl)
      .sort((a, b) => {
        const vetA = isVeterinaryActionPlan(a) ? 0 : 1;
        const vetB = isVeterinaryActionPlan(b) ? 0 : 1;
        if (vetA !== vetB) return vetA - vetB;
        const ta = a.submittedEvidence?.timestamp ?? "";
        const tb = b.submittedEvidence?.timestamp ?? "";
        return tb.localeCompare(ta);
      });
  },

  async getAction(actionId: string): Promise<CorrectiveAction> {
    try {
      const action = await apiFetch<CorrectiveAction>(`/corrective-actions/${actionId}`);
      return correctiveActionService.attachEvidenceAnalysis(action);
    } catch (err) {
      if (!isNotFoundError(err)) throw err;
      const all = await correctiveActionService.getActions();
      const found = all.find((a) => a.id === actionId);
      if (!found) throw err;
      return correctiveActionService.attachEvidenceAnalysis(found);
    }
  },

  async getSubmittedEvidence(actionId: string): Promise<CorrectiveAction["submittedEvidence"]> {
    try {
      return await apiFetch<NonNullable<CorrectiveAction["submittedEvidence"]>>(
        `/corrective-actions/${actionId}/submitted-evidence`
      );
    } catch (err) {
      if (!isNotFoundError(err)) throw err;
      const action = await correctiveActionService.getAction(actionId);
      return action.submittedEvidence;
    }
  },

  async getActions(farmId?: string): Promise<CorrectiveAction[]> {
    const query = farmId ? `?farmId=${encodeURIComponent(farmId)}` : "";
    const list = await apiFetch<CorrectiveAction[]>(`/corrective-actions${query}`);
    return list.map((a) => correctiveActionService.attachEvidenceAnalysis(a));
  },

  async createAction(payload: {
    farmId: string;
    incidentId?: string;
    title: string;
    description: string;
    priority: string;
    assignedPerson: string;
    deadline: string;
    evidenceRequired?: boolean;
  }): Promise<CorrectiveAction> {
    return apiFetch<CorrectiveAction>("/corrective-actions", {
      method: "POST",
      body: JSON.stringify({
        farmId: payload.farmId,
        incidentId: payload.incidentId,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        assignedPerson: payload.assignedPerson,
        deadline: payload.deadline,
        evidenceRequired: payload.evidenceRequired ?? true,
      }),
    });
  },

  async submitEvidence(
    actionId: string,
    evidence: { file: File; notes: string; location: string }
  ): Promise<CorrectiveAction> {
    const form = new FormData();
    form.append("file", evidence.file);
    form.append("notes", evidence.notes);
    form.append("location", evidence.location);
    const result = await apiFetchForm<CorrectiveAction>(`/corrective-actions/${actionId}/evidence`, form);
    return correctiveActionService.attachEvidenceAnalysis(result);
  },

  async analyzeEvidence(actionId: string): Promise<EvidenceAnalysis> {
    try {
      return await apiFetch<EvidenceAnalysis>(`/corrective-actions/${actionId}/analyze-evidence`);
    } catch (err) {
      if (!isNotFoundError(err)) throw err;
      const all = await correctiveActionService.getActions();
      const action = all.find((a) => a.id === actionId);
      if (!action) throw err;
      return analyzeEvidenceLocally(action);
    }
  },

  async verifyAction(actionId: string, approved: boolean, notes?: string): Promise<CorrectiveAction> {
    return apiFetch<CorrectiveAction>(`/corrective-actions/${actionId}/verify`, {
      method: "POST",
      body: JSON.stringify({ approved, notes }),
    });
  },

  async getAwaitingVerification(): Promise<CorrectiveAction[]> {
    try {
      const list = await apiFetch<CorrectiveAction[]>("/corrective-actions/awaiting-verification");
      return correctiveActionService.sortEvidenceQueue(
        list.map((a) => correctiveActionService.attachEvidenceAnalysis(a))
      );
    } catch (err) {
      if (!isNotFoundError(err)) throw err;
      const all = await correctiveActionService.getActions();
      return correctiveActionService.sortEvidenceQueue(
        all
          .filter(
            (a) =>
              (a.status === "Evidence Submitted" || a.status === "Awaiting Verification") &&
              !!a.submittedEvidence?.fileUrl
          )
          .map((a) => correctiveActionService.attachEvidenceAnalysis(a))
      );
    }
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

  async recalculateFarm(farmId: string): Promise<RiskSummary> {
    return apiFetch<RiskSummary>(`/risk/farms/${farmId}/recalculate`, {
      method: "POST",
    });
  },

  async getScoreTimeline(farmId: string, days = 30): Promise<ScoreTimelineEvent[]> {
    return apiFetch<ScoreTimelineEvent[]>(`/risk/farms/${farmId}/timeline?days=${days}`);
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

  async getScheduledInspections(): Promise<ScheduledInspection[]> {
    return apiFetch<ScheduledInspection[]>("/officer/inspections");
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

  async getFarmProfile(farmId: string): Promise<{
    farm: Farm;
    openIncidents: number;
    openActions: number;
    incidentCount: number;
    actionCount: number;
  }> {
    return apiFetch(`/officer/farms/${encodeURIComponent(farmId)}/profile`);
  },

  async getFarmDetail(farmId: string): Promise<{
    farm: Farm;
    incidents: IncidentReport[];
    actions: CorrectiveAction[];
    passport: BiosecurityPassport | null;
    scheduledInspections: ScheduledInspection[];
    openIncidents: number;
    openActions: number;
    incidentCount: number;
    actionCount: number;
  }> {
    return apiFetch(`/officer/farms/${encodeURIComponent(farmId)}/detail`);
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
