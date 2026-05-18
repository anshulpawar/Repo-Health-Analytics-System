from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.core.enums import AnalysisJobStatus


class AnalysisJobResponse(BaseModel):
    id: int
    repository_id: int
    status: AnalysisJobStatus
    progress: float
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: dict = {}


class AnalysisJobStatusResponse(BaseModel):
    job: AnalysisJobResponse

