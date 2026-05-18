"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hexagon, ArrowRight, Network, Flame, Brain, Users, Building2, Activity, ChevronRight, Star, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useRepositoryContext } from "@/context/repository-context";
import { useApiData } from "@/hooks/use-api-data";
import { api } from "@/lib/api";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const features = [
  { icon: Activity, title: "Health Timeline", desc: "Track repository health score across every commit and sprint" },
  { icon: Network, title: "Dependency Graphs", desc: "Interactive architecture visualization with cyclic detection" },
  { icon: Flame, title: "Hotspot Detection", desc: "Identify dangerous code areas by churn x complexity analysis" },
  { icon: Brain, title: "AI Placeholders", desc: "Reserved AI endpoints and schemas for future integrations" },
  { icon: Users, title: "Bus Factor Analysis", desc: "Ownership concentration and contributor risk assessment" },
  { icon: Building2, title: "Architecture Drift", desc: "Detect layer violations and structural degradation over time" },
];

function TerminalAnimation({ lines }: { lines: string[] }) {
  const [visible, setVisible] = useState<string[]>([]);
  useEffect(() => {
    setVisible([]);
    const interval = setInterval(() => {
      setVisible((prev) => {
        if (prev.length < lines.length) {
          return [...prev, lines[prev.length]];
        }
        clearInterval(interval);
        return prev;
      });
    }, 350);
    return () => clearInterval(interval);
  }, [lines]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5 font-mono text-xs">
      <div className="flex gap-1.5 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <div className="space-y-1.5 min-h-[260px]">
        {visible.map((line, i) => (
          <motion.div key={`${line}-${i}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={line.startsWith("OK") ? "text-emerald-400" : line.startsWith("->") ? "text-cyan-400" : "text-zinc-300"}>
            {line}
          </motion.div>
        ))}
        {visible.length < lines.length && <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse" />}
      </div>
    </div>
  );
}

function FloatingMetric({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }} className="glass rounded-2xl px-6 py-4 text-center pulse-glow">
      <div className="text-2xl font-bold gradient-text-cyan">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { startAnalysis, currentJob, repositoryOverview, error } = useRepositoryContext();
  const repositoriesQuery = useApiData(() => api.listRepositories(), []);

  const [repoInput, setRepoInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const repos = repositoriesQuery.data ?? [];
    return [
      { label: "Repos Analyzed", value: repos.length.toLocaleString() },
      { label: "Commits Processed", value: repositoryOverview ? repositoryOverview.commits.toLocaleString() : "0" },
      { label: "Insights Generated", value: "0" },
      { label: "Risks Prevented", value: repositoryOverview ? Math.round(100 - repositoryOverview.health_score).toString() : "0" },
    ];
  }, [repositoriesQuery.data, repositoryOverview]);

  const terminalLines = useMemo(() => {
    if (!currentJob) {
      return [
        "$ rhi analyze <github-url>",
        "-> Waiting for repository input",
        "-> No repository analyzed yet",
      ];
    }
    return [
      `$ rhi analyze ${repositoryOverview?.full_name ?? "repository"}`,
      `-> Job status: ${currentJob.status}`,
      `-> Progress: ${Math.round(currentJob.progress)}%`,
      currentJob.status === "completed" ? "OK Analysis completed" : "-> Analysis in progress",
      currentJob.error_message ? `-> Error: ${currentJob.error_message}` : "OK Backend pipeline connected",
      "-> AI integrations are intentionally disabled",
    ];
  }, [currentJob, repositoryOverview]);

  const onAnalyze = async () => {
    if (!repoInput.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await startAnalysis(repoInput.trim());
      router.push("/dashboard");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to start analysis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 inset-x-0 z-50 glass-strong border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Hexagon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Repo Health Intelligence</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#metrics" className="hover:text-foreground transition-colors">Metrics</a>
            <Link href="/dashboard" className="px-4 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-semibold hover:bg-cyan-400 transition-colors">
              Launch Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[128px]" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
                <Star className="w-3 h-3" />
                Engineering Intelligence Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
                Track how your codebase evolves -{" "}
                <span className="gradient-text">know when engineering health is winning or losing.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Repository intelligence for complexity, architecture, ownership risk, and code evolution.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <GithubIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/50"
                  />
                </div>
                <button
                  onClick={onAnalyze}
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  Analyze Repository
                </button>
              </div>
              {(submitError || error) && <p className="mt-3 text-xs text-red-400">{submitError || error}</p>}
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <TerminalAnimation lines={terminalLines} />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="metrics" className="relative py-16 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <FloatingMetric key={metric.label} label={metric.label} value={metric.value} delay={index * 0.1} />
          ))}
        </div>
      </section>

      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Everything you need to understand <span className="gradient-text">codebase health</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Commit-level analysis, architecture drift tracking, dependency intelligence, and contributor risk signals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} whileHover={{ y: -4 }} className="group rounded-2xl border border-white/5 bg-card p-6 hover:border-cyan-500/20 transition-all duration-300">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to understand your codebase?</h2>
            <p className="text-muted-foreground mb-8">Start analyzing your repository with the production backend pipeline.</p>
            <Link href="/dashboard">
              <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity">Open Dashboard</button>
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Hexagon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">Repo Health Intelligence</span>
          </div>
          <p className="text-xs text-muted-foreground">Copyright 2026 Repo Health Intelligence.</p>
        </div>
      </footer>
    </div>
  );
}

