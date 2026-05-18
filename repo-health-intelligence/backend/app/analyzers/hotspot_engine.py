from dataclasses import dataclass

from app.core.enums import HotspotRiskLevel
from app.utils.scoring import clamp


@dataclass
class HotspotResult:
    hotspot_score: float
    risk_level: HotspotRiskLevel
    trend: str


class HotspotEngine:
    def score(self, churn_score: float, complexity: float, ownership_risk: float, maintainability: float) -> HotspotResult:
        # Weighted formula: high churn + high complexity + ownership concentration - maintainability.
        score = clamp(churn_score * 0.4 + complexity * 0.35 + ownership_risk * 0.2 + (100 - maintainability) * 0.05)
        if score >= 85:
            risk = HotspotRiskLevel.CRITICAL
        elif score >= 70:
            risk = HotspotRiskLevel.HIGH
        elif score >= 50:
            risk = HotspotRiskLevel.MEDIUM
        else:
            risk = HotspotRiskLevel.LOW
        trend = "degrading" if score > 70 else "stable" if score > 45 else "improving"
        return HotspotResult(hotspot_score=round(score, 2), risk_level=risk, trend=trend)

