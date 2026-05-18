"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, CheckCircle2, Shield, ArrowRight, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const severityConfig = {
  critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
  error: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
};

export default function ArchitecturePage() {
  const { repositoryId, currentJob } = useRepositoryContext();
  const hasRepository = !!repositoryId;

  const summaryQuery = useApiData(
    repositoryId ? () => api.getArchitectureSummary(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const violationsQuery = useApiData(
    repositoryId ? () => api.getArchitectureViolations(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );

  const summary = summaryQuery.data;
  const violations = violationsQuery.data ?? [];

  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Architecture Drift" description="Monitor structural degradation and layer violations over time" />

        {!hasRepository && <EmptyRepositoryState />}
        {hasRepository && (summaryQuery.loading || violationsQuery.loading) && <LoadingState label="Loading architecture analytics..." />}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Integrity Score", value: `${Math.round(summary?.integrity_score ?? 0)}`, color: "text-amber-400", icon: Shield },
            { label: "Active Violations", value: `${summary?.active_violations ?? 0}`, color: "text-red-400", icon: AlertCircle },
            { label: "Resolved", value: `${summary?.resolved ?? 0}`, color: "text-emerald-400", icon: CheckCircle2 },
            { label: "Drift Rate", value: `${(summary?.drift_rate ?? 0).toFixed(2)}`, color: "text-amber-400", icon: TrendingDown },
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
            <SectionHeader title="Drift Timeline" description="Violations and structural integrity over time" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary?.drift_timeline ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fill: "#71717a", fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="violations" stroke="#f87171" strokeWidth={2} dot={false} name="Violations" />
                  <Line yAxisId="right" type="monotone" dataKey="integrity" stroke="#22d3ee" strokeWidth={2} dot={false} name="Integrity" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-5" delay={0.15}>
            <SectionHeader title="Architecture Policies" />
            <div className="space-y-2">
              {(summary?.policies ?? []).map((policy, index) => (
                <motion.div key={policy.name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.04 }} className={cn("p-3 rounded-xl border text-xs", policy.status === "violated" ? "border-red-400/20 bg-red-400/5" : policy.status === "warning" ? "border-amber-400/20 bg-amber-400/5" : "border-emerald-400/20 bg-emerald-400/5")}>
                  <div className="flex items-start gap-2">
                    {policy.status === "passing" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", policy.status === "violated" ? "text-red-400" : "text-amber-400")} />
                    )}
                    <div>
                      <div className="font-medium">{policy.name}</div>
                      {policy.count > 0 && <div className="text-muted-foreground mt-0.5">{policy.count} violation{policy.count > 1 ? "s" : ""}</div>}
                    </div>
                  </div>
                </motion.div>
              ))}
              {(summary?.policies ?? []).length === 0 && <p className="text-xs text-muted-foreground">No repository analyzed yet</p>}
            </div>
          </FloatingGlowPanel>
        </div>

        <FloatingGlowPanel className="p-5" delay={0.2}>
          <SectionHeader title="Architecture Violations" description="All detected structural violations" />
          <div className="space-y-3">
            {violations.map((violation, index) => {
              const config = severityConfig[violation.severity];
              const Icon = config.icon;
              return (
                <motion.div key={violation.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className={cn("rounded-xl border p-4", violation.resolved ? "border-white/5 opacity-60" : config.border, "bg-card")}>
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg flex-shrink-0", config.bg)}><Icon className={cn("w-4 h-4", config.color)} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", config.bg, config.color)}>{violation.severity}</span>
                        <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">{violation.type}</span>
                        {violation.resolved && <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-400/10">Resolved</span>}
                        <span className="text-[10px] text-muted-foreground ml-auto">{new Date(violation.detected_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{violation.description}</p>
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <span className="text-cyan-400">{violation.source.split("/").pop()}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-amber-400">{violation.target.split("/").pop()}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">{violation.layer}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {violations.length === 0 && <p className="text-sm text-muted-foreground">No repository analyzed yet</p>}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}

