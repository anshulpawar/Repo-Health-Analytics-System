from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import AnalyticsRepository
from app.schemas.contributor import (
    ContributorResponse,
    ContributorStats,
    OwnershipDistributionItem,
    OwnershipWarning,
)

OWNERSHIP_COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#818cf8", "#64748b", "#14b8a6"]


class ContributorService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.analytics_repo = AnalyticsRepository(session)

    async def leaderboard(self, repository_id: int) -> list[ContributorResponse]:
        contributors = await self.analytics_repo.get_contributors(repository_id)
        file_ownership_counts = await self.analytics_repo.get_contributor_file_ownership_counts(repository_id)
        rows: list[ContributorResponse] = []
        for contributor in contributors:
            rows.append(
                ContributorResponse(
                    id=contributor.id,
                    name=contributor.name,
                    email=contributor.email,
                    commits=contributor.commit_count,
                    lines_added=contributor.lines_added,
                    lines_removed=contributor.lines_removed,
                    files_owned=file_ownership_counts.get(contributor.id, 0),
                    ownership_score=round(contributor.ownership_score, 2),
                    last_active=contributor.last_active,
                    risk_level=self._risk_level(contributor.ownership_score),
                )
            )
        return rows

    async def stats(self, repository_id: int) -> ContributorStats:
        contributors = await self.analytics_repo.get_contributors(repository_id)
        if not contributors:
            return ContributorStats(bus_factor=0, contributors=0, active_30d=0, top_contributor="N/A")
        owners = [c for c in contributors if c.ownership_score >= 50]
        top = contributors[0]
        active_threshold = datetime.utcnow() - timedelta(days=30)
        active = len([c for c in contributors if c.last_active and c.last_active >= active_threshold])
        return ContributorStats(
            bus_factor=float(max(len(owners), 1)),
            contributors=len(contributors),
            active_30d=active,
            top_contributor=top.name,
        )

    async def ownership_distribution(self, repository_id: int) -> list[OwnershipDistributionItem]:
        contributors = await self.analytics_repo.get_contributors(repository_id)
        distribution: list[OwnershipDistributionItem] = []
        for idx, contributor in enumerate(contributors[:10]):
            distribution.append(
                OwnershipDistributionItem(
                    name=contributor.name,
                    value=round(contributor.ownership_score, 2),
                    color=OWNERSHIP_COLORS[idx % len(OWNERSHIP_COLORS)],
                )
            )
        return distribution

    async def ownership_warnings(self, repository_id: int) -> list[OwnershipWarning]:
        hotspots = await self.analytics_repo.get_hotspots(repository_id, limit=50)
        contributors = await self.analytics_repo.get_contributors(repository_id)
        contributors_by_score = sorted(contributors, key=lambda c: c.ownership_score, reverse=True)
        fallback_owner = contributors_by_score[0].name if contributors_by_score else "N/A"
        warnings: list[OwnershipWarning] = []

        for hotspot, file_model in hotspots[:8]:
            if hotspot.ownership_risk < 70:
                continue
            warnings.append(
                OwnershipWarning(
                    module=file_model.path,
                    owner=fallback_owner,
                    ownership=round(hotspot.ownership_risk, 2),
                    risk=self._risk_message(hotspot.ownership_risk),
                )
            )
        return warnings

    @staticmethod
    def _risk_level(score: float) -> str:
        if score >= 80:
            return "High"
        if score >= 50:
            return "Medium"
        return "Low"

    @staticmethod
    def _risk_message(score: float) -> str:
        if score >= 90:
            return "Critical - single point of failure"
        if score >= 75:
            return "High - limited knowledge sharing"
        return "Medium - monitor ownership balance"

