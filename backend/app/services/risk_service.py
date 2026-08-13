from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.corrective_action import CorrectiveAction
from app.models.enums import (
    CorrectiveActionStatus,
    IncidentSeverity,
    IncidentStatus,
    NotificationType,
    RiskFactorCategory,
    RiskLevel,
    UserRole,
)
from app.models.farm import Farm
from app.models.incident import Incident
from app.models.passport import BiosecurityPassport
from app.models.risk import RiskFactor, RiskScoreHistory
from app.services.notification_service import NotificationService
from app.utils.helpers import clamp_score, farm_risk_level, generate_id


class RiskEngine:
    @staticmethod
    def incident_penalty(severity: IncidentSeverity) -> int:
        if severity in (IncidentSeverity.HIGH, IncidentSeverity.CRITICAL):
            return 12
        return 6

    @staticmethod
    def incident_factor_label(incident_id: str, incident_type: str) -> str:
        return f"Incident [{incident_id}]: {incident_type}"

    @staticmethod
    def compute_risk_level(score: int) -> RiskLevel:
        return farm_risk_level(score)

    @staticmethod
    def get_baseline_score(db: Session, farm: Farm) -> int:
        passport = (
            db.query(BiosecurityPassport)
            .filter(BiosecurityPassport.farm_id == farm.id)
            .first()
        )
        if passport:
            components = [
                passport.hygiene_score,
                passport.visitor_control_score,
                passport.quarantine_protocol_score,
                passport.waste_management_score,
            ]
            return round(sum(components) / len(components))

        if farm.biosecurity_score > 0:
            return farm.biosecurity_score
        return 75

    @staticmethod
    def record_history(db: Session, farm_id: str, score: int) -> None:
        db.add(
            RiskScoreHistory(
                id=generate_id("RH"),
                farm_id=farm_id,
                score=score,
                recorded_at=datetime.now(timezone.utc),
            )
        )

    @staticmethod
    def recalculate_farm(db: Session, farm: Farm) -> int:
        """Recalculate score from passport baseline minus active risk penalties. Returns old score."""
        old_score = farm.biosecurity_score
        baseline = RiskEngine.get_baseline_score(db, farm)
        active_factors = (
            db.query(RiskFactor)
            .filter(RiskFactor.farm_id == farm.id, RiskFactor.is_active.is_(True))
            .all()
        )
        penalty = sum(f.delta for f in active_factors)
        farm.previous_score = old_score
        new_score = clamp_score(baseline - penalty)
        farm.biosecurity_score = new_score
        farm.risk_level = RiskEngine.compute_risk_level(new_score)
        RiskEngine.record_history(db, farm.id, new_score)
        db.flush()
        return old_score

    @staticmethod
    def notify_score_change(db: Session, farm: Farm, old_score: int) -> None:
        delta = farm.biosecurity_score - old_score
        if delta == 0:
            return
        sign = "+" if delta > 0 else ""
        NotificationService.create(
            db,
            title="Biosecurity Score Updated",
            message=(
                f"{farm.name}: your biosecurity score is now "
                f"{farm.biosecurity_score}/100 ({sign}{delta} points)."
            ),
            notification_type=NotificationType.RISK,
            target_role=UserRole.FARMER,
        )

    @staticmethod
    def add_factor(
        db: Session,
        farm_id: str,
        label: str,
        delta: int,
        category: RiskFactorCategory,
        description: str,
    ) -> RiskFactor:
        factor = RiskFactor(
            id=generate_id("RF"),
            farm_id=farm_id,
            label=label,
            delta=delta,
            category=category,
            description=description,
            is_active=True,
        )
        db.add(factor)
        db.flush()
        return factor

    @staticmethod
    def find_incident_factor(db: Session, farm_id: str, incident_id: str) -> RiskFactor | None:
        prefix = f"Incident [{incident_id}]:"
        return (
            db.query(RiskFactor)
            .filter(
                RiskFactor.farm_id == farm_id,
                RiskFactor.is_active.is_(True),
                RiskFactor.label.like(f"{prefix}%"),
            )
            .first()
        )

    @staticmethod
    def deactivate_incident_factors(db: Session, farm_id: str, incident_id: str) -> None:
        prefix = f"Incident [{incident_id}]:"
        factors = (
            db.query(RiskFactor)
            .filter(
                RiskFactor.farm_id == farm_id,
                RiskFactor.is_active.is_(True),
                RiskFactor.label.like(f"{prefix}%"),
            )
            .all()
        )
        if not factors:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if incident:
                legacy_label = f"Incident reported: {incident.incident_type}"
                factors = (
                    db.query(RiskFactor)
                    .filter(
                        RiskFactor.farm_id == farm_id,
                        RiskFactor.is_active.is_(True),
                        RiskFactor.label == legacy_label,
                        RiskFactor.category == RiskFactorCategory.INCIDENT,
                    )
                    .all()
                )
        for factor in factors:
            factor.is_active = False
        db.flush()

    @staticmethod
    def update_incident_factor_progress(db: Session, incident_id: str) -> None:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            return

        factor = RiskEngine.find_incident_factor(db, incident.farm_id, incident_id)
        if not factor:
            return

        total_actions = (
            db.query(func.count(CorrectiveAction.id))
            .filter(CorrectiveAction.incident_id == incident_id)
            .scalar()
        ) or 0
        if total_actions == 0:
            return

        verified_actions = (
            db.query(func.count(CorrectiveAction.id))
            .filter(
                CorrectiveAction.incident_id == incident_id,
                CorrectiveAction.status == CorrectiveActionStatus.VERIFIED,
            )
            .scalar()
        ) or 0

        if verified_actions >= total_actions:
            factor.is_active = False
        else:
            base_penalty = RiskEngine.incident_penalty(incident.severity)
            remaining = total_actions - verified_actions
            factor.delta = max(1, round(base_penalty * remaining / total_actions))
        db.flush()

    @staticmethod
    def get_factors(db: Session, farm_id: str | None = None) -> list[RiskFactor]:
        query = db.query(RiskFactor).filter(RiskFactor.is_active.is_(True))
        if farm_id:
            query = query.filter(RiskFactor.farm_id == farm_id)
        return query.order_by(RiskFactor.delta.desc()).all()

    @staticmethod
    def get_history(db: Session, farm_id: str, days: int = 7) -> list[RiskScoreHistory]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        return (
            db.query(RiskScoreHistory)
            .filter(RiskScoreHistory.farm_id == farm_id, RiskScoreHistory.recorded_at >= since)
            .order_by(RiskScoreHistory.recorded_at.asc())
            .all()
        )

    @staticmethod
    def get_summary(db: Session, farm: Farm) -> dict:
        history = RiskEngine.get_history(db, farm.id, days=7)
        score_delta = farm.biosecurity_score - (history[0].score if history else farm.previous_score)
        trend = "improving" if score_delta > 0 else "deteriorating" if score_delta < 0 else "stable"
        return {
            "farmId": farm.id,
            "biosecurityScore": farm.biosecurity_score,
            "previousScore": farm.previous_score,
            "riskLevel": farm.risk_level.value,
            "scoreDelta7d": score_delta,
            "riskTrend": trend,
        }

    @staticmethod
    def update_farm_counters(db: Session, farm: Farm) -> None:
        open_incidents = (
            db.query(func.count(Incident.id))
            .filter(
                Incident.farm_id == farm.id,
                Incident.status.in_([
                    IncidentStatus.REPORTED,
                    IncidentStatus.UNDER_REVIEW,
                    IncidentStatus.MORE_INFO_REQUIRED,
                ]),
            )
            .scalar()
        )
        open_actions = (
            db.query(func.count(CorrectiveAction.id))
            .filter(
                CorrectiveAction.farm_id == farm.id,
                CorrectiveAction.status.in_([
                    CorrectiveActionStatus.PENDING,
                    CorrectiveActionStatus.IN_PROGRESS,
                    CorrectiveActionStatus.EVIDENCE_SUBMITTED,
                    CorrectiveActionStatus.AWAITING_VERIFICATION,
                ]),
            )
            .scalar()
        )
        farm.active_incidents = open_incidents or 0
        farm.active_alerts = open_actions or 0
