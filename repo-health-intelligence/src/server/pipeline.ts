import fs from "fs/promises";
import os from "os";
import path from "path";
import simpleGit from "simple-git";

import { prisma } from "@/server/db";
import {
  detectLanguage,
  estimateComplexity,
  estimateMaintainability,
  estimateTestCoverage,
  extractImports,
  resolveImportToFile,
  walkSourceFiles,
} from "@/server/file-analysis";
import { normalizeGithubUrl } from "@/server/github";
import { clamp, computeHealthScore, hotspotRiskLevel, hotspotTrend } from "@/server/scoring";

const MAX_COMMITS = Number(process.env.MAX_COMMITS_PER_ANALYSIS ?? "80");
const CACHE_ROOT = path.join(os.tmpdir(), "rhi-repos");

type JobStatus = "queued" | "cloning" | "parsing" | "analyzing" | "generating_metrics" | "completed" | "failed";

async function updateJob(
  jobId: number,
  status: JobStatus,
  progress: number,
  extra?: { errorMessage?: string; completed?: boolean }
) {
  await prisma.analysisJob.update({
    where: { id: jobId },
    data: {
      status,
      progress,
      completedAt: extra?.completed ? new Date() : undefined,
      errorMessage: extra?.errorMessage ?? null,
    },
  });
}

export async function runAnalysisPipeline(
  repositoryId: number,
  jobId: number,
  options?: { forceReanalyze?: boolean; maxCommits?: number }
) {
  const maxCommits = options?.maxCommits ?? MAX_COMMITS;
  const repository = await prisma.repository.findUnique({ where: { id: repositoryId } });
  if (!repository) throw new Error("Repository not found");

  try {
    await updateJob(jobId, "cloning", 5);
    const repoUrl = normalizeGithubUrl(repository.url);
    const repoName = repoUrl.split("/").slice(-1)[0]?.replace(".git", "") ?? `repo-${repositoryId}`;
    const repoPath = path.join(CACHE_ROOT, `${repositoryId}-${repoName}`);

    if (options?.forceReanalyze) {
      await fs.rm(repoPath, { recursive: true, force: true }).catch(() => undefined);
    }

    await fs.mkdir(CACHE_ROOT, { recursive: true });
    const git = simpleGit();
    if (await fileExists(path.join(repoPath, ".git"))) {
      await simpleGit(repoPath).fetch(["--all"]);
      await simpleGit(repoPath).pull();
    } else {
      await git.clone(repoUrl, repoPath, ["--depth", String(maxCommits + 5)]);
    }

    await updateJob(jobId, "parsing", 12);
    const repoGit = simpleGit(repoPath);
    const log = await repoGit.log({ maxCount: maxCommits });
    const commits = [...log.all].reverse();

    const existingHashes = new Set(
      (
        await prisma.commit.findMany({
          where: { repositoryId },
          select: { hash: true },
        })
      ).map((c) => c.hash)
    );

    const newCommits = commits.filter((c) => !existingHashes.has(c.hash));
    const commitsToStore = newCommits.length > 0 ? newCommits : commits;

    await updateJob(jobId, "analyzing", 25);

    const fileChurn: Record<string, number> = {};
    const fileAuthors: Record<string, Record<string, number>> = {};
    const contributorMap = new Map<string, { name: string; email: string; commits: number; lines: number }>();

    let latestCommitRecord: { id: number } | null = null;
    let idx = 0;
    for (const commit of commitsToStore) {
      idx += 1;
      if (idx % 10 === 0) {
        await updateJob(jobId, "analyzing", 25 + (idx / Math.max(commits.length, 1)) * 40);
      }

      const email = commit.author_email ?? `${commit.author_name}@local`;
      const key = email.toLowerCase();
      const existing = contributorMap.get(key) ?? {
        name: commit.author_name ?? "unknown",
        email,
        commits: 0,
        lines: 0,
      };
      existing.commits += 1;
      existing.lines += 10;
      contributorMap.set(key, existing);

      if (!existingHashes.has(commit.hash)) {
        latestCommitRecord = await prisma.commit.create({
          data: {
            repositoryId,
            hash: commit.hash,
            author: commit.author_name ?? "unknown",
            message: commit.message ?? "",
            timestamp: new Date(commit.date),
            filesChanged: 0,
            additions: 0,
            deletions: 0,
          },
        });
        existingHashes.add(commit.hash);
      }

      const nameOnly = await repoGit.raw(["show", "--name-only", "--pretty=format:", commit.hash]).catch(() => "");
      for (const line of nameOnly.split("\n").map((l) => l.trim()).filter(Boolean)) {
        fileChurn[line] = (fileChurn[line] ?? 0) + 1;
        fileAuthors[line] ??= {};
        fileAuthors[line][email] = (fileAuthors[line][email] ?? 0) + 1;
      }
    }

    const sourceFiles = await walkSourceFiles(repoPath);
    const fileSet = new Set(sourceFiles);
    const dependencyEdges: Array<{ source: string; target: string; type: string }> = [];

    await updateJob(jobId, "generating_metrics", 72);

    await prisma.hotspot.deleteMany({ where: { repositoryId } });
    await prisma.architectureViolation.deleteMany({ where: { repositoryId } });
    await prisma.dependencyRelationship.deleteMany({ where: { repositoryId } });
    await prisma.contributorOwnership.deleteMany({
      where: { contributor: { repositoryId } },
    });
    await prisma.fileMetric.deleteMany({ where: { file: { repositoryId } } });

    const fileRecords = new Map<string, number>();
    let totalComplexity = 0;
    let totalMaintainability = 0;
    let totalCoverage = 0;
    let fileCount = 0;

    for (const relPath of sourceFiles) {
      const abs = path.join(repoPath, relPath);
      const content = await fs.readFile(abs, "utf8").catch(() => "");
      const loc = content.split("\n").length;
      const language = detectLanguage(relPath);
      const complexity = estimateComplexity(content);
      const maintainability = estimateMaintainability(complexity, loc);
      const churn = Math.min(100, (fileChurn[relPath] ?? 0) * 8);
      const coverage = estimateTestCoverage(relPath, loc);

      const file = await prisma.file.upsert({
        where: { uq_repo_file_path: { repositoryId, path: relPath } },
        create: {
          repositoryId,
          path: relPath,
          language,
          currentComplexity: complexity,
          maintainabilityIndex: maintainability,
          churnScore: churn,
        },
        update: {
          language,
          currentComplexity: complexity,
          maintainabilityIndex: maintainability,
          churnScore: churn,
        },
      });
      fileRecords.set(relPath, file.id);
      fileCount += 1;
      totalComplexity += complexity;
      totalMaintainability += maintainability;
      totalCoverage += coverage;

      if (latestCommitRecord) {
        await prisma.fileMetric.create({
          data: {
            fileId: file.id,
            commitId: latestCommitRecord.id,
            complexity,
            maintainability,
            linesOfCode: loc,
            couplingScore: 0,
            duplicationScore: 0,
            testCoverage: coverage,
          },
        });
      }

      for (const imp of extractImports(content, relPath)) {
        const target = resolveImportToFile(imp, relPath, fileSet);
        if (target) dependencyEdges.push({ source: relPath, target, type: "import" });
      }
    }

    const avgComplexity = fileCount ? totalComplexity / fileCount : 0;
    const avgMaintainability = fileCount ? totalMaintainability / fileCount : 0;
    const avgCoverage = fileCount ? totalCoverage / fileCount : 0;

    const contributorIds = new Map<string, number>();
    for (const [, info] of contributorMap) {
      const contributor = await prisma.contributor.upsert({
        where: { uq_repo_contributor_email: { repositoryId, email: info.email } },
        create: {
          repositoryId,
          name: info.name,
          email: info.email,
          commitCount: info.commits,
          ownershipScore: 0,
          linesAdded: info.lines,
          linesRemoved: 0,
          lastActive: new Date(),
        },
        update: {
          name: info.name,
          commitCount: { increment: info.commits },
          linesAdded: { increment: info.lines },
          lastActive: new Date(),
        },
      });
      contributorIds.set(info.email.toLowerCase(), contributor.id);
    }

    const ownershipEntries: Array<{ contributorId: number; fileId: number; pct: number }> = [];
    let maxOwnership = 0;
    for (const [filePath, authors] of Object.entries(fileAuthors)) {
      const fileId = fileRecords.get(filePath);
      if (!fileId) continue;
      const total = Object.values(authors).reduce((a, b) => a + b, 0) || 1;
      for (const [email, count] of Object.entries(authors)) {
        const pct = (count / total) * 100;
        const contributorId = contributorIds.get(email.toLowerCase());
        if (contributorId) {
          ownershipEntries.push({ contributorId, fileId, pct });
          maxOwnership = Math.max(maxOwnership, pct);
        }
      }
    }

    for (const entry of ownershipEntries) {
      await prisma.contributorOwnership.create({
        data: {
          contributorId: entry.contributorId,
          fileId: entry.fileId,
          ownershipPercentage: entry.pct,
        },
      });
    }

    for (const contributor of await prisma.contributor.findMany({ where: { repositoryId } })) {
      const owned = ownershipEntries.filter((o) => o.contributorId === contributor.id);
      const score = owned.length ? owned.reduce((s, o) => s + o.pct, 0) / owned.length : 0;
      await prisma.contributor.update({
        where: { id: contributor.id },
        data: { ownershipScore: score },
      });
    }

    const cyclicPairs = detectCycles(dependencyEdges);
    for (const edge of dependencyEdges) {
      const isCyclic = cyclicPairs.has(`${edge.source}->${edge.target}`);
      await prisma.dependencyRelationship.create({
        data: {
          repositoryId,
          sourceFile: edge.source,
          targetFile: edge.target,
          relationshipType: edge.type,
          isCyclic,
          weight: 1,
        },
      });
      if (isCyclic) {
        await prisma.architectureViolation.create({
          data: {
            repositoryId,
            filePath: edge.source,
            violationType: "cyclic_dependency",
            severity: "error",
            source: edge.source,
            target: edge.target,
            layer: layerFromPath(edge.source),
            description: `Cyclic dependency between ${edge.source} and ${edge.target}`,
          },
        });
      }
    }

    let maxHotspot = 0;
    for (const [relPath, fileId] of fileRecords) {
      const file = await prisma.file.findUnique({ where: { id: fileId } });
      if (!file) continue;
      const ownershipRisk = Math.min(100, (fileChurn[relPath] ?? 0) * 12 + maxOwnership * 0.3);
      const score = clamp(file.churnScore * 0.4 + file.currentComplexity * 0.35 + ownershipRisk * 0.2 + (100 - file.maintainabilityIndex) * 0.05);
      maxHotspot = Math.max(maxHotspot, score);
      await prisma.hotspot.create({
        data: {
          repositoryId,
          fileId,
          hotspotScore: score,
          riskLevel: hotspotRiskLevel(score),
          complexity: file.currentComplexity,
          churn: file.churnScore,
          ownershipRisk,
          maintainability: file.maintainabilityIndex,
          trend: hotspotTrend(score),
        },
      });
    }

    const violationCount = await prisma.architectureViolation.count({ where: { repositoryId, resolved: false } });
    const busFactor = Math.max(1, (await prisma.contributor.count({ where: { repositoryId, ownershipScore: { gte: 50 } } })) || 1);

    const health = computeHealthScore({
      complexityScore: avgComplexity,
      couplingScore: Math.min(100, dependencyEdges.length * 0.5),
      maintainabilityScore: avgMaintainability,
      architectureViolations: violationCount,
      hotspotScore: maxHotspot,
      ownershipConcentration: maxOwnership,
      testCoverage: avgCoverage,
    });

    await prisma.repositoryHealth.create({
      data: {
        repositoryId,
        commitId: latestCommitRecord?.id,
        healthScore: health.healthScore,
        riskScore: health.riskScore,
        couplingScore: health.couplingScore,
        complexityScore: health.complexityScore,
        maintainabilityScore: health.maintainabilityScore,
        testCoverageScore: health.testCoverageScore,
        busFactor,
        hotspotSeverity: health.hotspotSeverity,
        architectureScore: health.architectureScore,
      },
    });

    await prisma.repository.update({
      where: { id: repositoryId },
      data: { lastAnalyzedAt: new Date() },
    });

    await updateJob(jobId, "completed", 100, { completed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    await updateJob(jobId, "failed", 100, { errorMessage: message, completed: true });
    throw err;
  }
}

function layerFromPath(filePath: string): string {
  const lowered = filePath.toLowerCase();
  if (lowered.includes("/api/")) return "presentation";
  if (lowered.includes("/db/")) return "data";
  if (lowered.includes("/infra/")) return "infrastructure";
  return "business";
}

function detectCycles(edges: Array<{ source: string; target: string }>): Set<string> {
  const graph = new Map<string, string[]>();
  for (const e of edges) {
    const list = graph.get(e.source) ?? [];
    list.push(e.target);
    graph.set(e.source, list);
  }

  const cyclic = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(node: string, stack: string[]) {
    if (visiting.has(node)) {
      const idx = stack.indexOf(node);
      if (idx >= 0) {
        for (let i = idx; i < stack.length; i++) {
          const next = stack[i + 1];
          if (next) cyclic.add(`${stack[i]}->${next}`);
        }
      }
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) dfs(next, stack);
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of graph.keys()) dfs(node, []);
  return cyclic;
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
