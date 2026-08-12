import React, { useEffect, useRef, useState } from "react";
import { X, Upload, MapPin, Clock, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { CorrectiveAction } from "../../types";
import { correctiveActionService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/LocaleContext";

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
  const { t } = useTranslation();
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
      setSubmitError(t("evidence.errorNoFile"));
      fileInputRef.current?.click();
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await correctiveActionService.submitEvidence(action.id, {
        file: evidenceFile,
        notes: notes || t("evidence.defaultNotes"),
        location: locationTag,
      });
      setSubmitSuccess(true);
      onSubmitted();
      window.setTimeout(() => onClose(), 900);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("evidence.errorUpload"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="evidence-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-eyebrow">{t("evidence.eyebrow")}</span>
            <h3 className="modal-title">{t("evidence.modalTitle")}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label={t("common.close")}>
            <X size={20} />
          </button>
        </div>

        <div className="action-summary-box">
          <strong className="action-title-text">{action.title}</strong>
          <p className="action-farm-sub">{t("actions.farmTag")}: {action.farmName} • ID: {action.id}</p>
        </div>

        <form onSubmit={handleSubmit} className="evidence-form-body">
          <div className="form-group">
            <label className="form-label" htmlFor="evidence-file-input">{t("evidence.fileLabel")} *</label>
            <div className="file-upload-dropzone" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
              <Upload size={28} className="upload-icon-green" />
              <span>{t("evidence.dropHint")}</span>
              <input id="evidence-file-input" ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }} className="file-input-hidden" />
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
                <span className="meta-label">{t("evidence.captureTime")}</span>
                <strong className="meta-val">{timestamp}</strong>
              </div>
            </div>
            <div className="meta-tag-box">
              <MapPin size={16} className="icon-sub" />
              <div>
                <span className="meta-label">{t("evidence.gpsLocation")}</span>
                <strong className="meta-val">{locationTag}</strong>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("evidence.complianceNotes")}</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("evidence.notesPlaceholderLong")} className="form-textarea" />
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
              <span>{t("evidence.success")}</span>
            </div>
          )}

          <div className="form-actions-row">
            <button type="button" className="btn-secondary-action" onClick={onClose}>{t("common.cancel")}</button>
            <button type="submit" disabled={submitting || submitSuccess} className="btn-primary-action">
              {submitting ? t("evidence.uploading") : submitSuccess ? t("evidence.uploaded") : t("evidence.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
