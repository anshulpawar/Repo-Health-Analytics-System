from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

import redis.asyncio as redis

from app.core.config import get_settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        settings = get_settings()
        self._limit = settings.rate_limit_per_minute
        self._redis = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        bucket = f"rate-limit:{client_ip}:{request.url.path}"
        try:
            count = await self._redis.incr(bucket)
            if count == 1:
                await self._redis.expire(bucket, 60)
            if count > self._limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please retry in a minute."},
                )
        except Exception:
            # Fail-open so local development and tests are not blocked when Redis is unavailable.
            pass
        return await call_next(request)
