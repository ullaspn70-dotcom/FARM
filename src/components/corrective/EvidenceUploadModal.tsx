import React, { useEffect, useRef, useState } from "react";
import { X, Upload, MapPin, Clock, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { CorrectiveAction } from "../../types";
import { correctiveActionService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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
  const { activeFarm } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const locationTag = activeFarm.coordinates
    ? `Lat: ${activeFarm.coordinates.lat}° N, Long: ${activeFarm.coordinates.lng}° E (${activeFarm.name})`
    : `${activeFarm.location} (${activeFarm.name})`;

  const [timestamp] = useState(
    new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"
  );

  useEffect(() => {
    if (isOpen) {
      setEvidenceFile(null);
      setFileName("");
      setNotes("");
      setSubmitError("");
      setSubmitSuccess(false);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [isOpen, action?.id]);

  if (!isOpen || !action) return null;

  const handleFileSelect = (file: File) => {
    setEvidenceFile(file);
    setFileName(file.name);
    setSubmitError("");
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceFile) {
      setSubmitError("Please select a photo or document before submitting.");
      fileInputRef.current?.click();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      await correctiveActionService.submitEvidence(action.id, {
        file: evidenceFile,
        notes: notes || "Disinfection evidence recorded and verified on site.",
        location: locationTag,
      });
      setSubmitSuccess(true);
      onSubmitted();
      window.setTimeout(() => onClose(), 900);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to upload evidence. Please try again."
      );
    } finally {
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
          <div className="form-group">
            <label className="form-label" htmlFor="evidence-file-input">
              Evidence File / Photo *
            </label>
            <div
              className="file-upload-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              role="button"
              tabIndex={0}
            >
              <Upload size={28} className="upload-icon-green" />
              <span>Click here to browse or drop your photo</span>
              <input
                id="evidence-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
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

          {submitError && (
            <div className="form-error-banner" role="alert">
              <AlertTriangle size={16} />
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div className="form-success-banner" role="status">
              <CheckCircle2 size={16} />
              <span>Evidence uploaded successfully!</span>
            </div>
          )}

          <div className="form-actions-row">
            <button type="button" className="btn-secondary-action" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || submitSuccess} className="btn-primary-action">
              {submitting ? "Uploading Evidence..." : submitSuccess ? "Uploaded!" : "Submit Evidence"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
