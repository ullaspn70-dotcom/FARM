from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_optional_user, require_roles
from app.database.session import get_db
from app.models.enums import CorrectiveActionStatus, IncidentStatus, InspectionStatus, UserRole
from app.models.farm import Farm
from app.models.user import User
from app.schemas.farm import FarmResponse
from app.schemas.officer import (
    InspectionCreate,
    InspectionResponse,
    OfficerFarmProfileResponse,
    OfficerStatsResponse,
)
from app.services.corrective_action_service import CorrectiveActionService
from app.services.farm_service import FarmService
from app.services.incident_service import IncidentService
from app.services.officer_service import InspectionService, OfficerService
from app.utils.serializers import farm_to_response

router = APIRouter(prefix="/officer", tags=["Officer Dashboard"])


@router.get("/stats", response_model=OfficerStatsResponse)
def officer_stats(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_roles(UserRole.OFFICER))] = None,
):
    return OfficerService.get_stats(db, current_user.district_id)


@router.get("/inspection-priority", response_model=list[FarmResponse])
def inspection_priority(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_roles(UserRole.OFFICER, UserRole.VETERINARIAN))] = None,
):
    farms = OfficerService.inspection_priority(db, current_user.district_id)
    return [farm_to_response(f) for f in farms]


@router.get("/farms/{farm_id}/profile", response_model=OfficerFarmProfileResponse)
def farm_profile(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_roles(UserRole.OFFICER, UserRole.VETERINARIAN))] = None,
):
    farm = FarmService.get_farm(db, farm_id, current_user)
    incidents = IncidentService.list_incidents(db, farm_id, current_user)
    actions = CorrectiveActionService.list_actions(db, farm_id, current_user)
    open_incidents = sum(
        1
        for i in incidents
        if i.status
        in (
            IncidentStatus.REPORTED,
            IncidentStatus.UNDER_REVIEW,
            IncidentStatus.MORE_INFO_REQUIRED,
        )
    )
    open_actions = sum(
        1
        for a in actions
        if a.status
        not in (CorrectiveActionStatus.VERIFIED, CorrectiveActionStatus.CLOSED)
    )
    return OfficerFarmProfileResponse(
        farm=farm_to_response(farm),
        open_incidents=open_incidents,
        open_actions=open_actions,
        incident_count=len(incidents),
        action_count=len(actions),
    )


def _inspection_to_response(db: Session, inspection) -> InspectionResponse:
    farm = db.query(Farm).filter(Farm.id == inspection.farm_id).first()
    return InspectionResponse(
        id=inspection.id,
        farm_id=inspection.farm_id,
        farm_name=farm.name if farm else None,
        status=inspection.status.value,
        scheduled_at=inspection.scheduled_at.isoformat() if inspection.scheduled_at else "",
        inspector_name=inspection.inspector_name,
        result=inspection.result.value if inspection.result else None,
        notes=inspection.notes,
    )


@router.get("/inspections", response_model=list[InspectionResponse])
def list_inspections(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_roles(UserRole.OFFICER, UserRole.VETERINARIAN))] = None,
):
    inspections = InspectionService.list_inspections(
        db,
        district_id=current_user.district_id,
        status=InspectionStatus.SCHEDULED,
    )
    return [_inspection_to_response(db, inspection) for inspection in inspections]


@router.post("/inspections", response_model=InspectionResponse, status_code=201)
def schedule_inspection(
    payload: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_roles(UserRole.OFFICER, UserRole.VETERINARIAN))] = None,
):
    inspection = InspectionService.schedule(db, payload, current_user)
    return _inspection_to_response(db, inspection)
