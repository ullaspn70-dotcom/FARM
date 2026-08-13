import type { ConnectivityState } from "../types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.trim()?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://agrisentinel-api.onrender.com"
    : "http://localhost:8000");

type Listener = (state: ConnectivityState) => void;

class ConnectivityService {
  private state: ConnectivityState = "CHECKING_CONNECTION";
  private listeners = new Set<Listener>();
  private checkTimer: number | null = null;

  getState(): ConnectivityState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private emit(state: ConnectivityState) {
    this.state = state;
    this.listeners.forEach((l) => l(state));
  }

  async checkServerReachable(): Promise<boolean> {
    if (!navigator.onLine) return false;
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE}/health`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      window.clearTimeout(timeout);
      return res.ok;
    } catch {
      return false;
    }
  }

  async refresh(): Promise<ConnectivityState> {
    this.emit("CHECKING_CONNECTION");
    if (!navigator.onLine) {
      this.emit("OFFLINE");
      return "OFFLINE";
    }
    const reachable = await this.checkServerReachable();
    const next: ConnectivityState = reachable ? "ONLINE" : "ONLINE_BUT_SERVER_UNREACHABLE";
    this.emit(next);
    return next;
  }

  start() {
    if (typeof window === "undefined") return;
    const onOnline = () => void this.refresh();
    const onOffline = () => this.emit("OFFLINE");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    void this.refresh();
    this.checkTimer = window.setInterval(() => void this.refresh(), 45000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (this.checkTimer) window.clearInterval(this.checkTimer);
    };
  }

  canSync(): boolean {
    return this.state === "ONLINE";
  }

  canUseOfflineFeatures(): boolean {
    return this.state === "OFFLINE" || this.state === "ONLINE_BUT_SERVER_UNREACHABLE";
  }
}

export const connectivityService = new ConnectivityService();
