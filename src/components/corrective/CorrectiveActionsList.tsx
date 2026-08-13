import React, { useEffect, useState } from "react";
import { Upload, Calendar, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { CorrectiveAction } from "../../types";
import { correctiveActionService } from "../../services/api";
import { StatusBadge } from "../common/StatusBadge";
import { EvidenceUploadModal } from "./EvidenceUploadModal";
import { CorrectiveActionTraceability } from "./CorrectiveActionTraceability";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LocaleContext";
import { translateContent } from "../../i18n/contentTranslate";
import { translateData } from "../../i18n/dataTranslations";

export const CorrectiveActionsList: React.FC = () => {
  const { role, activeFarm } = useAuth();
  const { t, locale } = useTranslation();
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedActionForEvidence, setSelectedActionForEvidence] = useState<CorrectiveAction | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await correctiveActionService.getActions(
        role === "farmer" ? activeFarm.id : undefined
      );
      setActions(data);
    } catch (err) {
      setActions([]);
      setError(
        err instanceof Error ? err.message : t("actions.error")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [role, activeFarm.id]);

  const handleVerify = async (actionId: string, approve: boolean) => {
    await correctiveActionService.verifyAction(actionId, approve);
    fetchActions();
  };

  return (
    <div className="corrective-actions-view">
      {/* Header */}
      <div className="actions-header-card">
        <div>
          <span className="eyebrow-text">{t("actions.eyebrow")}</span>
          <h2 className="view-title">{t("actions.title")}</h2>
          <p className="view-subtitle">{t("actions.subtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="form-error-banner" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Actions Table / Card List */}
      <div className="actions-table-card">
        {loading ? (
          <div className="loading-state">{t("actions.loading")}</div>
        ) : actions.length === 0 ? (
          <div className="empty-state">{t("actions.empty")}</div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="bioshield-table">
              <thead>
                <tr>
                  <th>{t("actions.colTitle")}</th>
                  <th>{t("actions.colPriority")}</th>
                  <th>{t("actions.colAssigned")}</th>
                  <th>{t("actions.colDeadline")}</th>
                  <th>{t("actions.colStatus")}</th>
                  <th>{t("actions.colEvidence")}</th>
                  <th>{t("actions.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <React.Fragment key={act.id}>
                  <tr>
                    <td className="cell-main-info">
                      <strong className="action-item-title">{translateContent(act.title, t)}</strong>
                      <p className="action-item-desc">{translateContent(act.description, t)}</p>
                      <span className="farm-tag-sub">
                        {t("actions.farmTag")}: {translateData(act.farmName, locale)}
                      </span>
                      <button
                        type="button"
                        className="btn-trace-toggle"
                        onClick={() => setExpandedId(expandedId === act.id ? null : act.id)}
                      >
                        {expandedId === act.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {t("actions.traceability")}
                      </button>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${act.priority}`}>
                        {t(
                          `actionCenter.priority.${act.priority.toLowerCase() as "urgent" | "high" | "medium" | "low"}`
                        )}
                      </span>
                    </td>
                    <td className="cell-person">{translateData(act.assignedPerson, locale)}</td>
                    <td className="cell-date">
                      <Calendar size={14} className="inline-icon" /> {act.deadline}
                    </td>
                    <td>
                      <StatusBadge type="action" value={act.status} size="sm" />
                    </td>
                    <td>
                      {act.submittedEvidence ? (
                        <div className="evidence-badge-verified">
                          <CheckCircle2 size={14} color="#154D38" />
                          <span>
                            {t("actions.evidenceSubmittedWithStatus", {
                              status: translateContent(act.verificationStatus, t),
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted">{t("actions.evidenceRequired")}</span>
                      )}
                    </td>
                    <td className="cell-buttons">
                      {role === "farmer" && act.status !== "Verified" && (
                        <button
                          className="btn-upload-evidence"
                          onClick={() => setSelectedActionForEvidence(act)}
                        >
                          <Upload size={14} />
                          <span>{t("actions.uploadEvidence")}</span>
                        </button>
                      )}

                      {(role === "veterinarian" || role === "officer") &&
                        act.status === "Evidence Submitted" && (
                          <div className="btn-group-verify">
                            <button
                              className="btn-verify-approve"
                              onClick={() => handleVerify(act.id, true)}
                            >
                              {t("actions.verify")}
                            </button>
                            <button
                              className="btn-verify-reject"
                              onClick={() => handleVerify(act.id, false)}
                            >
                              {t("actions.reject")}
                            </button>
                          </div>
                        )}
                    </td>
                  </tr>
                  {expandedId === act.id && (
                    <tr className="traceability-row">
                      <td colSpan={7}>
                        <CorrectiveActionTraceability action={act} />
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evidence Upload Modal Trigger */}
      <EvidenceUploadModal
        action={selectedActionForEvidence}
        isOpen={!!selectedActionForEvidence}
        onClose={() => setSelectedActionForEvidence(null)}
        onSubmitted={() => fetchActions()}
      />
    </div>
  );
};
