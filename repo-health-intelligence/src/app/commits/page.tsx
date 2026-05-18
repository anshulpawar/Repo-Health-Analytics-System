"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { CommitCard } from "@/components/commit-card";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Search, Filter, GitCommitHorizontal, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function CommitsPage() {
  const { repositoryId, currentJob } = useRepositoryContext();
  const hasRepository = !!repositoryId;

  const commitsQuery = useApiData(
    repositoryId ? () => api.getCommits(repositoryId, 1, 50) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const statsQuery = useApiData(
    repositoryId ? () => api.getCommitStats(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );

  const commits = commitsQuery.data?.items ?? [];
  const stats = statsQuery.data;
  const activityData = (stats?.activity ?? []).map((item) => ({
    date: item.date.slice(5),
    commits: item.commits,
    impact: item.impact,
  }));

  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Commit Explorer" description="Analyze commit-by-commit health changes across your repository" />

        {!hasRepository && <EmptyRepositoryState />}
        {hasRepository && (commitsQuery.loading || statsQuery.loading) && <LoadingState label="Loading commit analytics..." />}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search commits by message, author, or hash..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/50" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Calendar className="w-4 h-4" />
            Date Range
          </button>
        </div>

        <FloatingGlowPanel className="p-5" delay={0.1}>
          <SectionHeader title="Commit Activity" description="Daily commit volume and health impact" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="commits" fill="#22d3ee" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FloatingGlowPanel>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Commits", value: `${stats?.total_commits ?? 0}`, sub: "All time" },
            { label: "Avg. Files/Commit", value: `${stats?.avg_files_per_commit?.toFixed(1) ?? "0.0"}`, sub: "Last analyzed set" },
            { label: "Positive Impact", value: `${Math.round(stats?.positive_impact_ratio ?? 0)}%`, sub: "Health improving" },
            { label: "Avg. Complexity Delta", value: `${(stats?.avg_complexity_delta ?? 0).toFixed(1)}`, sub: "Per commit" },
          ].map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-xl border border-white/5 bg-card p-4 text-center">
              <div className="text-xl font-bold">{item.value}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">{item.sub}</div>
            </motion.div>
          ))}
        </div>

        <FloatingGlowPanel className="p-5" delay={0.2}>
          <SectionHeader
            title="Commit Timeline"
            description="Latest commits with health impact analysis"
            action={
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <GitCommitHorizontal className="w-3 h-3" />
                {commits.length} commits
              </div>
            }
          />
          <div className="space-y-3">
            {commits.map((commit, index) => (
              <CommitCard
                key={commit.id}
                hash={commit.hash}
                message={commit.message}
                authorName={commit.author.name}
                date={commit.date}
                filesChanged={commit.files_changed}
                additions={commit.additions}
                deletions={commit.deletions}
                complexityDelta={commit.complexity_delta}
                couplingDelta={commit.coupling_delta}
                maintainabilityDelta={commit.maintainability_delta}
                architectureImpact={commit.architecture_impact}
                delay={index * 0.04}
              />
            ))}
            {commits.length === 0 && <p className="text-sm text-muted-foreground">No repository analyzed yet</p>}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}

