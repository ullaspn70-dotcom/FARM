from pydantic import Field

from app.schemas.common import CamelModel


class RiskFactorResponse(CamelModel):
    id: str
    label: str
    delta: int
    category: str
    description: str


class RiskHistoryPoint(CamelModel):
    time: str
    score: int


class RiskSummaryResponse(CamelModel):
    farm_id: str = Field(serialization_alias="farmId")
    biosecurity_score: int = Field(serialization_alias="biosecurityScore")
    previous_score: int = Field(serialization_alias="previousScore")
    risk_level: str = Field(serialization_alias="riskLevel")
    score_delta_7d: int = Field(serialization_alias="scoreDelta7d")
    risk_trend: str = Field(serialization_alias="riskTrend")
