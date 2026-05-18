from datetime import timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import AnalyticsRepository
from app.schemas.architecture import ArchitecturePolicyStatus, ArchitectureSummary, ArchitectureViolationResponse


class ArchitectureService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.analytics_repo = AnalyticsRepository(session)

    async def summary(self, repository_id: int) -> ArchitectureSummary:
        summary = await self.analytics_repo.get_architecture_summary(repository_id)
        violations = await self.analytics_repo.get_architecture_violations(repository_id)
        timeline = await self._drift_timeline(repository_id, days=20)

        policy_counters = {
            "No direct DB access from controllers": 0,
            "Services must not import other service internals": 0,
            "No circular dependencies between modules": 0,
            "Infrastructure code isolated from business logic": 0,
            "All external calls through adapter pattern": 0,
            "UI components must not import server code": 0,
        }
        for violation in violations:
            key = "No circular dependencies between modules" if "cyclic" in violation.violation_type.lower() else "No direct DB access from controllers"
            policy_counters[key] += 1

        policies = []
        for name, count in policy_counters.items():
            if count == 0:
                status = "passing"
            elif count >= 2:
                status = "violated"
            else:
                status = "warning"
            policies.append(ArchitecturePolicyStatus(name=name, status=status, count=count))

        return ArchitectureSummary(
            integrity_score=summary["integrity_score"],
            active_violations=summary["active_violations"],
            resolved=summary["resolved"],
            drift_rate=summary["drift_rate"],
            drift_timeline=timeline,
            policies=policies,
        )

    async def violations(self, repository_id: int) -> list[ArchitectureViolationResponse]:
        violations = await self.analytics_repo.get_architecture_violations(repository_id)
        rows = []
        for item in violations:
            rows.append(
                ArchitectureViolationResponse(
                    id=item.id,
                    type=item.violation_type,
                    description=item.description or item.violation_type,
                    severity=item.severity.value,
                    source=item.source or item.file_path,
                    target=item.target or "",
                    layer=item.layer or "unknown",
                    detected_at=item.detected_at,
                    resolved=item.resolved,
                )
            )
        return rows

    async def _drift_timeline(self, repository_id: int, days: int = 20) -> list[dict]:
        entries = await self.analytics_repo.get_health_timeline(repository_id, days=days + 10)
        points = []
        for entry in entries[-days:]:
            points.append(
                {
                    "date": entry.timestamp.date().isoformat(),
                    "violations": int(max((100 - entry.architecture_score) / 8, 0)),
                    "integrity": round(entry.architecture_score, 2),
                }
            )
        return points

