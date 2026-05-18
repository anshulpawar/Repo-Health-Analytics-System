"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { InsightCard } from "@/components/insight-card";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Brain, Zap, AlertTriangle, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const { repositoryId, currentJob } = useRepositoryContext();
  const hasRepository = !!repositoryId;
  const insightsQuery = useApiData(
    repositoryId ? () => api.getInsights(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );
  const insights = insightsQuery.data?.insights ?? [];

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex items-center justify-between">
          <SectionHeader title="AI Insights" description="Reserved API contract for future AI-generated engineering intelligence" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
            <Zap className="w-3 h-3" />
            Placeholder
          </div>
        </div>

        {!hasRepository && <EmptyRepositoryState />}
        {hasRepository && insightsQuery.loading && <LoadingState label="Loading insights placeholder..." />}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Insights", value: insights.length, icon: Brain, color: "text-cyan-400" },
            { label: "Critical", value: insights.filter((insight) => insight.severity === "critical").length, icon: AlertCircle, color: "text-red-400" },
            { label: "Warnings", value: insights.filter((insight) => insight.severity === "warning").length, icon: AlertTriangle, color: "text-amber-400" },
            { label: "Recommendations", value: insights.filter((insight) => insight.category === "recommendation").length, icon: Lightbulb, color: "text-emerald-400" },
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
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium">All</button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground text-xs hover:text-foreground transition-colors">Critical</button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground text-xs hover:text-foreground transition-colors">Architecture</button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground text-xs hover:text-foreground transition-colors">Risk</button>
            </div>
            {insights.map((insight, index) => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                description={insight.description}
                category={insight.category}
                severity={insight.severity}
                timestamp={insight.timestamp}
                recommendation={insight.recommendation}
                impact={insight.impact}
                delay={index * 0.06}
              />
            ))}
            {insights.length === 0 && <p className="text-sm text-muted-foreground">No repository analyzed yet</p>}
          </div>

          <div className="space-y-4">
            <FloatingGlowPanel className="p-5" glowColor="amber" delay={0.1}>
              <SectionHeader title="Risk Predictions" />
              <p className="text-xs text-muted-foreground">AI predictions are not enabled yet. This panel is reserved for future LLM outputs.</p>
            </FloatingGlowPanel>

            <FloatingGlowPanel className="p-5" glowColor="blue" delay={0.2}>
              <SectionHeader title="Action Items" />
              <div className="space-y-2">
                {(insightsQuery.data?.recommendations ?? []).map((recommendation, index) => (
                  <motion.div key={`rec-${index}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + index * 0.04 }} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{String(recommendation.title ?? "AI placeholder")}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-400/10 text-amber-400">{String(recommendation.priority ?? "High")}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>Effort: {String(recommendation.effort ?? "N/A")}</span>
                      <span>Impact: {String(recommendation.impact ?? "Future AI output")}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </FloatingGlowPanel>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

