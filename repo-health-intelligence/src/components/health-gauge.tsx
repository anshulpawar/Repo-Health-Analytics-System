"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HealthGaugeProps {
  score: number;
  size?: number;
  label?: string;
  className?: string;
}

export function HealthGauge({ score, size = 120, label = "Health Score", className }: HealthGaugeProps) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? "#34d399" : score >= 60 ? "#22d3ee" : score >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e1e22" strokeWidth="8" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
