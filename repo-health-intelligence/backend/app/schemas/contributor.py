from datetime import datetime

from pydantic import BaseModel


class ContributorResponse(BaseModel):
    id: int
    name: str
    avatar: str = ""
    email: str
    commits: int
    lines_added: int
    lines_removed: int
    files_owned: int
    ownership_score: float
    last_active: datetime | None
    risk_level: str


class ContributorStats(BaseModel):
    bus_factor: float
    contributors: int
    active_30d: int
    top_contributor: str


class OwnershipDistributionItem(BaseModel):
    name: str
    value: float
    color: str


class OwnershipWarning(BaseModel):
    module: str
    owner: str
    ownership: float
    risk: str

