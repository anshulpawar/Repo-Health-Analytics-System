from datetime import datetime
from typing import Optional

from pydantic import AnyHttpUrl, BaseModel, Field

from app.schemas.common import BaseSchema


class RepositoryCreateRequest(BaseModel):
    url: str = Field(..., min_length=10, max_length=1024)
    force_reanalyze: bool = False
    max_commits: Optional[int] = Field(default=None, ge=1, le=2000)


class LanguageBreakdown(BaseModel):
    name: str
    percentage: float
    color: str


class RepositorySummary(BaseSchema):
    id: int
    name: str
    url: str
    default_branch: str
    created_at: datetime
    last_analyzed_at: Optional[datetime] = None


class RepositoryOverview(BaseModel):
    id: int
    name: str
    full_name: str
    description: str
    language: str
    stars: int
    forks: int
    open_issues: int
    contributors: int
    commits: int
    health_score: float
    complexity_score: float
    coupling_score: float
    test_coverage: float
    bus_factor: float
    risk_level: str
    last_analyzed: Optional[datetime]
    languages: list[LanguageBreakdown]

