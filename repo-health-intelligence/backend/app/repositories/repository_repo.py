from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session

from app.models import Repository


class RepositoryRepository:
    def __init__(self, session: AsyncSession | Session):
        self.session = session

    async def get_by_id(self, repository_id: int) -> Optional[Repository]:
        result = await self.session.execute(select(Repository).where(Repository.id == repository_id))
        return result.scalar_one_or_none()

    async def get_by_url(self, url: str) -> Optional[Repository]:
        result = await self.session.execute(select(Repository).where(Repository.url == url))
        return result.scalar_one_or_none()

    async def list_all(self) -> list[Repository]:
        result = await self.session.execute(select(Repository).order_by(Repository.last_analyzed_at.desc().nullslast()))
        return list(result.scalars().all())

    async def create(self, *, name: str, url: str, default_branch: str) -> Repository:
        repository = Repository(name=name, url=url, default_branch=default_branch)
        self.session.add(repository)
        await self.session.flush()
        return repository

    async def update_last_analyzed(self, repository: Repository, when: datetime) -> Repository:
        repository.last_analyzed_at = when
        await self.session.flush()
        return repository

