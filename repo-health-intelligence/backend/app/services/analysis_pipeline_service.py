from __future__ import annotations

from collections import defaultdict
from datetime import datetime
import logging
from pathlib import Path
from typing import Any

from git.objects.commit import Commit as GitCommit
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analyzers.architecture_drift_engine import ArchitectureDriftEngine
from app.analyzers.bus_factor_engine import BusFactorEngine
from app.analyzers.complexity_analyzer import ComplexityAnalyzer
from app.analyzers.health_scoring_engine import HealthScoringEngine
from app.analyzers.hotspot_engine import HotspotEngine
from app.analyzers.parser_engine import TreeSitterParserEngine
from app.core.config import get_settings
from app.core.enums import AnalysisJobStatus
from app.graph import KnowledgeGraphService
from app.models import (
    AnalysisJob,
    ArchitectureViolation,
    Commit,
    Contributor,
    ContributorOwnership,
    DependencyRelationship,
    File,
    FileMetric,
    Hotspot,
    Repository,
    RepositoryHealth,
)
from app.services.git_service import GitRepositoryService

logger = logging.getLogger(__name__)


class AnalysisPipelineService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.settings = get_settings()
        self.git_service = GitRepositoryService()
        self.parser_engine = TreeSitterParserEngine()
        self.complexity_analyzer = ComplexityAnalyzer()
        self.hotspot_engine = HotspotEngine()
        self.architecture_engine = ArchitectureDriftEngine()
        self.bus_factor_engine = BusFactorEngine()
        self.health_engine = HealthScoringEngine()
        self.graph_service = KnowledgeGraphService()

    async def run(self, repository_id: int, job_id: int, force_reanalyze: bool = False, max_commits: int | None = None) -> None:
        repository = await self._load_repository(repository_id)
        job = await self._load_job(job_id)
        if repository is None or job is None:
            raise ValueError("Repository or analysis job not found.")

        max_commits = max_commits or self.settings.max_commits_per_analysis
        await self._set_job(job, AnalysisJobStatus.CLONING, 5, {"phase": "cloning"})

        repo_path, default_branch = self.git_service.clone_or_update(repository.url, force_refresh=force_reanalyze)
        repository.default_branch = default_branch
        self.graph_service.upsert_repository(repository.id, repository.name, repository.url)

        await self._set_job(job, AnalysisJobStatus.PARSING, 12, {"phase": "loading_commits"})
        commits = self.git_service.list_commits(repo_path, max_commits=max_commits)

        existing_hashes = await self._fetch_existing_commit_hashes(repository.id)
        commits_to_process = [commit for commit in commits if commit.hexsha not in existing_hashes]

        # If no new commits, still refresh aggregate snapshot.
        if not commits_to_process:
            await self._refresh_aggregates(repository, job)
            await self._set_job(job, AnalysisJobStatus.COMPLETED, 100, {"phase": "completed", "new_commits": 0})
            await self.session.commit()
            return

        files_by_path = await self._load_files(repository.id)
        contributors_by_email = await self._load_contributors(repository.id)
        dependency_edges: list[tuple[str, str, str]] = []
        file_churn = defaultdict(int)
        file_authors: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

        total = len(commits_to_process)
        for idx, git_commit in enumerate(commits_to_process, start=1):
            progress = 12 + (idx / total) * 70
            await self._set_job(job, AnalysisJobStatus.ANALYZING, round(progress, 2), {"phase": "analyzing", "commit": git_commit.hexsha})
            await self._process_commit(
                repository=repository,
                git_commit=git_commit,
                repo_path=repo_path,
                files_by_path=files_by_path,
                contributors_by_email=contributors_by_email,
                dependency_edges=dependency_edges,
                file_churn=file_churn,
                file_authors=file_authors,
            )
            if idx % self.settings.analysis_batch_size == 0:
                await self.session.commit()

        self.git_service.checkout_branch(repo_path, default_branch)
        await self._set_job(job, AnalysisJobStatus.GENERATING_METRICS, 90, {"phase": "generating_metrics"})
        await self._compute_post_commit_metrics(repository, files_by_path, contributors_by_email, dependency_edges, file_churn, file_authors)
        await self._refresh_aggregates(repository, job)
        await self._set_job(job, AnalysisJobStatus.COMPLETED, 100, {"phase": "completed", "new_commits": total})
        await self.session.commit()

    async def _process_commit(
        self,
        *,
        repository: Repository,
        git_commit: GitCommit,
        repo_path: Path,
        files_by_path: dict[str, File],
        contributors_by_email: dict[str, Contributor],
        dependency_edges: list[tuple[str, str, str]],
        file_churn: dict[str, int],
        file_authors: dict[str, dict[str, int]],
    ) -> None:
        self.git_service.checkout_commit(repo_path, git_commit.hexsha)
        changed_files = self._get_changed_files(git_commit)

        db_commit = Commit(
            repository_id=repository.id,
            hash=git_commit.hexsha,
            author=str(git_commit.author.name or "Unknown"),
            message=git_commit.message.strip(),
            timestamp=git_commit.committed_datetime,
            files_changed=len(changed_files),
            additions=int(git_commit.stats.total.get("insertions", 0)),
            deletions=int(git_commit.stats.total.get("deletions", 0)),
        )
        self.session.add(db_commit)
        await self.session.flush()

        contributor = await self._get_or_create_contributor(repository.id, git_commit, contributors_by_email)
        contributor.commit_count += 1
        contributor.lines_added += db_commit.additions
        contributor.lines_removed += db_commit.deletions
        contributor.last_active = git_commit.committed_datetime

        self.graph_service.add_commit_node(
            repository_id=repository.id,
            commit_hash=git_commit.hexsha,
            author=contributor.name,
            timestamp=git_commit.committed_datetime.isoformat(),
        )

        for file_path in changed_files:
            absolute_path = (repo_path / file_path).resolve()
            if not absolute_path.exists() or absolute_path.is_dir():
                continue

            content = self._safe_read_text(absolute_path)
            if not content:
                continue

            file_model = files_by_path.get(file_path)
            if file_model is None:
                file_model = File(repository_id=repository.id, path=file_path, language=self._detect_language(file_path))
                self.session.add(file_model)
                await self.session.flush()
                files_by_path[file_path] = file_model

            parse_result = self.parser_engine.parse_file(file_path, content)
            complexity_result = self.complexity_analyzer.analyze(file_path, content)
            coupling_score = min(len(parse_result.imports) * 8, 100)

            file_model.current_complexity = complexity_result.complexity
            file_model.maintainability_index = complexity_result.maintainability
            file_churn[file_path] += 1

            metric = FileMetric(
                file_id=file_model.id,
                commit_id=db_commit.id,
                complexity=complexity_result.complexity,
                maintainability=complexity_result.maintainability,
                lines_of_code=complexity_result.lines_of_code,
                coupling_score=float(coupling_score),
                duplication_score=complexity_result.duplication_score,
                test_coverage=self._estimate_test_coverage(file_path, complexity_result.lines_of_code),
            )
            self.session.add(metric)
            file_authors[file_path][contributor.email] += 1

            self.graph_service.add_file_relationships(
                repository_id=repository.id,
                commit_hash=git_commit.hexsha,
                file_path=file_path,
                imports=parse_result.imports,
                classes=parse_result.classes,
                functions=parse_result.functions,
                calls=parse_result.calls,
                inherits=parse_result.inherits,
                contributor=contributor.name,
            )
            for imported in parse_result.imports:
                target = self._normalize_import_to_path(imported)
                dependency_edges.append((file_path, target, "IMPORTS"))
            for caller, callee in parse_result.calls:
                if caller and callee:
                    dependency_edges.append((file_path, callee, "CALLS"))

    async def _compute_post_commit_metrics(
        self,
        repository: Repository,
        files_by_path: dict[str, File],
        contributors_by_email: dict[str, Contributor],
        dependency_edges: list[tuple[str, str, str]],
        file_churn: dict[str, int],
        file_authors: dict[str, dict[str, int]],
    ) -> None:
        for file_path, file_model in files_by_path.items():
            file_model.churn_score = min(float(file_churn.get(file_path, 0) * 10), 100.0)

        await self.session.execute(delete(DependencyRelationship).where(DependencyRelationship.repository_id == repository.id))
        unique_dependencies = {(source, target, relation) for source, target, relation in dependency_edges if target}
        for source, target, relation in unique_dependencies:
            self.session.add(
                DependencyRelationship(
                    repository_id=repository.id,
                    source_file=source,
                    target_file=target,
                    relationship_type=relation,
                )
            )

        violations, cyclic_edges = self.architecture_engine.detect(list(unique_dependencies))
        cyclic_lookup = set(cyclic_edges)

        await self.session.execute(delete(ArchitectureViolation).where(ArchitectureViolation.repository_id == repository.id))
        for violation in violations:
            self.session.add(
                ArchitectureViolation(
                    repository_id=repository.id,
                    file_path=violation.file_path,
                    violation_type=violation.violation_type,
                    severity=violation.severity,
                    source=violation.source,
                    target=violation.target,
                    layer=violation.layer,
                    description=violation.description,
                    resolved=False,
                )
            )

        for dep in self.session.new:
            if isinstance(dep, DependencyRelationship):
                dep.is_cyclic = (dep.source_file, dep.target_file) in cyclic_lookup

        ownership_percentages, bus_factor = self.bus_factor_engine.calculate_ownership(file_authors)

        await self.session.execute(
            delete(ContributorOwnership).where(
                ContributorOwnership.contributor_id.in_(
                    select(Contributor.id).where(Contributor.repository_id == repository.id)
                )
            )
        )
        for file_path, owners in ownership_percentages.items():
            file_model = files_by_path.get(file_path)
            if file_model is None:
                continue
            for owner_email, percent in owners.items():
                contributor = contributors_by_email.get(owner_email)
                if contributor is None:
                    continue
                self.session.add(
                    ContributorOwnership(
                        contributor_id=contributor.id,
                        file_id=file_model.id,
                        ownership_percentage=percent,
                    )
                )

        await self.session.execute(delete(Hotspot).where(Hotspot.repository_id == repository.id))
        for file_model in files_by_path.values():
            owner_percents = ownership_percentages.get(file_model.path, {})
            ownership_risk = self.bus_factor_engine.ownership_risk(max(owner_percents.values()) if owner_percents else 0)
            hotspot_result = self.hotspot_engine.score(
                churn_score=file_model.churn_score,
                complexity=file_model.current_complexity,
                ownership_risk=ownership_risk,
                maintainability=file_model.maintainability_index,
            )
            self.session.add(
                Hotspot(
                    repository_id=repository.id,
                    file_id=file_model.id,
                    hotspot_score=hotspot_result.hotspot_score,
                    risk_level=hotspot_result.risk_level,
                    complexity=file_model.current_complexity,
                    churn=file_model.churn_score,
                    ownership_risk=ownership_risk,
                    maintainability=file_model.maintainability_index,
                    trend=hotspot_result.trend,
                )
            )

        for contributor in contributors_by_email.values():
            # ownership score is percentage of files where this contributor owns > 50%
            dominant_files = sum(
                1
                for file_path, owners in ownership_percentages.items()
                if owners and max(owners, key=owners.get) == contributor.email and owners[contributor.email] >= 50
            )
            contributor.ownership_score = (dominant_files / max(len(files_by_path), 1)) * 100

        # Store one health snapshot per run.
        await self._store_health_snapshot(repository.id, bus_factor=bus_factor)

    async def _store_health_snapshot(self, repository_id: int, bus_factor: float) -> None:
        files = (await self.session.execute(select(File).where(File.repository_id == repository_id))).scalars().all()
        hotspots = (await self.session.execute(select(Hotspot).where(Hotspot.repository_id == repository_id))).scalars().all()
        violations = (
            await self.session.execute(select(ArchitectureViolation).where(ArchitectureViolation.repository_id == repository_id))
        ).scalars().all()
        metrics = (
            await self.session.execute(
                select(FileMetric).join(File, File.id == FileMetric.file_id).where(File.repository_id == repository_id)
            )
        ).scalars().all()
        contributors = (await self.session.execute(select(Contributor).where(Contributor.repository_id == repository_id))).scalars().all()
        latest_commit = (
            await self.session.execute(
                select(Commit).where(Commit.repository_id == repository_id).order_by(Commit.timestamp.desc()).limit(1)
            )
        ).scalar_one_or_none()

        complexity = sum(file.current_complexity for file in files) / max(len(files), 1)
        maintainability = sum(file.maintainability_index for file in files) / max(len(files), 1)
        coupling = sum(metric.coupling_score for metric in metrics) / max(len(metrics), 1)
        coverage = sum(metric.test_coverage for metric in metrics) / max(len(metrics), 1)
        hotspot_avg = sum(item.hotspot_score for item in hotspots) / max(len(hotspots), 1)
        ownership_concentration = max((contributor.ownership_score for contributor in contributors), default=0.0)
        scores = self.health_engine.compute(
            complexity_score=complexity,
            coupling_score=coupling,
            maintainability_score=maintainability,
            architecture_violations=len([v for v in violations if not v.resolved]),
            hotspot_score=hotspot_avg,
            ownership_concentration=ownership_concentration,
            test_coverage=coverage,
        )

        self.session.add(
            RepositoryHealth(
                repository_id=repository_id,
                commit_id=latest_commit.id if latest_commit else None,
                health_score=scores["health_score"],
                risk_score=scores["risk_score"],
                coupling_score=scores["coupling_score"],
                complexity_score=scores["complexity_score"],
                maintainability_score=scores["maintainability_score"],
                test_coverage_score=scores["test_coverage_score"],
                bus_factor=bus_factor,
                hotspot_severity=scores["hotspot_severity"],
                architecture_score=scores["architecture_score"],
            )
        )

    async def _refresh_aggregates(self, repository: Repository, job: AnalysisJob) -> None:
        bus_factor = 1.0
        contributors = (
            await self.session.execute(select(Contributor).where(Contributor.repository_id == repository.id))
        ).scalars().all()
        if contributors:
            owners = [contributor for contributor in contributors if contributor.ownership_score >= 50]
            bus_factor = max(1.0, float(len(owners)))
        await self._store_health_snapshot(repository.id, bus_factor=bus_factor)
        repository.last_analyzed_at = datetime.utcnow()
        job.metadata_json = {**(job.metadata_json or {}), "repository_last_analyzed": repository.last_analyzed_at.isoformat()}

    async def _load_repository(self, repository_id: int) -> Repository | None:
        result = await self.session.execute(select(Repository).where(Repository.id == repository_id))
        return result.scalar_one_or_none()

    async def _load_job(self, job_id: int) -> AnalysisJob | None:
        result = await self.session.execute(select(AnalysisJob).where(AnalysisJob.id == job_id))
        return result.scalar_one_or_none()

    async def _fetch_existing_commit_hashes(self, repository_id: int) -> set[str]:
        result = await self.session.execute(select(Commit.hash).where(Commit.repository_id == repository_id))
        return {row[0] for row in result.fetchall()}

    async def _load_files(self, repository_id: int) -> dict[str, File]:
        result = await self.session.execute(select(File).where(File.repository_id == repository_id))
        return {item.path: item for item in result.scalars().all()}

    async def _load_contributors(self, repository_id: int) -> dict[str, Contributor]:
        result = await self.session.execute(select(Contributor).where(Contributor.repository_id == repository_id))
        return {item.email: item for item in result.scalars().all()}

    async def _get_or_create_contributor(
        self,
        repository_id: int,
        git_commit: GitCommit,
        cache: dict[str, Contributor],
    ) -> Contributor:
        email = str(git_commit.author.email or f"unknown-{git_commit.author.name}@unknown.local")
        contributor = cache.get(email)
        if contributor:
            return contributor
        contributor = Contributor(
            repository_id=repository_id,
            name=str(git_commit.author.name or "Unknown"),
            email=email,
            commit_count=0,
            ownership_score=0.0,
        )
        self.session.add(contributor)
        await self.session.flush()
        cache[email] = contributor
        return contributor

    @staticmethod
    def _get_changed_files(git_commit: GitCommit) -> list[str]:
        if not git_commit.parents:
            return [path for path in git_commit.stats.files.keys()]
        parent = git_commit.parents[0]
        changes = []
        for item in git_commit.diff(parent):
            if item.a_path:
                changes.append(item.a_path)
            if item.b_path:
                changes.append(item.b_path)
        return sorted(set(changes or list(git_commit.stats.files.keys())))

    async def _set_job(
        self,
        job: AnalysisJob,
        status: AnalysisJobStatus,
        progress: float,
        metadata: dict[str, Any] | None = None,
        error_message: str | None = None,
    ) -> None:
        job.status = status
        job.progress = progress
        if metadata:
            payload = dict(job.metadata_json or {})
            payload.update(metadata)
            job.metadata_json = payload
        if error_message:
            job.error_message = error_message
        if status in {AnalysisJobStatus.COMPLETED, AnalysisJobStatus.FAILED}:
            job.completed_at = datetime.utcnow()
        await self.session.flush()
        await self.session.commit()

    @staticmethod
    def _safe_read_text(file_path: Path) -> str:
        try:
            return file_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return ""

    @staticmethod
    def _normalize_import_to_path(import_stmt: str) -> str:
        cleaned = str(import_stmt).strip().replace('"', "").replace("'", "")
        if cleaned.startswith("."):
            cleaned = cleaned[1:]
        cleaned = cleaned.replace(".", "/")
        return cleaned

    @staticmethod
    def _estimate_test_coverage(file_path: str, lines_of_code: int) -> float:
        lowered = file_path.lower()
        if "test" in lowered or lowered.endswith("_spec.ts") or lowered.endswith("_test.py"):
            return 95.0
        if lines_of_code < 50:
            return 75.0
        if lines_of_code < 200:
            return 65.0
        return 50.0

    @staticmethod
    def _detect_language(file_path: str) -> str:
        from app.utils.language import detect_language

        return detect_language(file_path)
