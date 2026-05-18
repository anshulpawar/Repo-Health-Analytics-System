"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { HealthGauge } from "@/components/health-gauge";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { GitBranch, Star, GitFork, AlertCircle, Users, Code2, Calendar, Shield, TrendingUp, FileText, Search } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function RepositoryPage() {
  const { repositoryId, repositoryOverview, currentJob } = useRepositoryContext();

  const timelineQuery = useApiData(
    repositoryId ? () => api.getRepositoryTimeline(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const modulesQuery = useApiData(
    repositoryId ? () => api.getRepositoryModules(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );

  const hasRepository = !!repositoryId;
  const overview = repositoryOverview;
  const languages = overview?.languages ?? [];
  const modules = modulesQuery.data ?? [];
  const timeline = (timelineQuery.data ?? []).map((point) => ({
    date: point.date,
    complexity: point.complexity,
  }));

  return (
    <DashboardLayout>
      <PageContainer>
        {!hasRepository && <EmptyRepositoryState />}
        {hasRepository && !overview && <LoadingState label="Loading repository overview..." />}

        <FloatingGlowPanel className="p-6" delay={0}>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <GitBranch className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{overview?.full_name ?? "No repository analyzed yet"}</h1>
              <p className="text-sm text-muted-foreground mt-1">{overview?.description ?? "Submit a GitHub repository URL to begin analysis."}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{(overview?.stars ?? 0).toLocaleString()}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{overview?.forks ?? 0}</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{overview?.open_issues ?? 0} issues</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{overview?.contributors ?? 0} contributors</span>
                <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{(overview?.commits ?? 0).toLocaleString()} commits</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {overview?.last_analyzed ? `Analyzed ${new Date(overview.last_analyzed).toLocaleDateString()}` : "No repository analyzed yet"}
                </span>
              </div>
            </div>
            <HealthGauge score={Math.round(overview?.health_score ?? 0)} size={100} />
          </div>
        </FloatingGlowPanel>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Architecture", score: overview ? Math.round(100 - overview.coupling_score) : 0, icon: Shield },
            { label: "Maintainability", score: overview ? Math.round(100 - overview.complexity_score * 0.6) : 0, icon: TrendingUp },
            { label: "Test Health", score: Math.round(overview?.test_coverage ?? 0), icon: FileText },
            { label: "Complexity", score: overview ? Math.round(100 - overview.complexity_score) : 0, icon: Code2 },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-white/5 bg-card p-4 text-center"
            >
              <item.icon className="w-5 h-5 mx-auto text-cyan-400 mb-2" />
              <div className="text-2xl font-bold">{item.score}</div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Activity Timeline" description="Complexity growth over the last 30 days" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(value) => value.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="complexity" stroke="#a78bfa" strokeWidth={2} fill="url(#compGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-5" delay={0.15}>
            <SectionHeader title="Language Breakdown" />
            <div className="space-y-3 mt-2">
              {languages.map((lang) => (
                <div key={lang.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: lang.color }} />{lang.name}</span>
                    <span className="text-muted-foreground">{Math.round(lang.percentage)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${lang.percentage}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: lang.color }} />
                  </div>
                </div>
              ))}
              {languages.length === 0 && <p className="text-xs text-muted-foreground">No repository analyzed yet</p>}
            </div>
          </FloatingGlowPanel>
        </div>

        <FloatingGlowPanel className="p-5" delay={0.2}>
          <SectionHeader
            title="Module Overview"
            description="Browse repository modules and their health"
            action={
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground">
                <Search className="w-3 h-3" />
                Search modules...
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-white/5">
                  <th className="text-left py-3 px-2 font-medium">Module</th>
                  <th className="text-center py-3 px-2 font-medium">Files</th>
                  <th className="text-center py-3 px-2 font-medium">Complexity</th>
                  <th className="text-center py-3 px-2 font-medium">Coverage</th>
                  <th className="text-center py-3 px-2 font-medium">Health</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((module, index) => (
                  <motion.tr
                    key={module.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-2 font-mono text-xs text-cyan-400">{module.name}</td>
                    <td className="py-3 px-2 text-center text-muted-foreground">{module.files}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={module.complexity > 70 ? "text-red-400" : module.complexity > 50 ? "text-amber-400" : "text-emerald-400"}>
                        {Math.round(module.complexity)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={module.coverage < 50 ? "text-red-400" : module.coverage < 70 ? "text-amber-400" : "text-emerald-400"}>
                        {Math.round(module.coverage)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${Math.round(module.health)}%` }} />
                        </div>
                        <span className="text-xs">{Math.round(module.health)}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {modules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                      No repository analyzed yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}

