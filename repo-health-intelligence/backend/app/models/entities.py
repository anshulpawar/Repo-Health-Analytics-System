from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import AnalysisJobStatus, HotspotRiskLevel, ViolationSeverity
from app.database.base import Base


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(1024), nullable=False, unique=True, index=True)
    default_branch: Mapped[str] = mapped_column(String(255), nullable=False, default="main")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_analyzed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    commits: Mapped[list["Commit"]] = relationship("Commit", back_populates="repository", cascade="all, delete-orphan")
    files: Mapped[list["File"]] = relationship("File", back_populates="repository", cascade="all, delete-orphan")
    hotspots: Mapped[list["Hotspot"]] = relationship("Hotspot", back_populates="repository", cascade="all, delete-orphan")
    architecture_violations: Mapped[list["ArchitectureViolation"]] = relationship(
        "ArchitectureViolation", back_populates="repository", cascade="all, delete-orphan"
    )
    contributors: Mapped[list["Contributor"]] = relationship(
        "Contributor", back_populates="repository", cascade="all, delete-orphan"
    )
    repository_health: Mapped[list["RepositoryHealth"]] = relationship(
        "RepositoryHealth", back_populates="repository", cascade="all, delete-orphan"
    )
    analysis_jobs: Mapped[list["AnalysisJob"]] = relationship(
        "AnalysisJob", back_populates="repository", cascade="all, delete-orphan"
    )


class Commit(Base):
    __tablename__ = "commits"
    __table_args__ = (UniqueConstraint("repository_id", "hash", name="uq_repo_commit_hash"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    hash: Mapped[str] = mapped_column(String(64), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    files_changed: Mapped[int] = mapped_column(Integer, default=0)
    additions: Mapped[int] = mapped_column(Integer, default=0)
    deletions: Mapped[int] = mapped_column(Integer, default=0)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="commits")
    file_metrics: Mapped[list["FileMetric"]] = relationship("FileMetric", back_populates="commit", cascade="all, delete-orphan")
    repository_health: Mapped[list["RepositoryHealth"]] = relationship("RepositoryHealth", back_populates="commit")


class File(Base):
    __tablename__ = "files"
    __table_args__ = (UniqueConstraint("repository_id", "path", name="uq_repo_file_path"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    path: Mapped[str] = mapped_column(String(2048), nullable=False)
    language: Mapped[str] = mapped_column(String(64), nullable=False, default="unknown")
    current_complexity: Mapped[float] = mapped_column(Float, default=0.0)
    maintainability_index: Mapped[float] = mapped_column(Float, default=0.0)
    churn_score: Mapped[float] = mapped_column(Float, default=0.0)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="files")
    file_metrics: Mapped[list["FileMetric"]] = relationship("FileMetric", back_populates="file", cascade="all, delete-orphan")
    hotspots: Mapped[list["Hotspot"]] = relationship("Hotspot", back_populates="file")
    ownerships: Mapped[list["ContributorOwnership"]] = relationship(
        "ContributorOwnership", back_populates="file", cascade="all, delete-orphan"
    )


class FileMetric(Base):
    __tablename__ = "file_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id", ondelete="CASCADE"), index=True)
    commit_id: Mapped[int] = mapped_column(ForeignKey("commits.id", ondelete="CASCADE"), index=True)
    complexity: Mapped[float] = mapped_column(Float, default=0.0)
    maintainability: Mapped[float] = mapped_column(Float, default=0.0)
    lines_of_code: Mapped[int] = mapped_column(Integer, default=0)
    coupling_score: Mapped[float] = mapped_column(Float, default=0.0)
    duplication_score: Mapped[float] = mapped_column(Float, default=0.0)
    test_coverage: Mapped[float] = mapped_column(Float, default=0.0)

    file: Mapped["File"] = relationship("File", back_populates="file_metrics")
    commit: Mapped["Commit"] = relationship("Commit", back_populates="file_metrics")


class Hotspot(Base):
    __tablename__ = "hotspots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id", ondelete="CASCADE"), index=True)
    hotspot_score: Mapped[float] = mapped_column(Float, default=0.0, index=True)
    risk_level: Mapped[HotspotRiskLevel] = mapped_column(Enum(HotspotRiskLevel), default=HotspotRiskLevel.LOW)
    complexity: Mapped[float] = mapped_column(Float, default=0.0)
    churn: Mapped[float] = mapped_column(Float, default=0.0)
    ownership_risk: Mapped[float] = mapped_column(Float, default=0.0)
    maintainability: Mapped[float] = mapped_column(Float, default=0.0)
    trend: Mapped[str] = mapped_column(String(32), default="stable")

    repository: Mapped["Repository"] = relationship("Repository", back_populates="hotspots")
    file: Mapped["File"] = relationship("File", back_populates="hotspots")


class ArchitectureViolation(Base):
    __tablename__ = "architecture_violations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    file_path: Mapped[str] = mapped_column(String(2048), nullable=False)
    violation_type: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[ViolationSeverity] = mapped_column(Enum(ViolationSeverity), default=ViolationSeverity.WARNING)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    source: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    target: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    layer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(default=False)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="architecture_violations")


class Contributor(Base):
    __tablename__ = "contributors"
    __table_args__ = (UniqueConstraint("repository_id", "email", name="uq_repo_contributor_email"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    commit_count: Mapped[int] = mapped_column(Integer, default=0)
    ownership_score: Mapped[float] = mapped_column(Float, default=0.0)
    lines_added: Mapped[int] = mapped_column(Integer, default=0)
    lines_removed: Mapped[int] = mapped_column(Integer, default=0)
    last_active: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="contributors")
    ownership_entries: Mapped[list["ContributorOwnership"]] = relationship(
        "ContributorOwnership", back_populates="contributor", cascade="all, delete-orphan"
    )


class ContributorOwnership(Base):
    __tablename__ = "contributor_ownership"
    __table_args__ = (UniqueConstraint("contributor_id", "file_id", name="uq_contributor_file_ownership"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    contributor_id: Mapped[int] = mapped_column(ForeignKey("contributors.id", ondelete="CASCADE"), index=True)
    file_id: Mapped[int] = mapped_column(ForeignKey("files.id", ondelete="CASCADE"), index=True)
    ownership_percentage: Mapped[float] = mapped_column(Float, default=0.0)

    contributor: Mapped["Contributor"] = relationship("Contributor", back_populates="ownership_entries")
    file: Mapped["File"] = relationship("File", back_populates="ownerships")


class RepositoryHealth(Base):
    __tablename__ = "repository_health"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    commit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("commits.id", ondelete="SET NULL"), nullable=True, index=True)
    health_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    coupling_score: Mapped[float] = mapped_column(Float, default=0.0)
    complexity_score: Mapped[float] = mapped_column(Float, default=0.0)
    maintainability_score: Mapped[float] = mapped_column(Float, default=0.0)
    test_coverage_score: Mapped[float] = mapped_column(Float, default=0.0)
    bus_factor: Mapped[float] = mapped_column(Float, default=0.0)
    hotspot_severity: Mapped[float] = mapped_column(Float, default=0.0)
    architecture_score: Mapped[float] = mapped_column(Float, default=0.0)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="repository_health")
    commit: Mapped[Optional["Commit"]] = relationship("Commit", back_populates="repository_health")


class DependencyRelationship(Base):
    __tablename__ = "dependency_relationships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    source_file: Mapped[str] = mapped_column(String(2048), nullable=False)
    target_file: Mapped[str] = mapped_column(String(2048), nullable=False)
    relationship_type: Mapped[str] = mapped_column(String(64), nullable=False)
    is_cyclic: Mapped[bool] = mapped_column(default=False)
    weight: Mapped[float] = mapped_column(Float, default=1.0)


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"), index=True)
    status: Mapped[AnalysisJobStatus] = mapped_column(Enum(AnalysisJobStatus), default=AnalysisJobStatus.QUEUED, index=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)

    repository: Mapped["Repository"] = relationship("Repository", back_populates="analysis_jobs")

