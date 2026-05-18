"use client";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useState, useEffect } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Sidebar />
      <div className="ml-[260px] transition-all duration-300">
        <Topbar />
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </div>
    </div>
  );
}
