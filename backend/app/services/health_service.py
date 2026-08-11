from datetime import datetime

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.health import ChecklistItem, HealthRecord
from app.schemas.health import HealthRecordCreate
from app.services.farm_service import FarmService
from app.utils.helpers import generate_id


class HealthRecordService:
    @staticmethod
    def list_records(db: Session, farm_id: str, user=None) -> list[HealthRecord]:
        FarmService.get_farm(db, farm_id, user)
        return (
            db.query(HealthRecord)
            .filter(HealthRecord.farm_id == farm_id)
            .order_by(HealthRecord.recorded_at.desc())
            .all()
        )

    @staticmethod
    def create_record(db: Session, farm_id: str, payload: HealthRecordCreate, user=None) -> HealthRecord:
        FarmService.get_farm(db, farm_id, user)
        vaccination_date = None
        if payload.vaccination_date:
            vaccination_date = datetime.fromisoformat(payload.vaccination_date).date()

        record = HealthRecord(
            id=generate_id("HR"),
            farm_id=farm_id,
            animal_type=payload.animal_type,
            batch_name=payload.batch_name,
            zone_id=payload.zone_id,
            health_status=payload.health_status,
            mortality_count=payload.mortality_count,
            morbidity_count=payload.morbidity_count,
            vaccination_date=vaccination_date,
            notes=payload.notes,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


class ChecklistService:
    @staticmethod
    def list_items(db: Session, farm_id: str, user=None) -> list[ChecklistItem]:
        FarmService.get_farm(db, farm_id, user)
        return db.query(ChecklistItem).filter(ChecklistItem.farm_id == farm_id).all()

    @staticmethod
    def update_item(db: Session, farm_id: str, item_id: str, completed: bool, user=None) -> ChecklistItem:
        FarmService.get_farm(db, farm_id, user)
        item = (
            db.query(ChecklistItem)
            .filter(ChecklistItem.farm_id == farm_id, ChecklistItem.id == item_id)
            .first()
        )
        if not item:
            raise NotFoundError("ChecklistItem", item_id)
        item.completed = completed
        db.commit()
        db.refresh(item)
        return item
