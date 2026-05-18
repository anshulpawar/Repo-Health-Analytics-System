import asyncio
import logging

from sqlalchemy import select

from app.core.enums import AnalysisJobStatus
from app.database.session import AsyncSessionLocal
from app.models import AnalysisJob
from app.services.analysis_pipeline_service import AnalysisPipelineService
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="analysis.run_repository_analysis")
def run_repository_analysis_task(repository_id: int, job_id: int, force_reanalyze: bool = False, max_commits: int | None = None) -> None:
    asyncio.run(_run(repository_id, job_id, force_reanalyze, max_commits))


async def _run(repository_id: int, job_id: int, force_reanalyze: bool, max_commits: int | None) -> None:
    async with AsyncSessionLocal() as session:
        service = AnalysisPipelineService(session)
        try:
            await service.run(
                repository_id=repository_id,
                job_id=job_id,
                force_reanalyze=force_reanalyze,
                max_commits=max_commits,
            )
        except Exception as exc:
            logger.exception("Analysis task failed for repository=%s job=%s", repository_id, job_id)
            result = await session.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
            job = result.scalar_one_or_none()
            if job:
                job.status = AnalysisJobStatus.FAILED
                job.progress = 100
                job.error_message = str(exc)
                await session.commit()
            raise

