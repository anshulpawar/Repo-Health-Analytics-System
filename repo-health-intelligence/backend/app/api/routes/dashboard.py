from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.dashboard import DashboardResponse, RepositoryTimelinePoint
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/{repository_id}", response_model=DashboardResponse)
async def dashboard(repository_id: int, db: DbSession):
    service = DashboardService(db)
    return await service.get_dashboard(repository_id)


@router.get("/{repository_id}/timeline", response_model=list[RepositoryTimelinePoint])
async def repository_timeline(repository_id: int, db: DbSession):
    service = DashboardService(db)
    return await service.get_repository_timeline(repository_id, days=30)


@router.get("/{repository_id}/modules")
async def repository_modules(repository_id: int, db: DbSession):
    service = DashboardService(db)
    return await service.get_module_overview(repository_id)

