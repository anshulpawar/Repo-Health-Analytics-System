"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { MetricCard } from "@/components/metric-card";
import { InsightCard } from "@/components/insight-card";
import { CommitCard } from "@/components/commit-card";
import { HealthGauge } from "@/components/health-gauge";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Activity, TrendingUp, GitBranch, Shield, Users, AlertTriangle, Zap } from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
} from "recharts";

function sparklineFromSeries(values: number[]): number[] {
  if (values.length >= 12) {
    return values.slice(-12);
  }
  if (values.length === 0) {
    return Array.from({ length: 12 }, () => 0);
  }
  const padded = [...values];
  while (padded.length < 12) padded.unshift(values[0]);
  return padded;
}

export default function DashboardPage() {
  const { repositoryId, currentJob } = useRepositoryContext();
  const hasRepository = !!repositoryId;

  const dashboardQuery = useApiData(
    repositoryId ? () => api.getDashboard(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const commitsQuery = useApiData(
    repositoryId ? () => api.getCommits(repositoryId, 1, 4) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );

  const dashboard = dashboardQuery.data;
  const hasData = !!dashboard?.has_data;
  const timeline = dashboard?.health_timeline ?? [];
  const healthSeries = timeline.map((point) => point.health_score);
  const complexitySeries = timeline.map((point) => point.complexity);
  const couplingSeries = timeline.map((point) => point.coupling);
  const coverageSeries = timeline.map((point) => point.coverage);

  const latestHealth = healthSeries.length ? healthSeries[healthSeries.length - 1] : 0;
  const prevHealth = healthSeries.length > 1 ? healthSeries[healthSeries.length - 2] : latestHealth;
  const healthChange = latestHealth - prevHealth;

  const latestComplexity = complexitySeries.length ? complexitySeries[complexitySeries.length - 1] : 0;
  const prevComplexity = complexitySeries.length > 1 ? complexitySeries[complexitySeries.length - 2] : latestComplexity;
  const complexityChange = latestComplexity - prevComplexity;

  const latestCoupling = couplingSeries.length ? couplingSeries[couplingSeries.length - 1] : 0;
  const prevCoupling = couplingSeries.length > 1 ? couplingSeries[couplingSeries.length - 2] : latestCoupling;
  const couplingChange = latestCoupling - prevCoupling;

  const latestCoverage = coverageSeries.length ? coverageSeries[coverageSeries.length - 1] : 0;
  const prevCoverage = coverageSeries.length > 1 ? coverageSeries[coverageSeries.length - 2] : latestCoverage;
  const coverageChange = latestCoverage - prevCoverage;

  const commits = commitsQuery.data?.items ?? [];

  return (
    <DashboardLayout>
      <PageContainer>
        {!hasRepository && <EmptyRepositoryState />}
        {hasRepository && !hasData && (
          <EmptyRepositoryState message={dashboard?.no_data_message ?? "No repository analyzed yet"} />
        )}
        {dashboardQuery.loading && <LoadingState label="Loading dashboard metrics..." />}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="Health Score"
            value={Math.round(dashboard?.health_score ?? 0)}
            change={Math.round(healthChange)}
            changeLabel="vs last snapshot"
            trend={healthChange > 0 ? "up" : healthChange < 0 ? "down" : "stable"}
            icon={<Activity className="w-4 h-4" />}
            sparkline={sparklineFromSeries(healthSeries)}
            delay={0}
          />
          <MetricCard
            title="Complexity"
            value={Math.round(dashboard?.complexity_score ?? 0)}
            change={Math.round(complexityChange)}
            changeLabel="delta"
            trend={complexityChange > 0 ? "up" : complexityChange < 0 ? "down" : "stable"}
            icon={<TrendingUp className="w-4 h-4" />}
            sparkline={sparklineFromSeries(complexitySeries)}
            delay={0.05}
          />
          <MetricCard
            title="Coupling"
            value={Math.round(dashboard?.coupling_score ?? 0)}
            change={Math.round(couplingChange)}
            changeLabel="delta"
            trend={couplingChange > 0 ? "up" : couplingChange < 0 ? "down" : "stable"}
            icon={<GitBranch className="w-4 h-4" />}
            sparkline={sparklineFromSeries(couplingSeries)}
            delay={0.1}
          />
          <MetricCard
            title="Coverage"
            value={Math.round(dashboard?.coverage_score ?? 0)}
            suffix="%"
            change={Math.round(coverageChange)}
            changeLabel="delta"
            trend={coverageChange > 0 ? "up" : coverageChange < 0 ? "down" : "stable"}
            icon={<Shield className="w-4 h-4" />}
            sparkline={sparklineFromSeries(coverageSeries)}
            delay={0.15}
          />
          <MetricCard
            title="Bus Factor"
            value={Math.round(dashboard?.bus_factor ?? 0)}
            change={0}
            changeLabel="snapshot"
            trend="stable"
            icon={<Users className="w-4 h-4" />}
            delay={0.2}
          />
          <MetricCard title="Risk Level" value={dashboard?.risk_level ?? "Low"} icon={<AlertTriangle className="w-4 h-4" />} delay={0.25} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <FloatingGlowPanel className="lg:col-span-2 p-5" delay={0.1}>
            <SectionHeader title="Repository Health Timeline" description="Health score across the last 30 days" />
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={(dashboard?.health_timeline ?? []).map((item) => ({
                    date: item.date,
                    healthScore: item.health_score,
                    complexity: item.complexity,
                    coverage: item.coverage,
                  }))}
                >
                  <defs>
                    <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                  <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} tickFormatter={(value) => value.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="healthScore" stroke="#22d3ee" strokeWidth={2} fill="url(#healthGrad)" name="Health" />
                  <Line type="monotone" dataKey="complexity" stroke="#a78bfa" strokeWidth={1.5} dot={false} name="Complexity" />
                  <Line type="monotone" dataKey="coverage" stroke="#34d399" strokeWidth={1.5} dot={false} name="Coverage" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          <div className="space-y-4">
            <FloatingGlowPanel className="p-5 flex flex-col items-center" delay={0.15}>
              <HealthGauge score={Math.round(dashboard?.health_score ?? 0)} size={140} />
              <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-cyan-400">{(dashboard?.total_commits ?? 0).toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">Total Commits</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5">
                  <div className="text-lg font-bold text-cyan-400">{dashboard?.total_contributors ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground">Contributors</div>
                </div>
              </div>
            </FloatingGlowPanel>

            <FloatingGlowPanel className="p-5" delay={0.2}>
              <h3 className="text-sm font-semibold mb-3">Languages</h3>
              <div className="space-y-2">
                {(dashboard?.language_breakdown ?? []).map((lang) => (
                  <div key={lang.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: lang.color }} />
                    <span className="text-xs flex-1">{lang.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lang.percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ background: lang.color }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(lang.percentage)}%</span>
                  </div>
                ))}
                {(dashboard?.language_breakdown ?? []).length === 0 && <p className="text-xs text-muted-foreground">No repository analyzed yet</p>}
              </div>
            </FloatingGlowPanel>
          </div>
        </div>

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
                  <Scatter data={dashboard?.churn_complexity ?? []} fill="#22d3ee" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-5" glowColor="purple" delay={0.25}>
            <SectionHeader title="AI Insight" description="Placeholder for future AI-generated analysis" action={<span className="flex items-center gap-1 text-xs text-cyan-400"><Zap className="w-3 h-3" /> Reserved</span>} />
            <InsightCard
              title={dashboard?.ai_insight_placeholder.title ?? "AI insights pending"}
              description={dashboard?.ai_insight_placeholder.description ?? "No repository analyzed yet"}
              category={dashboard?.ai_insight_placeholder.category ?? "recommendation"}
              severity={dashboard?.ai_insight_placeholder.severity ?? "info"}
              timestamp={dashboard?.ai_insight_placeholder.timestamp ?? new Date(0).toISOString()}
              recommendation={dashboard?.ai_insight_placeholder.recommendation ?? "Start repository analysis first."}
              impact={dashboard?.ai_insight_placeholder.impact ?? "No repository analyzed yet"}
            />
          </FloatingGlowPanel>
        </div>

        <FloatingGlowPanel className="p-5" delay={0.3}>
          <SectionHeader title="Recent Commit Impact" description="Latest commits and their health impact" />
          <div className="grid md:grid-cols-2 gap-3">
            {commits.map((commit, index) => (
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
                delay={index * 0.05}
              />
            ))}
            {commits.length === 0 && <p className="text-sm text-muted-foreground">No repository analyzed yet</p>}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}
