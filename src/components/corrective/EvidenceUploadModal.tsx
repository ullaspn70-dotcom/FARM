import React, { useState } from "react";
import { X, Upload, MapPin, Clock, FileText } from "lucide-react";
import type { CorrectiveAction } from "../../types";
import { correctiveActionService } from "../../services/api";

interface EvidenceUploadModalProps {
  action: CorrectiveAction | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  action,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [fileName, setFileName] = useState("gate_basin_refill_proof.jpg");
  const [notes, setNotes] = useState("");
  const locationTag = "Lat: 23.3441° N, Long: 85.3096° E (Main Gate)";
  const [timestamp] = useState(
    new Date().toLocaleString("en-IN", { timeZone: "IST" }) + " IST"
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !action) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await correctiveActionService.submitEvidence(action.id, {
        fileUrl: "#",
        fileName,
        notes: notes || "Disinfection evidence recorded and verified on site.",
        location: locationTag,
      });
      setSubmitting(false);
      onSubmitted();
      onClose();
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="evidence-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">BIOSECURITY COMPLIANCE EVIDENCE</span>
            <h3 className="modal-title">Submit Evidence for Action</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="action-summary-box">
          <strong className="action-title-text">{action.title}</strong>
          <p className="action-farm-sub">Farm: {action.farmName} • ID: {action.id}</p>
        </div>

        <form onSubmit={handleSubmit} className="evidence-form-body">
          {/* File Upload Zone */}
          <div className="form-group">
            <label className="form-label">Evidence File / Photo *</label>
            <div className="file-upload-dropzone">
              <Upload size={28} className="upload-icon-green" />
              <span>Click to select or drop photo of completed action</span>
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
                <div className="file-attached-preview">
                  <FileText size={16} />
                  <span>{fileName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Automatic Metadata Displays */}
          <div className="metadata-readonly-row">
            <div className="meta-tag-box">
              <Clock size={16} className="icon-sub" />
              <div>
                <span className="meta-label">Capture Timestamp</span>
                <strong className="meta-val">{timestamp}</strong>
              </div>
            </div>

            <div className="meta-tag-box">
              <MapPin size={16} className="icon-sub" />
              <div>
                <span className="meta-label">GPS Geotag Location</span>
                <strong className="meta-val">{locationTag}</strong>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Compliance Notes & Inspector Comments</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details regarding chemicals used, dosage, or supervisor sign-off..."
              className="form-textarea"
            />
          </div>

          <div className="form-actions-row">
            <button type="button" className="btn-secondary-action" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary-action">
              {submitting ? "Uploading Evidence..." : "Submit Evidence"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
