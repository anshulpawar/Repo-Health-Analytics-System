"""Initial schema for repo health backend."""

from alembic import op
import sqlalchemy as sa


revision = "20260519_0001"
down_revision = None
branch_labels = None
depends_on = None


analysis_status_enum = sa.Enum(
    "queued",
    "cloning",
    "parsing",
    "analyzing",
    "generating_metrics",
    "completed",
    "failed",
    name="analysisjobstatus",
)
hotspot_risk_enum = sa.Enum("low", "medium", "high", "critical", name="hotspotrisklevel")
violation_severity_enum = sa.Enum("warning", "error", "critical", name="violationseverity")


def upgrade() -> None:
    analysis_status_enum.create(op.get_bind(), checkfirst=True)
    hotspot_risk_enum.create(op.get_bind(), checkfirst=True)
    violation_severity_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "repositories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("url", sa.String(length=1024), nullable=False),
        sa.Column("default_branch", sa.String(length=255), nullable=False, server_default="main"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_analyzed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("url", name="uq_repositories_url"),
    )
    op.create_index("ix_repositories_id", "repositories", ["id"])
    op.create_index("ix_repositories_url", "repositories", ["url"])

    op.create_table(
        "commits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hash", sa.String(length=64), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("files_changed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("additions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("deletions", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("repository_id", "hash", name="uq_repo_commit_hash"),
    )
    op.create_index("ix_commits_id", "commits", ["id"])
    op.create_index("ix_commits_repository_id", "commits", ["repository_id"])
    op.create_index("ix_commits_timestamp", "commits", ["timestamp"])

    op.create_table(
        "files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("path", sa.String(length=2048), nullable=False),
        sa.Column("language", sa.String(length=64), nullable=False, server_default="unknown"),
        sa.Column("current_complexity", sa.Float(), nullable=False, server_default="0"),
        sa.Column("maintainability_index", sa.Float(), nullable=False, server_default="0"),
        sa.Column("churn_score", sa.Float(), nullable=False, server_default="0"),
        sa.UniqueConstraint("repository_id", "path", name="uq_repo_file_path"),
    )
    op.create_index("ix_files_id", "files", ["id"])
    op.create_index("ix_files_repository_id", "files", ["repository_id"])

    op.create_table(
        "file_metrics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("file_id", sa.Integer(), sa.ForeignKey("files.id", ondelete="CASCADE"), nullable=False),
        sa.Column("commit_id", sa.Integer(), sa.ForeignKey("commits.id", ondelete="CASCADE"), nullable=False),
        sa.Column("complexity", sa.Float(), nullable=False, server_default="0"),
        sa.Column("maintainability", sa.Float(), nullable=False, server_default="0"),
        sa.Column("lines_of_code", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("coupling_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("duplication_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("test_coverage", sa.Float(), nullable=False, server_default="0"),
    )
    op.create_index("ix_file_metrics_id", "file_metrics", ["id"])
    op.create_index("ix_file_metrics_file_id", "file_metrics", ["file_id"])
    op.create_index("ix_file_metrics_commit_id", "file_metrics", ["commit_id"])

    op.create_table(
        "hotspots",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_id", sa.Integer(), sa.ForeignKey("files.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hotspot_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("risk_level", hotspot_risk_enum, nullable=False, server_default="low"),
        sa.Column("complexity", sa.Float(), nullable=False, server_default="0"),
        sa.Column("churn", sa.Float(), nullable=False, server_default="0"),
        sa.Column("ownership_risk", sa.Float(), nullable=False, server_default="0"),
        sa.Column("maintainability", sa.Float(), nullable=False, server_default="0"),
        sa.Column("trend", sa.String(length=32), nullable=False, server_default="stable"),
    )
    op.create_index("ix_hotspots_id", "hotspots", ["id"])
    op.create_index("ix_hotspots_repository_id", "hotspots", ["repository_id"])
    op.create_index("ix_hotspots_hotspot_score", "hotspots", ["hotspot_score"])

    op.create_table(
        "architecture_violations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_path", sa.String(length=2048), nullable=False),
        sa.Column("violation_type", sa.String(length=255), nullable=False),
        sa.Column("severity", violation_severity_enum, nullable=False, server_default="warning"),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("source", sa.String(length=2048), nullable=True),
        sa.Column("target", sa.String(length=2048), nullable=True),
        sa.Column("layer", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index("ix_architecture_violations_id", "architecture_violations", ["id"])
    op.create_index("ix_architecture_violations_repository_id", "architecture_violations", ["repository_id"])
    op.create_index("ix_architecture_violations_detected_at", "architecture_violations", ["detected_at"])

    op.create_table(
        "contributors",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("commit_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ownership_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("lines_added", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lines_removed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_active", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("repository_id", "email", name="uq_repo_contributor_email"),
    )
    op.create_index("ix_contributors_id", "contributors", ["id"])
    op.create_index("ix_contributors_repository_id", "contributors", ["repository_id"])

    op.create_table(
        "contributor_ownership",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("contributor_id", sa.Integer(), sa.ForeignKey("contributors.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_id", sa.Integer(), sa.ForeignKey("files.id", ondelete="CASCADE"), nullable=False),
        sa.Column("ownership_percentage", sa.Float(), nullable=False, server_default="0"),
        sa.UniqueConstraint("contributor_id", "file_id", name="uq_contributor_file_ownership"),
    )
    op.create_index("ix_contributor_ownership_id", "contributor_ownership", ["id"])
    op.create_index("ix_contributor_ownership_contributor_id", "contributor_ownership", ["contributor_id"])
    op.create_index("ix_contributor_ownership_file_id", "contributor_ownership", ["file_id"])

    op.create_table(
        "repository_health",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("commit_id", sa.Integer(), sa.ForeignKey("commits.id", ondelete="SET NULL"), nullable=True),
        sa.Column("health_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("risk_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("coupling_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("complexity_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("maintainability_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("test_coverage_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("bus_factor", sa.Float(), nullable=False, server_default="0"),
        sa.Column("hotspot_severity", sa.Float(), nullable=False, server_default="0"),
        sa.Column("architecture_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_repository_health_id", "repository_health", ["id"])
    op.create_index("ix_repository_health_repository_id", "repository_health", ["repository_id"])
    op.create_index("ix_repository_health_commit_id", "repository_health", ["commit_id"])
    op.create_index("ix_repository_health_timestamp", "repository_health", ["timestamp"])

    op.create_table(
        "dependency_relationships",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_file", sa.String(length=2048), nullable=False),
        sa.Column("target_file", sa.String(length=2048), nullable=False),
        sa.Column("relationship_type", sa.String(length=64), nullable=False),
        sa.Column("is_cyclic", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("weight", sa.Float(), nullable=False, server_default="1"),
    )
    op.create_index("ix_dependency_relationships_id", "dependency_relationships", ["id"])
    op.create_index("ix_dependency_relationships_repository_id", "dependency_relationships", ["repository_id"])

    op.create_table(
        "analysis_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("repository_id", sa.Integer(), sa.ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", analysis_status_enum, nullable=False, server_default="queued"),
        sa.Column("progress", sa.Float(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False, server_default="{}"),
    )
    op.create_index("ix_analysis_jobs_id", "analysis_jobs", ["id"])
    op.create_index("ix_analysis_jobs_repository_id", "analysis_jobs", ["repository_id"])
    op.create_index("ix_analysis_jobs_status", "analysis_jobs", ["status"])


def downgrade() -> None:
    op.drop_table("analysis_jobs")
    op.drop_table("dependency_relationships")
    op.drop_table("repository_health")
    op.drop_table("contributor_ownership")
    op.drop_table("contributors")
    op.drop_table("architecture_violations")
    op.drop_table("hotspots")
    op.drop_table("file_metrics")
    op.drop_table("files")
    op.drop_table("commits")
    op.drop_table("repositories")

    violation_severity_enum.drop(op.get_bind(), checkfirst=True)
    hotspot_risk_enum.drop(op.get_bind(), checkfirst=True)
    analysis_status_enum.drop(op.get_bind(), checkfirst=True)

