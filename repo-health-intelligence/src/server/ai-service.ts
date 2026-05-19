import { prisma } from "@/server/db";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

interface RepoAnalysisContext {
  repositoryName: string;
  healthScore: number;
  riskScore: number;
  complexityScore: number;
  couplingScore: number;
  maintainabilityScore: number;
  testCoverageScore: number;
  architectureScore: number;
  busFactor: number;
  hotspotSeverity: number;
  totalCommits: number;
  totalContributors: number;
  totalFiles: number;
  activeViolations: number;
  criticalHotspots: number;
  highRiskFiles: number;
  topHotspots: Array<{ path: string; score: number; complexity: number; churn: number; riskLevel: string }>;
  topViolations: Array<{ type: string; source: string; target: string; severity: string }>;
  topContributors: Array<{ name: string; commits: number; ownershipScore: number }>;
  languageBreakdown: Array<{ name: string; percentage: number }>;
  cyclicDependencyCount: number;
}

interface AiInsightResult {
  id: string;
  title: string;
  description: string;
  category: "health" | "architecture" | "complexity" | "risk" | "recommendation";
  severity: "info" | "warning" | "critical";
  recommendation: string;
  impact: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  effort: "Low" | "Medium" | "High";
}

/**
 * Gathers all repository analysis data needed for building the AI prompt.
 */
async function gatherRepoContext(repositoryId: number): Promise<RepoAnalysisContext | null> {
  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) return null;

  const latest = await prisma.repositoryHealth.findFirst({
    where: { repositoryId },
    orderBy: { timestamp: "desc" },
  });
  if (!latest) return null;

  const totalCommits = await prisma.commit.count({ where: { repositoryId } });
  const totalContributors = await prisma.contributor.count({ where: { repositoryId } });
  const totalFiles = await prisma.file.count({ where: { repositoryId } });
  const activeViolations = await prisma.architectureViolation.count({
    where: { repositoryId, resolved: false },
  });
  const cyclicDependencyCount = await prisma.dependencyRelationship.count({
    where: { repositoryId, isCyclic: true },
  });

  const hotspots = await prisma.hotspot.findMany({
    where: { repositoryId },
    orderBy: { hotspotScore: "desc" },
    take: 10,
    include: { file: true },
  });
  const criticalHotspots = hotspots.filter((h) => h.riskLevel === "critical").length;
  const highRiskFiles = hotspots.filter(
    (h) => h.riskLevel === "critical" || h.riskLevel === "high"
  ).length;

  const violations = await prisma.architectureViolation.findMany({
    where: { repositoryId, resolved: false },
    orderBy: { detectedAt: "desc" },
    take: 8,
  });

  const contributors = await prisma.contributor.findMany({
    where: { repositoryId },
    orderBy: [{ commitCount: "desc" }, { ownershipScore: "desc" }],
    take: 5,
  });

  const languageGroups = await prisma.file.groupBy({
    by: ["language"],
    where: { repositoryId },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  const totalLangFiles = languageGroups.reduce((s, g) => s + g._count.id, 0) || 1;
  const languageBreakdown = languageGroups.map((g) => ({
    name: g.language,
    percentage: Math.round((g._count.id / totalLangFiles) * 100),
  }));

  return {
    repositoryName: repository.name,
    healthScore: latest.healthScore,
    riskScore: latest.riskScore,
    complexityScore: latest.complexityScore,
    couplingScore: latest.couplingScore,
    maintainabilityScore: latest.maintainabilityScore,
    testCoverageScore: latest.testCoverageScore,
    architectureScore: latest.architectureScore,
    busFactor: latest.busFactor,
    hotspotSeverity: latest.hotspotSeverity,
    totalCommits,
    totalContributors,
    totalFiles,
    activeViolations,
    criticalHotspots,
    highRiskFiles,
    topHotspots: hotspots.map((h) => ({
      path: h.file.path,
      score: h.hotspotScore,
      complexity: h.complexity,
      churn: h.churn,
      riskLevel: h.riskLevel,
    })),
    topViolations: violations.map((v) => ({
      type: v.violationType,
      source: v.source ?? v.filePath,
      target: v.target ?? "",
      severity: v.severity,
    })),
    topContributors: contributors.map((c) => ({
      name: c.name,
      commits: c.commitCount,
      ownershipScore: c.ownershipScore,
    })),
    languageBreakdown,
    cyclicDependencyCount,
  };
}

/**
 * Builds a comprehensive prompt for the Groq LLM from the repository analysis data.
 */
function buildPrompt(ctx: RepoAnalysisContext): string {
  const hotspotList = ctx.topHotspots
    .slice(0, 7)
    .map((h) => `  - ${h.path} (score: ${h.score.toFixed(1)}, complexity: ${h.complexity.toFixed(1)}, churn: ${h.churn.toFixed(1)}, risk: ${h.riskLevel})`)
    .join("\n");

  const violationList = ctx.topViolations
    .slice(0, 5)
    .map((v) => `  - [${v.severity}] ${v.type}: ${v.source} → ${v.target}`)
    .join("\n");

  const contributorList = ctx.topContributors
    .map((c) => `  - ${c.name}: ${c.commits} commits, ownership score: ${c.ownershipScore.toFixed(1)}%`)
    .join("\n");

  const languages = ctx.languageBreakdown.map((l) => `${l.name} (${l.percentage}%)`).join(", ");

  return `You are an expert software engineering consultant specializing in code quality, architecture, and repository health analysis. Analyze the following repository metrics and provide actionable insights.

## Repository: ${ctx.repositoryName}

### Overall Scores (0-100 scale)
- Health Score: ${ctx.healthScore.toFixed(1)}/100
- Risk Score: ${ctx.riskScore.toFixed(1)}/100
- Complexity Score: ${ctx.complexityScore.toFixed(1)}/100
- Coupling Score: ${ctx.couplingScore.toFixed(1)}/100
- Maintainability Score: ${ctx.maintainabilityScore.toFixed(1)}/100
- Test Coverage Score: ${ctx.testCoverageScore.toFixed(1)}/100
- Architecture Integrity Score: ${ctx.architectureScore.toFixed(1)}/100
- Hotspot Severity: ${ctx.hotspotSeverity.toFixed(1)}/100
- Bus Factor: ${ctx.busFactor}

### Repository Stats
- Total files analyzed: ${ctx.totalFiles}
- Total commits: ${ctx.totalCommits}
- Total contributors: ${ctx.totalContributors}
- Languages: ${languages}
- Active architecture violations: ${ctx.activeViolations}
- Cyclic dependencies: ${ctx.cyclicDependencyCount}
- Critical hotspots: ${ctx.criticalHotspots}
- High-risk files: ${ctx.highRiskFiles}

### Top Hotspot Files (highest risk first)
${hotspotList || "  No hotspots detected."}

### Active Architecture Violations
${violationList || "  No violations detected."}

### Top Contributors
${contributorList || "  No contributor data."}

---

Based on this analysis, generate exactly 6-8 structured insights. Each insight MUST address a real finding from the data above. Focus on:
1. The most critical risk factors that could cause production incidents
2. Specific files/modules that need immediate attention
3. Architecture improvements to reduce coupling and cyclic dependencies
4. Strategies to improve the bus factor and reduce ownership concentration
5. Actionable steps to lower complexity and improve maintainability
6. Test coverage improvement priorities

For each insight, respond with a JSON array. Each object must have:
- "title": concise title (max 12 words)
- "description": 2-3 sentence explanation referencing specific metrics/files from the data
- "category": one of "health", "architecture", "complexity", "risk", "recommendation"
- "severity": one of "info", "warning", "critical" (based on urgency)
- "recommendation": specific, actionable step the team should take (1-2 sentences)
- "impact": what improvement this would bring, referencing expected score changes
- "priority": one of "Low", "Medium", "High", "Critical"
- "effort": one of "Low", "Medium", "High"

IMPORTANT: Only respond with the JSON array, no markdown fences, no explanation. Just the raw JSON array.`;
}

/**
 * Calls the Groq API to generate AI insights.
 */
async function callGroqApi(prompt: string): Promise<AiInsightResult[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[ai-service] GROQ_API_KEY is not set");
    return [];
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a software engineering expert. You analyze repository health metrics and provide precise, actionable insights. Always respond with valid JSON arrays only. No markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ai-service] Groq API error ${response.status}: ${errorText}`);
      return [];
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.error("[ai-service] Empty response from Groq");
      return [];
    }

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

    const parsed = JSON.parse(cleaned) as AiInsightResult[];
    if (!Array.isArray(parsed)) {
      console.error("[ai-service] Response is not an array");
      return [];
    }

    // Validate and assign IDs
    return parsed.map((item, idx) => ({
      id: `ai-insight-${idx + 1}`,
      title: String(item.title ?? "Untitled Insight"),
      description: String(item.description ?? ""),
      category: validateCategory(item.category),
      severity: validateSeverity(item.severity),
      recommendation: String(item.recommendation ?? ""),
      impact: String(item.impact ?? ""),
      priority: validatePriority(item.priority),
      effort: validateEffort(item.effort),
    }));
  } catch (err) {
    console.error("[ai-service] Failed to call Groq API:", err);
    return [];
  }
}

function validateCategory(
  val: unknown
): "health" | "architecture" | "complexity" | "risk" | "recommendation" {
  const valid = ["health", "architecture", "complexity", "risk", "recommendation"];
  return valid.includes(String(val)) ? (String(val) as ReturnType<typeof validateCategory>) : "recommendation";
}

function validateSeverity(val: unknown): "info" | "warning" | "critical" {
  const valid = ["info", "warning", "critical"];
  return valid.includes(String(val)) ? (String(val) as ReturnType<typeof validateSeverity>) : "info";
}

function validatePriority(val: unknown): "Low" | "Medium" | "High" | "Critical" {
  const valid = ["Low", "Medium", "High", "Critical"];
  return valid.includes(String(val)) ? (String(val) as ReturnType<typeof validatePriority>) : "Medium";
}

function validateEffort(val: unknown): "Low" | "Medium" | "High" {
  const valid = ["Low", "Medium", "High"];
  return valid.includes(String(val)) ? (String(val) as ReturnType<typeof validateEffort>) : "Medium";
}

/**
 * Generates AI insights for a repository and stores them in the database.
 * Clears previously cached insights before storing new ones.
 */
export async function generateAndStoreInsights(repositoryId: number): Promise<AiInsightResult[]> {
  const context = await gatherRepoContext(repositoryId);
  if (!context) {
    console.warn(`[ai-service] No analysis data for repository ${repositoryId}`);
    return [];
  }

  const prompt = buildPrompt(context);
  const insights = await callGroqApi(prompt);

  if (insights.length === 0) {
    console.warn("[ai-service] No insights generated from Groq");
    return [];
  }

  // Clear old cached insights
  await prisma.aiInsight.deleteMany({ where: { repositoryId } });

  // Store new insights
  for (const insight of insights) {
    await prisma.aiInsight.create({
      data: {
        repositoryId,
        insightId: insight.id,
        title: insight.title,
        description: insight.description,
        category: insight.category,
        severity: insight.severity,
        recommendation: insight.recommendation,
        impact: insight.impact,
        priority: insight.priority,
        effort: insight.effort,
      },
    });
  }

  return insights;
}

/**
 * Retrieves cached AI insights from the database.
 * Returns null if none exist (caller should decide whether to generate).
 */
export async function getCachedInsights(repositoryId: number): Promise<AiInsightResult[] | null> {
  const rows = await prisma.aiInsight.findMany({
    where: { repositoryId },
    orderBy: { generatedAt: "desc" },
  });

  if (rows.length === 0) return null;

  return rows.map((r) => ({
    id: r.insightId,
    title: r.title,
    description: r.description,
    category: validateCategory(r.category),
    severity: validateSeverity(r.severity),
    recommendation: r.recommendation,
    impact: r.impact,
    priority: validatePriority(r.priority),
    effort: validateEffort(r.effort),
  }));
}

/**
 * Returns cached insights or generates new ones if none exist.
 */
export async function getOrGenerateInsights(repositoryId: number): Promise<AiInsightResult[]> {
  const cached = await getCachedInsights(repositoryId);
  if (cached && cached.length > 0) return cached;
  return generateAndStoreInsights(repositoryId);
}
