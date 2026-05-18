from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession
from app.core.security import normalize_github_url, parse_and_validate_github_url
from app.schemas.common import ApiMessage
from app.schemas.repository import RepositoryCreateRequest, RepositoryOverview, RepositorySummary
from app.services.job_service import JobService
from app.services.repository_service import RepositoryService
from app.tasks.analysis_tasks import run_repository_analysis_task

router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.get("", response_model=list[RepositorySummary])
async def list_repositories(db: DbSession):
    service = RepositoryService(db)
    return await service.list_repositories()


@router.post("/analyze")
async def analyze_repository(payload: RepositoryCreateRequest, db: DbSession):
    try:
        parse_and_validate_github_url(payload.url)
        normalized_url = normalize_github_url(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    service = RepositoryService(db)
    repository_id = await service.ensure_repository(normalized_url)
    job_id = await service.create_analysis_job(
        repository_id=repository_id,
        payload={"requested_url": payload.url, "force_reanalyze": payload.force_reanalyze},
    )
    run_repository_analysis_task.delay(
        repository_id=repository_id,
        job_id=job_id,
        force_reanalyze=payload.force_reanalyze,
        max_commits=payload.max_commits,
    )
    return {"repository_id": repository_id, "job_id": job_id, "status": "queued"}


@router.get("/{repository_id}/overview", response_model=RepositoryOverview)
async def repository_overview(repository_id: int, db: DbSession):
    service = RepositoryService(db)
    try:
        return await service.get_repository_overview(repository_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{repository_id}/jobs/latest")
async def latest_repository_job(repository_id: int, db: DbSession):
    service = JobService(db)
    job = await service.latest_for_repository(repository_id)
    if job is None:
        raise HTTPException(status_code=404, detail="No analysis jobs found for repository.")
    return job

