"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { InsightCard } from "@/components/insight-card";
import { EmptyRepositoryState, LoadingState } from "@/components/data-state";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Brain, Zap, AlertTriangle, AlertCircle, Lightbulb, RefreshCw, Sparkles, TrendingDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

type FilterType = "all" | "critical" | "architecture" | "risk" | "recommendation" | "complexity" | "health";

export default function InsightsPage() {
  const { repositoryId, currentJob } = useRepositoryContext();
  const hasRepository = !!repositoryId;
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [regenerating, setRegenerating] = useState(false);

  const insightsQuery = useApiData(
    repositoryId ? () => api.getInsights(repositoryId) : null,
    [repositoryId, currentJob?.status, currentJob?.progress]
  );

  const allInsights = insightsQuery.data?.insights ?? [];
  const predictions = insightsQuery.data?.predictions ?? [];
  const recommendations = insightsQuery.data?.recommendations ?? [];

  // Apply filter
  const insights = allInsights.filter((insight) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "critical") return insight.severity === "critical";
    return insight.category === activeFilter;
  });

  const handleRegenerate = useCallback(async () => {
    if (!repositoryId || regenerating) return;
    setRegenerating(true);
    try {
      await api.regenerateInsights(repositoryId);
      insightsQuery.reload();
    } catch (err) {
      console.error("Failed to regenerate insights:", err);
    } finally {
      setRegenerating(false);
    }
  }, [repositoryId, regenerating, insightsQuery]);

  const filterButtons: Array<{ key: FilterType; label: string }> = [
    { key: "all", label: "All" },
    { key: "critical", label: "Critical" },
    { key: "architecture", label: "Architecture" },
    { key: "risk", label: "Risk" },
    { key: "recommendation", label: "Suggestions" },
    { key: "complexity", label: "Complexity" },
    { key: "health", label: "Health" },
  ];

  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex items-center justify-between">
          <SectionHeader title="AI Insights" description="AI-generated engineering intelligence powered by Groq" />
          <div className="flex items-center gap-2">
            {hasRepository && allInsights.length > 0 && !allInsights[0]?.placeholder && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
                  regenerating
                    ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                    : "bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
                )}
              >
                <RefreshCw className={cn("w-3 h-3", regenerating && "animate-spin")} />
                {regenerating ? "Regenerating..." : "Regenerate"}
              </button>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </div>
          </div>
        </div>

        {!hasRepository && <EmptyRepositoryState />}
        {hasRepository && insightsQuery.loading && <LoadingState label="Generating AI insights..." />}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Insights", value: allInsights.length, icon: Brain, color: "text-cyan-400" },
            { label: "Critical", value: allInsights.filter((insight) => insight.severity === "critical").length, icon: AlertCircle, color: "text-red-400" },
            { label: "Warnings", value: allInsights.filter((insight) => insight.severity === "warning").length, icon: AlertTriangle, color: "text-amber-400" },
            { label: "Recommendations", value: allInsights.filter((insight) => insight.category === "recommendation").length, icon: Lightbulb, color: "text-emerald-400" },
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
            <div className="flex items-center gap-2 flex-wrap">
              {filterButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setActiveFilter(btn.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    activeFilter === btn.key
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "bg-white/5 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {btn.label}
                  {btn.key !== "all" && (
                    <span className="ml-1.5 text-[10px] opacity-60">
                      {btn.key === "critical"
                        ? allInsights.filter((i) => i.severity === "critical").length
                        : allInsights.filter((i) => i.category === btn.key).length}
                    </span>
                  )}
                </button>
              ))}
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
            {hasRepository && !insightsQuery.loading && insights.length === 0 && allInsights.length > 0 && (
              <p className="text-sm text-muted-foreground">No insights match the selected filter.</p>
            )}
            {hasRepository && !insightsQuery.loading && allInsights.length === 0 && (
              <p className="text-sm text-muted-foreground">No repository analyzed yet</p>
            )}
          </div>

          <div className="space-y-4">
            <FloatingGlowPanel className="p-5" glowColor="amber" delay={0.1}>
              <SectionHeader title="Risk Predictions" />
              {predictions.length > 0 ? (
                <div className="space-y-2">
                  {predictions.map((prediction, index) => (
                    <motion.div
                      key={`pred-${index}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + index * 0.04 }}
                      className="p-3 rounded-xl border border-white/5 bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium flex items-center gap-1.5">
                          <Shield className="w-3 h-3 text-amber-400" />
                          {String(prediction.title ?? "Risk")}
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          String(prediction.risk) === "High"
                            ? "bg-red-400/10 text-red-400"
                            : "bg-amber-400/10 text-amber-400"
                        )}>
                          {String(prediction.risk ?? "Medium")}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {String(prediction.description ?? "")}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {hasRepository ? "No critical risk predictions at this time." : "Analyze a repository to see AI risk predictions."}
                </p>
              )}
            </FloatingGlowPanel>

            <FloatingGlowPanel className="p-5" glowColor="blue" delay={0.2}>
              <SectionHeader title="Action Items" />
              <div className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <motion.div key={`rec-${index}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + index * 0.04 }} className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{String(recommendation.title ?? "Action Item")}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium",
                        String(recommendation.priority) === "Critical"
                          ? "bg-red-400/10 text-red-400"
                          : String(recommendation.priority) === "High"
                            ? "bg-amber-400/10 text-amber-400"
                            : "bg-blue-400/10 text-blue-400"
                      )}>
                        {String(recommendation.priority ?? "Medium")}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>Effort: {String(recommendation.effort ?? "N/A")}</span>
                      <span className="truncate">Impact: {String(recommendation.impact ?? "N/A")}</span>
                    </div>
                  </motion.div>
                ))}
                {recommendations.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {hasRepository ? "No action items generated yet." : "Analyze a repository to see action items."}
                  </p>
                )}
              </div>
            </FloatingGlowPanel>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
