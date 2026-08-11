from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.corrective_action import CorrectiveAction
from app.models.enums import (
    CorrectiveActionStatus,
    IncidentStatus,
    RiskFactorCategory,
    RiskLevel,
)
from app.models.farm import Farm
from app.models.incident import Incident
from app.models.risk import RiskFactor, RiskScoreHistory
from app.utils.helpers import clamp_score, farm_risk_level, generate_id


class RiskEngine:
    @staticmethod
    def compute_risk_level(score: int) -> RiskLevel:
        return farm_risk_level(score)

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
    def recalculate_farm(db: Session, farm: Farm) -> Farm:
        active_factors = (
            db.query(RiskFactor)
            .filter(RiskFactor.farm_id == farm.id, RiskFactor.is_active.is_(True))
            .all()
        )
        penalty = sum(f.delta for f in active_factors)
        farm.previous_score = farm.biosecurity_score
        new_score = clamp_score(100 - penalty)
        farm.biosecurity_score = new_score
        farm.risk_level = RiskEngine.compute_risk_level(new_score)
        RiskEngine.record_history(db, farm.id, new_score)
        db.flush()
        return farm

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
