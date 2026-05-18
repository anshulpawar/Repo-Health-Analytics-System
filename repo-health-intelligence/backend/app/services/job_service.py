from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import AnalysisJobRepository
from app.schemas.job import AnalysisJobResponse


class JobService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.repo = AnalysisJobRepository(session)

    async def get_job(self, job_id: int) -> AnalysisJobResponse | None:
        job = await self.repo.get_by_id(job_id)
        if job is None:
            return None
        return AnalysisJobResponse(
            id=job.id,
            repository_id=job.repository_id,
            status=job.status,
            progress=job.progress,
            started_at=job.started_at,
            completed_at=job.completed_at,
            error_message=job.error_message,
            metadata=job.metadata_json or {},
        )

    async def latest_for_repository(self, repository_id: int) -> AnalysisJobResponse | None:
        job = await self.repo.get_latest_for_repository(repository_id)
        if job is None:
            return None
        return AnalysisJobResponse(
            id=job.id,
            repository_id=job.repository_id,
            status=job.status,
            progress=job.progress,
            started_at=job.started_at,
            completed_at=job.completed_at,
            error_message=job.error_message,
            metadata=job.metadata_json or {},
        )

