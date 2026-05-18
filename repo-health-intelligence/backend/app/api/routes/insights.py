from fastapi import APIRouter

from app.api.deps import DbSession
from app.repositories import AnalyticsRepository
from app.schemas.insight import InsightsFeedResponse
from app.services.insight_service import InsightService

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/{repository_id}", response_model=InsightsFeedResponse)
async def insights_feed(repository_id: int, db: DbSession):
    analytics_repo = AnalyticsRepository(db)
    latest = await analytics_repo.get_latest_health(repository_id)
    service = InsightService(db)
    return await service.feed(has_data=latest is not None)

