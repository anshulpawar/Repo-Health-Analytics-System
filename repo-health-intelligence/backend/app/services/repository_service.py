from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import AnalysisJobRepository, AnalyticsRepository, RepositoryRepository
from app.schemas.repository import LanguageBreakdown, RepositoryOverview, RepositorySummary


class RepositoryService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository_repo = RepositoryRepository(session)
        self.job_repo = AnalysisJobRepository(session)
        self.analytics_repo = AnalyticsRepository(session)

    async def list_repositories(self) -> list[RepositorySummary]:
        repositories = await self.repository_repo.list_all()
        return [RepositorySummary.model_validate(repository) for repository in repositories]

    async def ensure_repository(self, repository_url: str) -> int:
        existing = await self.repository_repo.get_by_url(repository_url)
        if existing:
            return existing.id
        owner, repo = self._extract_owner_repo(repository_url)
        model = await self.repository_repo.create(name=f"{owner}/{repo}", url=repository_url, default_branch="main")
        await self.session.commit()
        return model.id

    async def create_analysis_job(self, repository_id: int, payload: dict | None = None) -> int:
        job = await self.job_repo.create(repository_id=repository_id, metadata=payload)
        await self.session.commit()
        return job.id

    async def get_repository_overview(self, repository_id: int) -> RepositoryOverview:
        repository = await self.repository_repo.get_by_id(repository_id)
        if repository is None:
            raise ValueError("Repository not found.")

        latest_health = await self.analytics_repo.get_latest_health(repository_id)
        languages = await self.analytics_repo.get_languages(repository_id)
        contributors = await self.analytics_repo.get_contributors(repository_id)
        commits, total_commits = await self.analytics_repo.get_commits(repository_id, 0, 1)

        health_score = latest_health.health_score if latest_health else 0
        complexity_score = latest_health.complexity_score if latest_health else 0
        coupling_score = latest_health.coupling_score if latest_health else 0
        coverage_score = latest_health.test_coverage_score if latest_health else 0
        bus_factor = latest_health.bus_factor if latest_health else 0
        risk_score = latest_health.risk_score if latest_health else 0
        risk_level = self._risk_level(risk_score)

        owner, repo_name = self._extract_owner_repo(repository.url)
        return RepositoryOverview(
            id=repository.id,
            name=repo_name,
            full_name=f"{owner}/{repo_name}",
            description=f"Repository analysis for {owner}/{repo_name}",
            language=languages[0]["name"] if languages else "Unknown",
            stars=0,
            forks=0,
            open_issues=0,
            contributors=len(contributors),
            commits=total_commits,
            health_score=round(health_score, 2),
            complexity_score=round(complexity_score, 2),
            coupling_score=round(coupling_score, 2),
            test_coverage=round(coverage_score, 2),
            bus_factor=round(bus_factor, 2),
            risk_level=risk_level,
            last_analyzed=repository.last_analyzed_at,
            languages=[LanguageBreakdown(**item) for item in languages],
        )

    @staticmethod
    def _extract_owner_repo(url: str) -> tuple[str, str]:
        cleaned = url.replace(".git", "").rstrip("/")
        parts = cleaned.split("/")
        if len(parts) >= 2:
            return parts[-2], parts[-1]
        return "unknown", cleaned

    @staticmethod
    def _risk_level(risk_score: float) -> str:
        if risk_score >= 75:
            return "Critical"
        if risk_score >= 55:
            return "High"
        if risk_score >= 35:
            return "Medium"
        return "Low"

