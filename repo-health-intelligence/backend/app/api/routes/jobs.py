import asyncio

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.api.deps import DbSession
from app.database.session import AsyncSessionLocal
from app.schemas.job import AnalysisJobResponse
from app.services.job_service import JobService

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=AnalysisJobResponse)
async def get_job(job_id: int, db: DbSession):
    service = JobService(db)
    job = await service.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Analysis job not found.")
    return job


@router.websocket("/{job_id}/ws")
async def job_status_websocket(websocket: WebSocket, job_id: int):
    await websocket.accept()
    try:
        while True:
            async with AsyncSessionLocal() as session:
                service = JobService(session)
                job = await service.get_job(job_id)
                if job is None:
                    await websocket.send_json({"status": "not_found", "job_id": job_id})
                    break
                await websocket.send_json(job.model_dump(mode="json"))
                if job.status.value in {"completed", "failed"}:
                    break
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        return

