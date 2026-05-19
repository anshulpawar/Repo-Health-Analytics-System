"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Brain, Clock, ExternalLink, GitBranch, RefreshCw, Server, Check, AlertCircle } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard-layout";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { useRepositoryContext } from "@/context/repository-context";
import { checkHealth, getApiBaseUrl } from "@/lib/api";
import {
  AnalysisFrequency,
  loadPreferences,
  resetPreferences,
  savePreferences,
  UserPreferences,
} from "@/lib/settings-storage";
import { cn } from "@/lib/utils";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn("relative w-10 h-5 rounded-full transition-colors", enabled ? "bg-cyan-500" : "bg-white/10")}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ duration: 0.2 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
      />
    </button>
  );
}

export default function SettingsPage() {
  const { repositoryId, repositoryOverview, currentJob } = useRepositoryContext();
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences());
  const [saved, setSaved] = useState(false);
  const [health, setHealth] = useState<{ ok: boolean; status?: string; error?: string } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const refreshHealth = useCallback(async () => {
    setCheckingHealth(true);
    const result = await checkHealth();
    setHealth(result);
    setCheckingHealth(false);
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const onSave = () => {
    savePreferences(preferences);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const onReset = () => {
    setPreferences(resetPreferences());
    setSaved(false);
  };

  const apiBase = getApiBaseUrl();
  const docsUrl = `${apiBase.replace(/\/api\/v1\/?$/, "")}/docs`;

  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Settings" description="Connection status, repository context, and local preferences" />

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-2 gap-4">
          <FloatingGlowPanel className="p-6" delay={0}>
            <motion.div layout className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/5">
                <Server className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold">Backend Connection</h3>
                <p className="text-xs text-muted-foreground">Live API health and configuration</p>
              </div>
            </motion.div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-muted-foreground">API base URL</span>
                <code className="text-xs text-cyan-300 truncate max-w-[60%]">{apiBase}</code>
              </div>
              <motion.div layout className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-muted-foreground">Health</span>
                <span className="flex items-center gap-2 text-xs">
                  {health?.ok ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Connected ({health.status})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">{health?.error ?? "Unreachable"}</span>
                    </>
                  )}
                </span>
              </motion.div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void refreshHealth()}
                  disabled={checkingHealth}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", checkingHealth && "animate-spin")} />
                  Recheck
                </button>
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open API docs
                </a>
              </div>
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-6" delay={0.05}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/5">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Repository</h3>
                <p className="text-xs text-muted-foreground">Active analysis context from the backend</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {repositoryOverview ? (
                <div className="p-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5">
                  <div className="font-medium">{repositoryOverview.full_name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Health {Math.round(repositoryOverview.health_score)}/100 · {repositoryOverview.commits.toLocaleString()} commits
                  </div>
                  {currentJob && !["completed", "failed"].includes(currentJob.status) && (
                    <div className="text-xs text-cyan-400 mt-2">
                      Analysis in progress ({currentJob.status}, {Math.round(currentJob.progress)}%)
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No repository selected. Analyze a public GitHub URL from the home page.</p>
              )}
              <Link href="/" className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                Analyze a repository
              </Link>
              {repositoryId && <p className="text-[10px] text-muted-foreground">Repository ID: {repositoryId}</p>}
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-6" delay={0.1}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/5">
                <Clock className="w-5 h-5 text-cyan-400" />
              </div>
              <motion.div layout>
                <h3 className="font-semibold">Analysis Frequency</h3>
                <p className="text-xs text-muted-foreground">Saved locally · scheduled runs not enabled yet</p>
              </motion.div>
            </div>
            <div className="space-y-2">
              {(
                [
                  { id: "manual" as const, label: "Manual", desc: "Analyze from the home page (current behavior)" },
                  { id: "daily" as const, label: "Daily", desc: "Planned: once per day UTC" },
                  { id: "weekly" as const, label: "Weekly", desc: "Planned: weekly schedule" },
                  { id: "realtime" as const, label: "Real-time", desc: "Planned: on every push" },
                ] satisfies Array<{ id: AnalysisFrequency; label: string; desc: string }>
              ).map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    preferences.analysisFrequency === opt.id
                      ? "border-cyan-500/30 bg-cyan-500/5"
                      : "border-white/5 hover:border-white/10"
                  )}
                >
                  <motion.div
                    layout
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      preferences.analysisFrequency === opt.id ? "border-cyan-400" : "border-white/20"
                    )}
                  >
                    {preferences.analysisFrequency === opt.id && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </motion.div>
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                  </div>
                  <input
                    type="radio"
                    name="frequency"
                    value={opt.id}
                    checked={preferences.analysisFrequency === opt.id}
                    onChange={() => setPreferences((prev) => ({ ...prev, analysisFrequency: opt.id }))}
                    className="hidden"
                  />
                </label>
              ))}
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-6" delay={0.15}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/5">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-xs text-muted-foreground">Saved locally until delivery integrations ship</p>
              </div>
            </div>
            <div className="space-y-4">
              {(
                [
                  { key: "email" as const, label: "Email notifications", desc: "Receive alerts via email" },
                  { key: "slack" as const, label: "Slack integration", desc: "Send alerts to Slack channel" },
                  { key: "violations" as const, label: "Architecture violations", desc: "Alert on new violations" },
                  { key: "insights" as const, label: "AI insights", desc: "Alert on critical insights" },
                  { key: "weekly" as const, label: "Weekly digest", desc: "Summary report every Monday" },
                ] as const
              ).map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">{item.desc}</div>
                  </div>
                  <Toggle
                    enabled={preferences.notifications[item.key]}
                    onChange={(v) =>
                      setPreferences((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, [item.key]: v },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </FloatingGlowPanel>

          <FloatingGlowPanel className="p-6 lg:col-span-2" delay={0.2}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-white/5">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">AI Configuration</h3>
                <p className="text-xs text-muted-foreground">LLM insights are disabled in this release; analytics APIs are fully connected</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Commit, hotspot, architecture, contributor, and dependency data are served by the Next.js API. The insights feed
              returns structured placeholders until the AI pipeline under <code className="text-cyan-300">app/ai/</code> is enabled.
            </p>
          </FloatingGlowPanel>
        </motion.div>

        <div className="flex justify-end gap-3 items-center">
          {saved && <span className="text-xs text-emerald-400">Preferences saved locally</span>}
          <button
            type="button"
            onClick={onReset}
            className="px-6 py-2.5 rounded-xl bg-white/5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
