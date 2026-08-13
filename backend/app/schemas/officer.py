from pydantic import Field

from app.schemas.common import CamelModel
from app.schemas.farm import FarmResponse


class OfficerStatsResponse(CamelModel):
    total_registered_farms: int = Field(serialization_alias="totalRegisteredFarms")
    high_risk_farms: int = Field(serialization_alias="highRiskFarms")
    medium_risk_farms: int = Field(serialization_alias="mediumRiskFarms")
    low_risk_farms: int = Field(serialization_alias="lowRiskFarms")
    open_incidents: int = Field(serialization_alias="openIncidents")
    pending_verifications: int = Field(serialization_alias="pendingVerifications")
    pending_inspections: int = Field(serialization_alias="pendingInspections")
    open_corrective_actions: int = Field(serialization_alias="openCorrectiveActions")


class InspectionCreate(CamelModel):
    farm_id: str = Field(alias="farmId")
    scheduled_at: str = Field(alias="scheduledAt")
    inspector_id: str | None = Field(default=None, alias="inspectorId")
    notes: str | None = None


class InspectionResponse(CamelModel):
    id: str
    farm_id: str = Field(serialization_alias="farmId")
    status: str
    scheduled_at: str = Field(serialization_alias="scheduledAt")
    inspector_name: str | None = Field(default=None, serialization_alias="inspectorName")
    result: str | None = None
    notes: str | None = None


class InspectionComplete(CamelModel):
    result: str
    notes: str | None = None
    inspection_date: str | None = Field(default=None, alias="inspectionDate")


class OfficerFarmProfileResponse(CamelModel):
    farm: FarmResponse
    open_incidents: int = Field(serialization_alias="openIncidents")
    open_actions: int = Field(serialization_alias="openActions")
    incident_count: int = Field(serialization_alias="incidentCount")
    action_count: int = Field(serialization_alias="actionCount")
