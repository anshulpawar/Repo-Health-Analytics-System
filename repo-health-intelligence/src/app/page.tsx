"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Hexagon, ArrowRight, GitBranch, Network, Flame, Brain,
  Users, Building2, Activity, Shield, Zap, BarChart3,
  ChevronRight, Terminal, Star,
} from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);
import { useState, useEffect } from "react";

const features = [
  { icon: Activity, title: "Health Timeline", desc: "Track repository health score across every commit and sprint" },
  { icon: Network, title: "Dependency Graphs", desc: "Interactive architecture visualization with cyclic detection" },
  { icon: Flame, title: "Hotspot Detection", desc: "Identify dangerous code areas by churn × complexity analysis" },
  { icon: Brain, title: "AI Explanations", desc: "AI-generated insights explaining why your codebase is changing" },
  { icon: Users, title: "Bus Factor Analysis", desc: "Ownership concentration and contributor risk assessment" },
  { icon: Building2, title: "Architecture Drift", desc: "Detect layer violations and structural degradation over time" },
];

const metrics = [
  { label: "Repos Analyzed", value: "12,847" },
  { label: "Commits Processed", value: "4.2M" },
  { label: "Insights Generated", value: "89,234" },
  { label: "Risks Prevented", value: "2,156" },
];

const terminalLines = [
  "$ rhi analyze acme-corp/nexus-platform",
  "→ Scanning 8,742 commits...",
  "→ Analyzing 342 files across 12 modules...",
  "→ Computing complexity metrics...",
  "→ Detecting architectural violations...",
  "→ Generating AI insights...",
  "✓ Health Score: 73/100",
  "✓ 4 architecture violations detected",
  "✓ 3 critical hotspots identified",
  "✓ Report ready — opening dashboard...",
];

function TerminalAnimation() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      setLines((prev) => {
        if (prev.length < terminalLines.length) {
          return [...prev, terminalLines[prev.length]];
        }
        clearInterval(interval);
        return prev;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-5 font-mono text-xs">
      <div className="flex gap-1.5 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
      </div>
      <div className="space-y-1.5 min-h-[260px]">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={line.startsWith("✓") ? "text-emerald-400" : line.startsWith("→") ? "text-cyan-400" : "text-zinc-300"}
          >
            {line}
          </motion.div>
        ))}
        {lines.length < terminalLines.length && (
          <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}

function FloatingMetric({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="glass rounded-2xl px-6 py-4 text-center pulse-glow"
    >
      <div className="text-2xl font-bold gradient-text-cyan">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
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

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 grid-bg opacity-50" />
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-[128px]" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6">
                <Star className="w-3 h-3" />
                AI-Powered Engineering Intelligence
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight mb-6">
                Track how your codebase evolves —{" "}
                <span className="gradient-text">know when engineering health is winning or losing.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
                AI-powered repository intelligence for complexity, architecture, ownership risk, and code evolution.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <GithubIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="github.com/org/repo"
                    className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground/50"
                  />
                </div>
                <Link href="/dashboard">
                  <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
                    Analyze Repository
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <TerminalAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section id="metrics" className="relative py-16 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <FloatingMetric key={m.label} label={m.label} value={m.value} delay={i * 0.1} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Everything you need to understand{" "}
              <span className="gradient-text">codebase health</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From commit-level analysis to AI-generated architectural recommendations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-white/5 bg-card p-6 hover:border-cyan-500/20 transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 w-fit mb-4 group-hover:bg-cyan-500/20 transition-colors">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 mb-6">
              <Zap className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
              Ready to understand your codebase?
            </h2>
            <p className="text-muted-foreground mb-8">
              Start analyzing your repository in seconds. No setup required.
            </p>
            <Link href="/dashboard">
              <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity">
                Get Started Free
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Hexagon className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">Repo Health Intelligence</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Repo Health Intelligence. Built for elite engineering teams.</p>
        </div>
      </footer>
    </div>
  );
}
