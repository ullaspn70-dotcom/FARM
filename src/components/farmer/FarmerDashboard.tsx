import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  FileBadge,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../common/StatusBadge";
import { farmService, incidentService, riskService } from "../../services/api";
import type { ChecklistItem, IncidentReport, RiskFactor } from "../../types";

interface FarmerDashboardProps {
  onOpenPassport: () => void;
  onOpenReportIncident: () => void;
  onNavigateToActions: () => void;
  onNavigateToRisk: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onOpenPassport,
  onOpenReportIncident,
  onNavigateToActions,
  onNavigateToRisk,
}) => {
  const { activeFarm } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadError("");

    Promise.all([
      farmService.getChecklist(activeFarm.id),
      incidentService.getIncidents(activeFarm.id),
      riskService.getRiskFactors(activeFarm.id),
    ])
      .then(([checklistItems, farmIncidents, factors]) => {
        if (!cancelled) {
          setChecklist(checklistItems);
          setIncidents(farmIncidents);
          setRiskFactors(factors);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChecklist([]);
          setIncidents([]);
          setRiskFactors([]);
          setLoadError("Unable to load farm data. Please refresh the page.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeFarm.id]);

  const completedCount = checklist.filter((c) => c.completed).length;
  const scoreDelta = activeFarm.biosecurityScore - activeFarm.previousScore;
  const topRiskFactor = [...riskFactors].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta)
  )[0];

  const toggleCheck = async (item: ChecklistItem) => {
    const nextCompleted = !item.completed;
    setChecklist((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, completed: nextCompleted } : entry
      )
    );

    try {
      const updated = await farmService.updateChecklistItem(
        activeFarm.id,
        item.id,
        nextCompleted
      );
      setChecklist((prev) =>
        prev.map((entry) => (entry.id === item.id ? updated : entry))
      );
    } catch {
      setChecklist((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, completed: item.completed } : entry
        )
      );
    }
  };

  const advisorTitle =
    topRiskFactor?.label ??
    (activeFarm.riskLevel === "critical"
      ? "Urgent Biosecurity Action Required"
      : activeFarm.riskLevel === "caution"
      ? "Review Pending Protocol Items"
      : "Farm Status Update");

  const advisorMessage =
    topRiskFactor?.description ??
    (activeFarm.riskLevel === "safe"
      ? "No active bio-pathogen anomalies detected. Continue routine sanitation and checklist verification."
      : activeFarm.riskLevel === "caution"
      ? "One or more risk factors need attention. Review corrective actions to protect your biosecurity score."
      : "Active risk factors detected. Follow quarantine and disinfection protocols immediately.");

  return (
    <div className="farmer-dashboard-view">
      <div className="dashboard-header-card">
        <div className="header-meta">
          <div className="farm-type-pills">
            <StatusBadge type="farmType" value={activeFarm.farmType} />
            <span className="farm-id-code">ID: {activeFarm.id}</span>
            <span className="location-tag">📍 {activeFarm.location}</span>
          </div>

          <h2 className="farm-title-name">{activeFarm.name}</h2>
          <p className="farm-subtitle">
            Registered Owner: <strong>{activeFarm.owner}</strong> • Total Population:{" "}
            <strong>
              {activeFarm.animalCount.toLocaleString()}{" "}
              {activeFarm.farmType === "poultry" ? "birds" : "pigs"}
            </strong>
          </p>
        </div>

        <div className="header-action-buttons">
          <button className="btn-primary-report" onClick={onOpenReportIncident}>
            <ShieldAlert size={18} />
            <span>Report Incident</span>
          </button>

          <button className="btn-secondary-passport" onClick={onOpenPassport}>
            <FileBadge size={18} />
            <span>View Passport</span>
          </button>
        </div>
      </div>

      <section className={`biosecurity-risk-banner ${activeFarm.riskLevel}`}>
        <div className="banner-left">
          <div className={`risk-indicator-icon ${activeFarm.riskLevel}`}>
            {activeFarm.riskLevel === "safe" ? (
              <CheckCircle2 size={32} />
            ) : activeFarm.riskLevel === "caution" ? (
              <AlertCircle size={32} />
            ) : (
              <ShieldAlert size={32} />
            )}
          </div>

          <div className="banner-text">
            <span className="banner-eyebrow">CONTINUOUS BIOSECURITY STATUS</span>
            <h3 className="banner-heading">
              {activeFarm.riskLevel === "safe"
                ? "Low Bio-Risk Level — Optimal Safeguards"
                : activeFarm.riskLevel === "caution"
                ? "Medium Risk — Attention Required"
                : "High Bio-Risk — Urgent Action Recommended"}
            </h3>
            <p className="banner-subtext">
              {activeFarm.riskLevel === "safe"
                ? "No active bio-pathogen anomalies detected across farm zones. Continue routine sanitation."
                : activeFarm.riskLevel === "caution"
                ? "Disinfection protocol or visitor record delay detected. Resolve pending items to protect score."
                : "Active incident nearby or sanitation breach observed. Quarantine guidelines triggered."}
            </p>
          </div>
        </div>

        <div className="banner-right">
          <div className="score-box">
            <span className="score-number">{activeFarm.biosecurityScore}</span>
            <span className="score-max">/100</span>
            <div className="score-trend-badge">
              {scoreDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>
                {scoreDelta >= 0 ? "+" : ""}
                {scoreDelta} points (recent trend)
              </span>
            </div>
          </div>
          <button className="btn-why-risk" onClick={onNavigateToRisk}>
            Why did score change? →
          </button>
        </div>
      </section>

      {loadError && (
        <div className="form-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{loadError}</span>
        </div>
      )}

      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-bg bg-green">
            <Activity size={20} color="#154D38" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Compliance Rate</span>
            <strong className="metric-value">{activeFarm.complianceRate}%</strong>
            <span className="metric-sub text-green">Target: &gt;85%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-amber">
            <ClipboardList size={20} color="#D97706" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Checklist Routine</span>
            <strong className="metric-value">
              {completedCount} / {checklist.length || "—"}
            </strong>
            <span className="metric-sub">
              {checklist.length === 0
                ? "Loading..."
                : completedCount === checklist.length
                ? "100% Completed"
                : `${checklist.length - completedCount} Item(s) Pending`}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-blue">
            <CheckCircle2 size={20} color="#2563EB" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Vaccination Rate</span>
            <strong className="metric-value">{activeFarm.vaccinationCoverage}%</strong>
            <span className="metric-sub">Fully Documented</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-red">
            <AlertCircle size={20} color="#DC2626" />
          </div>
          <div className="metric-details">
            <span className="metric-label">Pending Actions</span>
            <strong className="metric-value">{activeFarm.activeAlerts}</strong>
            <button className="btn-text-link" onClick={onNavigateToActions}>
              View Actions →
            </button>
          </div>
        </div>
      </div>

      <div className="farmer-content-grid">
        <div className="card-panel">
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">DAILY BIO-SECURITY PROTOCOL</span>
              <h3 className="panel-title">Routine Verification Checklist</h3>
            </div>
            <span className="progress-badge">
              {completedCount}/{checklist.length || 0} Completed
            </span>
          </div>

          <div className="checklist-items-list">
            {checklist.length === 0 ? (
              <p className="timeline-desc">No checklist items loaded for this farm.</p>
            ) : (
              checklist.map((item) => (
                <div
                  key={item.id}
                  className={`checklist-item-row ${item.completed ? "completed" : "pending"}`}
                  onClick={() => toggleCheck(item)}
                >
                  <div className={`check-checkbox ${item.completed ? "checked" : ""}`}>
                    {item.completed && <CheckCircle2 size={16} />}
                  </div>
                  <span className="item-label">{item.title}</span>
                  {!item.completed && <span className="action-tag-urgent">Action Due</span>}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-panel">
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">REAL-TIME MONITORING</span>
              <h3 className="panel-title">Recent Farm Log Events</h3>
            </div>
            <span className="live-pill">LIVE</span>
          </div>

          <div className="events-timeline">
            {incidents.length === 0 ? (
              <p className="timeline-desc">No incidents recorded for this farm yet.</p>
            ) : (
              incidents.slice(0, 4).map((incident) => (
                <div key={incident.id} className="timeline-item">
                  <div
                    className={`timeline-dot ${
                      incident.status === "Verified" || incident.status === "Rejected"
                        ? "resolved"
                        : "active"
                    }`}
                  />
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <strong>{incident.incidentType}</strong>
                      <span className="timeline-time">
                        {new Date(incident.dateTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="timeline-desc">{incident.description}</p>
                    <span className="zone-tag">Location: {incident.location}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="aarohi-tip-banner">
        <div className="aarohi-avatar-large">A</div>
        <div className="aarohi-content">
          <span className="aarohi-eyebrow">AAROHI BIOSECURITY ADVISOR TIP</span>
          <h4 className="aarohi-title">{advisorTitle}</h4>
          <p className="aarohi-message">{advisorMessage}</p>
          <div className="aarohi-actions">
            <button className="btn-aarohi-action" onClick={onNavigateToActions}>
              Open Corrective Actions List <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
