"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, GitCommitHorizontal, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { DashboardLayout } from "@/components/dashboard-layout";
import { CommitCard } from "@/components/commit-card";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api, CommitData } from "@/lib/api";
import { cn } from "@/lib/utils";

type ImpactFilter = "all" | CommitData["architecture_impact"];

const IMPACT_OPTIONS: Array<{ value: ImpactFilter; label: string }> = [
  { value: "all", label: "All impact" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];

export default function CommitsPage() {
  const { repositoryId, currentJob } = useRepositoryContext();
  const hasRepository = !!repositoryId;

  const [search, setSearch] = useState("");
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  const filteredCommits = useMemo(() => {
    const query = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999);

    return commits.filter((commit) => {
      if (impactFilter !== "all" && commit.architecture_impact !== impactFilter) return false;
      if (from || to) {
        const commitDate = new Date(commit.date);
        if (from && commitDate < from) return false;
        if (to && commitDate > to) return false;
      }
      if (!query) return true;
      return (
        commit.message.toLowerCase().includes(query) ||
        commit.hash.toLowerCase().includes(query) ||
        commit.author.name.toLowerCase().includes(query) ||
        commit.author.email.toLowerCase().includes(query)
      );
    });
  }, [commits, search, impactFilter, dateFrom, dateTo]);

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

        <motion.div layout className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commits by message, author, or hash..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors",
              showFilters ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300" : "bg-white/5 border-white/5 text-muted-foreground hover:text-foreground"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </motion.div>

        {showFilters && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]"
          >
            <label className="flex flex-col gap-1 text-xs text-muted-foreground flex-1">
              Architecture impact
              <select
                value={impactFilter}
                onChange={(e) => setImpactFilter(e.target.value as ImpactFilter)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-foreground outline-none"
              >
                {IMPACT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground flex-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> From
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-foreground outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground flex-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> To
              </span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-foreground outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setImpactFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="self-end px-4 py-2 rounded-lg bg-white/5 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          </motion.div>
        )}

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
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-white/5 bg-card p-4 text-center"
            >
              <motion.div layout className="text-xl font-bold">
                {item.value}
              </motion.div>
              <motion.div layout className="text-xs text-muted-foreground">
                {item.label}
              </motion.div>
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
                {filteredCommits.length}
                {filteredCommits.length !== commits.length ? ` of ${commits.length}` : ""} commits
              </div>
            }
          />
          <div className="space-y-3">
            {filteredCommits.map((commit, index) => (
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
            {commits.length === 0 && <p className="text-sm text-muted-foreground">No commits loaded yet. Run analysis first.</p>}
            {commits.length > 0 && filteredCommits.length === 0 && (
              <p className="text-sm text-muted-foreground">No commits match your search or filters.</p>
            )}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}
