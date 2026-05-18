"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { mockViolations } from "@/mock/data";
import { motion } from "framer-motion";
import { Building2, AlertTriangle, AlertCircle, CheckCircle2, Shield, ArrowRight, Brain, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const driftTimeline = Array.from({ length: 20 }, (_, i) => ({
  date: `May ${i + 1}`,
  violations: Math.max(0, Math.floor(3 + Math.sin(i * 0.4) * 2 + Math.random() * 2)),
  integrity: Math.max(50, Math.floor(75 - i * 0.5 + Math.sin(i * 0.3) * 5)),
}));

const policies = [
  { name: "No direct DB access from controllers", status: "violated", count: 2 },
  { name: "Services must not import other service internals", status: "violated", count: 1 },
  { name: "No circular dependencies between modules", status: "violated", count: 1 },
  { name: "Infrastructure code isolated from business logic", status: "warning", count: 1 },
  { name: "All external calls through adapter pattern", status: "passing", count: 0 },
  { name: "UI components must not import server code", status: "passing", count: 0 },
];

const sevConfig = {
  critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
  error: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
};

export default function ArchitecturePage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Architecture Drift" description="Monitor structural degradation and layer violations over time" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Integrity Score", value: "62", color: "text-amber-400", icon: Shield },
            { label: "Active Violations", value: "4", color: "text-red-400", icon: AlertCircle },
            { label: "Resolved", value: "2", color: "text-emerald-400", icon: CheckCircle2 },
            { label: "Drift Rate", value: "+2.5/wk", color: "text-amber-400", icon: TrendingDown },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/5 bg-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn("w-4 h-4", s.color)} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Timeline + Policies */}
        <div className="grid lg:grid-cols-3 gap-4">
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Drift Timeline" description="Violations and structural integrity over time" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={driftTimeline}>
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
              {policies.map((p, i) => (
                <motion.div key={p.name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.04 }}
                  className={cn("p-3 rounded-xl border text-xs", p.status === "violated" ? "border-red-400/20 bg-red-400/5" : p.status === "warning" ? "border-amber-400/20 bg-amber-400/5" : "border-emerald-400/20 bg-emerald-400/5")}>
                  <div className="flex items-start gap-2">
                    {p.status === "passing" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" /> : <AlertCircle className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", p.status === "violated" ? "text-red-400" : "text-amber-400")} />}
                    <div>
                      <div className="font-medium">{p.name}</div>
                      {p.count > 0 && <div className="text-muted-foreground mt-0.5">{p.count} violation{p.count > 1 ? "s" : ""}</div>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </FloatingGlowPanel>
        </div>

        {/* Violations */}
        <FloatingGlowPanel className="p-5" delay={0.2}>
          <SectionHeader title="Architecture Violations" description="All detected structural violations" />
          <div className="space-y-3">
            {mockViolations.map((v, i) => {
              const config = sevConfig[v.severity];
              const Icon = config.icon;
              return (
                <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn("rounded-xl border p-4", v.resolved ? "border-white/5 opacity-60" : config.border, "bg-card")}>
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg flex-shrink-0", config.bg)}><Icon className={cn("w-4 h-4", config.color)} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", config.bg, config.color)}>{v.severity}</span>
                        <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-white/5">{v.type}</span>
                        {v.resolved && <span className="text-[10px] text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-400/10">Resolved</span>}
                        <span className="text-[10px] text-muted-foreground ml-auto">{new Date(v.detectedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium mb-2">{v.description}</p>
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <span className="text-cyan-400">{v.source.split("/").pop()}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-amber-400">{v.target.split("/").pop()}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">{v.layer}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}
