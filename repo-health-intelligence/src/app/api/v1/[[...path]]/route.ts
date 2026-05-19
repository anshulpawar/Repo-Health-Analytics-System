import { after, NextRequest, NextResponse } from "next/server";

import { parseAndValidateGithubUrl } from "@/server/github";
import { runAnalysisPipeline } from "@/server/pipeline";
import * as services from "@/server/services";

export const runtime = "nodejs";
export const maxDuration = 300;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(message: string, status: number) {
  return json({ detail: message }, status);
}

function parseId(value: string | undefined, label: string): number {
  const id = Number(value);
  if (!value || Number.isNaN(id)) throw new Error(`Invalid ${label}`);
  return id;
}

async function handleGet(segments: string[], request: NextRequest) {
  const [resource, idOrAction, action, subAction] = segments;

  if (segments.length === 1 && resource === "healthz") {
    return json({ status: "ok" });
  }

  if (resource === "repositories" && segments.length === 1) {
    return json(await services.listRepositories());
  }

  if (resource === "repositories" && idOrAction && action === "overview") {
    try {
      return json(await services.getRepositoryOverview(parseId(idOrAction, "repository id")));
    } catch {
      return errorResponse("Repository not found", 404);
    }
  }

  if (resource === "repositories" && idOrAction && action === "jobs" && subAction === "latest") {
    const job = await services.getLatestJob(parseId(idOrAction, "repository id"));
    if (!job) return errorResponse("No analysis jobs found for repository.", 404);
    return json(job);
  }

  if (resource === "dashboard" && idOrAction && segments.length === 2) {
    return json(await services.getDashboard(parseId(idOrAction, "repository id")));
  }

  if (resource === "dashboard" && idOrAction && action === "timeline") {
    return json(await services.getTimeline(parseId(idOrAction, "repository id")));
  }

  if (resource === "dashboard" && idOrAction && action === "modules") {
    return json(await services.getModules(parseId(idOrAction, "repository id")));
  }

  if (resource === "commits" && idOrAction && segments.length === 2) {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("page_size") ?? "20");
    return json(await services.listCommits(parseId(idOrAction, "repository id"), page, pageSize));
  }

  if (resource === "commits" && idOrAction && action === "stats") {
    return json(await services.getCommitStats(parseId(idOrAction, "repository id")));
  }

  if (resource === "hotspots" && idOrAction && action === "summary") {
    return json(await services.getHotspotSummary(parseId(idOrAction, "repository id")));
  }

  if (resource === "hotspots" && idOrAction && segments.length === 2) {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? "200");
    return json(await services.listHotspots(parseId(idOrAction, "repository id"), limit));
  }

  if (resource === "contributors" && idOrAction && action === "stats") {
    return json(await services.getContributorStats(parseId(idOrAction, "repository id")));
  }

  if (resource === "contributors" && idOrAction && action === "ownership") {
    return json(await services.getOwnershipDistribution(parseId(idOrAction, "repository id")));
  }

  if (resource === "contributors" && idOrAction && action === "warnings") {
    return json(await services.getOwnershipWarnings(parseId(idOrAction, "repository id")));
  }

  if (resource === "contributors" && idOrAction && segments.length === 2) {
    return json(await services.listContributors(parseId(idOrAction, "repository id")));
  }

  if (resource === "dependencies" && idOrAction && segments.length === 2) {
    return json(await services.getDependencyGraph(parseId(idOrAction, "repository id")));
  }

  if (resource === "architecture" && idOrAction && action === "summary") {
    return json(await services.getArchitectureSummary(parseId(idOrAction, "repository id")));
  }

  if (resource === "architecture" && idOrAction && action === "violations") {
    return json(await services.getArchitectureViolations(parseId(idOrAction, "repository id")));
  }

  if (resource === "insights" && idOrAction && segments.length === 2) {
    return json(await services.getInsights(parseId(idOrAction, "repository id")));
  }

  if (resource === "jobs" && idOrAction && segments.length === 2) {
    const job = await services.getJob(parseId(idOrAction, "job id"));
    if (!job) return errorResponse("Analysis job not found.", 404);
    return json(job);
  }

  return errorResponse("Not found", 404);
}

async function handlePost(segments: string[], request: NextRequest) {
  if (segments[0] === "repositories" && segments[1] === "analyze") {
    let body: { url?: string; force_reanalyze?: boolean; max_commits?: number };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }
    if (!body.url) return errorResponse("url is required", 400);

    try {
      parseAndValidateGithubUrl(body.url);
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : "Invalid URL", 400);
    }

    const repositoryId = await services.ensureRepository(body.url);
    if (body.force_reanalyze) {
      await services.clearRepositoryAnalysis(repositoryId);
    }

    const jobId = await services.createAnalysisJob(repositoryId, {
      requested_url: body.url,
      force_reanalyze: body.force_reanalyze ?? false,
    });

    after(async () => {
      try {
        await runAnalysisPipeline(repositoryId, jobId, {
          forceReanalyze: body.force_reanalyze,
          maxCommits: body.max_commits,
        });
      } catch (err) {
        console.error("[analysis]", err);
      }
    });

    return json({ repository_id: repositoryId, job_id: jobId, status: "queued" });
  }

  return errorResponse("Not found", 404);
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  try {
    return await handleGet(path, request);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Request failed", 500);
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await context.params;
  try {
    return await handlePost(path, request);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Request failed", 500);
  }
}
