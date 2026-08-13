import React, { useEffect, useState } from "react";
import { X, Calendar, MapPin, User, Shield, AlertTriangle, ClipboardList } from "lucide-react";
import type { Farm, CorrectiveAction, IncidentReport, BiosecurityPassport } from "../../types";
import {
  officerService,
  incidentService,
  correctiveActionService,
  passportService,
} from "../../services/api";
import { StatusBadge } from "../common/StatusBadge";
import { useTranslation } from "../../context/LocaleContext";
import { translateContent } from "../../i18n/contentTranslate";

interface OfficerFarmDetailModalProps {
  farm: Farm | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (farm: Farm) => void;
}

export const OfficerFarmDetailModal: React.FC<OfficerFarmDetailModalProps> = ({
  farm,
  isOpen,
  onClose,
  onSchedule,
}) => {
  const { t } = useTranslation();
  const [profileFarm, setProfileFarm] = useState<Farm | null>(null);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [passport, setPassport] = useState<BiosecurityPassport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !farm) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      officerService.getFarmProfile(farm.id),
      incidentService.getIncidents(farm.id),
      correctiveActionService.getActions(farm.id),
      passportService.getBiosecurityPassport(farm.id).catch(() => null),
    ])
      .then(([profile, farmIncidents, farmActions, passportData]) => {
        if (!cancelled) {
          setProfileFarm(profile.farm);
          setIncidents(farmIncidents);
          setActions(farmActions);
          setPassport(passportData);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t("officer.detail.error"));
          setProfileFarm(farm);
          setIncidents([]);
          setActions([]);
          setPassport(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, farm, t]);

  if (!isOpen || !farm) return null;

  const display = profileFarm ?? farm;
  const openIncidents = incidents.filter(
    (i) => i.status !== "Verified" && i.status !== "Rejected"
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="schedule-modal officer-farm-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="header-title-box">
            <Shield size={24} className="icon-emerald" />
            <div>
              <span className="modal-eyebrow">{t("officer.detail.eyebrow")}</span>
              <h2 className="modal-title">{display.name}</h2>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label={t("common.close")}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="loading-state">{t("common.loading")}</div>
        ) : (
          <div className="officer-farm-detail-body">
            {error && (
              <div className="form-error-banner" role="alert">
                {error}
              </div>
            )}

            <div className="officer-detail-grid">
              <div className="detail-box">
                <span className="label">{t("common.farmId")}</span>
                <strong>{display.id}</strong>
              </div>
              <div className="detail-box">
                <span className="label">{t("officer.detail.location")}</span>
                <strong>
                  <MapPin size={14} className="inline-icon" /> {display.location}
                </strong>
              </div>
              <div className="detail-box">
                <span className="label">{t("officer.detail.owner")}</span>
                <strong>
                  <User size={14} className="inline-icon" /> {display.owner}
                </strong>
              </div>
              <div className="detail-box">
                <span className="label">{t("officer.detail.capacity")}</span>
                <strong>
                  {display.animalCount.toLocaleString()} / {display.capacity.toLocaleString()}{" "}
                  {t("officer.detail.animals")}
                </strong>
              </div>
              <div className="detail-box">
                <span className="label">{t("officer.detail.score")}</span>
                <strong>{display.biosecurityScore}/100</strong>
                <StatusBadge type="risk" value={display.riskLevel} size="sm" />
              </div>
              <div className="detail-box">
                <span className="label">{t("officer.detail.compliance")}</span>
                <strong>{display.complianceRate}%</strong>
              </div>
            </div>

            {passport && (
              <div className="officer-detail-passport">
                <h4>{t("officer.detail.passport")}</h4>
                <div className="passport-mini-grid">
                  <span>{t("score.hygiene")}: {passport.hygieneScore}</span>
                  <span>{t("score.visitorControl")}: {passport.visitorControlScore}</span>
                  <span>{t("score.quarantine")}: {passport.quarantineProtocolScore}</span>
                  <span>{t("score.wasteManagement")}: {passport.wasteManagementScore}</span>
                  <span>{t("passport.complianceStatusLabel")}: {passport.complianceStatus}</span>
                </div>
              </div>
            )}

            <div className="officer-detail-section">
              <h4>
                <AlertTriangle size={16} /> {t("officer.detail.incidents")} ({incidents.length})
              </h4>
              {incidents.length === 0 ? (
                <p className="text-muted">{t("officer.detail.noIncidents")}</p>
              ) : (
                <ul className="officer-detail-list">
                  {incidents.slice(0, 6).map((inc) => (
                    <li key={inc.id}>
                      <strong>{translateContent(inc.incidentType, t)}</strong>
                      <StatusBadge type="incident" value={inc.status} size="sm" />
                      <span className="sub-text">{inc.id} • {inc.dateTime}</span>
                    </li>
                  ))}
                </ul>
              )}
              {openIncidents.length > 0 && (
                <p className="officer-detail-note">
                  {t("officer.detail.openIncidentsNote", { count: openIncidents.length })}
                </p>
              )}
            </div>

            <div className="officer-detail-section">
              <h4>
                <ClipboardList size={16} /> {t("officer.detail.actions")} ({actions.length})
              </h4>
              {actions.length === 0 ? (
                <p className="text-muted">{t("officer.detail.noActions")}</p>
              ) : (
                <ul className="officer-detail-list">
                  {actions.slice(0, 6).map((act) => (
                    <li key={act.id}>
                      <strong>{translateContent(act.title, t)}</strong>
                      <StatusBadge type="action" value={act.status} size="sm" />
                      <span className="sub-text">{t("actions.colDeadline")}: {act.deadline}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="officer-detail-actions">
              <button
                type="button"
                className="btn-primary-gis"
                onClick={() => {
                  onSchedule(display);
                  onClose();
                }}
              >
                <Calendar size={16} />
                {t("officer.priority.schedule")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
