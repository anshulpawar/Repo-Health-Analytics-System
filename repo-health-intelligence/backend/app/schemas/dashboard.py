from datetime import datetime

from pydantic import BaseModel


class MetricCardResponse(BaseModel):
    title: str
    value: float | str
    change: float
    change_label: str
    trend: str
    sparkline: list[float] = []


class HealthTimelinePoint(BaseModel):
    date: str
    health_score: float
    complexity: float
    coupling: float
    coverage: float


class ScatterPoint(BaseModel):
    name: str
    complexity: float
    churn: float
    size: float
    module: str


class DashboardResponse(BaseModel):
    repository_id: int
    has_data: bool
    no_data_message: str
    health_score: float
    complexity_score: float
    coupling_score: float
    coverage_score: float
    bus_factor: float
    risk_level: str
    total_commits: int
    total_contributors: int
    language_breakdown: list[dict]
    health_timeline: list[HealthTimelinePoint]
    churn_complexity: list[ScatterPoint]
    top_commit_ids: list[int]
    ai_insight_placeholder: dict


class RepositoryTimelinePoint(BaseModel):
    date: str
    complexity: float
    health: float


class DriftTimelinePoint(BaseModel):
    date: str
    violations: int
    integrity: float

