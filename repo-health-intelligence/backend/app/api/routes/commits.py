from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.schemas.commit import CommitResponse, CommitStatsResponse
from app.schemas.common import PaginatedResponse
from app.services.commit_service import CommitService

router = APIRouter(prefix="/commits", tags=["commits"])


@router.get("/{repository_id}", response_model=PaginatedResponse[CommitResponse])
async def list_commits(
    repository_id: int,
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
):
    service = CommitService(db)
    items, total = await service.list_commits(repository_id, page=page, page_size=page_size)
    return PaginatedResponse[CommitResponse](items=items, total=total, page=page, page_size=page_size)


@router.get("/{repository_id}/stats", response_model=CommitStatsResponse)
async def commit_stats(repository_id: int, db: DbSession):
    service = CommitService(db)
    return await service.stats(repository_id)

