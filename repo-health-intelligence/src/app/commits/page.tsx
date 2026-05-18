"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CommitCard } from "@/components/commit-card";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { mockCommits } from "@/mock/data";
import { motion } from "framer-motion";
import { Search, Filter, GitCommitHorizontal, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const activityData = Array.from({ length: 14 }, (_, i) => ({
  date: `May ${5 + i}`,
  commits: Math.floor(Math.random() * 20) + 2,
  impact: Math.floor(Math.random() * 30) - 10,
}));

export default function CommitsPage() {
  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Commit Explorer" description="Analyze commit-by-commit health changes across your repository" />

        {/* Search/Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search commits by message, author, or hash..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/50" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-4 h-4" />Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Calendar className="w-4 h-4" />Date Range
          </button>
        </div>

        {/* Activity chart */}
        <FloatingGlowPanel className="p-5" delay={0.1}>
          <SectionHeader title="Commit Activity" description="Daily commit volume and health impact" />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e22" />
                <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 10 }} />
                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#111113", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="commits" fill="#22d3ee" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FloatingGlowPanel>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Commits", value: "8,742", sub: "All time" },
            { label: "Avg. Files/Commit", value: "6.3", sub: "Last 30 days" },
            { label: "Positive Impact", value: "62%", sub: "Health improving" },
            { label: "Avg. Complexity Δ", value: "+1.8", sub: "Per commit" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-white/5 bg-card p-4 text-center">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-1">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Commit Timeline */}
        <FloatingGlowPanel className="p-5" delay={0.2}>
          <SectionHeader title="Commit Timeline" description="Latest commits with health impact analysis" action={
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><GitCommitHorizontal className="w-3 h-3" />{mockCommits.length} commits</div>
          } />
          <div className="space-y-3">
            {mockCommits.map((c, i) => (
              <CommitCard key={c.id} hash={c.hash} message={c.message} authorName={c.author.name} date={c.date} filesChanged={c.filesChanged} additions={c.additions} deletions={c.deletions} complexityDelta={c.complexityDelta} couplingDelta={c.couplingDelta} maintainabilityDelta={c.maintainabilityDelta} architectureImpact={c.architectureImpact} delay={i * 0.04} />
            ))}
          </div>
        </FloatingGlowPanel>
      </PageContainer>
    </DashboardLayout>
  );
}
