import React, { useEffect, useState } from "react";
import { Landmark, MapPin, ArrowRight } from "lucide-react";
import type { OfficerStats, Farm } from "../../types";
import { officerService, farmService } from "../../services/api";
import { StatusBadge } from "../common/StatusBadge";

interface OfficerDashboardProps {
  onNavigateToGis: () => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ onNavigateToGis }) => {
  const [stats, setStats] = useState<OfficerStats | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([officerService.getOfficerStats(), farmService.getAllFarms()]).then(
      ([statsData, farmsData]) => {
        setStats(statsData);
        setFarms(farmsData);
        setLoading(false);
      }
    );
  }, []);

  // Sort farms by risk score ascending (highest risk first for inspection priority)
  const priorityFarms = [...farms].sort((a, b) => a.biosecurityScore - b.biosecurityScore);

  return (
    <div className="officer-dashboard-view">
      {/* Command Center Top Banner */}
      <div className="officer-header-card">
        <div className="header-left">
          <div className="officer-badge-icon">
            <Landmark size={28} color="#FFFFFF" />
          </div>
          <div>
            <span className="eyebrow-text">GOVERNMENT OF INDIA • ANIMAL HUSBANDRY & BIOSECURITY</span>
            <h2 className="view-title">Regional Command Center Dashboard</h2>
            <p className="view-subtitle">
              District Surveillance Portal — Ranchi & South Chota Nagpur Division
            </p>
          </div>
        </div>

        <button className="btn-primary-gis" onClick={onNavigateToGis}>
          <MapPin size={18} />
          <span>Open Regional GIS Risk Map</span>
        </button>
      </div>

      {/* Main Command Metrics 8-Grid */}
      {loading || !stats ? (
        <div className="loading-state">Loading regional command telemetry...</div>
      ) : (
        <div className="officer-stats-grid">
          <div className="stat-box">
            <span className="stat-label">Total Registered Farms</span>
            <strong className="stat-val">{stats.totalRegisteredFarms}</strong>
            <span className="stat-sub">Poultry & Swine Units</span>
          </div>

          <div className="stat-box border-red">
            <span className="stat-label">High-Risk Farms</span>
            <strong className="stat-val text-red">{stats.highRiskFarms}</strong>
            <span className="stat-sub">Requires Direct Audit</span>
          </div>

          <div className="stat-box border-amber">
            <span className="stat-label">Medium-Risk Farms</span>
            <strong className="stat-val text-amber">{stats.mediumRiskFarms}</strong>
            <span className="stat-sub">Under Watchlist</span>
          </div>

          <div className="stat-box border-green">
            <span className="stat-label">Low-Risk Farms</span>
            <strong className="stat-val text-green">{stats.lowRiskFarms}</strong>
            <span className="stat-sub">Compliant Status</span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Active Incidents</span>
            <strong className="stat-val">{stats.openIncidents}</strong>
            <span className="stat-sub">Reported in District</span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Pending Verifications</span>
            <strong className="stat-val">{stats.pendingVerifications}</strong>
            <span className="stat-sub">Awaiting Vet Officer</span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Pending Inspections</span>
            <strong className="stat-val">{stats.pendingInspections}</strong>
            <span className="stat-sub">Due this week</span>
          </div>

          <div className="stat-box">
            <span className="stat-label">Open Corrective Actions</span>
            <strong className="stat-val">{stats.openCorrectiveActions}</strong>
            <span className="stat-sub">Pending farmer upload</span>
          </div>
        </div>
      )}

      {/* Two Column Layout: Risk Distribution + Inspection Priority List */}
      <div className="officer-main-grid">
        {/* Inspection Priority Ranking List */}
        <div className="priority-list-card">
          <div className="panel-header-row">
            <div>
              <span className="panel-eyebrow">FIELD AUDIT SCHEDULING</span>
              <h3 className="panel-title">Inspection Priority List (Risk-Ranked)</h3>
            </div>
          </div>

          <div className="priority-farms-table">
            <table className="bioshield-table">
              <thead>
                <tr>
                  <th>Priority Rank</th>
                  <th>Farm Name & ID</th>
                  <th>Farm Type</th>
                  <th>Biosecurity Score</th>
                  <th>Risk Status</th>
                  <th>Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {priorityFarms.map((farm, idx) => (
                  <tr key={farm.id} className={idx === 0 ? "highlight-critical-row" : ""}>
                    <td className="cell-rank">#{idx + 1}</td>
                    <td className="cell-main">
                      <strong>{farm.name}</strong>
                      <span className="sub-text">ID: {farm.id} • {farm.location}</span>
                    </td>
                    <td>
                      <StatusBadge type="farmType" value={farm.farmType} size="sm" />
                    </td>
                    <td>
                      <strong className={`score-tag ${farm.biosecurityScore < 50 ? "text-red" : farm.biosecurityScore < 75 ? "text-amber" : "text-green"}`}>
                        {farm.biosecurityScore}/100
                      </strong>
                    </td>
                    <td>
                      <StatusBadge type="risk" value={farm.riskLevel} size="sm" />
                    </td>
                    <td>
                      <button className="btn-table-audit">
                        Schedule Inspection
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Distribution Breakdown Panel */}
        <div className="risk-distribution-card">
          <h3 className="panel-title">Regional Risk Distribution Summary</h3>
          <p className="panel-sub">Division breakdown across registered poultry & swine clusters</p>

          <div className="distribution-bars-wrapper">
            <div className="dist-row">
              <div className="dist-meta">
                <span>Low Risk Compliant (77%)</span>
                <strong>110 Farms</strong>
              </div>
              <div className="dist-bar-bg">
                <div className="dist-bar-fill bg-emerald" style={{ width: "77%" }} />
              </div>
            </div>

            <div className="dist-row">
              <div className="dist-meta">
                <span>Medium Risk Watchlist (17%)</span>
                <strong>24 Farms</strong>
              </div>
              <div className="dist-bar-bg">
                <div className="dist-bar-fill bg-amber" style={{ width: "17%" }} />
              </div>
            </div>

            <div className="dist-row">
              <div className="dist-meta">
                <span>High Risk Quarantine Priority (6%)</span>
                <strong>8 Farms</strong>
              </div>
              <div className="dist-bar-bg">
                <div className="dist-bar-fill bg-red" style={{ width: "6%" }} />
              </div>
            </div>
          </div>

          <div className="gis-map-promo-box" onClick={onNavigateToGis}>
            <MapPin size={28} className="promo-icon" />
            <div>
              <strong>Interactive GIS Farm Map</strong>
              <p>View geographical distribution of farms, containment buffers & vet diagnostic centers.</p>
            </div>
            <ArrowRight size={20} className="promo-arrow" />
          </div>
        </div>
      </div>
    </div>
  );
};
