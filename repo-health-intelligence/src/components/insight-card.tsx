"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertCircle, Lightbulb, TrendingDown } from "lucide-react";

interface InsightCardProps {
  title: string;
  description: string;
  category: string;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  recommendation: string;
  impact: string;
  delay?: number;
}

const severityConfig = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
  critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
};

const categoryIcons: Record<string, React.ReactNode> = {
  health: <TrendingDown className="w-3 h-3" />,
  architecture: <AlertTriangle className="w-3 h-3" />,
  risk: <AlertCircle className="w-3 h-3" />,
  recommendation: <Lightbulb className="w-3 h-3" />,
  complexity: <Info className="w-3 h-3" />,
};

export function InsightCard({ title, description, category, severity, timestamp, recommendation, impact, delay = 0 }: InsightCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "rounded-2xl border p-5 transition-all duration-300 hover:border-white/10",
        config.border, "bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-xl flex-shrink-0", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase", config.bg, config.color)}>
              {severity}
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-muted-foreground">
              {categoryIcons[category]}
              {category}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {new Date(timestamp).toLocaleDateString()}
            </span>
          </div>
          <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{description}</p>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Recommendation</p>
              <p className="text-xs text-foreground/80">{recommendation}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-medium">Impact</p>
              <p className="text-xs text-foreground/80">{impact}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
