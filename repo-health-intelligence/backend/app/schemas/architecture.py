from datetime import datetime

from pydantic import BaseModel


class ArchitectureViolationResponse(BaseModel):
    id: int
    type: str
    description: str
    severity: str
    source: str
    target: str
    layer: str
    detected_at: datetime
    resolved: bool


class ArchitecturePolicyStatus(BaseModel):
    name: str
    status: str
    count: int


class ArchitectureSummary(BaseModel):
    integrity_score: float
    active_violations: int
    resolved: int
    drift_rate: float
    drift_timeline: list[dict]
    policies: list[ArchitecturePolicyStatus]

