import React, { useEffect, useState } from "react";
import { Stethoscope, CheckCircle, HelpCircle, XCircle, Image, MapPin } from "lucide-react";
import type { IncidentReport } from "../../types";
import { incidentService } from "../../services/api";
import { StatusBadge } from "../common/StatusBadge";

export const VetDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    const list = await incidentService.getIncidents();
    setIncidents(list);
    if (list.length > 0 && !selectedIncident) {
      setSelectedIncident(list[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleAction = async (action: "validate" | "request_info" | "reject") => {
    if (!selectedIncident) return;
    setProcessing(true);
    try {
      const updated = await incidentService.verifyIncident(
        selectedIncident.id,
        action,
        actionNotes
      );
      setSelectedIncident(updated);
      setActionNotes("");
      await fetchIncidents();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="vet-dashboard-view">
      {/* Top Banner */}
      <div className="vet-header-card">
        <div className="header-left">
          <div className="vet-badge-icon">
            <Stethoscope size={28} color="#FFFFFF" />
          </div>
          <div>
            <span className="eyebrow-text">DISTRICT VETERINARY VERIFICATION PORTAL</span>
            <h2 className="view-title">Veterinary Verification Queue</h2>
            <p className="view-subtitle">
              Inspect reported farm health incidents, verify diagnostic evidence, and issue official bio-hazard responses.
            </p>
          </div>
        </div>

        <div className="vet-status-summary">
          <div className="summary-pill">
            <span>Pending Review:</span>
            <strong>{incidents.filter((i) => i.status === "Reported" || i.status === "Under Review").length}</strong>
          </div>
          <div className="summary-pill">
            <span>Verified:</span>
            <strong>{incidents.filter((i) => i.status === "Verified").length}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue List + Detailed Verification Panel */}
      <div className="vet-queue-grid">
        {/* Left Column: Incidents Queue List */}
        <div className="queue-list-panel">
          <h3 className="panel-title">Incoming Incident Reports</h3>

          {loading ? (
            <div className="loading-state">Loading incoming incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="empty-state">No incidents currently reported.</div>
          ) : (
            <div className="queue-items-scroll">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`queue-item-card ${
                    selectedIncident?.id === inc.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedIncident(inc);
                    setActionNotes("");
                  }}
                >
                  <div className="item-top">
                    <span className="inc-id">{inc.id}</span>
                    <StatusBadge type="incident" value={inc.status} size="sm" />
                  </div>
                  <strong className="inc-type">{inc.incidentType}</strong>
                  <p className="inc-farm-name">📍 {inc.farmName}</p>
                  <div className="item-meta">
                    <span>{inc.numberAffected} Affected</span>
                    <span>{inc.dateTime}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Incident Inspection & Action Workspace */}
        {selectedIncident ? (
          <div className="incident-inspection-workspace">
            {/* Header */}
            <div className="workspace-header">
              <div>
                <div className="id-status-row">
                  <span className="inc-id-tag">{selectedIncident.id}</span>
                  <StatusBadge type="incident" value={selectedIncident.status} size="md" />
                  <span className={`severity-tag ${selectedIncident.severity}`}>
                    Severity: {selectedIncident.severity.toUpperCase()}
                  </span>
                </div>
                <h3 className="inc-title">{selectedIncident.incidentType}</h3>
              </div>
            </div>

            {/* Farm & Health Details Card */}
            <div className="workspace-details-grid">
              <div className="detail-box">
                <span className="label">Reporting Farm</span>
                <strong>{selectedIncident.farmName} ({selectedIncident.farmId})</strong>
              </div>
              <div className="detail-box">
                <span className="label">Farm Type</span>
                <strong>{selectedIncident.farmType.toUpperCase()}</strong>
              </div>
              <div className="detail-box">
                <span className="label">Animal Species & Count</span>
                <strong>
                  {selectedIncident.animalType} ({selectedIncident.numberAffected} affected)
                </strong>
              </div>
              <div className="detail-box">
                <span className="label">Farm Zone Location</span>
                <strong>{selectedIncident.location}</strong>
              </div>
            </div>

            {/* Health Observations */}
            <div className="workspace-section">
              <h4 className="section-title">Health Observations & Symptoms</h4>
              <p className="section-text">{selectedIncident.description}</p>
            </div>

            {/* Evidence Preview Box */}
            <div className="workspace-section">
              <h4 className="section-title">Submitted Diagnostic Evidence</h4>
              {selectedIncident.evidenceFiles.length > 0 ? (
                <div className="evidence-preview-list">
                  {selectedIncident.evidenceFiles.map((file, idx) => (
                    <div key={idx} className="evidence-file-card">
                      <Image size={24} className="file-icon" />
                      <div>
                        <strong className="file-name">{file.name}</strong>
                        <span className="file-time">{file.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No evidence media uploaded with initial report.</p>
              )}
            </div>

            {/* Nearby Risk Context */}
            <div className="workspace-section nearby-risk-box">
              <MapPin size={18} className="icon-amber" />
              <div>
                <strong>Nearby Regional Context</strong>
                <p>
                  1 pig breeding farm (Ramgarh sector, 14km away) currently under high bio-security quarantine.
                </p>
              </div>
            </div>

            {/* Status Workflow Progress Indicator */}
            <div className="status-workflow-tracker">
              <span className="workflow-title">Workflow Progress:</span>
              <div className="workflow-steps">
                <div className="step-pill done">Reported</div>
                <div className={`step-pill ${selectedIncident.status !== "Reported" ? "done" : "active"}`}>
                  Under Review
                </div>
                <div className={`step-pill ${selectedIncident.status === "Verified" ? "verified" : selectedIncident.status === "More Info Required" ? "warning" : selectedIncident.status === "Rejected" ? "rejected" : ""}`}>
                  {selectedIncident.status === "Reported" || selectedIncident.status === "Under Review"
                    ? "Pending Verification"
                    : selectedIncident.status}
                </div>
              </div>
            </div>

            {/* Verification Notes & Action Triggers */}
            <div className="workspace-action-box">
              <label className="form-label">Veterinary Inspector Notes / Verification Comments</label>
              <textarea
                rows={2}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Enter diagnostic notes, laboratory sample directives, or reasons..."
                className="form-textarea"
              />

              <div className="action-button-group">
                <button
                  disabled={processing}
                  className="btn-action-validate"
                  onClick={() => handleAction("validate")}
                >
                  <CheckCircle size={16} />
                  <span>Validate (Verify)</span>
                </button>

                <button
                  disabled={processing}
                  className="btn-action-request"
                  onClick={() => handleAction("request_info")}
                >
                  <HelpCircle size={16} />
                  <span>Request More Info</span>
                </button>

                <button
                  disabled={processing}
                  className="btn-action-reject"
                  onClick={() => handleAction("reject")}
                >
                  <XCircle size={16} />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="workspace-empty">Select an incident from the queue to verify.</div>
        )}
      </div>
    </div>
  );
};
