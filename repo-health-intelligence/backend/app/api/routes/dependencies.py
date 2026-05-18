from fastapi import APIRouter

from app.api.deps import DbSession
from app.schemas.dependency import DependencyGraphResponse
from app.services.dependency_service import DependencyService

router = APIRouter(prefix="/dependencies", tags=["dependencies"])


@router.get("/{repository_id}", response_model=DependencyGraphResponse)
async def dependency_graph(repository_id: int, db: DbSession):
    service = DependencyService(db)
    return await service.graph(repository_id)

