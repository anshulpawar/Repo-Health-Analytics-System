"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "stable";
  icon: React.ReactNode;
  sparkline?: number[];
  suffix?: string;
  className?: string;
  delay?: number;
}

function AnimatedCounter({ value, suffix = "" }: { value: number | string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const numVal = typeof value === "string" ? parseFloat(value) || 0 : value;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = numVal / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numVal) {
        setDisplay(numVal);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [numVal]);

  return <span>{typeof value === "string" ? value : Math.round(display)}{suffix}</span>;
}

function MiniSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 30;
  const w = 80;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline fill="none" stroke="#22d3ee" strokeWidth="1.5" points={points} />
    </svg>
  );
}

export function MetricCard({ title, value, change, changeLabel, trend = "stable", icon, sparkline, suffix, className, delay = 0 }: MetricCardProps) {
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400";
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/5 bg-card p-5",
        "hover:border-cyan-500/20 hover:glow-cyan transition-all duration-300",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">{icon}</div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          </div>
          <div className="text-3xl font-bold tracking-tight">
            <AnimatedCounter value={value} suffix={suffix} />
          </div>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trendColor)}>
              <TrendIcon className="w-3 h-3" />
              <span>{change > 0 ? "+" : ""}{change}%</span>
              {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>
        {sparkline && <MiniSparkline data={sparkline} />}
      </div>
    </motion.div>
  );
}
