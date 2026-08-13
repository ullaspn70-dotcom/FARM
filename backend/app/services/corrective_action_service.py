from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ValidationAppError
from app.models.corrective_action import ActionEvidence, CorrectiveAction
from app.models.enums import (
    ActionPriority,
    ComplianceStatus,
    CorrectiveActionStatus,
    NotificationType,
    UserRole,
    VerificationStatus,
)
from app.models.passport import BiosecurityPassport
from app.models.user import User
from app.schemas.corrective_action import ActionVerifyRequest, CorrectiveActionCreate
from app.services.farm_service import FarmService
from app.services.notification_service import NotificationService
from app.services.risk_service import RiskEngine
from app.utils.helpers import generate_id


class CorrectiveActionService:
    @staticmethod
    def list_actions(db: Session, farm_id: str | None = None, user: User | None = None) -> list[CorrectiveAction]:
        query = db.query(CorrectiveAction).order_by(CorrectiveAction.deadline.asc())
        if farm_id:
            FarmService.get_farm(db, farm_id, user)
            query = query.filter(CorrectiveAction.farm_id == farm_id)
        elif user and user.role == UserRole.FARMER:
            farm_ids = [a.farm_id for a in user.farm_assignments]
            query = query.filter(CorrectiveAction.farm_id.in_(farm_ids)) if farm_ids else query.filter(False)
        elif user and user.district_id and user.role != UserRole.OFFICER:
            query = query.join(CorrectiveAction.farm).filter_by(district_id=user.district_id)
        return query.all()

    @staticmethod
    def get_action(db: Session, action_id: str, user: User | None = None) -> CorrectiveAction:
        action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
        if not action:
            raise NotFoundError("CorrectiveAction", action_id)
        FarmService.ensure_farm_access(action.farm, user)
        return action

    @staticmethod
    def create_action(db: Session, payload: CorrectiveActionCreate, user: User | None) -> CorrectiveAction:
        farm = FarmService.get_farm(db, payload.farm_id, user)
        try:
            deadline = datetime.fromisoformat(payload.deadline).date()
        except ValueError as exc:
            raise ValidationAppError("Invalid deadline format.") from exc

        action = CorrectiveAction(
            id=generate_id("ACT"),
            farm_id=farm.id,
            incident_id=payload.incident_id,
            title=payload.title,
            description=payload.description,
            priority=ActionPriority(payload.priority),
            assigned_person=payload.assigned_person,
            deadline=deadline,
            status=CorrectiveActionStatus.PENDING,
            evidence_required=payload.evidence_required,
        )
        db.add(action)
        db.commit()
        db.refresh(action)
        return action

    @staticmethod
    def submit_evidence(
        db: Session,
        action_id: str,
        file_url: str,
        file_name: str,
        notes: str,
        location: str,
        user: User | None,
    ) -> CorrectiveAction:
        action = CorrectiveActionService.get_action(db, action_id, user)
        if action.status == CorrectiveActionStatus.VERIFIED:
            raise ConflictError("Action is already verified.")

        if action.evidence:
            db.delete(action.evidence)
            db.flush()

        evidence = ActionEvidence(
            id=generate_id("AEV"),
            action_id=action.id,
            file_url=file_url,
            file_name=file_name,
            notes=notes,
            location=location,
            captured_at=datetime.now(timezone.utc),
        )
        db.add(evidence)
        action.status = CorrectiveActionStatus.EVIDENCE_SUBMITTED
        action.verification_status = VerificationStatus.VERIFICATION_PENDING

        NotificationService.create(
            db,
            title="Evidence Submitted",
            message=f"Evidence submitted for {action.title}. Awaiting officer verification.",
            notification_type=NotificationType.EVIDENCE,
            target_role=UserRole.VETERINARIAN,
        )
        db.commit()
        db.refresh(action)
        return action

    @staticmethod
    def verify_action(db: Session, action_id: str, payload: ActionVerifyRequest, user: User | None) -> CorrectiveAction:
        action = CorrectiveActionService.get_action(db, action_id, user)
        if action.status not in (
            CorrectiveActionStatus.EVIDENCE_SUBMITTED,
            CorrectiveActionStatus.AWAITING_VERIFICATION,
        ):
            raise ConflictError("Action is not awaiting verification.")

        farm = action.farm
        if payload.approved:
            action.status = CorrectiveActionStatus.VERIFIED
            action.verification_status = VerificationStatus.VERIFIED
            if action.incident_id:
                RiskEngine.update_incident_factor_progress(db, action.incident_id)
            old_score = RiskEngine.recalculate_farm(db, farm)
            RiskEngine.update_farm_counters(db, farm)
            RiskEngine.notify_score_change(db, farm, old_score)
            CorrectiveActionService._check_compliance_closure(db, action.farm_id)
        else:
            action.status = CorrectiveActionStatus.IN_PROGRESS
            action.verification_status = VerificationStatus.UNVERIFIED

        db.commit()
        db.refresh(action)
        return action

    @staticmethod
    def _check_compliance_closure(db: Session, farm_id: str) -> None:
        open_actions = (
            db.query(CorrectiveAction)
            .filter(
                CorrectiveAction.farm_id == farm_id,
                CorrectiveAction.status.notin_([
                    CorrectiveActionStatus.VERIFIED,
                    CorrectiveActionStatus.CLOSED,
                ]),
            )
            .count()
        )
        farm = FarmService.get_farm(db, farm_id)
        RiskEngine.update_farm_counters(db, farm)
        if open_actions == 0:
            passport = db.query(BiosecurityPassport).filter(BiosecurityPassport.farm_id == farm_id).first()
            if passport:
                passport.compliance_status = ComplianceStatus.COMPLIANT
