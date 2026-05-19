# Repo Health Intelligence

Full-stack repository analytics on **Next.js + Node.js** — ready for **Vercel** deployment. No Docker required.

## Stack

- **Next.js 16** (App Router, React 19)
- **API**: Route Handlers at `/api/v1/*`
- **Database**: Prisma + SQLite (local) or PostgreSQL (Vercel production)
- **Analysis**: Node.js + `simple-git` (clone, parse, metrics)

## Quick start (local)

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000, paste a **public** GitHub URL, and run analysis.

API docs: http://localhost:3000/api/v1/healthz → `{"status":"ok"}`

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add **Vercel Postgres** (Storage → Create Database).
4. Set environment variable `DATABASE_URL` to the Postgres connection string.
5. In `prisma/schema.prisma`, change:
   ```prisma
   provider = "postgresql"
   ```
6. Deploy. The build runs `prisma db push` to create tables.

Optional: set `MAX_COMMITS_PER_ANALYSIS=50` on the Hobby plan to stay within function time limits.

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `file:./prisma/dev.db` (local) or Postgres URL (Vercel) |
| `MAX_COMMITS_PER_ANALYSIS` | Max git commits to process (default `80`) |

## API routes

All endpoints live under `/api/v1`:

- `GET /healthz`
- `POST /repositories/analyze`
- `GET /repositories`, `/repositories/{id}/overview`, `/repositories/{id}/jobs/latest`
- `GET /dashboard/{id}`, `/timeline`, `/modules`
- `GET /commits/{id}`, `/commits/{id}/stats`
- `GET /hotspots/{id}`, `/hotspots/{id}/summary`
- `GET /contributors/{id}`, `/stats`, `/ownership`, `/warnings`
- `GET /dependencies/{id}`
- `GET /architecture/{id}/summary`, `/violations`
- `GET /insights/{id}`
- `GET /jobs/{id}`

## Legacy Python backend

The `backend/` folder contains the original FastAPI implementation (reference only). The active API is implemented in `src/app/api/v1` and `src/server/`.

## AI features

LLM insights are placeholders. Commit, hotspot, architecture, contributor, and dependency analytics are fully implemented in Node.js.
