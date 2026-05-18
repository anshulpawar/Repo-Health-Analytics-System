from datetime import datetime

from pydantic import BaseModel


class CommitAuthor(BaseModel):
    name: str
    email: str = ""


class CommitResponse(BaseModel):
    id: int
    hash: str
    message: str
    author: CommitAuthor
    date: datetime
    files_changed: int
    additions: int
    deletions: int
    complexity_delta: float
    coupling_delta: float
    maintainability_delta: float
    architecture_impact: str


class CommitActivityPoint(BaseModel):
    date: str
    commits: int
    impact: float


class CommitStatsResponse(BaseModel):
    total_commits: int
    avg_files_per_commit: float
    positive_impact_ratio: float
    avg_complexity_delta: float
    activity: list[CommitActivityPoint]

