from collections import defaultdict
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import AnalyticsRepository
from app.schemas.dashboard import DashboardResponse, HealthTimelinePoint, RepositoryTimelinePoint


NO_DATA_MESSAGE = "No repository analyzed yet"


class DashboardService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.analytics_repo = AnalyticsRepository(session)

    async def get_dashboard(self, repository_id: int) -> DashboardResponse:
        latest = await self.analytics_repo.get_latest_health(repository_id)
        previous = await self.analytics_repo.get_previous_health(repository_id)
        timeline = await self.analytics_repo.get_health_timeline(repository_id, days=30)
        languages = await self.analytics_repo.get_languages(repository_id)
        contributors = await self.analytics_repo.get_contributors(repository_id)
        commits, total_commits = await self.analytics_repo.get_commits(repository_id, 0, 4)
        points = await self.analytics_repo.get_churn_complexity_points(repository_id, limit=120)

        has_data = latest is not None
        if not has_data:
            return DashboardResponse(
                repository_id=repository_id,
                has_data=False,
                no_data_message=NO_DATA_MESSAGE,
                health_score=0,
                complexity_score=0,
                coupling_score=0,
                coverage_score=0,
                bus_factor=0,
                risk_level="Low",
                total_commits=0,
                total_contributors=0,
                language_breakdown=[],
                health_timeline=[],
                churn_complexity=[],
                top_commit_ids=[],
                ai_insight_placeholder={
                    "title": "AI insights not enabled",
                    "description": "AI integration is reserved for a future phase.",
                    "category": "recommendation",
                    "severity": "info",
                    "timestamp": datetime.utcnow().isoformat(),
                    "recommendation": "Enable AI service integration in future releases.",
                    "impact": "No AI insights are generated yet.",
                    "placeholder": True,
                },
            )

        previous_health = previous.health_score if previous else latest.health_score
        change = latest.health_score - previous_health
        risk_level = self._risk_level(latest.risk_score)
        return DashboardResponse(
            repository_id=repository_id,
            has_data=True,
            no_data_message=NO_DATA_MESSAGE,
            health_score=round(latest.health_score, 2),
            complexity_score=round(latest.complexity_score, 2),
            coupling_score=round(latest.coupling_score, 2),
            coverage_score=round(latest.test_coverage_score, 2),
            bus_factor=round(latest.bus_factor, 2),
            risk_level=risk_level,
            total_commits=total_commits,
            total_contributors=len(contributors),
            language_breakdown=languages,
            health_timeline=[
                HealthTimelinePoint(
                    date=point.timestamp.date().isoformat(),
                    health_score=round(point.health_score, 2),
                    complexity=round(point.complexity_score, 2),
                    coupling=round(point.coupling_score, 2),
                    coverage=round(point.test_coverage_score, 2),
                )
                for point in timeline
            ],
            churn_complexity=points,
            top_commit_ids=[commit.id for commit in commits],
            ai_insight_placeholder={
                "title": "AI insights not enabled",
                "description": "Pipeline reserves AI slots but no LLM execution is active.",
                "category": "recommendation",
                "severity": "info",
                "timestamp": datetime.utcnow().isoformat(),
                "recommendation": "Use hotspot and architecture pages for actionable insights.",
                "impact": f"Current health score: {latest.health_score:.2f} ({change:+.2f} vs previous snapshot).",
                "placeholder": True,
            },
        )

    async def get_repository_timeline(self, repository_id: int, days: int = 30) -> list[RepositoryTimelinePoint]:
        timeline = await self.analytics_repo.get_health_timeline(repository_id, days)
        return [
            RepositoryTimelinePoint(
                date=entry.timestamp.date().isoformat(),
                complexity=round(entry.complexity_score, 2),
                health=round(entry.health_score, 2),
            )
            for entry in timeline
        ]

    async def get_module_overview(self, repository_id: int) -> list[dict]:
        modules = await self.analytics_repo.get_module_rollup(repository_id)
        modules.sort(key=lambda m: m["complexity"], reverse=True)
        return modules

    @staticmethod
    def _risk_level(score: float) -> str:
        if score >= 75:
            return "Critical"
        if score >= 55:
            return "High"
        if score >= 35:
            return "Medium"
        return "Low"

