from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_optional_user, require_roles
from app.database.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.farm import FarmResponse
from app.schemas.officer import InspectionCreate, InspectionResponse, OfficerStatsResponse
from app.services.officer_service import InspectionService, OfficerService
from app.utils.serializers import farm_to_response

router = APIRouter(prefix="/officer", tags=["Officer Dashboard"])


@router.get("/stats", response_model=OfficerStatsResponse)
def officer_stats(
    db: Session = Depends(get_db),
    current_user: Annotated[User | None, Depends(get_optional_user)] = None,
):
    district_id = current_user.district_id if current_user else None
    return OfficerService.get_stats(db, district_id)


@router.get("/inspection-priority", response_model=list[FarmResponse])
def inspection_priority(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_roles(UserRole.OFFICER, UserRole.VETERINARIAN))] = None,
):
    farms = OfficerService.inspection_priority(db, current_user.district_id)
    return [farm_to_response(f) for f in farms]


@router.post("/inspections", response_model=InspectionResponse, status_code=201)
def schedule_inspection(
    payload: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(require_roles(UserRole.OFFICER, UserRole.VETERINARIAN))] = None,
):
    inspection = InspectionService.schedule(db, payload, current_user)
    return InspectionResponse(
        id=inspection.id,
        farm_id=inspection.farm_id,
        status=inspection.status.value,
        scheduled_at=inspection.scheduled_at.isoformat() if inspection.scheduled_at else "",
        inspector_name=inspection.inspector_name,
        result=inspection.result.value if inspection.result else None,
        notes=inspection.notes,
    )
