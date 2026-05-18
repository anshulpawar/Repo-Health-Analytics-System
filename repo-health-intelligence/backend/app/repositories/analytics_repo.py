from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import case, desc, distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    ArchitectureViolation,
    Commit,
    Contributor,
    ContributorOwnership,
    DependencyRelationship,
    File,
    FileMetric,
    Hotspot,
    RepositoryHealth,
)


class AnalyticsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_latest_health(self, repository_id: int) -> RepositoryHealth | None:
        result = await self.session.execute(
            select(RepositoryHealth)
            .where(RepositoryHealth.repository_id == repository_id)
            .order_by(RepositoryHealth.timestamp.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_previous_health(self, repository_id: int) -> RepositoryHealth | None:
        result = await self.session.execute(
            select(RepositoryHealth)
            .where(RepositoryHealth.repository_id == repository_id)
            .order_by(RepositoryHealth.timestamp.desc())
            .offset(1)
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_health_timeline(self, repository_id: int, days: int = 30) -> list[RepositoryHealth]:
        since = datetime.utcnow() - timedelta(days=days)
        result = await self.session.execute(
            select(RepositoryHealth)
            .where(RepositoryHealth.repository_id == repository_id, RepositoryHealth.timestamp >= since)
            .order_by(RepositoryHealth.timestamp.asc())
        )
        return list(result.scalars().all())

    async def get_commits(self, repository_id: int, offset: int, limit: int) -> tuple[list[Commit], int]:
        commits_result = await self.session.execute(
            select(Commit)
            .where(Commit.repository_id == repository_id)
            .order_by(Commit.timestamp.desc())
            .offset(offset)
            .limit(limit)
        )
        total_result = await self.session.execute(select(func.count()).select_from(Commit).where(Commit.repository_id == repository_id))
        return list(commits_result.scalars().all()), int(total_result.scalar_one() or 0)

    async def get_commit_activity(self, repository_id: int, days: int = 14) -> list[dict[str, Any]]:
        since = datetime.utcnow() - timedelta(days=days)
        result = await self.session.execute(
            select(
                func.date_trunc("day", Commit.timestamp).label("day"),
                func.count(Commit.id).label("count"),
                func.avg(FileMetric.complexity).label("impact"),
            )
            .outerjoin(FileMetric, FileMetric.commit_id == Commit.id)
            .where(Commit.repository_id == repository_id, Commit.timestamp >= since)
            .group_by(func.date_trunc("day", Commit.timestamp))
            .order_by(func.date_trunc("day", Commit.timestamp))
        )
        return [
            {"date": row.day.date().isoformat(), "commits": int(row.count), "impact": float(row.impact or 0.0)}
            for row in result.fetchall()
        ]

    async def get_commit_stats(self, repository_id: int) -> dict[str, float]:
        result = await self.session.execute(
            select(
                func.count(Commit.id).label("total_commits"),
                func.avg(Commit.files_changed).label("avg_files"),
                func.avg(FileMetric.complexity).label("avg_complexity"),
            )
            .outerjoin(FileMetric, FileMetric.commit_id == Commit.id)
            .where(Commit.repository_id == repository_id)
        )
        row = result.one()
        return {
            "total_commits": float(row.total_commits or 0),
            "avg_files": float(row.avg_files or 0),
            "avg_complexity": float(row.avg_complexity or 0),
        }

    async def get_contributors(self, repository_id: int) -> list[Contributor]:
        result = await self.session.execute(
            select(Contributor)
            .where(Contributor.repository_id == repository_id)
            .order_by(Contributor.commit_count.desc(), Contributor.ownership_score.desc())
        )
        return list(result.scalars().all())

    async def get_contributor_file_ownership_counts(self, repository_id: int) -> dict[int, int]:
        result = await self.session.execute(
            select(ContributorOwnership.contributor_id, func.count(ContributorOwnership.file_id))
            .join(Contributor, Contributor.id == ContributorOwnership.contributor_id)
            .where(Contributor.repository_id == repository_id)
            .group_by(ContributorOwnership.contributor_id)
        )
        return {int(row[0]): int(row[1]) for row in result.fetchall()}

    async def get_hotspots(self, repository_id: int, limit: int = 100) -> list[tuple[Hotspot, File]]:
        result = await self.session.execute(
            select(Hotspot, File)
            .join(File, File.id == Hotspot.file_id)
            .where(Hotspot.repository_id == repository_id)
            .order_by(Hotspot.hotspot_score.desc())
            .limit(limit)
        )
        return list(result.fetchall())

    async def get_churn_complexity_points(self, repository_id: int, limit: int = 200) -> list[dict[str, Any]]:
        result = await self.session.execute(
            select(File.path, File.current_complexity, File.churn_score, func.max(FileMetric.lines_of_code), File.language)
            .outerjoin(FileMetric, FileMetric.file_id == File.id)
            .where(File.repository_id == repository_id)
            .group_by(File.id)
            .order_by(desc(File.churn_score + File.current_complexity))
            .limit(limit)
        )
        points: list[dict[str, Any]] = []
        for row in result.fetchall():
            path = row[0]
            module = path.split("/")[0] if "/" in path else path.split("\\")[0]
            points.append(
                {
                    "name": path,
                    "complexity": float(row[1] or 0),
                    "churn": float(row[2] or 0),
                    "size": float(row[3] or 0),
                    "module": module or "root",
                }
            )
        return points

    async def get_module_rollup(self, repository_id: int) -> list[dict[str, Any]]:
        result = await self.session.execute(
            select(
                func.split_part(File.path, "/", 1).label("module"),
                func.count(File.id).label("files"),
                func.avg(File.current_complexity).label("complexity"),
                func.avg(File.maintainability_index).label("maintainability"),
                func.avg(FileMetric.test_coverage).label("coverage"),
            )
            .outerjoin(FileMetric, FileMetric.file_id == File.id)
            .where(File.repository_id == repository_id)
            .group_by(func.split_part(File.path, "/", 1))
            .order_by(func.avg(File.current_complexity).desc())
        )
        module_rows = []
        for row in result.fetchall():
            maintainability = float(row.maintainability or 0)
            complexity = float(row.complexity or 0)
            health = max(0.0, min(100.0, maintainability - complexity * 0.2))
            module_rows.append(
                {
                    "name": row.module or "root",
                    "files": int(row.files or 0),
                    "complexity": complexity,
                    "coverage": float(row.coverage or 0),
                    "health": health,
                }
            )
        return module_rows

    async def get_languages(self, repository_id: int) -> list[dict[str, Any]]:
        result = await self.session.execute(
            select(File.language, func.count(File.id).label("count"))
            .where(File.repository_id == repository_id)
            .group_by(File.language)
            .order_by(func.count(File.id).desc())
        )
        rows = result.fetchall()
        total = sum(int(row.count or 0) for row in rows) or 1
        palette = ["#3178c6", "#3572A5", "#00ADD8", "#fbbf24", "#34d399", "#a78bfa", "#6b7280"]
        languages = []
        for idx, row in enumerate(rows):
            languages.append(
                {
                    "name": row.language or "unknown",
                    "percentage": round((int(row.count or 0) / total) * 100, 2),
                    "color": palette[idx % len(palette)],
                }
            )
        return languages

    async def get_dependency_edges(self, repository_id: int) -> list[DependencyRelationship]:
        result = await self.session.execute(
            select(DependencyRelationship).where(DependencyRelationship.repository_id == repository_id)
        )
        return list(result.scalars().all())

    async def get_architecture_violations(self, repository_id: int) -> list[ArchitectureViolation]:
        result = await self.session.execute(
            select(ArchitectureViolation)
            .where(ArchitectureViolation.repository_id == repository_id)
            .order_by(ArchitectureViolation.detected_at.desc())
        )
        return list(result.scalars().all())

    async def get_architecture_summary(self, repository_id: int) -> dict[str, Any]:
        result = await self.session.execute(
            select(
                func.count(ArchitectureViolation.id).label("total"),
                func.sum(case((ArchitectureViolation.resolved.is_(True), 1), else_=0)).label("resolved"),
                func.sum(case((ArchitectureViolation.resolved.is_(False), 1), else_=0)).label("active"),
            ).where(ArchitectureViolation.repository_id == repository_id)
        )
        row = result.one()
        total = int(row.total or 0)
        active = int(row.active or 0)
        resolved = int(row.resolved or 0)
        integrity = max(0.0, 100.0 - active * 7)
        drift_rate = active / max(total, 1)
        return {
            "integrity_score": integrity,
            "active_violations": active,
            "resolved": resolved,
            "drift_rate": round(drift_rate, 2),
        }

