import { prisma } from "@/server/db";
import { extractOwnerRepo, normalizeGithubUrl } from "@/server/github";
import { riskLevelFromScore } from "@/server/scoring";

const NO_DATA = "No repository analyzed yet";
const LANG_COLORS = ["#3178c6", "#3572A5", "#00ADD8", "#fbbf24", "#34d399", "#a78bfa", "#6b7280"];
const OWNERSHIP_COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f87171", "#818cf8", "#64748b", "#14b8a6"];

export async function listRepositories() {
  const rows = await prisma.repository.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    url: r.url,
    default_branch: r.defaultBranch,
    created_at: r.createdAt.toISOString(),
    last_analyzed_at: r.lastAnalyzedAt?.toISOString() ?? null,
  }));
}

export async function getRepositoryOverview(repositoryId: number) {
  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) throw new Error("Repository not found");

  const latest = await prisma.repositoryHealth.findFirst({
    where: { repositoryId },
    orderBy: { timestamp: "desc" },
  });
  const languages = await getLanguages(repositoryId);
  const contributors = await prisma.contributor.count({ where: { repositoryId } });
  const totalCommits = await prisma.commit.count({ where: { repositoryId } });
  const { owner, repo } = extractOwnerRepo(repository.url);

  return {
    id: repository.id,
    name: repo,
    full_name: `${owner}/${repo}`,
    description: `Repository analysis for ${owner}/${repo}`,
    language: languages[0]?.name ?? "Unknown",
    stars: 0,
    forks: 0,
    open_issues: 0,
    contributors,
    commits: totalCommits,
    health_score: latest?.healthScore ?? 0,
    complexity_score: latest?.complexityScore ?? 0,
    coupling_score: latest?.couplingScore ?? 0,
    test_coverage: latest?.testCoverageScore ?? 0,
    bus_factor: latest?.busFactor ?? 0,
    risk_level: riskLevelFromScore(latest?.riskScore ?? 0),
    last_analyzed: repository.lastAnalyzedAt?.toISOString() ?? null,
    languages,
  };
}

export async function getDashboard(repositoryId: number) {
  const latest = await prisma.repositoryHealth.findFirst({
    where: { repositoryId },
    orderBy: { timestamp: "desc" },
  });
  if (!latest) {
    return emptyDashboard(repositoryId);
  }

  const previous = await prisma.repositoryHealth.findFirst({
    where: { repositoryId },
    orderBy: { timestamp: "desc" },
    skip: 1,
  });
  const timeline = await prisma.repositoryHealth.findMany({
    where: { repositoryId, timestamp: { gte: daysAgo(30) } },
    orderBy: { timestamp: "asc" },
  });
  const languages = await getLanguages(repositoryId);
  const contributors = await prisma.contributor.count({ where: { repositoryId } });
  const totalCommits = await prisma.commit.count({ where: { repositoryId } });
  const topCommits = await prisma.commit.findMany({
    where: { repositoryId },
    orderBy: { timestamp: "desc" },
    take: 4,
  });
  const churnComplexity = await getChurnPoints(repositoryId, 120);
  const change = latest.healthScore - (previous?.healthScore ?? latest.healthScore);

  return {
    repository_id: repositoryId,
    has_data: true,
    no_data_message: NO_DATA,
    health_score: round(latest.healthScore),
    complexity_score: round(latest.complexityScore),
    coupling_score: round(latest.couplingScore),
    coverage_score: round(latest.testCoverageScore),
    bus_factor: round(latest.busFactor),
    risk_level: riskLevelFromScore(latest.riskScore),
    total_commits: totalCommits,
    total_contributors: contributors,
    language_breakdown: languages,
    health_timeline: timeline.map((p) => ({
      date: p.timestamp.toISOString().slice(0, 10),
      health_score: round(p.healthScore),
      complexity: round(p.complexityScore),
      coupling: round(p.couplingScore),
      coverage: round(p.testCoverageScore),
    })),
    churn_complexity: churnComplexity,
    top_commit_ids: topCommits.map((c) => c.id),
    ai_insight_placeholder: {
      title: "AI insights not enabled",
      description: "Pipeline reserves AI slots but no LLM execution is active.",
      category: "recommendation",
      severity: "info" as const,
      timestamp: new Date().toISOString(),
      recommendation: "Use hotspot and architecture pages for actionable insights.",
      impact: `Current health score: ${latest.healthScore.toFixed(2)} (${change >= 0 ? "+" : ""}${change.toFixed(2)} vs previous snapshot).`,
      placeholder: true,
    },
  };
}

function emptyDashboard(repositoryId: number) {
  return {
    repository_id: repositoryId,
    has_data: false,
    no_data_message: NO_DATA,
    health_score: 0,
    complexity_score: 0,
    coupling_score: 0,
    coverage_score: 0,
    bus_factor: 0,
    risk_level: "Low",
    total_commits: 0,
    total_contributors: 0,
    language_breakdown: [],
    health_timeline: [],
    churn_complexity: [],
    top_commit_ids: [],
    ai_insight_placeholder: {
      title: "AI insights not enabled",
      description: "AI integration is reserved for a future phase.",
      category: "recommendation",
      severity: "info" as const,
      timestamp: new Date().toISOString(),
      recommendation: "Enable AI service integration in future releases.",
      impact: "No AI insights are generated yet.",
      placeholder: true,
    },
  };
}

export async function getTimeline(repositoryId: number) {
  const timeline = await prisma.repositoryHealth.findMany({
    where: { repositoryId, timestamp: { gte: daysAgo(30) } },
    orderBy: { timestamp: "asc" },
  });
  return timeline.map((p) => ({
    date: p.timestamp.toISOString().slice(0, 10),
    complexity: round(p.complexityScore),
    health: round(p.healthScore),
  }));
}

export async function getModules(repositoryId: number) {
  const files = await prisma.file.findMany({ where: { repositoryId } });
  const modules = new Map<string, { files: number; complexity: number; maintainability: number; coverage: number }>();
  for (const file of files) {
    const mod = file.path.includes("/") ? file.path.split("/")[0]! : "root";
    const entry = modules.get(mod) ?? { files: 0, complexity: 0, maintainability: 0, coverage: 0 };
    entry.files += 1;
    entry.complexity += file.currentComplexity;
    entry.maintainability += file.maintainabilityIndex;
    entry.coverage += 0;
    modules.set(mod, entry);
  }
  return [...modules.entries()]
    .map(([name, data]) => ({
      name,
      files: data.files,
      complexity: data.files ? data.complexity / data.files : 0,
      coverage: data.coverage,
      health: Math.max(0, Math.min(100, (data.files ? data.maintainability / data.files : 0) - (data.files ? data.complexity / data.files : 0) * 0.2)),
    }))
    .sort((a, b) => b.complexity - a.complexity);
}

export async function listCommits(repositoryId: number, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.commit.findMany({
      where: { repositoryId },
      orderBy: { timestamp: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.commit.count({ where: { repositoryId } }),
  ]);
  return {
    items: items.map((c) => ({
      id: c.id,
      hash: c.hash.slice(0, 8),
      message: c.message,
      author: { name: c.author, email: "" },
      date: c.timestamp.toISOString(),
      files_changed: c.filesChanged,
      additions: c.additions,
      deletions: c.deletions,
      complexity_delta: 0,
      coupling_delta: 0,
      maintainability_delta: 0,
      architecture_impact: impactFromFiles(c.filesChanged),
    })),
    total,
    page,
    page_size: pageSize,
  };
}

export async function getCommitStats(repositoryId: number) {
  const total = await prisma.commit.count({ where: { repositoryId } });
  const agg = await prisma.commit.aggregate({
    where: { repositoryId },
    _avg: { filesChanged: true },
  });
  const since = daysAgo(14);
  const commits = await prisma.commit.findMany({
    where: { repositoryId, timestamp: { gte: since } },
    orderBy: { timestamp: "asc" },
  });
  const byDay = new Map<string, number>();
  for (const c of commits) {
    const day = c.timestamp.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  const activity = [...byDay.entries()].map(([date, count]) => ({
    date,
    commits: count,
    impact: 5,
  }));
  const positiveRatio = activity.length ? 70 : 0;
  return {
    total_commits: total,
    avg_files_per_commit: round(agg._avg.filesChanged ?? 0),
    positive_impact_ratio: positiveRatio,
    avg_complexity_delta: 0,
    activity,
  };
}

export async function getHotspotSummary(repositoryId: number) {
  const hotspots = await prisma.hotspot.findMany({ where: { repositoryId } });
  const points = await getChurnPoints(repositoryId, 200);
  const critical = hotspots.filter((h) => h.riskLevel === "critical").length;
  const highRisk = hotspots.filter((h) => h.riskLevel === "critical" || h.riskLevel === "high").length;
  const improving = hotspots.filter((h) => h.trend === "improving").length;
  const avg = hotspots.length ? hotspots.reduce((s, h) => s + h.hotspotScore, 0) / hotspots.length : 0;

  const grouped = new Map<string, typeof hotspots>();
  for (const h of hotspots) {
    const file = await prisma.file.findUnique({ where: { id: h.fileId } });
    const mod = file?.path.includes("/") ? file.path.split("/")[0]! : "root";
    const list = grouped.get(mod) ?? [];
    list.push(h);
    grouped.set(mod, list);
  }
  const dangerous_modules = [...grouped.entries()]
    .map(([name, entries]) => ({
      name,
      score: round(entries.reduce((s, e) => s + e.hotspotScore, 0) / Math.max(entries.length, 1)),
      files: entries.length,
      trend: entries.some((e) => e.trend === "degrading") ? "degrading" : "stable",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    critical_hotspots: critical,
    high_risk_files: highRisk,
    avg_hotspot_score: round(avg),
    improving_files: improving,
    churn_complexity: points,
    dangerous_modules,
  };
}

export async function listHotspots(repositoryId: number, limit: number) {
  const rows = await prisma.hotspot.findMany({
    where: { repositoryId },
    orderBy: { hotspotScore: "desc" },
    take: limit,
    include: { file: true },
  });
  return rows.map((h) => ({
    id: h.id,
    file_path: h.file.path,
    module: h.file.path.includes("/") ? h.file.path.split("/")[0]! : "root",
    complexity: round(h.complexity),
    churn: round(h.churn),
    ownership_risk: round(h.ownershipRisk),
    maintainability: round(h.maintainability),
    hotspot_score: round(h.hotspotScore),
    severity: h.riskLevel,
    trend: h.trend,
  }));
}

export async function getContributorStats(repositoryId: number) {
  const contributors = await prisma.contributor.findMany({
    where: { repositoryId },
    orderBy: [{ commitCount: "desc" }, { ownershipScore: "desc" }],
  });
  if (!contributors.length) {
    return { bus_factor: 0, contributors: 0, active_30d: 0, top_contributor: "N/A" };
  }
  const owners = contributors.filter((c) => c.ownershipScore >= 50);
  const threshold = daysAgo(30);
  const active = contributors.filter((c) => c.lastActive && c.lastActive >= threshold).length;
  return {
    bus_factor: Math.max(owners.length, 1),
    contributors: contributors.length,
    active_30d: active,
    top_contributor: contributors[0]!.name,
  };
}

export async function listContributors(repositoryId: number) {
  const contributors = await prisma.contributor.findMany({
    where: { repositoryId },
    orderBy: [{ commitCount: "desc" }, { ownershipScore: "desc" }],
  });
  const ownershipCounts = await prisma.contributorOwnership.groupBy({
    by: ["contributorId"],
    where: { contributor: { repositoryId } },
    _count: { fileId: true },
  });
  const countMap = new Map(ownershipCounts.map((o) => [o.contributorId, o._count.fileId]));
  return contributors.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: "",
    email: c.email,
    commits: c.commitCount,
    lines_added: c.linesAdded,
    lines_removed: c.linesRemoved,
    files_owned: countMap.get(c.id) ?? 0,
    ownership_score: round(c.ownershipScore),
    last_active: c.lastActive?.toISOString() ?? null,
    risk_level: contributorRisk(c.ownershipScore),
  }));
}

export async function getOwnershipDistribution(repositoryId: number) {
  const contributors = await prisma.contributor.findMany({
    where: { repositoryId },
    orderBy: { ownershipScore: "desc" },
    take: 10,
  });
  return contributors.map((c, idx) => ({
    name: c.name,
    value: round(c.ownershipScore),
    color: OWNERSHIP_COLORS[idx % OWNERSHIP_COLORS.length]!,
  }));
}

export async function getOwnershipWarnings(repositoryId: number) {
  const hotspots = await prisma.hotspot.findMany({
    where: { repositoryId },
    orderBy: { ownershipRisk: "desc" },
    take: 50,
    include: { file: true },
  });
  const topContributor = await prisma.contributor.findFirst({
    where: { repositoryId },
    orderBy: { ownershipScore: "desc" },
  });
  const owner = topContributor?.name ?? "N/A";
  return hotspots
    .filter((h) => h.ownershipRisk >= 70)
    .slice(0, 8)
    .map((h) => ({
      module: h.file.path,
      owner,
      ownership: round(h.ownershipRisk),
      risk: h.ownershipRisk >= 85 ? "Critical" : "High",
    }));
}

export async function getDependencyGraph(repositoryId: number) {
  const edgesDb = await prisma.dependencyRelationship.findMany({ where: { repositoryId } });
  const nodes: Record<string, { id: string; label: string; type: string; layer: string; complexity: number; connections: number }> = {};
  const edges = edgesDb.map((e) => {
    for (const p of [e.sourceFile, e.targetFile]) {
      if (!nodes[p]) {
        nodes[p] = {
          id: p,
          label: p.split("/").pop() ?? p,
          type: "file",
          layer: layerFromPath(p),
          complexity: 0,
          connections: 0,
        };
      }
      nodes[p]!.connections += 1;
    }
    return {
      source: e.sourceFile,
      target: e.targetFile,
      type: e.relationshipType.toLowerCase(),
      weight: e.weight,
      is_cyclic: e.isCyclic,
    };
  });
  return {
    nodes: Object.values(nodes),
    edges,
    has_data: Object.keys(nodes).length > 0,
    no_data_message: NO_DATA,
  };
}

export async function getArchitectureSummary(repositoryId: number) {
  const violations = await prisma.architectureViolation.findMany({ where: { repositoryId } });
  const active = violations.filter((v) => !v.resolved).length;
  const resolved = violations.filter((v) => v.resolved).length;
  const total = violations.length;
  const integrity = Math.max(0, 100 - active * 7);
  const timeline = await prisma.repositoryHealth.findMany({
    where: { repositoryId },
    orderBy: { timestamp: "asc" },
    take: 20,
  });
  const policyCounters: Record<string, number> = {
    "No direct DB access from controllers": 0,
    "Services must not import other service internals": 0,
    "No circular dependencies between modules": 0,
    "Infrastructure code isolated from business logic": 0,
    "All external calls through adapter pattern": 0,
    "UI components must not import server code": 0,
  };
  for (const v of violations) {
    const key = v.violationType.includes("cyclic")
      ? "No circular dependencies between modules"
      : "No direct DB access from controllers";
    policyCounters[key] = (policyCounters[key] ?? 0) + 1;
  }
  const policies = Object.entries(policyCounters).map(([name, count]) => ({
    name,
    status: count === 0 ? "passing" : count >= 2 ? "violated" : "warning",
    count,
  }));
  return {
    integrity_score: integrity,
    active_violations: active,
    resolved,
    drift_rate: round(active / Math.max(total, 1)),
    drift_timeline: timeline.map((e) => ({
      date: e.timestamp.toISOString().slice(0, 10),
      violations: Math.max(0, Math.floor((100 - e.architectureScore) / 8)),
      integrity: round(e.architectureScore),
    })),
    policies,
  };
}

export async function getArchitectureViolations(repositoryId: number) {
  const rows = await prisma.architectureViolation.findMany({
    where: { repositoryId },
    orderBy: { detectedAt: "desc" },
  });
  return rows.map((v) => ({
    id: v.id,
    type: v.violationType,
    description: v.description ?? v.violationType,
    severity: v.severity,
    source: v.source ?? v.filePath,
    target: v.target ?? "",
    layer: v.layer ?? "unknown",
    detected_at: v.detectedAt.toISOString(),
    resolved: v.resolved,
  }));
}

export async function getInsights(repositoryId: number) {
  const latest = await prisma.repositoryHealth.findFirst({
    where: { repositoryId },
    orderBy: { timestamp: "desc" },
  });
  if (!latest) {
    return { has_data: false, no_data_message: NO_DATA, insights: [], predictions: [], recommendations: [] };
  }
  return {
    has_data: true,
    no_data_message: "",
    insights: [
      {
        id: "ai-placeholder-1",
        title: "AI insights pipeline placeholder",
        description: "AI/LLM insights are intentionally disabled for this release.",
        category: "recommendation",
        severity: "info",
        timestamp: new Date().toISOString(),
        recommendation: "Use commit, hotspot, architecture, and contributor analytics while AI is pending.",
        impact: "No AI-generated summaries or predictions are executed.",
        placeholder: true,
      },
    ],
    predictions: [],
    recommendations: [
      { title: "Future AI endpoint ready", effort: "N/A", impact: "Fast integration path", priority: "High" },
    ],
  };
}

export async function getJob(jobId: number) {
  const job = await prisma.analysisJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  return formatJob(job);
}

export async function getLatestJob(repositoryId: number) {
  const job = await prisma.analysisJob.findFirst({
    where: { repositoryId },
    orderBy: { startedAt: "desc" },
  });
  if (!job) return null;
  return formatJob(job);
}

export async function ensureRepository(url: string) {
  const normalized = normalizeGithubUrl(url);
  const { owner, repo } = extractOwnerRepo(normalized);
  const existing = await prisma.repository.findUnique({ where: { url: normalized } });
  if (existing) return existing.id;
  const created = await prisma.repository.create({
    data: { name: `${owner}/${repo}`, url: normalized, defaultBranch: "main" },
  });
  return created.id;
}

export async function createAnalysisJob(repositoryId: number, metadata: Record<string, unknown>) {
  const job = await prisma.analysisJob.create({
    data: {
      repositoryId,
      status: "queued",
      metadataJson: JSON.stringify(metadata),
    },
  });
  return job.id;
}

export async function clearRepositoryAnalysis(repositoryId: number) {
  await prisma.analysisJob.deleteMany({ where: { repositoryId } });
  await prisma.repositoryHealth.deleteMany({ where: { repositoryId } });
  await prisma.hotspot.deleteMany({ where: { repositoryId } });
  await prisma.architectureViolation.deleteMany({ where: { repositoryId } });
  await prisma.dependencyRelationship.deleteMany({ where: { repositoryId } });
  await prisma.commit.deleteMany({ where: { repositoryId } });
  await prisma.contributor.deleteMany({ where: { repositoryId } });
  await prisma.file.deleteMany({ where: { repositoryId } });
}

function formatJob(job: {
  id: number;
  repositoryId: number;
  status: string;
  progress: number;
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  metadataJson: string;
}) {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(job.metadataJson) as Record<string, unknown>;
  } catch {
    metadata = {};
  }
  return {
    id: job.id,
    repository_id: job.repositoryId,
    status: job.status,
    progress: job.progress,
    started_at: job.startedAt.toISOString(),
    completed_at: job.completedAt?.toISOString() ?? null,
    error_message: job.errorMessage,
    metadata,
  };
}

async function getLanguages(repositoryId: number) {
  const grouped = await prisma.file.groupBy({
    by: ["language"],
    where: { repositoryId },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  const total = grouped.reduce((s, g) => s + g._count.id, 0) || 1;
  return grouped.map((g, idx) => ({
    name: g.language,
    percentage: round((g._count.id / total) * 100),
    color: LANG_COLORS[idx % LANG_COLORS.length]!,
  }));
}

async function getChurnPoints(repositoryId: number, limit: number) {
  const files = await prisma.file.findMany({
    where: { repositoryId },
    orderBy: [{ churnScore: "desc" }, { currentComplexity: "desc" }],
    take: limit,
  });
  return files.map((f) => ({
    name: f.path,
    complexity: f.currentComplexity,
    churn: f.churnScore,
    size: 0,
    module: f.path.includes("/") ? f.path.split("/")[0]! : "root",
  }));
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function impactFromFiles(files: number): "none" | "low" | "medium" | "high" {
  if (files >= 20) return "high";
  if (files >= 10) return "medium";
  if (files >= 4) return "low";
  return "none";
}

function contributorRisk(score: number): "Low" | "Medium" | "High" {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

function layerFromPath(filePath: string): string {
  const lowered = filePath.toLowerCase();
  if (lowered.includes("/api/")) return "presentation";
  if (lowered.includes("/db/")) return "data";
  if (lowered.includes("/infra/")) return "infrastructure";
  return "business";
}
