export type AnalysisJobStatus =
  | "queued"
  | "cloning"
  | "parsing"
  | "analyzing"
  | "generating_metrics"
  | "completed"
  | "failed";

/** Resolves API root; uses same-origin proxy in the browser when env is unset. */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/v1`;
  }
  return "http://localhost:8000/api/v1";
}

function getApiOrigin(): string {
  const base = getApiBaseUrl();
  return base.replace(/\/api\/v1\/?$/, "");
}

function getJobWebSocketUrl(jobId: number): string {
  const base = getApiBaseUrl();
  const url = new URL(base.endsWith("/api/v1") ? base : `${base}/api/v1`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return `${url.origin}${url.pathname.replace(/\/$/, "")}/jobs/${jobId}/ws`;
}

export async function checkHealth(): Promise<{ ok: boolean; status?: string; error?: string }> {
  try {
    const response = await fetch(`${getApiOrigin()}/api/v1/healthz`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const data = (await response.json()) as { status?: string };
    return { ok: data.status === "ok", status: data.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Backend unreachable" };
  }
}

export function subscribeJobStatus(
  jobId: number,
  onUpdate: (job: AnalysisJob) => void,
  onError?: (error: Error) => void
): () => void {
  let closed = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let socket: WebSocket | null = null;

  const poll = async () => {
    try {
      const job = await apiRequest<AnalysisJob>(`/jobs/${jobId}`);
      onUpdate(job);
      if (job.status === "completed" || job.status === "failed") {
        cleanup();
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error("Failed to poll job status"));
    }
  };

  const startPolling = () => {
    if (pollTimer || closed) return;
    void poll();
    pollTimer = setInterval(() => void poll(), 2000);
  };

  const cleanup = () => {
    if (closed) return;
    closed = true;
    socket?.close();
    socket = null;
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  try {
    socket = new WebSocket(getJobWebSocketUrl(jobId));
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as AnalysisJob | { status: "not_found"; job_id: number };
        if ("status" in payload && payload.status === "not_found") return;
        onUpdate(payload as AnalysisJob);
        if (payload.status === "completed" || payload.status === "failed") {
          cleanup();
        }
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error("Invalid job status payload"));
      }
    };
    socket.onerror = () => {
      socket?.close();
      socket = null;
      startPolling();
    };
    socket.onclose = () => {
      if (!closed) startPolling();
    };
  } catch {
    startPolling();
  }

  return cleanup;
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export interface AnalyzeRequest {
  url: string;
  force_reanalyze?: boolean;
  max_commits?: number;
}

export interface AnalyzeResponse {
  repository_id: number;
  job_id: number;
  status: AnalysisJobStatus;
}

export interface AnalysisJob {
  id: number;
  repository_id: number;
  status: AnalysisJobStatus;
  progress: number;
  started_at: string;
  completed_at?: string | null;
  error_message?: string | null;
  metadata: Record<string, unknown>;
}

export interface RepositorySummary {
  id: number;
  name: string;
  url: string;
  default_branch: string;
  created_at: string;
  last_analyzed_at?: string | null;
}

export interface RepositoryOverview {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  open_issues: number;
  contributors: number;
  commits: number;
  health_score: number;
  complexity_score: number;
  coupling_score: number;
  test_coverage: number;
  bus_factor: number;
  risk_level: string;
  last_analyzed?: string | null;
  languages: Array<{ name: string; percentage: number; color: string }>;
}

export interface DashboardData {
  repository_id: number;
  has_data: boolean;
  no_data_message: string;
  health_score: number;
  complexity_score: number;
  coupling_score: number;
  coverage_score: number;
  bus_factor: number;
  risk_level: string;
  total_commits: number;
  total_contributors: number;
  language_breakdown: Array<{ name: string; percentage: number; color: string }>;
  health_timeline: Array<{ date: string; health_score: number; complexity: number; coupling: number; coverage: number }>;
  churn_complexity: Array<{ name: string; complexity: number; churn: number; size: number; module: string }>;
  top_commit_ids: number[];
  ai_insight_placeholder: {
    title: string;
    description: string;
    category: string;
    severity: "info" | "warning" | "critical";
    timestamp: string;
    recommendation: string;
    impact: string;
    placeholder: boolean;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface CommitData {
  id: number;
  hash: string;
  message: string;
  author: { name: string; email: string };
  date: string;
  files_changed: number;
  additions: number;
  deletions: number;
  complexity_delta: number;
  coupling_delta: number;
  maintainability_delta: number;
  architecture_impact: "none" | "low" | "medium" | "high";
}

export interface CommitStatsData {
  total_commits: number;
  avg_files_per_commit: number;
  positive_impact_ratio: number;
  avg_complexity_delta: number;
  activity: Array<{ date: string; commits: number; impact: number }>;
}

export interface HotspotSummaryData {
  critical_hotspots: number;
  high_risk_files: number;
  avg_hotspot_score: number;
  improving_files: number;
  churn_complexity: Array<{ name: string; complexity: number; churn: number; size: number; module: string }>;
  dangerous_modules: Array<{ name: string; score: number; files: number; trend: string }>;
}

export interface HotspotData {
  id: number;
  file_path: string;
  module: string;
  complexity: number;
  churn: number;
  ownership_risk: number;
  maintainability: number;
  hotspot_score: number;
  severity: "low" | "medium" | "high" | "critical";
  trend: "improving" | "stable" | "degrading";
}

export interface ContributorStatsData {
  bus_factor: number;
  contributors: number;
  active_30d: number;
  top_contributor: string;
}

export interface ContributorData {
  id: number;
  name: string;
  avatar: string;
  email: string;
  commits: number;
  lines_added: number;
  lines_removed: number;
  files_owned: number;
  ownership_score: number;
  last_active?: string | null;
  risk_level: "Low" | "Medium" | "High";
}

export interface DependencyGraphData {
  nodes: Array<{ id: string; label: string; type: string; layer: string; complexity: number; connections: number }>;
  edges: Array<{ source: string; target: string; type: string; weight: number; is_cyclic: boolean }>;
  has_data: boolean;
  no_data_message: string;
}

export interface ArchitectureSummaryData {
  integrity_score: number;
  active_violations: number;
  resolved: number;
  drift_rate: number;
  drift_timeline: Array<{ date: string; violations: number; integrity: number }>;
  policies: Array<{ name: string; status: string; count: number }>;
}

export interface ArchitectureViolationData {
  id: number;
  type: string;
  description: string;
  severity: "warning" | "error" | "critical";
  source: string;
  target: string;
  layer: string;
  detected_at: string;
  resolved: boolean;
}

export interface InsightsData {
  has_data: boolean;
  no_data_message: string;
  insights: Array<{
    id: string;
    title: string;
    description: string;
    category: "health" | "architecture" | "complexity" | "risk" | "recommendation";
    severity: "info" | "warning" | "critical";
    timestamp: string;
    recommendation: string;
    impact: string;
    placeholder: boolean;
  }>;
  predictions: Array<Record<string, unknown>>;
  recommendations: Array<Record<string, unknown>>;
}

export const api = {
  analyzeRepository: (payload: AnalyzeRequest) =>
    apiRequest<AnalyzeResponse>("/repositories/analyze", { method: "POST", body: JSON.stringify(payload) }),
  listRepositories: () => apiRequest<RepositorySummary[]>("/repositories"),
  getRepositoryOverview: (repositoryId: number) => apiRequest<RepositoryOverview>(`/repositories/${repositoryId}/overview`),
  getLatestRepositoryJob: (repositoryId: number) => apiRequest<AnalysisJob>(`/repositories/${repositoryId}/jobs/latest`),
  getJob: (jobId: number) => apiRequest<AnalysisJob>(`/jobs/${jobId}`),
  getDashboard: (repositoryId: number) => apiRequest<DashboardData>(`/dashboard/${repositoryId}`),
  getRepositoryTimeline: (repositoryId: number) =>
    apiRequest<Array<{ date: string; complexity: number; health: number }>>(`/dashboard/${repositoryId}/timeline`),
  getRepositoryModules: (repositoryId: number) =>
    apiRequest<Array<{ name: string; files: number; complexity: number; coverage: number; health: number }>>(
      `/dashboard/${repositoryId}/modules`
    ),
  getCommits: (repositoryId: number, page = 1, pageSize = 20) =>
    apiRequest<PaginatedResponse<CommitData>>(`/commits/${repositoryId}?page=${page}&page_size=${pageSize}`),
  getCommitStats: (repositoryId: number) => apiRequest<CommitStatsData>(`/commits/${repositoryId}/stats`),
  getHotspotSummary: (repositoryId: number) => apiRequest<HotspotSummaryData>(`/hotspots/${repositoryId}/summary`),
  getHotspots: (repositoryId: number, limit = 200) => apiRequest<HotspotData[]>(`/hotspots/${repositoryId}?limit=${limit}`),
  getContributorStats: (repositoryId: number) => apiRequest<ContributorStatsData>(`/contributors/${repositoryId}/stats`),
  getContributors: (repositoryId: number) => apiRequest<ContributorData[]>(`/contributors/${repositoryId}`),
  getContributorOwnership: (repositoryId: number) =>
    apiRequest<Array<{ name: string; value: number; color: string }>>(`/contributors/${repositoryId}/ownership`),
  getContributorWarnings: (repositoryId: number) =>
    apiRequest<Array<{ module: string; owner: string; ownership: number; risk: string }>>(
      `/contributors/${repositoryId}/warnings`
    ),
  getDependencyGraph: (repositoryId: number) => apiRequest<DependencyGraphData>(`/dependencies/${repositoryId}`),
  getArchitectureSummary: (repositoryId: number) =>
    apiRequest<ArchitectureSummaryData>(`/architecture/${repositoryId}/summary`),
  getArchitectureViolations: (repositoryId: number) =>
    apiRequest<ArchitectureViolationData[]>(`/architecture/${repositoryId}/violations`),
  getInsights: (repositoryId: number) => apiRequest<InsightsData>(`/insights/${repositoryId}`),
};

