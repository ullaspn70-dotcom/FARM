import React from "react";
import {
  LayoutDashboard,
  FileBadge,
  AlertTriangle,
  FileSpreadsheet,
  CheckSquare,
  MapPin,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export type NavTab = "overview" | "passport" | "risk" | "incident" | "actions" | "gis" | "officer";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenPassport: () => void;
  onOpenReportIncident: () => void;
  onOpenAarohi?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenPassport,
  onOpenReportIncident,
  onOpenAarohi,
}) => {
  const { role } = useAuth();

  return (
    <aside className="bioshield-sidebar">
      <div className="sidebar-role-indicator">
        <span className="role-label">ACTIVE PORTAL</span>
        <strong className="role-name">
          {role === "farmer"
            ? "Farmer Operations"
            : role === "veterinarian"
            ? "Veterinary Verification"
            : "Government Field Command"}
        </strong>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-link ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard Overview</span>
        </button>

        <button
          className={`sidebar-link ${activeTab === "passport" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("passport");
            onOpenPassport();
          }}
        >
          <FileBadge size={18} />
          <span>Biosecurity Passport</span>
        </button>

        <button
          className={`sidebar-link ${activeTab === "risk" ? "active" : ""}`}
          onClick={() => setActiveTab("risk")}
        >
          <AlertTriangle size={18} />
          <span>Risk Analytics</span>
        </button>

        <button
          className={`sidebar-link ${activeTab === "incident" ? "active" : ""}`}
          onClick={() => setActiveTab("incident")}
        >
          <ShieldAlert size={18} />
          <span>
            {role === "veterinarian" ? "Incident Queue" : "Report & Track Incident"}
          </span>
        </button>

        <button
          className={`sidebar-link ${activeTab === "actions" ? "active" : ""}`}
          onClick={() => setActiveTab("actions")}
        >
          <CheckSquare size={18} />
          <span>Corrective Actions</span>
        </button>

        <button
          className={`sidebar-link ${activeTab === "gis" ? "active" : ""}`}
          onClick={() => setActiveTab("gis")}
        >
          <MapPin size={18} />
          <span>GIS Farm Map</span>
        </button>

        {(role === "officer" || role === "veterinarian") && (
          <button
            className={`sidebar-link ${activeTab === "officer" ? "active" : ""}`}
            onClick={() => setActiveTab("officer")}
          >
            <FileSpreadsheet size={18} />
            <span>Inspection Priorities</span>
          </button>
        )}
      </nav>

      {/* Quick Action Box for Farmer */}
      {role === "farmer" && (
        <div className="sidebar-quick-actions">
          <p className="quick-action-title">Quick Actions</p>
          <button className="btn-primary-action" onClick={onOpenReportIncident}>
            + Report Incident
          </button>
          <button className="btn-secondary-action" onClick={onOpenPassport}>
            View Passport Profile
          </button>
        </div>
      )}

      {/* Aarohi Farm Assistant Footer */}
      <div
        className="sidebar-assistant"
        role="button"
        tabIndex={0}
        onClick={onOpenAarohi}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpenAarohi?.();
        }}
      >
        <div className="assistant-avatar">A</div>
        <div className="assistant-info">
          <strong>Aarohi AI Assistant</strong>
          <span>Biosecurity Advisor — click for tips</span>
        </div>
        <HelpCircle size={16} className="assistant-help-icon" />
      </div>
    </aside>
  );
};
