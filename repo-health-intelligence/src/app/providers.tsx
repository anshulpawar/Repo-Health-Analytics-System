"use client";

import { RepositoryProvider } from "@/context/repository-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <RepositoryProvider>{children}</RepositoryProvider>;
}

