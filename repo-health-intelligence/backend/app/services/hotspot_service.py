from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import AnalyticsRepository
from app.schemas.hotspot import DangerousModule, HotspotResponse, HotspotSummary


class HotspotService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.analytics_repo = AnalyticsRepository(session)

    async def summary(self, repository_id: int) -> HotspotSummary:
        hotspots = await self.analytics_repo.get_hotspots(repository_id, limit=300)
        points = await self.analytics_repo.get_churn_complexity_points(repository_id, limit=200)
        hotspot_rows = [row[0] for row in hotspots]

        critical = len([h for h in hotspot_rows if h.risk_level.value == "critical"])
        high_risk = len([h for h in hotspot_rows if h.risk_level.value in {"critical", "high"}])
        improving = len([h for h in hotspot_rows if h.trend == "improving"])
        avg_score = sum(h.hotspot_score for h in hotspot_rows) / max(len(hotspot_rows), 1)

        grouped = defaultdict(list)
        for hotspot, file_model in hotspots:
            module = file_model.path.split("/")[0] if "/" in file_model.path else "root"
            grouped[module].append(hotspot)
        dangerous_modules = []
        for module, entries in grouped.items():
            dangerous_modules.append(
                DangerousModule(
                    name=module,
                    score=round(sum(item.hotspot_score for item in entries) / max(len(entries), 1), 2),
                    files=len(entries),
                    trend="degrading" if any(item.trend == "degrading" for item in entries) else "stable",
                )
            )
        dangerous_modules.sort(key=lambda m: m.score, reverse=True)

        return HotspotSummary(
            critical_hotspots=critical,
            high_risk_files=high_risk,
            avg_hotspot_score=round(avg_score, 2),
            improving_files=improving,
            churn_complexity=points,
            dangerous_modules=dangerous_modules[:5],
        )

    async def list_hotspots(self, repository_id: int, limit: int = 200) -> list[HotspotResponse]:
        hotspots = await self.analytics_repo.get_hotspots(repository_id, limit=limit)
        rows: list[HotspotResponse] = []
        for hotspot, file_model in hotspots:
            rows.append(
                HotspotResponse(
                    id=hotspot.id,
                    file_path=file_model.path,
                    module=file_model.path.split("/")[0] if "/" in file_model.path else "root",
                    complexity=round(hotspot.complexity, 2),
                    churn=round(hotspot.churn, 2),
                    ownership_risk=round(hotspot.ownership_risk, 2),
                    maintainability=round(hotspot.maintainability, 2),
                    hotspot_score=round(hotspot.hotspot_score, 2),
                    severity=hotspot.risk_level.value,
                    trend=hotspot.trend,
                )
            )
        return rows

