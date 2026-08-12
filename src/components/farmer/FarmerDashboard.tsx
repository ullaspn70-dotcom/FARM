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
import { useLocale, useTranslation } from "../../context/LocaleContext";
import { StatusBadge } from "../common/StatusBadge";
import { farmService, incidentService, riskService } from "../../services/api";
import type { ChecklistItem, IncidentReport, RiskFactor } from "../../types";

interface FarmerDashboardProps {
  onOpenPassport: () => void;
  onOpenReportIncident: () => void;
  onNavigateToActions: () => void;
  onNavigateToRisk: () => void;
  onNavigateToActionCenter?: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onOpenPassport,
  onOpenReportIncident,
  onNavigateToActions,
  onNavigateToRisk,
}) => {
  const { activeFarm } = useAuth();
  const { t } = useTranslation();
  const { suggestFromFarmLocation } = useLocale();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    suggestFromFarmLocation(activeFarm.location);
  }, [activeFarm.location, suggestFromFarmLocation]);

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
          setLoadError(t("dashboard.loadError"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeFarm.id, t]);

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

  const riskKey = activeFarm.riskLevel === "safe" ? "safe" : activeFarm.riskLevel === "caution" ? "caution" : "critical";

  const advisorTitle =
    topRiskFactor?.label ??
    (activeFarm.riskLevel === "critical"
      ? t("dashboard.advisor.urgent")
      : activeFarm.riskLevel === "caution"
      ? t("dashboard.advisor.review")
      : t("dashboard.advisor.update"));

  const advisorMessage =
    topRiskFactor?.description ??
    (activeFarm.riskLevel === "safe"
      ? t("dashboard.advisor.safe")
      : activeFarm.riskLevel === "caution"
      ? t("dashboard.advisor.caution")
      : t("dashboard.advisor.critical"));

  const animalLabel =
    activeFarm.farmType === "poultry" ? t("common.birds") : t("common.pigs");

  return (
    <div className="farmer-dashboard-view">
      <div className="dashboard-header-card">
        <div className="header-meta">
          <div className="farm-type-pills">
            <StatusBadge type="farmType" value={activeFarm.farmType} />
            <span className="farm-id-code">{t("common.farmId")}: {activeFarm.id}</span>
            <span className="location-tag">📍 {activeFarm.location}</span>
          </div>

          <h2 className="farm-title-name">{activeFarm.name}</h2>
          <p className="farm-subtitle">
            {t("dashboard.registeredOwner")}: <strong>{activeFarm.owner}</strong> •{" "}
            {t("dashboard.totalPopulation")}:{" "}
            <strong>
              {activeFarm.animalCount.toLocaleString()} {animalLabel}
            </strong>
          </p>
        </div>

        <div className="header-action-buttons">
          <button className="btn-primary-report" onClick={onOpenReportIncident}>
            <ShieldAlert size={18} />
            <span>{t("dashboard.reportIncident")}</span>
          </button>

          <button className="btn-secondary-passport" onClick={onOpenPassport}>
            <FileBadge size={18} />
            <span>{t("dashboard.viewPassport")}</span>
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
            <span className="banner-eyebrow">{t("dashboard.biosecurityStatus")}</span>
            <h3 className="banner-heading">{t(`dashboard.risk.${riskKey}.title`)}</h3>
            <p className="banner-subtext">{t(`dashboard.risk.${riskKey}.desc`)}</p>
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
                {scoreDelta} {t("dashboard.scoreTrend")}
              </span>
            </div>
          </div>
          <button className="btn-why-risk" onClick={onNavigateToRisk}>
            {t("dashboard.whyScoreChanged")} →
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
            <span className="metric-label">{t("dashboard.complianceRate")}</span>
            <strong className="metric-value">{activeFarm.complianceRate}%</strong>
            <span className="metric-sub text-green">{t("common.target")}: &gt;85%</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-amber">
            <ClipboardList size={20} color="#D97706" />
          </div>
          <div className="metric-details">
            <span className="metric-label">{t("dashboard.checklistRoutine")}</span>
            <strong className="metric-value">
              {completedCount} / {checklist.length || "—"}
            </strong>
            <span className="metric-sub">
              {checklist.length === 0
                ? t("common.loading")
                : completedCount === checklist.length
                ? t("dashboard.checklistCompleted")
                : t("dashboard.checklistPending", {
                    count: checklist.length - completedCount,
                  })}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-blue">
            <CheckCircle2 size={20} color="#2563EB" />
          </div>
          <div className="metric-details">
            <span className="metric-label">{t("dashboard.vaccinationRate")}</span>
            <strong className="metric-value">{activeFarm.vaccinationCoverage}%</strong>
            <span className="metric-sub">{t("dashboard.vaccinationDocumented")}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-bg bg-red">
            <AlertCircle size={20} color="#DC2626" />
          </div>
          <div className="metric-details">
            <span className="metric-label">{t("dashboard.pendingActions")}</span>
            <strong className="metric-value">{activeFarm.activeAlerts}</strong>
            <button className="btn-text-link" onClick={onNavigateToActions}>
              {t("dashboard.viewActions")} →
            </button>
          </div>
        </div>
      </div>

      <div className="farmer-content-grid">
        <div className="card-panel">
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">{t("dashboard.checklistEyebrow")}</span>
              <h3 className="panel-title">{t("dashboard.checklistTitle")}</h3>
            </div>
            <span className="progress-badge">
              {t("dashboard.checklistCompletedBadge", {
                done: completedCount,
                total: checklist.length || 0,
              })}
            </span>
          </div>

          <div className="checklist-items-list">
            {checklist.length === 0 ? (
              <p className="timeline-desc">{t("dashboard.checklistEmpty")}</p>
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
                  {!item.completed && (
                    <span className="action-tag-urgent">{t("dashboard.actionDue")}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-panel">
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">{t("dashboard.eventsEyebrow")}</span>
              <h3 className="panel-title">{t("dashboard.eventsTitle")}</h3>
            </div>
            <span className="live-pill">{t("common.live")}</span>
          </div>

          <div className="events-timeline">
            {incidents.length === 0 ? (
              <p className="timeline-desc">{t("dashboard.eventsEmpty")}</p>
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
                    <span className="zone-tag">
                      {t("dashboard.location")}: {incident.location}
                    </span>
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
          <span className="aarohi-eyebrow">{t("dashboard.advisorEyebrow")}</span>
          <h4 className="aarohi-title">{advisorTitle}</h4>
          <p className="aarohi-message">{advisorMessage}</p>
          <div className="aarohi-actions">
            <button className="btn-aarohi-action" onClick={onNavigateToActions}>
              {t("dashboard.advisorOpenActions")} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
