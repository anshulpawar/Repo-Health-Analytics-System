"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface FloatingGlowPanelProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  delay?: number;
}

export function FloatingGlowPanel({ children, className, glowColor = "cyan", delay = 0 }: FloatingGlowPanelProps) {
  const glowStyles: Record<string, string> = {
    cyan: "from-cyan-500/10 via-transparent to-transparent shadow-cyan-500/5",
    blue: "from-blue-500/10 via-transparent to-transparent shadow-blue-500/5",
    purple: "from-purple-500/10 via-transparent to-transparent shadow-purple-500/5",
    amber: "from-amber-500/10 via-transparent to-transparent shadow-amber-500/5",
    red: "from-red-500/10 via-transparent to-transparent shadow-red-500/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative rounded-2xl border border-white/5 bg-card overflow-hidden",
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", glowStyles[glowColor])} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export function SkeletonLoader({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("p-6 space-y-6", className)}
    >
      {children}
    </motion.div>
  );
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};
