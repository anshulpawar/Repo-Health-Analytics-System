from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.architecture import ArchitectureSummary, ArchitectureViolationResponse
from app.services.architecture_service import ArchitectureService

router = APIRouter(prefix="/architecture", tags=["architecture"])


@router.get("/{repository_id}/summary", response_model=ArchitectureSummary)
async def architecture_summary(repository_id: int, db: DbSession):
    service = ArchitectureService(db)
    return await service.summary(repository_id)


@router.get("/{repository_id}/violations", response_model=list[ArchitectureViolationResponse])
async def architecture_violations(repository_id: int, db: DbSession):
    service = ArchitectureService(db)
    return await service.violations(repository_id)

