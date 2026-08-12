import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  ShieldCheck,
  QrCode,
  Calendar,
  Award,
  CheckCircle,
  AlertTriangle,
  ScanLine,
} from "lucide-react";
import type { BiosecurityPassport } from "../../types";
import { passportService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface BiosecurityPassportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function buildQrPayload(passport: BiosecurityPassport) {
  return JSON.stringify({
    platform: "AgriSentinel",
    farmId: passport.farmId,
    farmName: passport.farmName,
    owner: passport.ownerName,
    score: passport.biosecurityScore,
    status: passport.complianceStatus,
    qrCode: passport.passportQrCode,
    verified: true,
  });
}

export const BiosecurityPassportModal: React.FC<BiosecurityPassportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeFarm } = useAuth();
  const [passport, setPassport] = useState<BiosecurityPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showScanResult, setShowScanResult] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowScanResult(false);
      return;
    }

    setLoading(true);
    setError("");
    setPassport(null);

    passportService
      .getBiosecurityPassport(activeFarm.id)
      .then((data) => {
        setPassport(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load biosecurity passport for this farm."
        );
        setLoading(false);
      });
  }, [isOpen, activeFarm.id]);

  const qrImageUrl = useMemo(() => {
    if (!passport) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
      buildQrPayload(passport)
    )}`;
  }, [passport]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="passport-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="passport-modal-header">
          <div className="header-left">
            <ShieldCheck size={28} className="shield-icon-badge" />
            <div>
              <span className="passport-eyebrow">OFFICIAL DIGITAL FARM PROFILE</span>
              <h2 className="passport-modal-title">Biosecurity Passport</h2>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={22} />
          </button>
        </div>

        {loading ? (
          <div className="modal-loading-state">
            <div className="spinner" />
            <p>Retrieving verified digital passport record...</p>
          </div>
        ) : error ? (
          <div className="modal-loading-state">
            <AlertTriangle size={32} color="#DC2626" />
            <p>{error}</p>
            <button className="btn-secondary-action" onClick={onClose}>
              Close
            </button>
          </div>
        ) : passport ? (
          <div className="passport-body">
            <div className="passport-verified-banner">
              <div className="banner-badge-icon">
                <Award size={32} />
              </div>
              <div className="banner-details">
                <div className="verified-title-row">
                  <h3>{passport.farmName}</h3>
                  <span className="status-pill-verified">
                    <CheckCircle size={14} /> {passport.complianceStatus}
                  </span>
                </div>
                <p className="passport-farm-sub">
                  Farm ID: <strong>{passport.farmId}</strong> • Type:{" "}
                  <strong>{passport.farmType.toUpperCase()}</strong> • Issued: {passport.issueDate}
                </p>
                <div className="continuous-monitored-tag">
                  <span className="live-dot-green"></span>
                  <span>Continuously Monitored via AgriSentinel Telemetry</span>
                </div>
              </div>

              <div className="qr-box">
                <img
                  src={qrImageUrl}
                  alt={`QR code for ${passport.farmName} biosecurity passport`}
                  className="passport-qr-image"
                />
                <span className="qr-code-text">{passport.passportQrCode}</span>
                <button
                  type="button"
                  className="btn-qr-scan"
                  onClick={() => setShowScanResult((prev) => !prev)}
                >
                  <ScanLine size={14} />
                  {showScanResult ? "Hide Scan Result" : "Simulate QR Scan"}
                </button>
              </div>
            </div>

            {showScanResult && (
              <div className="qr-scan-result-panel">
                <h4 className="section-title">
                  <QrCode size={18} /> QR Scan Verification Result
                </h4>
                <div className="qr-scan-grid">
                  <div className="scan-result-item">
                    <span>Farm Name</span>
                    <strong>{passport.farmName}</strong>
                  </div>
                  <div className="scan-result-item">
                    <span>Farm ID</span>
                    <strong>{passport.farmId}</strong>
                  </div>
                  <div className="scan-result-item">
                    <span>Owner</span>
                    <strong>{passport.ownerName}</strong>
                  </div>
                  <div className="scan-result-item">
                    <span>Biosecurity Score</span>
                    <strong>{passport.biosecurityScore}/100</strong>
                  </div>
                  <div className="scan-result-item">
                    <span>Compliance Status</span>
                    <strong>{passport.complianceStatus}</strong>
                  </div>
                  <div className="scan-result-item">
                    <span>Passport Code</span>
                    <strong>{passport.passportQrCode}</strong>
                  </div>
                </div>
                <p className="qr-scan-note">
                  Scan verified by AgriSentinel — this farm passport is authentic and registered in
                  the district biosecurity registry.
                </p>
              </div>
            )}

            <div className="passport-info-grid">
              <div className="info-tile">
                <span className="tile-label">Location / Sector</span>
                <strong className="tile-value">{passport.location}</strong>
              </div>
              <div className="info-tile">
                <span className="tile-label">Farm Owner</span>
                <strong className="tile-value">{passport.ownerName}</strong>
              </div>
              <div className="info-tile">
                <span className="tile-label">Capacity / Animals</span>
                <strong className="tile-value">
                  {passport.animalCount} / {passport.capacity} Head
                </strong>
              </div>
              <div className="info-tile">
                <span className="tile-label">Last Govt Inspection</span>
                <strong className="tile-value">{passport.lastInspectionDate}</strong>
              </div>
            </div>

            <div className="passport-scores-section">
              <h4 className="section-title">Biosecurity Score Breakdown</h4>
              <div className="score-bars-grid">
                <div className="score-item">
                  <div className="score-label-row">
                    <span>Overall Biosecurity Index</span>
                    <strong>{passport.biosecurityScore}/100</strong>
                  </div>
                  <div className="bar-bg">
                    <div
                      className="bar-fill bg-emerald"
                      style={{ width: `${passport.biosecurityScore}%` }}
                    />
                  </div>
                </div>

                <div className="score-item">
                  <div className="score-label-row">
                    <span>Shed & Facility Hygiene</span>
                    <strong>{passport.hygieneScore}/100</strong>
                  </div>
                  <div className="bar-bg">
                    <div
                      className="bar-fill bg-emerald"
                      style={{ width: `${passport.hygieneScore}%` }}
                    />
                  </div>
                </div>

                <div className="score-item">
                  <div className="score-label-row">
                    <span>Visitor & Vehicle Control</span>
                    <strong>{passport.visitorControlScore}/100</strong>
                  </div>
                  <div className="bar-bg">
                    <div
                      className="bar-fill bg-amber"
                      style={{ width: `${passport.visitorControlScore}%` }}
                    />
                  </div>
                </div>

                <div className="score-item">
                  <div className="score-label-row">
                    <span>Quarantine & Isolation Protocol</span>
                    <strong>{passport.quarantineProtocolScore}/100</strong>
                  </div>
                  <div className="bar-bg">
                    <div
                      className="bar-fill bg-emerald"
                      style={{ width: `${passport.quarantineProtocolScore}%` }}
                    />
                  </div>
                </div>

                <div className="score-item">
                  <div className="score-label-row">
                    <span>Vaccination Rate</span>
                    <strong>{passport.vaccinationCoverage}%</strong>
                  </div>
                  <div className="bar-bg">
                    <div
                      className="bar-fill bg-blue"
                      style={{ width: `${passport.vaccinationCoverage}%` }}
                    />
                  </div>
                </div>

                <div className="score-item">
                  <div className="score-label-row">
                    <span>Waste & Carcass Management</span>
                    <strong>{passport.wasteManagementScore}/100</strong>
                  </div>
                  <div className="bar-bg">
                    <div
                      className="bar-fill bg-emerald"
                      style={{ width: `${passport.wasteManagementScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="passport-inspection-history">
              <h4 className="section-title">Verified Inspection Audit History</h4>
              <div className="history-list">
                {passport.inspectionHistory.length === 0 ? (
                  <p className="timeline-desc">No completed inspections recorded yet.</p>
                ) : (
                  passport.inspectionHistory.map((item) => (
                    <div key={item.id} className="history-card">
                      <div className="history-meta">
                        <div className="date-box">
                          <Calendar size={16} />
                          <span>{item.date}</span>
                        </div>
                        <span className={`result-tag ${item.result.toLowerCase().replace(" ", "-")}`}>
                          {item.result}
                        </span>
                      </div>
                      <div className="history-details">
                        <strong>{item.inspectorName}</strong>
                        <p>{item.notes}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="passport-footer">
              <p className="passport-disclaimer">
                <AlertTriangle size={14} className="inline-icon" /> Official Digital Passport
                generated by AgriSentinel Platform. Tampering or misrepresentation of biosecurity
                status is punishable under Animal Health Protocols.
              </p>
              <button className="btn-secondary-action" onClick={onClose}>
                Close Passport Profile
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
