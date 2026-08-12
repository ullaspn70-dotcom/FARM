import React, { useEffect, useState } from "react";
import { Upload, Calendar, CheckCircle2 } from "lucide-react";
import type { CorrectiveAction } from "../../types";
import { correctiveActionService } from "../../services/api";
import { StatusBadge } from "../common/StatusBadge";
import { EvidenceUploadModal } from "./EvidenceUploadModal";
import { useAuth } from "../../context/AuthContext";

export const CorrectiveActionsList: React.FC = () => {
  const { role, activeFarm } = useAuth();
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedActionForEvidence, setSelectedActionForEvidence] = useState<CorrectiveAction | null>(null);

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
        err instanceof Error ? err.message : "Unable to load corrective actions for this farm."
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
          <span className="eyebrow-text">BIOSECURITY PROTOCOL MANAGEMENT</span>
          <h2 className="view-title">Corrective Actions & Compliance</h2>
          <p className="view-subtitle">
            Track, assign, and verify corrective biosecurity tasks required to maintain farm certification.
          </p>
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
          <div className="loading-state">Loading corrective action tasks...</div>
        ) : actions.length === 0 ? (
          <div className="empty-state">No active corrective actions recorded.</div>
        ) : (
          <div className="table-responsive-wrapper">
            <table className="bioshield-table">
              <thead>
                <tr>
                  <th>Action Title & Description</th>
                  <th>Priority</th>
                  <th>Assigned Person</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Evidence Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((act) => (
                  <tr key={act.id}>
                    <td className="cell-main-info">
                      <strong className="action-item-title">{act.title}</strong>
                      <p className="action-item-desc">{act.description}</p>
                      <span className="farm-tag-sub">Farm: {act.farmName}</span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${act.priority}`}>
                        {act.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="cell-person">{act.assignedPerson}</td>
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
                          <span>Submitted ({act.verificationStatus})</span>
                        </div>
                      ) : (
                        <span className="text-muted">Evidence Required</span>
                      )}
                    </td>
                    <td className="cell-buttons">
                      {role === "farmer" && act.status !== "Verified" && (
                        <button
                          className="btn-upload-evidence"
                          onClick={() => setSelectedActionForEvidence(act)}
                        >
                          <Upload size={14} />
                          <span>Upload Evidence</span>
                        </button>
                      )}

                      {(role === "veterinarian" || role === "officer") &&
                        act.status === "Evidence Submitted" && (
                          <div className="btn-group-verify">
                            <button
                              className="btn-verify-approve"
                              onClick={() => handleVerify(act.id, true)}
                            >
                              Verify
                            </button>
                            <button
                              className="btn-verify-reject"
                              onClick={() => handleVerify(act.id, false)}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                    </td>
                  </tr>
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
