import React from "react";
import { AlertTriangle, CheckCircle2, Upload, Bell } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LocaleContext";
import {
  useActionCenterData,
  getCriticalGaps,
  getNextAction,
  getActiveIncidents,
} from "../../hooks/useActionCenterData";
import { StatusBadge } from "../common/StatusBadge";
import { ScoreTrendChart } from "./ScoreTrendChart";

interface BiosecurityActionCenterProps {
  onSubmitEvidence?: () => void;
  onNavigateToActions?: () => void;
}

export const BiosecurityActionCenter: React.FC<BiosecurityActionCenterProps> = ({
  onSubmitEvidence,
  onNavigateToActions,
}) => {
  const { activeFarm, role } = useAuth();
  const { t } = useTranslation();
  const { farm, summary, history, checklist, incidents, actions, notifications, loading, error } =
    useActionCenterData(activeFarm.id, role);

  const gaps = getCriticalGaps(checklist);
  const activeIncidents = getActiveIncidents(incidents);
  const nextAction = getNextAction(actions);
  const displayFarm = farm ?? activeFarm;
  const score = summary?.biosecurityScore ?? displayFarm.biosecurityScore;

  if (loading) {
    return <div className="action-center-view loading-state">{t("common.loading")}</div>;
  }

  return (
    <div className="action-center-view">
      <div className="action-center-header">
        <div>
          <span className="eyebrow-text">{t("actionCenter.title")}</span>
          <h2 className="view-title">{displayFarm.name}</h2>
          <p className="view-subtitle">{t("actionCenter.subtitle")}</p>
        </div>
        <StatusBadge type="risk" value={summary?.riskLevel ?? displayFarm.riskLevel} size="lg" />
      </div>

      {error && (
        <div className="form-error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      <div className="action-center-score-banner">
        <div className="ac-score-main">
          <span className="ac-score-label">{t("score.current")}</span>
          <strong className="ac-score-value">
            {score}
            <span className="ac-score-max">/100</span>
          </strong>
        </div>
        {history.length >= 2 && (
          <div className="ac-score-trend">
            <span className="ac-trend-label">{t("score.trend")}</span>
            <ScoreTrendChart history={history.slice(-5)} compact />
          </div>
        )}
      </div>

      <div className="action-center-grid">
        <section className="ac-section">
          <h3>
            <AlertTriangle size={18} />
            {t("actionCenter.criticalGaps")}
          </h3>
          {gaps.length === 0 ? (
            <p className="ac-empty">{t("actionCenter.noGaps")}</p>
          ) : (
            <ul className="ac-gap-list">
              {gaps.slice(0, 5).map((gap) => (
                <li key={gap.id}>{gap.title}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="ac-section">
          <h3>{t("actionCenter.activeIncidents")}</h3>
          {activeIncidents.length === 0 ? (
            <p className="ac-empty">{t("actionCenter.noIncidents")}</p>
          ) : (
            activeIncidents.slice(0, 3).map((inc) => (
              <div key={inc.id} className="ac-incident-card">
                <strong>{inc.incidentType}</strong>
                <StatusBadge type="incident" value={inc.status} size="sm" />
                <span className="ac-incident-id">#{inc.id}</span>
              </div>
            ))
          )}
        </section>

        <section className="ac-section ac-section-wide">
          <h3>{t("actionCenter.correctiveActions")}</h3>
          {actions.length === 0 ? (
            <p className="ac-empty">{t("actionCenter.noActions")}</p>
          ) : (
            <div className="ac-actions-list">
              {actions.slice(0, 4).map((act) => (
                <div key={act.id} className="ac-action-row">
                  <div>
                    <strong>{act.title}</strong>
                    <span className={`priority-badge priority-${act.priority}`}>
                      {act.priority.toUpperCase()}
                    </span>
                  </div>
                  <StatusBadge type="action" value={act.status} size="sm" />
                  {act.evidenceRequired && !act.submittedEvidence && (
                    <span className="ac-evidence-pending">{t("actionCenter.evidencePending")}</span>
                  )}
                  {act.verificationStatus === "Verified" && (
                    <span className="ac-evidence-verified">
                      <CheckCircle2 size={14} /> {t("actionCenter.evidenceVerified")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ac-section ac-next-action">
          <h3>{t("actionCenter.nextAction")}</h3>
          {nextAction ? (
            <>
              <p className="ac-next-desc">{nextAction.title}</p>
              <p className="ac-next-deadline">{nextAction.deadline}</p>
              {role === "farmer" && (
                <button
                  className="btn-primary-action"
                  onClick={onSubmitEvidence ?? onNavigateToActions}
                >
                  <Upload size={16} />
                  {t("actionCenter.submitEvidence")}
                </button>
              )}
            </>
          ) : (
            <p className="ac-empty">{t("actionCenter.allClear")}</p>
          )}
        </section>

        <section className="ac-section">
          <h3>
            <Bell size={18} />
            {t("actionCenter.recentAlerts")}
          </h3>
          {notifications.length === 0 ? (
            <p className="ac-empty">—</p>
          ) : (
            <ul className="ac-alerts-list">
              {notifications.map((n) => (
                <li key={n.id} className={n.read ? "" : "unread"}>
                  <strong>{n.title}</strong>
                  <span>{n.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
