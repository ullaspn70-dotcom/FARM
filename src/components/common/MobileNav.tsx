import React from "react";
import { LayoutDashboard, FileBadge, AlertTriangle, ShieldAlert, CheckSquare, MapPin, X } from "lucide-react";
import type { NavTab } from "./Sidebar";

interface MobileNavProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenPassport: () => void;
  onOpenReportIncident: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  onOpenPassport,
  onOpenReportIncident,
}) => {
  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && <div className="mobile-drawer-backdrop" onClick={onClose} />}

      {/* Slide-over Mobile Drawer */}
      <div className={`mobile-drawer ${isOpen ? "open" : ""}`}>
        <div className="mobile-drawer-header">
          <div>
            <h3 className="drawer-title">AgriSentinel Navigation</h3>
            <span className="drawer-sub">AgriSentinel Portal • SIH260487</span>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </button>
        </div>

        <div className="mobile-drawer-menu">
          <button
            className={`drawer-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("overview");
              onClose();
            }}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard Overview</span>
          </button>

          <button
            className={`drawer-item ${activeTab === "passport" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("passport");
              onOpenPassport();
              onClose();
            }}
          >
            <FileBadge size={20} />
            <span>Biosecurity Passport</span>
          </button>

          <button
            className={`drawer-item ${activeTab === "risk" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("risk");
              onClose();
            }}
          >
            <AlertTriangle size={20} />
            <span>Risk Analytics</span>
          </button>

          <button
            className={`drawer-item ${activeTab === "incident" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("incident");
              onClose();
            }}
          >
            <ShieldAlert size={20} />
            <span>Incident Management</span>
          </button>

          <button
            className={`drawer-item ${activeTab === "actions" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("actions");
              onClose();
            }}
          >
            <CheckSquare size={20} />
            <span>Corrective Actions</span>
          </button>

          <button
            className={`drawer-item ${activeTab === "gis" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("gis");
              onClose();
            }}
          >
            <MapPin size={20} />
            <span>GIS Farm Map</span>
          </button>
        </div>

        <div className="mobile-drawer-footer">
          <button
            className="btn-primary-action w-full"
            onClick={() => {
              onOpenReportIncident();
              onClose();
            }}
          >
            + Report Incident
          </button>
        </div>
      </div>

      {/* Bottom Sticky Navigation Bar for Phones */}
      <div className="mobile-bottom-bar">
        <button
          className={`bottom-bar-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <LayoutDashboard size={20} />
          <span>Home</span>
        </button>

        <button
          className={`bottom-bar-item ${activeTab === "passport" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("passport");
            onOpenPassport();
          }}
        >
          <FileBadge size={20} />
          <span>Passport</span>
        </button>

        <button
          className="bottom-bar-item highlight-btn"
          onClick={onOpenReportIncident}
        >
          <ShieldAlert size={22} />
          <span>Report</span>
        </button>

        <button
          className={`bottom-bar-item ${activeTab === "actions" ? "active" : ""}`}
          onClick={() => setActiveTab("actions")}
        >
          <CheckSquare size={20} />
          <span>Actions</span>
        </button>

        <button
          className={`bottom-bar-item ${activeTab === "gis" ? "active" : ""}`}
          onClick={() => setActiveTab("gis")}
        >
          <MapPin size={20} />
          <span>GIS Map</span>
        </button>
      </div>
    </>
  );
};
