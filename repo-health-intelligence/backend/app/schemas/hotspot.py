from pydantic import BaseModel


class HotspotResponse(BaseModel):
    id: int
    file_path: str
    module: str
    complexity: float
    churn: float
    ownership_risk: float
    maintainability: float
    hotspot_score: float
    severity: str
    trend: str


class DangerousModule(BaseModel):
    name: str
    score: float
    files: int
    trend: str


class HotspotSummary(BaseModel):
    critical_hotspots: int
    high_risk_files: int
    avg_hotspot_score: float
    improving_files: int
    churn_complexity: list[dict]
    dangerous_modules: list[DangerousModule]

