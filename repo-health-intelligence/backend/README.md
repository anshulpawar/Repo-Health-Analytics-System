# Repo Health Intelligence Backend

Production-grade backend stack for repository ingestion, commit analysis, architecture metrics, hotspot detection, contributor analytics, and health scoring.

## Stack

- FastAPI + Celery
- PostgreSQL (structured analytics)
- Neo4j (code knowledge graph)
- Redis (queue + caching primitives)
- SQLAlchemy + Alembic
- GitPython, Tree-sitter, NetworkX, Radon, Lizard, Pandas

## Folder Layout

```
backend/
  app/
    api/
    core/
    database/
    models/
    schemas/
    services/
    repositories/
    analyzers/
    graph/
    workers/
    tasks/
    utils/
    middleware/
    ai/
    main.py
  migrations/
  tests/
  docker/
  requirements.txt
  .env.example
  docker-compose.yml
```

## Quick Start

```bash
cd backend
docker compose up --build
```

Services:

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Neo4j browser: `http://localhost:7474` (`neo4j` / `neo4jpassword`)

## API Summary

- `POST /api/v1/repositories/analyze` : queue repository analysis job
- `GET /api/v1/repositories` : list repositories
- `GET /api/v1/repositories/{id}/overview`
- `GET /api/v1/dashboard/{id}`
- `GET /api/v1/commits/{id}`
- `GET /api/v1/hotspots/{id}`
- `GET /api/v1/contributors/{id}`
- `GET /api/v1/dependencies/{id}`
- `GET /api/v1/architecture/{id}/summary`
- `GET /api/v1/jobs/{job_id}`
- `WS /api/v1/jobs/{job_id}/ws` for live status

## Analysis Pipeline (Incremental)

1. Validate and normalize GitHub URL.
2. Clone/update cached repository.
3. Fetch commits (up to configured max, default 600).
4. Process only new commits not yet stored.
5. Analyze only changed files per commit.
6. Extract parse graph (functions/classes/imports/dependencies).
7. Compute complexity/maintainability/duplication metrics.
8. Build dependency graph, detect cycles and violations.
9. Compute contributor ownership and bus-factor.
10. Score hotspots and repository health snapshot.
11. Persist Postgres analytics + Neo4j graph nodes/relationships.

## AI Placeholder

AI/LLM endpoints are intentionally placeholders in this release.

- No OpenAI calls
- No LLM summaries or predictions
- API contract is ready for future integration under `app/ai/`

## Local Dev (No Docker)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
celery -A app.tasks.celery_app.celery_app worker --loglevel=info
```

