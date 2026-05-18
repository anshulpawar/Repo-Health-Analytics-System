"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { mockContributors } from "@/mock/data";
import { motion } from "framer-motion";
import { Users, AlertTriangle, Trophy, GitCommitHorizontal, FileText, Code2, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

const ownershipData = [
  { name: "Sarah Chen", value: 127, color: "#22d3ee" },
  { name: "Marcus Rivera", value: 89, color: "#a78bfa" },
  { name: "Aiko Tanaka", value: 64, color: "#34d399" },
  { name: "James Okafor", value: 52, color: "#fbbf24" },
  { name: "Elena Petrova", value: 41, color: "#f87171" },
  { name: "Dev Patel", value: 38, color: "#818cf8" },
];

const activityTimeline = Array.from({ length: 14 }, (_, i) => ({
  date: `May ${5 + i}`,
  ...Object.fromEntries(mockContributors.slice(0, 4).map(c => [c.name.split(" ")[0], Math.floor(Math.random() * 8)])),
}));

const riskWarnings = [
  { module: "Payment Service", owner: "Sarah Chen", ownership: 94, risk: "Critical — single point of failure" },
  { module: "Auth Session Manager", owner: "Elena Petrova", ownership: 88, risk: "High — limited knowledge sharing" },
  { module: "Event Bus Core", owner: "Marcus Rivera", ownership: 76, risk: "Medium — recent onboarding of backup" },
];

export default function ContributorsPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Contributor Insights" description="Bus factor analysis, ownership concentration, and contributor activity" />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Bus Factor", value: "3", color: "text-amber-400", icon: AlertTriangle },
            { label: "Contributors", value: "34", color: "text-cyan-400", icon: Users },
            { label: "Active (30d)", value: "12", color: "text-emerald-400", icon: Clock },
            { label: "Top Contributor", value: "Sarah C.", color: "text-cyan-400", icon: Trophy },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/5 bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><s.icon className={cn("w-4 h-4", s.color)} /><span className="text-xs text-muted-foreground">{s.label}</span></div>
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Commits chart */}
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Commits per Developer" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockContributors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis type="number" tick={{ fill: "#71717a", fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#71717a", fontSize: 10 }} width={100} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="commits" fill="#22d3ee" radius={[0, 6, 6, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          {/* Ownership pie */}
          <FloatingGlowPanel className="p-5" delay={0.15}>
            <SectionHeader title="Ownership Distribution" />
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ownershipData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} strokeWidth={0}>
                    {ownershipData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {ownershipData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground truncate">{d.name}</span>
                </div>
              ))}
            </div>
          </FloatingGlowPanel>
        </div>

        {/* Risk Warnings */}
        <FloatingGlowPanel className="p-5" glowColor="amber" delay={0.2}>
          <SectionHeader title="Ownership Risk Warnings" description="Modules with dangerously concentrated ownership" />
          <div className="space-y-3">
            {riskWarnings.map((w, i) => (
              <motion.div key={w.module} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-amber-400/20 bg-amber-400/5">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{w.module}</div>
                  <div className="text-xs text-muted-foreground">{w.risk}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-amber-400">{w.ownership}%</div>
                  <div className="text-[10px] text-muted-foreground">{w.owner}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </FloatingGlowPanel>

        {/* Leaderboard */}
        <FloatingGlowPanel className="p-5" delay={0.25}>
          <SectionHeader title="Contributor Leaderboard" />
          <div className="space-y-2">
            {mockContributors.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="w-6 text-center text-xs font-bold text-muted-foreground">#{i + 1}</div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {c.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.email}</div>
                </div>
                <div className="flex gap-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><GitCommitHorizontal className="w-3 h-3" />{c.commits.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{(c.linesAdded / 1000).toFixed(0)}K+</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{c.filesOwned} files</span>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium",
                  c.riskLevel === "Low" ? "bg-emerald-400/10 text-emerald-400" : c.riskLevel === "Medium" ? "bg-amber-400/10 text-amber-400" : "bg-red-400/10 text-red-400"
                )}>{c.riskLevel}</span>
              </motion.div>
            ))}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}
