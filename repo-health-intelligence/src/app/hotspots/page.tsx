"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Search, ArrowUpDown } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

const severityColors = {
  critical: "text-red-400 bg-red-400/10",
  high: "text-amber-400 bg-amber-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  low: "text-emerald-400 bg-emerald-400/10",
};
const trendIcons = { improving: TrendingDown, stable: Minus, degrading: TrendingUp };

export default function HotspotsPage() {
  const { repositoryId, currentJob } = useRepositoryContext();
  const hasRepository = !!repositoryId;

  const summaryQuery = useApiData(
    repositoryId ? () => api.getHotspotSummary(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const hotspotsQuery = useApiData(
    repositoryId ? () => api.getHotspots(repositoryId, 200) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );

  const summary = summaryQuery.data;
  const hotspots = hotspotsQuery.data ?? [];
  const dangerousModules = summary?.dangerous_modules ?? [];
  const scatter = summary?.churn_complexity ?? [];

  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Hotspot Analysis" description="Identify dangerous code areas by combining complexity and churn metrics" />

        {!hasRepository && <EmptyRepositoryState />}
        {hasRepository && (summaryQuery.loading || hotspotsQuery.loading) && <LoadingState label="Loading hotspot analytics..." />}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Critical Hotspots", value: `${summary?.critical_hotspots ?? 0}`, color: "text-red-400" },
            { label: "High Risk Files", value: `${summary?.high_risk_files ?? 0}`, color: "text-amber-400" },
            { label: "Avg Hotspot Score", value: `${Math.round(summary?.avg_hotspot_score ?? 0)}`, color: "text-cyan-400" },
            { label: "Improving Files", value: `${summary?.improving_files ?? 0}`, color: "text-emerald-400" },
          ].map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="rounded-xl border border-white/5 bg-card p-4 text-center">
              <div className={cn("text-2xl font-bold", item.color)}>{item.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Churn vs Complexity Matrix" description="Top-right corner = highest risk" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="churn" name="Churn" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: "Churn ->", position: "bottom", fill: "#71717a", fontSize: 10 }} />
                  <YAxis dataKey="complexity" name="Complexity" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: "Complexity ->", angle: -90, position: "left", fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Scatter data={scatter} fillOpacity={0.7}>
                    {scatter.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={entry.complexity > 70 && entry.churn > 70 ? "#f87171" : entry.complexity > 50 || entry.churn > 50 ? "#fbbf24" : "#22d3ee"}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-5" glowColor="red" delay={0.15}>
            <SectionHeader title="Most Dangerous Modules" />
            <div className="space-y-3">
              {dangerousModules.map((module, index) => {
                const trend = module.trend as "degrading" | "stable" | "improving";
                const TrendIcon = trendIcons[trend] ?? Minus;
                return (
                  <motion.div key={module.name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{module.name}</span>
                      <span className={cn("text-xs flex items-center gap-1", trend === "degrading" ? "text-red-400" : "text-zinc-400")}>
                        <TrendIcon className="w-3 h-3" />
                        {trend}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500" style={{ width: `${module.score}%` }} />
                      </div>
                      <span className="text-xs font-mono text-red-400">{Math.round(module.score)}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{module.files} critical files</div>
                  </motion.div>
                );
              })}
              {dangerousModules.length === 0 && <p className="text-xs text-muted-foreground">No repository analyzed yet</p>}
            </div>
          </FloatingGlowPanel>
        </div>

        <FloatingGlowPanel className="p-5" delay={0.2}>
          <SectionHeader
            title="Hotspot File Rankings"
            description="All files ranked by hotspot score"
            action={
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground">
                <Search className="w-3 h-3" />
                Search files...
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-white/5">
                  {["File", "Module", "Complexity", "Churn", "Ownership Risk", "Maintainability", "Score", "Severity", "Trend"].map((header) => (
                    <th key={header} className="text-left py-3 px-2 font-medium cursor-pointer hover:text-foreground transition-colors">
                      <span className="flex items-center gap-1">
                        {header}
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hotspots.map((item, index) => {
                  const TrendIcon = trendIcons[item.trend] ?? Minus;
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-2 font-mono text-xs text-cyan-400 max-w-[200px] truncate">{item.file_path}</td>
                      <td className="py-3 px-2 text-xs">{item.module}</td>
                      <td className="py-3 px-2 text-xs"><span className={item.complexity > 70 ? "text-red-400" : "text-foreground"}>{Math.round(item.complexity)}</span></td>
                      <td className="py-3 px-2 text-xs"><span className={item.churn > 70 ? "text-red-400" : "text-foreground"}>{Math.round(item.churn)}</span></td>
                      <td className="py-3 px-2 text-xs"><span className={item.ownership_risk > 70 ? "text-amber-400" : "text-foreground"}>{Math.round(item.ownership_risk)}</span></td>
                      <td className="py-3 px-2 text-xs">{Math.round(item.maintainability)}</td>
                      <td className="py-3 px-2 text-xs font-bold">
                        <span className={item.hotspot_score > 80 ? "text-red-400" : item.hotspot_score > 60 ? "text-amber-400" : "text-foreground"}>{Math.round(item.hotspot_score)}</span>
                      </td>
                      <td className="py-3 px-2"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", severityColors[item.severity])}>{item.severity}</span></td>
                      <td className="py-3 px-2 text-xs">
                        <span className={cn("flex items-center gap-1", item.trend === "degrading" ? "text-red-400" : item.trend === "improving" ? "text-emerald-400" : "text-zinc-400")}>
                          <TrendIcon className="w-3 h-3" />
                          {item.trend}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
                {hotspots.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-sm text-muted-foreground">
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

