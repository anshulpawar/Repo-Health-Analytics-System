from fastapi import APIRouter, Query

from app.api.deps import DbSession
from app.schemas.hotspot import HotspotResponse, HotspotSummary
from app.services.hotspot_service import HotspotService

router = APIRouter(prefix="/hotspots", tags=["hotspots"])


@router.get("/{repository_id}/summary", response_model=HotspotSummary)
async def hotspot_summary(repository_id: int, db: DbSession):
    service = HotspotService(db)
    return await service.summary(repository_id)


@router.get("/{repository_id}", response_model=list[HotspotResponse])
async def list_hotspots(repository_id: int, db: DbSession, limit: int = Query(default=200, ge=1, le=1000)):
    service = HotspotService(db)
    return await service.list_hotspots(repository_id, limit=limit)

