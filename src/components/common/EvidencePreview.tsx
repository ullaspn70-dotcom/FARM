import React, { useState } from "react";
import { ExternalLink, Image, FileText } from "lucide-react";
import { isImageFile, isPdfFile, resolveMediaUrl } from "../../utils/mediaUrl";
import { useTranslation } from "../../context/LocaleContext";

interface EvidencePreviewProps {
  fileName: string;
  fileUrl: string;
  notes?: string;
  compact?: boolean;
}

export const EvidencePreview: React.FC<EvidencePreviewProps> = ({
  fileName,
  fileUrl,
  notes,
  compact = false,
}) => {
  const { t } = useTranslation();
  const mediaUrl = resolveMediaUrl(fileUrl);
  const showImage = mediaUrl && isImageFile(fileName || mediaUrl);
  const showPdf = mediaUrl && isPdfFile(fileName || mediaUrl);
  const [imageFailed, setImageFailed] = useState(false);

  if (!mediaUrl) {
    return (
      <div className="evidence-file-card">
        <Image size={24} className="file-icon" />
        <div className="evidence-file-meta">
          <strong className="file-name">{fileName}</strong>
          <span className="text-muted">{t("vet.evidence.unavailable")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`evidence-file-card evidence-file-card-rich ${compact ? "evidence-compact" : ""}`}>
      {showImage && !imageFailed ? (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="evidence-thumb-link"
        >
          <img
            src={mediaUrl}
            alt={fileName}
            className="evidence-thumb-image"
            onError={() => setImageFailed(true)}
          />
        </a>
      ) : showPdf ? (
        <FileText size={32} className="file-icon" />
      ) : (
        <Image size={24} className="file-icon" />
      )}
      <div className="evidence-file-meta">
        <strong className="file-name">{fileName}</strong>
        {imageFailed && (
          <span className="text-muted evidence-load-fail">{t("vet.evidence.reloadHint")}</span>
        )}
        {notes && <p className="evidence-notes-preview">{notes}</p>}
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="evidence-open-link"
        >
          <ExternalLink size={14} />
          {t("vet.evidence.open")}
        </a>
      </div>
    </div>
  );
};
