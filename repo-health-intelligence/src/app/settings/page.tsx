"use client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FloatingGlowPanel, PageContainer, SectionHeader } from "@/components/shared";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, Brain, Palette, Clock, Shield, Link2, Check } from "lucide-react";

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

import { cn } from "@/lib/utils";
import { useState } from "react";

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!enabled)} className={cn("relative w-10 h-5 rounded-full transition-colors", enabled ? "bg-cyan-500" : "bg-white/10")}>
      <motion.div animate={{ x: enabled ? 20 : 2 }} transition={{ duration: 0.2 }} className="absolute top-0.5 w-4 h-4 rounded-full bg-white" />
    </button>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({ email: true, slack: false, violations: true, insights: true, weekly: true });
  const [analysis, setAnalysis] = useState("daily");
  const [aiModel, setAiModel] = useState("advanced");

  return (
    <DashboardLayout>
      <PageContainer>
        <SectionHeader title="Settings" description="Configure your repository analysis preferences" />

        <div className="grid lg:grid-cols-2 gap-4">
          {/* GitHub Integration */}
          <FloatingGlowPanel className="p-6" delay={0}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/5"><GithubIcon className="w-5 h-5" /></div>
              <div><h3 className="font-semibold">GitHub Integration</h3><p className="text-xs text-muted-foreground">Connect your GitHub account</p></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5">
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-sm font-medium">acme-corp</div>
                    <div className="text-xs text-muted-foreground">Organization • 12 repos connected</div>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground hover:text-foreground transition-colors">Manage</button>
              </div>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/10 text-sm text-muted-foreground hover:text-foreground hover:border-white/20 transition-all">
                <Link2 className="w-4 h-4" />Connect Another Organization
              </button>
            </div>
          </FloatingGlowPanel>

          {/* Analysis Frequency */}
          <FloatingGlowPanel className="p-6" delay={0.05}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/5"><Clock className="w-5 h-5 text-cyan-400" /></div>
              <div><h3 className="font-semibold">Analysis Frequency</h3><p className="text-xs text-muted-foreground">How often to analyze repositories</p></div>
            </div>
            <div className="space-y-2">
              {[
                { id: "realtime", label: "Real-time", desc: "Analyze on every push" },
                { id: "daily", label: "Daily", desc: "Once per day at midnight UTC" },
                { id: "weekly", label: "Weekly", desc: "Every Monday at 6 AM UTC" },
                { id: "manual", label: "Manual", desc: "Only when triggered" },
              ].map((opt) => (
                <label key={opt.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  analysis === opt.id ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 hover:border-white/10")}>
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    analysis === opt.id ? "border-cyan-400" : "border-white/20")}>
                    {analysis === opt.id && <div className="w-2 h-2 rounded-full bg-cyan-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                  </div>
                  <input type="radio" name="frequency" value={opt.id} checked={analysis === opt.id} onChange={() => setAnalysis(opt.id)} className="hidden" />
                </label>
              ))}
            </div>
          </FloatingGlowPanel>

          {/* Notifications */}
          <FloatingGlowPanel className="p-6" delay={0.1}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/5"><Bell className="w-5 h-5 text-amber-400" /></div>
              <div><h3 className="font-semibold">Notifications</h3><p className="text-xs text-muted-foreground">Configure alert preferences</p></div>
            </div>
            <div className="space-y-4">
              {[
                { key: "email" as const, label: "Email notifications", desc: "Receive alerts via email" },
                { key: "slack" as const, label: "Slack integration", desc: "Send alerts to Slack channel" },
                { key: "violations" as const, label: "Architecture violations", desc: "Alert on new violations" },
                { key: "insights" as const, label: "AI insights", desc: "Alert on critical insights" },
                { key: "weekly" as const, label: "Weekly digest", desc: "Summary report every Monday" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div><div className="text-sm">{item.label}</div><div className="text-[10px] text-muted-foreground">{item.desc}</div></div>
                  <Toggle enabled={notifications[item.key]} onChange={(v) => setNotifications(prev => ({ ...prev, [item.key]: v }))} />
                </div>
              ))}
            </div>
          </FloatingGlowPanel>

          {/* AI Configuration */}
          <FloatingGlowPanel className="p-6" delay={0.15}>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-white/5"><Brain className="w-5 h-5 text-purple-400" /></div>
              <div><h3 className="font-semibold">AI Configuration</h3><p className="text-xs text-muted-foreground">Configure AI analysis settings</p></div>
            </div>
            <div className="space-y-2">
              {[
                { id: "basic", label: "Basic", desc: "Pattern matching and heuristics" },
                { id: "advanced", label: "Advanced", desc: "Deep analysis with ML models" },
                { id: "enterprise", label: "Enterprise", desc: "Custom-trained on your codebase" },
              ].map((opt) => (
                <label key={opt.id} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                  aiModel === opt.id ? "border-purple-500/30 bg-purple-500/5" : "border-white/5 hover:border-white/10")}>
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center",
                    aiModel === opt.id ? "border-purple-400" : "border-white/20")}>
                    {aiModel === opt.id && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                  </div>
                  <input type="radio" name="ai" value={opt.id} checked={aiModel === opt.id} onChange={() => setAiModel(opt.id)} className="hidden" />
                </label>
              ))}
            </div>
          </FloatingGlowPanel>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3">
          <button className="px-6 py-2.5 rounded-xl bg-white/5 text-sm text-muted-foreground hover:text-foreground transition-colors">Reset</button>
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity">Save Changes</button>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
