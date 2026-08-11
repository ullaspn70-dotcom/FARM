import React, { useEffect, useState } from "react";
import { AlertTriangle, HelpCircle, Info, ShieldAlert, Flame } from "lucide-react";
import type { RiskFactor } from "../../types";
import { riskService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { StatusBadge } from "../common/StatusBadge";

export const RiskDashboard: React.FC = () => {
  const { activeFarm } = useAuth();
  const [factors, setFactors] = useState<RiskFactor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    riskService.getRiskFactors().then((data) => {
      setFactors(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="risk-dashboard-view">
      {/* Top Banner Header */}
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

      {/* Main Risk Gauge Score Panel */}
      <div className="risk-gauge-panel">
        <div className="gauge-score-display">
          <div className="score-ring-circle">
            <span className="score-ring-number">{activeFarm.biosecurityScore}</span>
            <span className="score-ring-denom">/100</span>
          </div>
          <div className="gauge-text-info">
            <h3 className="gauge-status-title">
              Current Farm Risk Level:{" "}
              <strong className="text-emerald">LOW RISK (SAFE)</strong>
            </h3>
            <p className="gauge-status-desc">
              Your farm maintains active biosecurity compliance. Small score variations (+/- points) reflect real-time visitor movement, sanitation logs, and regional epidemiologic events.
            </p>
          </div>
        </div>

        <div className="risk-level-indicators">
          <div className="level-bar-segment low active">
            <span>Low Risk (75-100)</span>
          </div>
          <div className="level-bar-segment medium">
            <span>Medium Risk (50-74)</span>
          </div>
          <div className="level-bar-segment high">
            <span>High Risk (25-49)</span>
          </div>
          <div className="level-bar-segment critical">
            <span>Critical (&lt;25)</span>
          </div>
        </div>
      </div>

      {/* "Why Did Risk Change?" Section */}
      <div className="risk-factors-card">
        <div className="factors-header">
          <div className="header-title-row">
            <HelpCircle size={22} color="#154D38" />
            <h3>Why Did Risk Score Change? (Factor Breakdown)</h3>
          </div>
          <span className="factors-subtitle">
            Quantified score impacts from recent farm telemetry & regional events
          </span>
        </div>

        {loading ? (
          <div className="loading-box">Loading risk factor breakdown...</div>
        ) : (
          <div className="factors-list">
            {factors.map((factor) => (
              <div key={factor.id} className="factor-row">
                <div className="factor-left">
                  <div className={`category-icon-box cat-${factor.category}`}>
                    {factor.category === "incident" ? (
                      <Flame size={18} />
                    ) : factor.category === "mortality" ? (
                      <ShieldAlert size={18} />
                    ) : (
                      <AlertTriangle size={18} />
                    )}
                  </div>
                  <div>
                    <strong className="factor-label">{factor.label}</strong>
                    <p className="factor-desc">{factor.description}</p>
                  </div>
                </div>

                <div className="factor-delta-tag">
                  <span className="delta-plus">+{factor.delta} Risk Points</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Trend Visual Section */}
      <div className="risk-trend-card">
        <h3>7-Day Risk Score History</h3>
        <div className="trend-timeline-bars">
          <div className="bar-day">
            <div className="bar-column" style={{ height: "65%" }}>
              <span className="bar-val">72</span>
            </div>
            <span className="day-name">Aug 05</span>
          </div>
          <div className="bar-day">
            <div className="bar-column" style={{ height: "70%" }}>
              <span className="bar-val">74</span>
            </div>
            <span className="day-name">Aug 06</span>
          </div>
          <div className="bar-day">
            <div className="bar-column" style={{ height: "68%" }}>
              <span className="bar-val">73</span>
            </div>
            <span className="day-name">Aug 07</span>
          </div>
          <div className="bar-day">
            <div className="bar-column" style={{ height: "72%" }}>
              <span className="bar-val">75</span>
            </div>
            <span className="day-name">Aug 08</span>
          </div>
          <div className="bar-day">
            <div className="bar-column" style={{ height: "75%" }}>
              <span className="bar-val">76</span>
            </div>
            <span className="day-name">Aug 09</span>
          </div>
          <div className="bar-day">
            <div className="bar-column" style={{ height: "74%" }}>
              <span className="bar-val">75</span>
            </div>
            <span className="day-name">Aug 10</span>
          </div>
          <div className="bar-day active">
            <div className="bar-column active-column" style={{ height: "78%" }}>
              <span className="bar-val">78</span>
            </div>
            <span className="day-name">Today</span>
          </div>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="risk-disclaimer-box">
        <Info size={20} className="disclaimer-icon" />
        <div>
          <strong>System Model Disclaimer</strong>
          <p>
            The risk score deltas and factor weights shown above are UI presentation models designed for integration with real backend machine-learning API endpoints. They do not constitute certified epidemiological conclusions without verified veterinary laboratory diagnostics.
          </p>
        </div>
      </div>
    </div>
  );
};
