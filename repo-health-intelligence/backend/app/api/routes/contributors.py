from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.contributor import ContributorResponse, ContributorStats, OwnershipDistributionItem, OwnershipWarning
from app.services.contributor_service import ContributorService

router = APIRouter(prefix="/contributors", tags=["contributors"])


@router.get("/{repository_id}/stats", response_model=ContributorStats)
async def contributor_stats(repository_id: int, db: DbSession):
    service = ContributorService(db)
    return await service.stats(repository_id)


@router.get("/{repository_id}", response_model=list[ContributorResponse])
async def contributor_leaderboard(repository_id: int, db: DbSession):
    service = ContributorService(db)
    return await service.leaderboard(repository_id)


@router.get("/{repository_id}/ownership", response_model=list[OwnershipDistributionItem])
async def ownership_distribution(repository_id: int, db: DbSession):
    service = ContributorService(db)
    return await service.ownership_distribution(repository_id)


@router.get("/{repository_id}/warnings", response_model=list[OwnershipWarning])
async def ownership_warnings(repository_id: int, db: DbSession):
    service = ContributorService(db)
    return await service.ownership_warnings(repository_id)

