from fastapi import APIRouter

from app.api.routes import architecture, commits, contributors, dashboard, dependencies, hotspots, insights, jobs, repositories, system

api_router = APIRouter()
api_router.include_router(system.router)
api_router.include_router(repositories.router)
api_router.include_router(dashboard.router)
api_router.include_router(commits.router)
api_router.include_router(hotspots.router)
api_router.include_router(contributors.router)
api_router.include_router(dependencies.router)
api_router.include_router(architecture.router)
api_router.include_router(insights.router)
api_router.include_router(jobs.router)

