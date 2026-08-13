import React, { useCallback, useEffect, useState } from "react";
import { Brain, CheckCircle, FileSearch, HelpCircle, RefreshCw, XCircle } from "lucide-react";
import type { CorrectiveAction, EvidenceAnalysis } from "../../types";
import { correctiveActionService, riskService } from "../../services/api";
import { EvidencePreview } from "../common/EvidencePreview";
import { StatusBadge } from "../common/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { analyzeEvidenceLocally, stripVetPlanMarker } from "../../utils/evidenceAnalysis";

const AWAITING_STATUSES = new Set(["Evidence Submitted", "Awaiting Verification"]);

export const VetEvidenceInspectionView: React.FC = () => {
  const { refreshFarms } = useAuth();
  const { refreshNotifications } = useNotifications();
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [vetNote, setVetNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [analysis, setAnalysis] = useState<EvidenceAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let list = await correctiveActionService.getAwaitingVerification();
      list = list.filter((a) => AWAITING_STATUSES.has(a.status));
      setActions(list);
      setSelectedId((prev) => {
        if (prev && list.some((a) => a.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch {
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 12000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const selected = actions.find((a) => a.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected?.submittedEvidence) {
      setAnalysis(null);
      return;
    }
    if (selected.evidenceAnalysis) {
      setAnalysis(selected.evidenceAnalysis);
      return;
    }
    let cancelled = false;
    setAnalysisLoading(true);
    correctiveActionService
      .analyzeEvidence(selected.id)
      .then((result) => {
        if (!cancelled) setAnalysis(result);
      })
      .catch(() => {
        if (!cancelled) setAnalysis(analyzeEvidenceLocally(selected));
      })
      .finally(() => {
        if (!cancelled) setAnalysisLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.submittedEvidence?.fileName]);

  const handleVerify = async (approved: boolean, noteOverride?: string) => {
    if (!selected) return;
    const note = noteOverride ?? vetNote;
    setProcessing(true);
    setMessage("");
    try {
      await correctiveActionService.verifyAction(selected.id, approved, note || undefined);
      if (selected.farmId) {
        await riskService.recalculateFarm(selected.farmId).catch(() => undefined);
      }
      await refreshFarms();
      await refreshNotifications();
      setVetNote("");
      setMessage(
        approved
          ? "Evidence confirmed. Corrective action closed. Farmer notified."
          : "Evidence rejected. Farmer must upload new evidence."
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="vet-evidence-view">
      <div className="vet-header-card">
        <div className="header-left">
          <div className="vet-badge-icon">
            <FileSearch size={28} color="#FFFFFF" />
          </div>
          <div>
            <span className="eyebrow-text">EVIDENCE INSPECTION PORTAL</span>
            <h2 className="view-title">Corrective Action Evidence Inspection</h2>
            <p className="view-subtitle">
              Review farmer-uploaded photos and documents for each veterinary action plan item.
            </p>
          </div>
        </div>
        <div className="vet-status-summary">
          <div className="summary-pill">
            <span>Awaiting inspection:</span>
            <strong>{actions.length}</strong>
          </div>
          <button type="button" className="btn-secondary" onClick={() => load()}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {loading && actions.length === 0 ? (
        <p className="loading-state">Loading evidence queue…</p>
      ) : actions.length === 0 ? (
        <div className="empty-state evidence-empty-state">
          <FileSearch size={40} />
          <p>No farmer evidence awaiting inspection.</p>
          <p className="text-muted">
            When a farmer uploads evidence from Corrective Actions, it will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="evidence-inspection-layout">
          <aside className="evidence-inspection-queue">
            <h3 className="panel-title">Evidence Queue</h3>
            {actions.map((act) => (
              <button
                key={act.id}
                type="button"
                className={`evidence-queue-card ${selectedId === act.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedId(act.id);
                  setVetNote("");
                  setMessage("");
                }}
              >
                <strong>{act.title}</strong>
                <span>{act.farmName}</span>
                {act.submittedEvidence && (
                  <span className="evidence-queue-thumb-label">
                    Photo: {act.submittedEvidence.fileName}
                  </span>
                )}
                <StatusBadge type="action" value={act.status} size="sm" />
              </button>
            ))}
          </aside>

          {selected && (
            <section className="evidence-inspection-main">
              <div className="workspace-details-grid">
                <div className="detail-box">
                  <span className="label">Farm</span>
                  <strong>{selected.farmName}</strong>
                </div>
                <div className="detail-box">
                  <span className="label">Incident</span>
                  <strong>{selected.incidentId ?? "—"}</strong>
                </div>
                <div className="detail-box">
                  <span className="label">Required action</span>
                  <strong>{selected.title}</strong>
                </div>
                <div className="detail-box">
                  <span className="label">Status</span>
                  <StatusBadge type="action" value={selected.status} size="sm" />
                </div>
              </div>

              <p className="section-text">{stripVetPlanMarker(selected.description)}</p>

              <div className="farmer-evidence-block">
                <h4 className="section-title">Farmer submitted evidence</h4>
                {selected.submittedEvidence ? (
                  <>
                    <div className="farmer-photo-frame">
                      <EvidencePreview
                        fileName={selected.submittedEvidence.fileName}
                        fileUrl={selected.submittedEvidence.fileUrl}
                        notes={selected.submittedEvidence.notes}
                      />
                    </div>
                    <div className="evidence-meta-grid">
                      <div>
                        <span className="label">Submitted at</span>
                        <strong>{selected.submittedEvidence.timestamp}</strong>
                      </div>
                      <div>
                        <span className="label">Location</span>
                        <strong>{selected.submittedEvidence.location || "—"}</strong>
                      </div>
                      <div>
                        <span className="label">Farmer note</span>
                        <strong>{selected.submittedEvidence.notes || "—"}</strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted">Waiting for farmer to upload evidence.</p>
                )}
              </div>

              {selected.submittedEvidence && (
                <div className="ai-evidence-analysis-block">
                  <div className="ai-analysis-header">
                    <Brain size={20} />
                    <h4 className="section-title">Aarohi AI Evidence Analysis</h4>
                    {analysis?.analysisMethod && (
                      <span className="ai-method-badge">{analysis.analysisMethod}</span>
                    )}
                  </div>
                  {analysisLoading ? (
                    <p className="text-muted">Analyzing image and problem description…</p>
                  ) : analysis ? (
                    <>
                      <p className="ai-analysis-summary">{analysis.summary}</p>
                      <div className="ai-observations">
                        <span className="label">Observations</span>
                        <ul>
                          {analysis.observations.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="ai-recommended-actions">
                        <span className="label">Recommended follow-up actions</span>
                        <div className="ai-rec-cards">
                          {analysis.recommendedActions.map((rec) => (
                            <div key={rec.title} className="ai-rec-card">
                              <strong>{rec.title}</strong>
                              <p>{rec.description}</p>
                              <span className={`priority-badge priority-${rec.priority}`}>
                                {rec.priority}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="ai-disclaimer text-muted">{analysis.disclaimer}</p>
                    </>
                  ) : null}
                </div>
              )}

              <label className="form-label">Veterinary inspection note</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={vetNote}
                onChange={(e) => setVetNote(e.target.value)}
                placeholder="Document whether the photo demonstrates the corrective action was completed…"
              />

              <div className="action-button-group">
                <button
                  type="button"
                  className="btn-action-validate"
                  disabled={processing || !selected.submittedEvidence}
                  onClick={() => handleVerify(true)}
                >
                  <CheckCircle size={16} />
                  Confirm Evidence
                </button>
                <button
                  type="button"
                  className="btn-action-reject"
                  disabled={processing || !selected.submittedEvidence}
                  onClick={() => handleVerify(false)}
                >
                  <XCircle size={16} />
                  Reject Evidence
                </button>
                <button
                  type="button"
                  className="btn-action-request"
                  disabled={processing || !selected.submittedEvidence}
                  onClick={() =>
                    handleVerify(
                      false,
                      vetNote ||
                        "Please submit additional photographic evidence clearly showing the completed corrective work."
                    )
                  }
                >
                  <HelpCircle size={16} />
                  Request More Evidence
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {message && <div className="form-success-banner">{message}</div>}
    </div>
  );
};
