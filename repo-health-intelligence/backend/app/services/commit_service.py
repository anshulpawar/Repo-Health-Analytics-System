from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import AnalyticsRepository
from app.schemas.commit import CommitActivityPoint, CommitAuthor, CommitResponse, CommitStatsResponse


class CommitService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.analytics_repo = AnalyticsRepository(session)

    async def list_commits(self, repository_id: int, page: int = 1, page_size: int = 20) -> tuple[list[CommitResponse], int]:
        offset = (page - 1) * page_size
        commits, total = await self.analytics_repo.get_commits(repository_id, offset, page_size)
        items = []
        previous_by_id = {c.id: None for c in commits}
        for commit in commits:
            items.append(
                CommitResponse(
                    id=commit.id,
                    hash=commit.hash[:8],
                    message=commit.message,
                    author=CommitAuthor(name=commit.author),
                    date=commit.timestamp,
                    files_changed=commit.files_changed,
                    additions=commit.additions,
                    deletions=commit.deletions,
                    complexity_delta=0,
                    coupling_delta=0,
                    maintainability_delta=0,
                    architecture_impact=self._impact_from_files(commit.files_changed),
                )
            )
        return items, total

    async def stats(self, repository_id: int) -> CommitStatsResponse:
        stats = await self.analytics_repo.get_commit_stats(repository_id)
        activity = await self.analytics_repo.get_commit_activity(repository_id, days=14)
        positive_ratio = 0.0
        if activity:
            positive_days = len([item for item in activity if item["impact"] <= 10])
            positive_ratio = (positive_days / len(activity)) * 100
        return CommitStatsResponse(
            total_commits=int(stats["total_commits"]),
            avg_files_per_commit=round(stats["avg_files"], 2),
            positive_impact_ratio=round(positive_ratio, 2),
            avg_complexity_delta=round(stats["avg_complexity"], 2),
            activity=[CommitActivityPoint(**item) for item in activity],
        )

    @staticmethod
    def _impact_from_files(files_changed: int) -> str:
        if files_changed >= 20:
            return "high"
        if files_changed >= 10:
            return "medium"
        if files_changed >= 4:
            return "low"
        return "none"

