"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GitCommitHorizontal, FileText, Plus, Minus } from "lucide-react";

interface CommitCardProps {
  hash: string;
  message: string;
  authorName: string;
  date: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  complexityDelta: number;
  couplingDelta: number;
  maintainabilityDelta: number;
  architectureImpact: string;
  delay?: number;
}

export function CommitCard({
  hash, message, authorName, date, filesChanged, additions, deletions,
  complexityDelta, couplingDelta, maintainabilityDelta, architectureImpact, delay = 0
}: CommitCardProps) {
  const impactColor = {
    none: "bg-zinc-400/10 text-zinc-400",
    low: "bg-emerald-400/10 text-emerald-400",
    medium: "bg-amber-400/10 text-amber-400",
    high: "bg-red-400/10 text-red-400",
  }[architectureImpact] || "bg-zinc-400/10 text-zinc-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-xl border border-white/5 bg-card p-4 hover:border-white/10 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/5 text-muted-foreground group-hover:text-cyan-400 transition-colors">
          <GitCommitHorizontal className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-xs font-mono text-cyan-400">{hash}</code>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", impactColor)}>
              {architectureImpact}
            </span>
          </div>
          <p className="text-sm font-medium truncate mb-2">{message}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{authorName}</span>
            <span>{new Date(date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{filesChanged}</span>
            <span className="flex items-center gap-1 text-emerald-400"><Plus className="w-3 h-3" />{additions}</span>
            <span className="flex items-center gap-1 text-red-400"><Minus className="w-3 h-3" />{deletions}</span>
          </div>
          <div className="flex gap-3 mt-2">
            <DeltaBadge label="Complexity" value={complexityDelta} />
            <DeltaBadge label="Coupling" value={couplingDelta} />
            <DeltaBadge label="Maintainability" value={maintainabilityDelta} invert />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DeltaBadge({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const isGood = invert ? value > 0 : value < 0;
  const isBad = invert ? value < 0 : value > 0;
  const color = value === 0 ? "text-zinc-500" : isGood ? "text-emerald-400" : isBad ? "text-red-400" : "text-zinc-500";

  return (
    <span className={cn("text-[10px] font-mono", color)}>
      {label}: {value > 0 ? "+" : ""}{value}
    </span>
  );
}
