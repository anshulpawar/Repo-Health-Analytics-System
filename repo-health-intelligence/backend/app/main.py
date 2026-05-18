from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.database.neo4j import driver
from app.middleware.rate_limit import RateLimitMiddleware

settings = get_settings()
configure_logging(settings.app_debug)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    driver.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.app_debug,
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    return {"service": settings.app_name, "version": settings.app_version}

