from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.models.corrective_action import CorrectiveAction
from app.models.enums import (
    ActionPriority,
    CorrectiveActionStatus,
    IncidentSeverity,
    IncidentStatus,
    NotificationType,
    RiskFactorCategory,
    UserRole,
)
from app.models.incident import Incident, IncidentEvidence
from app.models.user import User
from app.schemas.incident import IncidentCreate, IncidentVerifyRequest
from app.services.farm_service import FarmService
from app.services.notification_service import NotificationService
from app.services.risk_service import RiskEngine
from app.utils.helpers import generate_id, incident_severity


class IncidentService:
    @staticmethod
    def list_incidents(db: Session, farm_id: str | None = None, user: User | None = None) -> list[Incident]:
        query = db.query(Incident).order_by(Incident.created_at.desc())
        if farm_id:
            FarmService.get_farm(db, farm_id, user)
            query = query.filter(Incident.farm_id == farm_id)
        elif user and user.role == UserRole.FARMER:
            farm_ids = [a.farm_id for a in user.farm_assignments]
            query = query.filter(Incident.farm_id.in_(farm_ids)) if farm_ids else query.filter(False)
        elif user and user.district_id:
            query = query.join(Incident.farm).filter_by(district_id=user.district_id)
        return query.all()

    @staticmethod
    def get_incident(db: Session, incident_id: str, user: User | None = None) -> Incident:
        incident = db.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            raise NotFoundError("Incident", incident_id)
        FarmService.ensure_farm_access(incident.farm, user)
        return incident

    @staticmethod
    def create_incident(
        db: Session,
        payload: IncidentCreate,
        user: User | None = None,
        evidence_records: list | None = None,
    ) -> Incident:
        farm = FarmService.get_farm(db, payload.farm_id, user)
        try:
            observed_at = datetime.fromisoformat(payload.date_time.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValidationAppError("Invalid dateTime format.") from exc

        severity = incident_severity(payload.number_affected)
        incident = Incident(
            id=generate_id("INC"),
            farm_id=farm.id,
            incident_type=payload.incident_type,
            animal_type=payload.animal_type,
            number_affected=payload.number_affected,
            observed_at=observed_at,
            description=payload.description,
            location=payload.location,
            status=IncidentStatus.REPORTED,
            severity=severity,
            reported_by_id=user.id if user else None,
        )
        db.add(incident)
        db.flush()

        if evidence_records:
            for record in evidence_records:
                db.add(
                    IncidentEvidence(
                        id=generate_id("IEV"),
                        incident_id=incident.id,
                        file_name=record.file_name,
                        file_url=record.file_url,
                    )
                )

        RiskEngine.add_factor(
            db,
            farm.id,
            f"Incident reported: {payload.incident_type}",
            12 if severity in (IncidentSeverity.HIGH, IncidentSeverity.CRITICAL) else 6,
            RiskFactorCategory.INCIDENT,
            payload.description[:250],
        )
        RiskEngine.recalculate_farm(db, farm)
        RiskEngine.update_farm_counters(db, farm)

        NotificationService.create(
            db,
            title="New Incident Reported",
            message=f"{payload.incident_type} reported at {farm.name}.",
            notification_type=NotificationType.INCIDENT,
            broadcast_all=True,
        )
        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def verify_incident(
        db: Session,
        incident_id: str,
        payload: IncidentVerifyRequest,
        user: User | None,
    ) -> Incident:
        incident = IncidentService.get_incident(db, incident_id, user)
        if incident.status in (IncidentStatus.VERIFIED, IncidentStatus.REJECTED):
            raise ConflictError("Incident is already closed.")

        action = payload.action
        if action == "validate":
            incident.status = IncidentStatus.VERIFIED
            incident.veterinarian_notes = payload.notes or "Verified by certified District Veterinary Officer."
            incident.verified_at = datetime.now(timezone.utc)
            incident.verified_by_id = user.id if user else None
            incident.verified_by_name = user.full_name if user else "District Veterinary Officer"
            IncidentService._generate_corrective_actions(db, incident)
            title = "Incident Verified"
        elif action == "request_info":
            incident.status = IncidentStatus.MORE_INFO_REQUIRED
            incident.requested_info_notes = payload.notes or "Please upload additional diagnostic evidence."
            title = "Incident Info Requested"
        elif action == "reject":
            incident.status = IncidentStatus.REJECTED
            incident.veterinarian_notes = payload.notes or "Non-critical environmental anomaly. No bio-hazard detected."
            title = "Incident Rejected"
        else:
            raise ValidationAppError("Invalid verification action.")

        NotificationService.create(
            db,
            title=title,
            message=f"Incident {incident.id} update by Veterinarian Officer.",
            notification_type=NotificationType.VERIFICATION,
            target_role=UserRole.FARMER,
        )
        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def _generate_corrective_actions(db: Session, incident: Incident) -> None:
        farm = incident.farm
        actions = [
            (
                "Sanitize & Decontaminate Affected Zone",
                f"Apply recommended disinfectant in {incident.location}.",
                ActionPriority.HIGH,
            ),
            (
                "Submit Mortality & Health Observation Log",
                "Upload updated mortality and morbidity records for veterinary audit.",
                ActionPriority.URGENT,
            ),
        ]
        for title, description, priority in actions:
            db.add(
                CorrectiveAction(
                    id=generate_id("ACT"),
                    farm_id=farm.id,
                    incident_id=incident.id,
                    title=title,
                    description=description,
                    priority=priority,
                    assigned_person=farm.owner_name,
                    deadline=datetime.now(timezone.utc).date(),
                    status=CorrectiveActionStatus.PENDING,
                    evidence_required=True,
                )
            )
