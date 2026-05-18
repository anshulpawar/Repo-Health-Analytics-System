"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MetricCard } from "@/components/metric-card";
import { InsightCard } from "@/components/insight-card";
import { CommitCard } from "@/components/commit-card";
import { HealthGauge } from "@/components/health-gauge";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { mockRepository, mockHealthTimeline, mockCommits, mockInsights, mockChurnComplexity } from "@/mock/data";
import { motion } from "framer-motion";
import {
  Activity, TrendingUp, GitBranch, Shield, Users, AlertTriangle,
  Zap, BarChart3,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

const sparkData = (base: number) => Array.from({ length: 12 }, () => base + (Math.random() - 0.5) * 20);

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        {/* Top Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard title="Health Score" value={mockRepository.healthScore} change={-8} changeLabel="vs last week" trend="down" icon={<Activity className="w-4 h-4" />} sparkline={sparkData(73)} delay={0} />
          <MetricCard title="Complexity" value={mockRepository.complexityScore} change={5} changeLabel="increasing" trend="up" icon={<TrendingUp className="w-4 h-4" />} sparkline={sparkData(62)} delay={0.05} />
          <MetricCard title="Coupling" value={mockRepository.couplingScore} change={12} changeLabel="vs last week" trend="up" icon={<GitBranch className="w-4 h-4" />} sparkline={sparkData(58)} delay={0.1} />
          <MetricCard title="Coverage" value={mockRepository.testCoverage} suffix="%" change={-3} changeLabel="declining" trend="down" icon={<Shield className="w-4 h-4" />} sparkline={sparkData(71)} delay={0.15} />
          <MetricCard title="Bus Factor" value={mockRepository.busFactor} change={0} changeLabel="stable" trend="stable" icon={<Users className="w-4 h-4" />} delay={0.2} />
          <MetricCard title="Risk Level" value={mockRepository.riskLevel} icon={<AlertTriangle className="w-4 h-4" />} delay={0.25} />
        </div>

        {/* Main charts row */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Health Timeline */}
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Repository Health Timeline" description="Health score across the last 30 days" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockHealthTimeline}>
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[40, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="healthScore" stroke="#22d3ee" strokeWidth={2} fill="url(#healthGrad)" name="Health" />
                  <Line type="monotone" dataKey="complexity" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Complexity" />
                  <Line type="monotone" dataKey="coverage" stroke="#34d399" strokeWidth={1.5} dot={false} name="Coverage" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          {/* Health Gauge + Language */}
          <div className="space-y-4">
            <FloatingGlowPanel className="p-5 flex flex-col items-center" delay={0.15}>
              <HealthGauge score={mockRepository.healthScore} size={140} />
              <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-cyan-400">{mockRepository.commits.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">Total Commits</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-cyan-400">{mockRepository.contributors}</div>
                  <div className="text-[10px] text-muted-foreground">Contributors</div>
                </div>
              </div>
            </FloatingGlowPanel>
            <FloatingGlowPanel className="p-5" delay={0.2}>
              <h3 className="text-sm font-semibold mb-3">Languages</h3>
              <div className="space-y-2">
                {mockRepository.languages.map((lang) => (
                  <div key={lang.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: lang.color }} />
                    <span className="text-xs flex-1">{lang.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${lang.percentage}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full rounded-full" style={{ background: lang.color }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{lang.percentage}%</span>
                  </div>
                ))}
              </div>
            </FloatingGlowPanel>
          </div>
        </div>

        {/* Scatter + AI Insight */}
        <div className="grid lg:grid-cols-2 gap-4">
          <FloatingGlowPanel className="p-5" delay={0.2}>
            <SectionHeader title="Complexity vs Churn" description="Files plotted by change frequency and complexity" />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="churn" name="Churn" tick={{ fill: "#71717a", fontSize: 10 }} />
                  <YAxis dataKey="complexity" name="Complexity" tick={{ fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} cursor={{ strokeDasharray: "3 3", stroke: "#27272a" }} />
                  <Scatter data={mockChurnComplexity} fill="#22d3ee" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-5" glowColor="purple" delay={0.25}>
            <SectionHeader title="AI Insight" description="Latest AI-generated analysis" action={<span className="flex items-center gap-1 text-xs text-cyan-400"><Zap className="w-3 h-3" /> Powered by AI</span>} />
            <InsightCard {...mockInsights[0]} />
          </FloatingGlowPanel>
        </div>

        {/* Recent Commits */}
        <FloatingGlowPanel className="p-5" delay={0.3}>
          <SectionHeader title="Recent Commit Impact" description="Latest commits and their health impact" />
          <div className="grid md:grid-cols-2 gap-3">
            {mockCommits.slice(0, 4).map((c, i) => (
              <CommitCard key={c.id} hash={c.hash} message={c.message} authorName={c.author.name} date={c.date} filesChanged={c.filesChanged} additions={c.additions} deletions={c.deletions} complexityDelta={c.complexityDelta} couplingDelta={c.couplingDelta} maintainabilityDelta={c.maintainabilityDelta} architectureImpact={c.architectureImpact} delay={i * 0.05} />
            ))}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}
