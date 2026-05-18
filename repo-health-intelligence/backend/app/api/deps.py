from typing import Annotated

from fastapi import Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db_session

DbSession = Annotated[AsyncSession, Depends(get_db_session)]


def pagination_params(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 20,
) -> tuple[int, int]:
    offset = (page - 1) * page_size
    return offset, page_size

