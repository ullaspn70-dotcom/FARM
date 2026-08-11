import React, { useEffect, useState } from "react";
import { MapPin, Filter, Info, Phone, User, Calendar, ExternalLink } from "lucide-react";
import type { GisMapNode, FarmType, RiskLevel } from "../../types";
import { gisService } from "../../services/api";

interface GisFarmMapProps {
  onOpenPassport?: () => void;
}

export const GisFarmMap: React.FC<GisFarmMapProps> = ({ onOpenPassport }) => {
  const [nodes, setNodes] = useState<GisMapNode[]>([]);

  // Filters
  const [filterType, setFilterType] = useState<FarmType | "all">("all");
  const [filterRisk, setFilterRisk] = useState<RiskLevel | "all">("all");

  // Selected node drawer
  const [selectedNode, setSelectedNode] = useState<GisMapNode | null>(null);

  useEffect(() => {
    gisService.getGisMapNodes().then((data) => {
      setNodes(data);
      if (data.length > 0) setSelectedNode(data[0]);
    });
  }, []);

  const filteredNodes = nodes.filter((node) => {
    if (filterType !== "all" && node.farmType !== filterType) return false;
    if (filterRisk !== "all" && node.riskLevel !== filterRisk) return false;
    return true;
  });

  return (
    <div className="gis-map-view">
      {/* Top Controls Header */}
      <div className="gis-header-card">
        <div>
          <span className="eyebrow-text">GEOGRAPHIC INFORMATION SYSTEM (GIS)</span>
          <h2 className="view-title">Regional Biosecurity Telemetry Map</h2>
        </div>

        {/* Filter Controls */}
        <div className="gis-filter-bar">
          <div className="filter-group">
            <Filter size={16} className="filter-icon" />
            <label>Farm Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="poultry">Poultry Farms</option>
              <option value="pig">Pig Farms</option>
              <option value="mixed">Mixed Livestock</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Risk Level:</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Risk Levels</option>
              <option value="safe">Low Risk (Safe)</option>
              <option value="caution">Medium Risk (Caution)</option>
              <option value="critical">High Risk (Critical)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Map Workspace Canvas + Farm Details Drawer */}
      <div className="gis-workspace-grid">
        {/* Interactive GIS Map Canvas */}
        <div className="gis-canvas-container">
          <div className="gis-map-canvas">
            {/* GIS Satellite Topology Mesh Background */}
            <div className="topology-grid-overlay" />
            <div className="river-path" />
            <div className="highway-line highway-1" />
            <div className="highway-line highway-2" />

            {/* Farm Markers Overlay */}
            {filteredNodes.map((node) => {
              // Convert lat/lng to stylized percentage offsets on canvas
              const topPct = Math.max(15, Math.min(85, ((24.1 - node.lat) / 1.1) * 100));
              const leftPct = Math.max(15, Math.min(85, ((node.lng - 85.1) / 0.5) * 100));

              const isSelected = selectedNode?.id === node.id;
              const isVet = node.id.startsWith("VET");

              return (
                <div
                  key={node.id}
                  className={`map-node-marker risk-${node.riskLevel} ${isSelected ? "active" : ""} ${isVet ? "vet-node" : ""}`}
                  style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="marker-pin">
                    <MapPin size={20} />
                  </div>
                  <span className="marker-tooltip">{node.name} ({node.score})</span>
                </div>
              );
            })}

            {/* Containment Buffer Circles (Concept Visuals) */}
            <div className="quarantine-buffer-zone" style={{ top: "35%", left: "70%" }}>
              <span className="buffer-label">15km Containment Buffer</span>
            </div>

            {/* Map Legend Footer */}
            <div className="gis-map-legend">
              <span className="legend-item">
                <span className="legend-dot green" /> Low Risk Farm
              </span>
              <span className="legend-item">
                <span className="legend-dot yellow" /> Medium Risk Farm
              </span>
              <span className="legend-item">
                <span className="legend-dot red" /> High Risk / Quarantine
              </span>
              <span className="legend-item">
                <span className="legend-dot blue" /> Vet Diagnostic Center
              </span>
            </div>
          </div>
        </div>

        {/* Selected Node Inspection Side Panel */}
        {selectedNode ? (
          <div className="gis-detail-panel">
            <div className="panel-header">
              <span className="node-type-tag">{selectedNode.farmType.toUpperCase()}</span>
              <h3 className="node-name">{selectedNode.name}</h3>
              <span className="node-id-sub">Node ID: {selectedNode.id}</span>
            </div>

            <div className="node-metrics-box">
              <div className="node-metric">
                <span className="label">Biosecurity Score</span>
                <strong className={`val ${selectedNode.score >= 75 ? "text-green" : "text-red"}`}>
                  {selectedNode.score}/100
                </strong>
              </div>
              <div className="node-metric">
                <span className="label">Active Incidents</span>
                <strong className="val">{selectedNode.activeIncidents}</strong>
              </div>
            </div>

            <div className="node-details-list">
              <div className="detail-row">
                <User size={16} className="icon-sub" />
                <div>
                  <span className="label">Owner / Operator</span>
                  <strong>{selectedNode.owner}</strong>
                </div>
              </div>

              <div className="detail-row">
                <Phone size={16} className="icon-sub" />
                <div>
                  <span className="label">Contact Telemetry</span>
                  <strong>{selectedNode.contact}</strong>
                </div>
              </div>

              <div className="detail-row">
                <MapPin size={16} className="icon-sub" />
                <div>
                  <span className="label">GPS Coordinates</span>
                  <strong>{selectedNode.lat.toFixed(4)}° N, {selectedNode.lng.toFixed(4)}° E</strong>
                </div>
              </div>

              <div className="detail-row">
                <Calendar size={16} className="icon-sub" />
                <div>
                  <span className="label">Last Inspection</span>
                  <strong>{selectedNode.lastInspection}</strong>
                </div>
              </div>
            </div>

            {onOpenPassport && !selectedNode.id.startsWith("VET") && (
              <button className="btn-view-passport-gis" onClick={onOpenPassport}>
                <ExternalLink size={16} />
                <span>View Full Biosecurity Passport</span>
              </button>
            )}

            <div className="gis-api-disclaimer">
              <Info size={14} />
              <span>
                GIS Interface API-ready. Visual containment overlays are driven by backend spatial telemetry datasets.
              </span>
            </div>
          </div>
        ) : (
          <div className="gis-detail-panel empty">Click a map node to inspect farm details.</div>
        )}
      </div>
    </div>
  );
};
