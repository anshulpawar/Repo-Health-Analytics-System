"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { mockHotspots, mockChurnComplexity } from "@/mock/data";
import { motion } from "framer-motion";
import { Flame, AlertTriangle, TrendingUp, TrendingDown, Minus, Search, ArrowUpDown } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

const severityColors = { critical: "text-red-400 bg-red-400/10", high: "text-amber-400 bg-amber-400/10", medium: "text-yellow-400 bg-yellow-400/10", low: "text-emerald-400 bg-emerald-400/10" };
const trendIcons = { improving: TrendingDown, stable: Minus, degrading: TrendingUp };

const dangerousModules = [
  { name: "Payment", score: 95, files: 3, trend: "degrading" as const },
  { name: "API Gateway", score: 88, files: 2, trend: "degrading" as const },
  { name: "Auth", score: 85, files: 2, trend: "stable" as const },
];

export default function HotspotsPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Hotspot Analysis" description="Identify dangerous code areas by combining complexity and churn metrics" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Critical Hotspots", value: "1", color: "text-red-400" },
            { label: "High Risk Files", value: "3", color: "text-amber-400" },
            { label: "Avg Hotspot Score", value: "69", color: "text-cyan-400" },
            { label: "Improving Files", value: "2", color: "text-emerald-400" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/5 bg-card p-4 text-center">
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Scatter */}
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Churn vs Complexity Matrix" description="Top-right corner = highest risk" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="churn" name="Churn" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: "Churn →", position: "bottom", fill: "#71717a", fontSize: 10 }} />
                  <YAxis dataKey="complexity" name="Complexity" tick={{ fill: "#71717a", fontSize: 10 }} label={{ value: "Complexity →", angle: -90, position: "left", fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Scatter data={mockChurnComplexity} fillOpacity={0.7}>
                    {mockChurnComplexity.map((entry, i) => (
                      <Cell key={i} fill={entry.complexity > 70 && entry.churn > 70 ? "#f87171" : entry.complexity > 50 || entry.churn > 50 ? "#fbbf24" : "#22d3ee"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          {/* Dangerous Modules */}
          <FloatingGlowPanel className="p-5" glowColor="red" delay={0.15}>
            <SectionHeader title="Most Dangerous Modules" />
            <div className="space-y-3">
              {dangerousModules.map((m, i) => {
                const TIcon = trendIcons[m.trend];
                return (
                  <motion.div key={m.name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{m.name}</span>
                      <span className={cn("text-xs flex items-center gap-1", m.trend === "degrading" ? "text-red-400" : "text-zinc-400")}>
                        <TIcon className="w-3 h-3" />{m.trend}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500" style={{ width: `${m.score}%` }} />
                      </div>
                      <span className="text-xs font-mono text-red-400">{m.score}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{m.files} critical files</div>
                  </motion.div>
                );
              })}
            </div>
          </FloatingGlowPanel>
        </div>

        {/* Table */}
        <FloatingGlowPanel className="p-5" delay={0.2}>
          <SectionHeader title="Hotspot File Rankings" description="All files ranked by hotspot score" action={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground"><Search className="w-3 h-3" />Search files...</div>
          } />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-white/5">
                {["File", "Module", "Complexity", "Churn", "Ownership Risk", "Maintainability", "Score", "Severity", "Trend"].map(h => (
                  <th key={h} className="text-left py-3 px-2 font-medium cursor-pointer hover:text-foreground transition-colors">
                    <span className="flex items-center gap-1">{h}<ArrowUpDown className="w-3 h-3 opacity-50" /></span>
                  </th>
                ))}
              </tr></thead>
              <tbody>
                {mockHotspots.map((h, i) => {
                  const TrendIcon = trendIcons[h.trend];
                  return (
                    <motion.tr key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-2 font-mono text-xs text-cyan-400 max-w-[200px] truncate">{h.filePath}</td>
                      <td className="py-3 px-2 text-xs">{h.module}</td>
                      <td className="py-3 px-2 text-xs"><span className={h.complexity > 70 ? "text-red-400" : "text-foreground"}>{h.complexity}</span></td>
                      <td className="py-3 px-2 text-xs"><span className={h.churn > 70 ? "text-red-400" : "text-foreground"}>{h.churn}</span></td>
                      <td className="py-3 px-2 text-xs"><span className={h.ownershipRisk > 70 ? "text-amber-400" : "text-foreground"}>{h.ownershipRisk}</span></td>
                      <td className="py-3 px-2 text-xs">{h.maintainability}</td>
                      <td className="py-3 px-2 text-xs font-bold"><span className={h.hotspotScore > 80 ? "text-red-400" : h.hotspotScore > 60 ? "text-amber-400" : "text-foreground"}>{h.hotspotScore}</span></td>
                      <td className="py-3 px-2"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", severityColors[h.severity])}>{h.severity}</span></td>
                      <td className="py-3 px-2 text-xs"><span className={cn("flex items-center gap-1", h.trend === "degrading" ? "text-red-400" : h.trend === "improving" ? "text-emerald-400" : "text-zinc-400")}><TrendIcon className="w-3 h-3" />{h.trend}</span></td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}
