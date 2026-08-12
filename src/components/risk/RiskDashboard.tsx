import React from "react";
import { Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../common/StatusBadge";
import { ScoreHistoryPanel } from "../farmer/ScoreHistoryPanel";

function riskLabel(level: string): string {
  if (level === "safe" || level === "low") return "LOW RISK (SAFE)";
  if (level === "caution" || level === "medium") return "MEDIUM RISK (CAUTION)";
  if (level === "critical" || level === "high") return "HIGH RISK (CRITICAL)";
  return level.toUpperCase();
}

export const RiskDashboard: React.FC = () => {
  const { activeFarm } = useAuth();

  return (
    <div className="risk-dashboard-view">
      <div className="risk-header-card">
        <div>
          <span className="eyebrow-text">BIO-SECURITY RISK ANALYTICS</span>
          <h2 className="view-title">Dynamic Risk Score & Factor Breakdown</h2>
          <p className="view-subtitle">
            Farm: <strong>{activeFarm.name}</strong> ({activeFarm.id}) • Type:{" "}
            <strong>{activeFarm.farmType.toUpperCase()}</strong>
          </p>
        </div>
        <StatusBadge type="risk" value={activeFarm.riskLevel} size="lg" />
      </div>

      <div className="risk-gauge-panel">
        <div className="gauge-score-display">
          <div className="score-ring-circle">
            <span className="score-ring-number">{activeFarm.biosecurityScore}</span>
            <span className="score-ring-denom">/100</span>
          </div>
          <div className="gauge-text-info">
            <h3 className="gauge-status-title">
              Current Farm Risk Level:{" "}
              <strong className="text-emerald">{riskLabel(activeFarm.riskLevel)}</strong>
            </h3>
            <p className="gauge-status-desc">
              Score reflects visitor movement, sanitation logs, incidents, and corrective action status from the backend.
            </p>
          </div>
        </div>
      </div>

      <ScoreHistoryPanel />

      <div className="risk-disclaimer-box">
        <Info size={20} className="disclaimer-icon" />
        <div>
          <strong>Data Source</strong>
          <p>
            Score history and risk factors are loaded from the AgriSentinel API. They reflect recorded farm telemetry and verified events — not simulated values.
          </p>
        </div>
      </div>
    </div>
  );
};
