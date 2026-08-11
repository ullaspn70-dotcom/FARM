import React, { useEffect, useState } from "react";
import { X, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { riskService } from "../../services/api";
import type { RiskFactor } from "../../types";

interface AarohiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AarohiAdvisorModal: React.FC<AarohiAdvisorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeFarm } = useAuth();
  const [factors, setFactors] = useState<RiskFactor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    riskService
      .getRiskFactors(activeFarm.id)
      .then(setFactors)
      .catch(() => setFactors([]))
      .finally(() => setLoading(false));
  }, [isOpen, activeFarm.id]);

  if (!isOpen) return null;

  const topFactor = [...factors].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta)
  )[0];

  const tips =
    topFactor
      ? [
          `Priority: ${topFactor.label}`,
          topFactor.description || "Review this risk factor on the Risk Analytics page.",
          "Complete pending checklist items and corrective actions to improve your score.",
        ]
      : activeFarm.riskLevel === "safe"
      ? [
          "Your farm biosecurity score is stable.",
          "Continue daily sanitation and visitor log verification.",
          "Schedule routine veterinary inspection before the next assessment window.",
        ]
      : [
          "One or more risk indicators need attention.",
          "Check the corrective actions list and resolve high-priority items.",
          "Report any new mortality or symptom spikes immediately.",
        ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="aarohi-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="aarohi-modal-header">
          <div className="aarohi-modal-title-row">
            <div className="aarohi-avatar-large">A</div>
            <div>
              <span className="aarohi-eyebrow">AAROHI AI BIOSECURITY ADVISOR</span>
              <h2 className="modal-title">Farm Guidance for {activeFarm.name}</h2>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="aarohi-modal-body">
          <div className={`aarohi-status-chip ${activeFarm.riskLevel}`}>
            {activeFarm.riskLevel === "safe" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <span>
              Biosecurity score {activeFarm.biosecurityScore}/100 — {activeFarm.riskLevel} risk
            </span>
          </div>

          {loading ? (
            <p className="text-muted">Analyzing farm telemetry and risk signals...</p>
          ) : (
            <ul className="aarohi-tip-list">
              {tips.map((tip, idx) => (
                <li key={idx}>
                  <Sparkles size={14} />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="aarohi-disclaimer">
            Aarohi provides rule-based biosecurity guidance from live farm risk data. Always follow
            certified veterinary protocols for outbreak decisions.
          </p>
        </div>
      </div>
    </div>
  );
};
