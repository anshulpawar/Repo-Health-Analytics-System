from enum import Enum


class AnalysisJobStatus(str, Enum):
    QUEUED = "queued"
    CLONING = "cloning"
    PARSING = "parsing"
    ANALYZING = "analyzing"
    GENERATING_METRICS = "generating_metrics"
    COMPLETED = "completed"
    FAILED = "failed"


class HotspotRiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ViolationSeverity(str, Enum):
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

