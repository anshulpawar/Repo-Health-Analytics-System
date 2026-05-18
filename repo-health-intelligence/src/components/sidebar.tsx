"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  GitBranch,
  GitCommitHorizontal,
  Network,
  Flame,
  Building2,
  Users,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Search,
  Hexagon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useRepositoryContext } from "@/context/repository-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/repository", label: "Repository", icon: GitBranch },
  { href: "/commits", label: "Commits", icon: GitCommitHorizontal },
  { href: "/dependencies", label: "Dependencies", icon: Network },
  { href: "/hotspots", label: "Hotspots", icon: Flame },
  { href: "/architecture", label: "Architecture", icon: Building2 },
  { href: "/contributors", label: "Contributors", icon: Users },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { repositoryOverview } = useRepositoryContext();
  const score = Math.max(0, Math.min(100, Math.round(repositoryOverview?.health_score ?? 0)));
  const scoreLabel = repositoryOverview ? `${score}/100` : "0/100";
  const scoreState = repositoryOverview ? "Analyzed" : "No repository analyzed yet";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-white/5 bg-surface glass-strong"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
          <Hexagon className="w-4 h-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-sm font-bold tracking-tight whitespace-nowrap"
            >
              Repo Health
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {!collapsed && (
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 text-muted-foreground text-xs">
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono">CTRL+K</kbd>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive ? "text-cyan-400 bg-cyan-500/10" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-cyan-500/10 border border-cyan-500/20"
                    transition={{ duration: 0.3 }}
                  />
                )}
                <item.icon className="relative w-4 h-4 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="px-3 py-3 mx-3 mb-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-400">System Health</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {scoreLabel} - {scoreState}
          </p>
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-white/5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}

