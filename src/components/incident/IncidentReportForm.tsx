import React, { useState } from "react";
import { X, ShieldAlert, Upload, CheckCircle2, MapPin, AlertTriangle } from "lucide-react";

import { incidentService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface IncidentReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const IncidentReportForm: React.FC<IncidentReportFormProps> = ({
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { activeFarm } = useAuth();

  const [incidentType, setIncidentType] = useState("Sudden Mortality Increase");
  const [animalType, setAnimalType] = useState(
    activeFarm.farmType === "poultry" ? "Poultry (Broilers)" : "Swine / Pigs"
  );
  const [numberAffected, setNumberAffected] = useState<number>(12);
  const [dateTime, setDateTime] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Shed 02 - Isolation Pen B");
  const [fileName, setFileName] = useState<string | null>("mortality_obs_sample.jpg");

  const [submitting, setSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await incidentService.submitIncident({
        farmId: activeFarm.id,
        farmName: activeFarm.name,
        farmType: activeFarm.farmType,
        incidentType,
        animalType,
        numberAffected,
        dateTime,
        description: description || "Observed health anomaly requiring veterinary inspection.",
        location,
        evidenceFiles: fileName
          ? [{ name: fileName, url: "#", timestamp: new Date().toISOString() }]
          : [],
      });

      setSubmitting(false);
      setSubmittedStatus(true);
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedStatus(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleResetAndClose}>
      <div className="incident-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-box">
            <ShieldAlert size={24} className="icon-red" />
            <div>
              <span className="modal-eyebrow">BIO-SECURITY INCIDENT REPORTING</span>
              <h2 className="modal-title">Log Farm Health Incident</h2>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleResetAndClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {submittedStatus ? (
          /* Post-submission Success State */
          <div className="submitted-success-card">
            <div className="success-icon-box">
              <CheckCircle2 size={54} color="#154D38" />
            </div>
            <h3 className="success-title">Report Submitted Successfully</h3>
            <p className="success-status-badge">
              Report submitted — awaiting veterinary verification.
            </p>
            <p className="success-desc">
              Your report for <strong>{incidentType}</strong> ({numberAffected} animals affected at {location}) has been routed to the District Veterinary Verification Queue.
            </p>
            <div className="success-note-box">
              <AlertTriangle size={16} />
              <span>
                Note: In compliance with SIH260487 biosecurity guidelines, an outbreak is not declared automatically until certified veterinary inspection is completed.
              </span>
            </div>
            <button className="btn-primary-action" onClick={handleResetAndClose}>
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="incident-form-body">
            <div className="form-grid-two">
              <div className="form-group">
                <label className="form-label">Incident Category *</label>
                <select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="Sudden Mortality Increase">Sudden Mortality Increase</option>
                  <option value="Respiratory Symptoms">Respiratory Distress Symptoms</option>
                  <option value="Feed / Water Contamination">Feed or Water Contamination</option>
                  <option value="Perimeter Fencing Breach">Perimeter Fencing / Bio-Barrier Breach</option>
                  <option value="Unverified Visitor Entry">Unverified Visitor Entry</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Animal Species / Batch *</label>
                <select
                  value={animalType}
                  onChange={(e) => setAnimalType(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="Poultry (Broilers)">Poultry (Broilers)</option>
                  <option value="Poultry (Layers)">Poultry (Layers)</option>
                  <option value="Swine / Pigs (Growers)">Swine / Pigs (Growers)</option>
                  <option value="Swine / Pigs (Breeding Stock)">Swine / Pigs (Breeding Stock)</option>
                </select>
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-group">
                <label className="form-label">Number Affected *</label>
                <input
                  type="number"
                  min="1"
                  value={numberAffected}
                  onChange={(e) => setNumberAffected(Number(e.target.value))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date & Time Observed *</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Farm Zone Location *</label>
              <div className="input-with-icon">
                <MapPin size={18} className="input-icon" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Shed 02, Isolation Ward"
                  className="form-input pl-10"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Symptoms & Observations</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe health symptoms, temperature spikes, or physical anomalies observed..."
                className="form-textarea"
              />
            </div>

            {/* Evidence Upload Component */}
            <div className="form-group">
              <label className="form-label">Upload Photo / Document Evidence</label>
              <div className="file-upload-dropzone">
                <Upload size={24} className="upload-icon" />
                <span>Drag & drop evidence photos or click to browse</span>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="file-input-hidden"
                />
                {fileName && (
                  <div className="uploaded-preview-tag">
                    <span>Attached: {fileName}</span>
                    <button type="button" onClick={() => setFileName(null)}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions-row">
              <button type="button" className="btn-secondary-action" onClick={handleResetAndClose}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary-action">
                {submitting ? "Submitting Report..." : "Submit Incident Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
