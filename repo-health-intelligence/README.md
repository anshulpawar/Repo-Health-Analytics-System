# Repo Health Intelligence

Full-stack repository analytics: Next.js frontend + FastAPI backend with Postgres, Redis, Neo4j, and Celery.

## Quick start (recommended)

### 1. Backend stack

```bash
cd backend
docker compose up --build
```

| Service | URL |
|---------|-----|
| API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| Neo4j | http://localhost:7474 |

### 2. Frontend

```bash
cd ..
cp .env.example .env.local   # optional
npm install
npm run dev
```

Open http://localhost:3000, paste a **public** GitHub repository URL, and run analysis.

In local dev the frontend proxies `/api/v1/*` to `http://localhost:8000` (see `next.config.ts`). You do not need `NEXT_PUBLIC_API_BASE_URL` unless the API runs on another host.

## Environment

Copy [`.env.example`](.env.example) to `.env.local` when needed:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Direct API URL (skip proxy). Example: `http://localhost:8000/api/v1` |
| `BACKEND_URL` | Proxy target for Next.js rewrites (Docker: `http://backend:8000`) |

Backend variables: [`backend/.env.example`](backend/.env.example).

## Full stack with Docker (API + UI)

```bash
cd backend
docker compose up --build
```

This starts Postgres, Redis, Neo4j, API, Celery worker, and the Next.js frontend on http://localhost:3000.

## Architecture

- **Frontend** (`src/lib/api.ts`) — REST client; job updates via WebSocket with HTTP polling fallback
- **Backend** (`backend/app`) — analysis pipeline, metrics, graph storage
- **Settings** — local preferences in `localStorage`; live backend health check on `/api/v1/healthz`

## Analysis requirements

Analysis completes only when **all** of these are running:

1. FastAPI (`backend` or `uvicorn`)
2. Celery worker (`celery -A app.tasks.celery_app.celery_app worker`)
3. Postgres, Redis, Neo4j

See [`backend/README.md`](backend/README.md) for API details and local (non-Docker) setup.

## AI features

LLM insights are intentionally disabled. Analytics endpoints (commits, hotspots, architecture, contributors, dependencies) are fully wired.
