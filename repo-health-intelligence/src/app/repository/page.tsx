"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { HealthGauge } from "@/components/health-gauge";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { mockRepository, mockHealthTimeline } from "@/mock/data";
import { motion } from "framer-motion";
import { GitBranch, Star, GitFork, AlertCircle, Users, Code2, Calendar, Shield, TrendingUp, FileText, Search } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const modules = [
  { name: "src/core/auth", files: 24, complexity: 72, coverage: 65, health: 58 },
  { name: "src/services/payment", files: 18, complexity: 89, coverage: 34, health: 41 },
  { name: "src/api/gateway", files: 31, complexity: 78, coverage: 72, health: 62 },
  { name: "src/core/events", files: 12, complexity: 71, coverage: 81, health: 75 },
  { name: "src/services/notification", files: 15, complexity: 65, coverage: 58, health: 67 },
  { name: "src/utils", files: 22, complexity: 32, coverage: 88, health: 91 },
  { name: "src/db", files: 19, complexity: 58, coverage: 45, health: 55 },
  { name: "src/modules/user", files: 27, complexity: 42, coverage: 76, health: 82 },
];

export default function RepositoryPage() {
  const r = mockRepository;
  return (
    <DashboardLayout>
      <PageContainer>
        {/* Repo Header */}
        <FloatingGlowPanel className="p-6" delay={0}>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center">
              <GitBranch className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{r.fullName}</h1>
              <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{r.stars.toLocaleString()}</span>
                <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{r.forks}</span>
                <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{r.openIssues} issues</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.contributors} contributors</span>
                <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{r.commits.toLocaleString()} commits</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Analyzed {new Date(r.lastAnalyzed).toLocaleDateString()}</span>
              </div>
            </div>
            <HealthGauge score={r.healthScore} size={100} />
          </div>
        </FloatingGlowPanel>

        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Architecture", score: 68, icon: Shield },
            { label: "Maintainability", score: 72, icon: TrendingUp },
            { label: "Test Health", score: r.testCoverage, icon: FileText },
            { label: "Complexity", score: 100 - r.complexityScore, icon: Code2 },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-white/5 bg-card p-4 text-center">
              <s.icon className="w-5 h-5 mx-auto text-cyan-400 mb-2" />
              <div className="text-2xl font-bold">{s.score}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 1 }} className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Activity + Languages */}
        <div className="grid lg:grid-cols-3 gap-4">
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Activity Timeline" description="Complexity growth over the last 30 days" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockHealthTimeline}>
                  <defs>
                    <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="complexity" stroke="#a78bfa" strokeWidth={2} fill="url(#compGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-5" delay={0.15}>
            <SectionHeader title="Language Breakdown" />
            <div className="space-y-3 mt-2">
              {r.languages.map((lang) => (
                <div key={lang.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: lang.color }} />{lang.name}</span>
                    <span className="text-muted-foreground">{lang.percentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${lang.percentage}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: lang.color }} />
                  </div>
                </div>
              ))}
            </div>
          </FloatingGlowPanel>
        </div>

        {/* Modules */}
        <FloatingGlowPanel className="p-5" delay={0.2}>
          <SectionHeader title="Module Overview" description="Browse repository modules and their health" action={
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground"><Search className="w-3 h-3" />Search modules...</div>
          } />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground border-b border-white/5">
                <th className="text-left py-3 px-2 font-medium">Module</th>
                <th className="text-center py-3 px-2 font-medium">Files</th>
                <th className="text-center py-3 px-2 font-medium">Complexity</th>
                <th className="text-center py-3 px-2 font-medium">Coverage</th>
                <th className="text-center py-3 px-2 font-medium">Health</th>
              </tr></thead>
              <tbody>
                {modules.map((m, i) => (
                  <motion.tr key={m.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-cyan-400">{m.name}</td>
                    <td className="py-3 px-2 text-center text-muted-foreground">{m.files}</td>
                    <td className="py-3 px-2 text-center"><span className={m.complexity > 70 ? "text-red-400" : m.complexity > 50 ? "text-amber-400" : "text-emerald-400"}>{m.complexity}</span></td>
                    <td className="py-3 px-2 text-center"><span className={m.coverage < 50 ? "text-red-400" : m.coverage < 70 ? "text-amber-400" : "text-emerald-400"}>{m.coverage}%</span></td>
                    <td className="py-3 px-2 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${m.health}%` }} /></div>
                        <span className="text-xs">{m.health}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}
