"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { InsightCard } from "@/components/insight-card";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { mockInsights } from "@/mock/data";
import { motion } from "framer-motion";
import { Brain, Zap, Filter, AlertTriangle, AlertCircle, Info, Lightbulb, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const predictions = [
  { title: "Health score projected to drop below 70 by June 1", confidence: 82, severity: "warning" as const },
  { title: "Payment module likely to cause production incident within 2 sprints", confidence: 74, severity: "critical" as const },
  { title: "Test coverage will reach critical threshold (60%) by May 28", confidence: 68, severity: "warning" as const },
];

const recommendations = [
  { title: "Extract shared validation library", effort: "2-3 days", impact: "15% complexity reduction", priority: "High" },
  { title: "Add architectural linting to CI", effort: "1 day", impact: "Prevent future violations", priority: "High" },
  { title: "Split payment processor into sub-modules", effort: "1 week", impact: "Reduce hotspot score by 40%", priority: "Critical" },
  { title: "Schedule testing sprint for core modules", effort: "1 sprint", impact: "12% coverage increase", priority: "Medium" },
];

export default function InsightsPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <div className="flex items-center justify-between">
          <SectionHeader title="AI Insights" description="AI-generated engineering intelligence and recommendations" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium">
            <Zap className="w-3 h-3" />Powered by AI
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Insights", value: mockInsights.length, icon: Brain, color: "text-cyan-400" },
            { label: "Critical", value: mockInsights.filter(i => i.severity === "critical").length, icon: AlertCircle, color: "text-red-400" },
            { label: "Warnings", value: mockInsights.filter(i => i.severity === "warning").length, icon: AlertTriangle, color: "text-amber-400" },
            { label: "Recommendations", value: mockInsights.filter(i => i.category === "recommendation").length, icon: Lightbulb, color: "text-emerald-400" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/5 bg-card p-4">
              <div className="flex items-center gap-2 mb-2"><s.icon className={cn("w-4 h-4", s.color)} /><span className="text-xs text-muted-foreground">{s.label}</span></div>
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Insights Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium">All</button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground text-xs hover:text-foreground transition-colors">Critical</button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground text-xs hover:text-foreground transition-colors">Architecture</button>
              <button className="px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground text-xs hover:text-foreground transition-colors">Risk</button>
            </div>
            {mockInsights.map((insight, i) => (
              <InsightCard key={insight.id} title={insight.title} description={insight.description} category={insight.category}
                severity={insight.severity} timestamp={insight.timestamp} recommendation={insight.recommendation} impact={insight.impact} delay={i * 0.06} />
            ))}
          </div>

          {/* Side panels */}
          <div className="space-y-4">
            {/* Risk Predictions */}
            <FloatingGlowPanel className="p-5" glowColor="amber" delay={0.1}>
              <SectionHeader title="Risk Predictions" />
              <div className="space-y-3">
                {predictions.map((p, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                    className={cn("p-3 rounded-xl border", p.severity === "critical" ? "border-red-400/20 bg-red-400/5" : "border-amber-400/20 bg-amber-400/5")}>
                    <div className="flex items-start gap-2">
                      <TrendingUp className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", p.severity === "critical" ? "text-red-400" : "text-amber-400")} />
                      <div>
                        <p className="text-xs font-medium">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Confidence: {p.confidence}%</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </FloatingGlowPanel>

            {/* Recommendations */}
            <FloatingGlowPanel className="p-5" glowColor="blue" delay={0.2}>
              <SectionHeader title="Action Items" />
              <div className="space-y-2">
                {recommendations.map((r, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.04 }}
                    className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{r.title}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium",
                        r.priority === "Critical" ? "bg-red-400/10 text-red-400" : r.priority === "High" ? "bg-amber-400/10 text-amber-400" : "bg-blue-400/10 text-blue-400"
                      )}>{r.priority}</span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>Effort: {r.effort}</span>
                      <span>Impact: {r.impact}</span>
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
