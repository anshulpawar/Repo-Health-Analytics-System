"use client";

import { Database, Loader2 } from "lucide-react";

import { FloatingGlowPanel } from "@/components/shared";

export function EmptyRepositoryState({
  message = "No repository analyzed yet",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <FloatingGlowPanel className={`p-8 text-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-white/5 mx-auto flex items-center justify-center mb-3">
        <Database className="w-7 h-7 text-cyan-400" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{message}</h3>
      <p className="text-sm text-muted-foreground">Enter a repository URL to start analysis and populate this page.</p>
    </FloatingGlowPanel>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
      <span>{label}</span>
    </div>
  );
}

