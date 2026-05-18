"use client";
import { Bell, GitBranch, ChevronDown, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useRepositoryContext } from "@/context/repository-context";

export function Topbar() {
  const { repositoryOverview, currentJob } = useRepositoryContext();
  const repoLabel = repositoryOverview?.full_name ?? "No repository analyzed yet";
  const secondaryLabel = currentJob?.status
    ? `${currentJob.status.replace(/_/g, " ")} • ${Math.round(currentJob.progress)}%`
    : "Awaiting repository input";

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 border-b border-white/5 glass-strong"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm">
          <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium">{repoLabel}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{secondaryLabel}</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xs font-bold">
          SC
        </div>
      </div>
    </motion.header>
  );
}
