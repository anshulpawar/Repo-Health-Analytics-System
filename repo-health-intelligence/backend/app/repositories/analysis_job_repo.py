from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.core.enums import AnalysisJobStatus
from app.models import AnalysisJob


class AnalysisJobRepository:
    def __init__(self, session: AsyncSession | Session):
        self.session = session

    async def create(self, repository_id: int, metadata: dict | None = None) -> AnalysisJob:
        job = AnalysisJob(
            repository_id=repository_id,
            status=AnalysisJobStatus.QUEUED,
            progress=0,
            metadata_json=metadata or {},
        )
        self.session.add(job)
        await self.session.flush()
        return job

    async def get_by_id(self, job_id: int) -> Optional[AnalysisJob]:
        result = await self.session.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
        return result.scalar_one_or_none()

    async def get_latest_for_repository(self, repository_id: int) -> Optional[AnalysisJob]:
        result = await self.session.execute(
            select(AnalysisJob).where(AnalysisJob.repository_id == repository_id).order_by(AnalysisJob.started_at.desc()).limit(1)
        )
        return result.scalar_one_or_none()

    async def update_status(
        self,
        job: AnalysisJob,
        *,
        status: AnalysisJobStatus,
        progress: float,
        error_message: str | None = None,
        metadata: dict | None = None,
    ) -> AnalysisJob:
        job.status = status
        job.progress = progress
        if error_message:
            job.error_message = error_message
        if metadata:
            merged = dict(job.metadata_json or {})
            merged.update(metadata)
            job.metadata_json = merged
        if status in (AnalysisJobStatus.COMPLETED, AnalysisJobStatus.FAILED):
            job.completed_at = datetime.utcnow()
        await self.session.flush()
        return job

