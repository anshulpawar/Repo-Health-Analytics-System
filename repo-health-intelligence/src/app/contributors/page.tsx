"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Trophy, GitCommitHorizontal, FileText, Code2, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

export default function ContributorsPage() {
  const { repositoryId, currentJob } = useRepositoryContext();
  const hasRepository = !!repositoryId;

  const statsQuery = useApiData(
    repositoryId ? () => api.getContributorStats(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const contributorsQuery = useApiData(
    repositoryId ? () => api.getContributors(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const ownershipQuery = useApiData(
    repositoryId ? () => api.getContributorOwnership(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const warningsQuery = useApiData(
    repositoryId ? () => api.getContributorWarnings(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );

  const stats = statsQuery.data;
  const contributors = contributorsQuery.data ?? [];
  const ownershipData = ownershipQuery.data ?? [];
  const riskWarnings = warningsQuery.data ?? [];

  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Contributor Insights" description="Bus factor analysis, ownership concentration, and contributor activity" />

        {!hasRepository && <EmptyRepositoryState />}
        {hasRepository && (statsQuery.loading || contributorsQuery.loading) && <LoadingState label="Loading contributor analytics..." />}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Bus Factor", value: `${Math.round(stats?.bus_factor ?? 0)}`, color: "text-amber-400", icon: AlertTriangle },
            { label: "Contributors", value: `${stats?.contributors ?? 0}`, color: "text-cyan-400", icon: Users },
            { label: "Active (30d)", value: `${stats?.active_30d ?? 0}`, color: "text-emerald-400", icon: Clock },
            { label: "Top Contributor", value: stats?.top_contributor ?? "N/A", color: "text-cyan-400", icon: Trophy },
          ].map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-xl border border-white/5 bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={cn("w-4 h-4", item.color)} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
              </div>
              <div className={cn("text-2xl font-bold", item.color)}>{item.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Commits per Developer" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contributors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#71717a", fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="commits" fill="#22d3ee" radius={[0, 6, 6, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-5" delay={0.15}>
            <SectionHeader title="Ownership Distribution" />
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ownershipData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0}>
                    {ownershipData.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {ownershipData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-muted-foreground truncate">{item.name}</span>
                </div>
              ))}
              {ownershipData.length === 0 && <p className="text-[10px] text-muted-foreground">No repository analyzed yet</p>}
            </div>
          </FloatingGlowPanel>
        </div>

        <FloatingGlowPanel className="p-5" glowColor="amber" delay={0.2}>
          <SectionHeader title="Ownership Risk Warnings" description="Modules with dangerously concentrated ownership" />
          <div className="space-y-3">
            {riskWarnings.map((warning, index) => (
              <motion.div key={`${warning.module}-${index}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="flex items-center gap-4 p-4 rounded-xl border border-amber-400/20 bg-amber-400/5">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{warning.module}</div>
                  <div className="text-xs text-muted-foreground">{warning.risk}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-amber-400">{Math.round(warning.ownership)}%</div>
                  <div className="text-[10px] text-muted-foreground">{warning.owner}</div>
                </div>
              </motion.div>
            ))}
            {riskWarnings.length === 0 && <p className="text-sm text-muted-foreground">No repository analyzed yet</p>}
          </div>
        </FloatingGlowPanel>

        <FloatingGlowPanel className="p-5" delay={0.25}>
          <SectionHeader title="Contributor Leaderboard" />
          <div className="space-y-2">
            {contributors.map((contributor, index) => (
              <motion.div key={contributor.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.04 }} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="w-6 text-center text-xs font-bold text-muted-foreground">#{index + 1}</div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {contributor.name.split(" ").map((part) => part[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{contributor.name}</div>
                  <div className="text-[10px] text-muted-foreground">{contributor.email}</div>
                </div>
                <div className="flex gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><GitCommitHorizontal className="w-3 h-3" />{contributor.commits.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{(contributor.lines_added / 1000).toFixed(0)}K+</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{contributor.files_owned} files</span>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", contributor.risk_level === "Low" ? "bg-emerald-400/10 text-emerald-400" : contributor.risk_level === "Medium" ? "bg-amber-400/10 text-amber-400" : "bg-red-400/10 text-red-400")}>
                  {contributor.risk_level}
                </span>
              </motion.div>
            ))}
            {contributors.length === 0 && <p className="text-sm text-muted-foreground">No repository analyzed yet</p>}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}

