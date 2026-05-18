"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { AnalysisJob, api, RepositoryOverview, subscribeJobStatus } from "@/lib/api";

const STORAGE_KEY = "rhi:selected_repository_id";
const JOB_STORAGE_KEY = "rhi:active_job_id";

const TERMINAL_JOB_STATUSES = new Set<AnalysisJob["status"]>(["completed", "failed"]);

interface RepositoryContextValue {
  repositoryId: number | null;
  setRepositoryId: (id: number | null) => void;
  repositoryOverview: RepositoryOverview | null;
  currentJob: AnalysisJob | null;
  loadingOverview: boolean;
  loadingJob: boolean;
  startAnalysis: (repoUrl: string) => Promise<void>;
  refreshOverview: () => Promise<void>;
  refreshJob: () => Promise<void>;
  error: string | null;
}

const RepositoryContext = createContext<RepositoryContextValue | undefined>(undefined);

export function RepositoryProvider({ children }: { children: React.ReactNode }) {
  const [repositoryId, setRepositoryIdState] = useState<number | null>(null);
  const [repositoryOverview, setRepositoryOverview] = useState<RepositoryOverview | null>(null);
  const [currentJob, setCurrentJob] = useState<AnalysisJob | null>(null);
  const [trackedJobId, setTrackedJobId] = useState<number | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!Number.isNaN(parsed)) {
        setRepositoryIdState(parsed);
      }
    }
    const storedJob = window.localStorage.getItem(JOB_STORAGE_KEY);
    if (storedJob) {
      const parsed = Number(storedJob);
      if (!Number.isNaN(parsed)) {
        setTrackedJobId(parsed);
      }
    }
  }, []);

  const setRepositoryId = useCallback((id: number | null) => {
    setRepositoryIdState(id);
    if (id === null) {
      window.localStorage.removeItem(STORAGE_KEY);
      setRepositoryOverview(null);
      setCurrentJob(null);
      setTrackedJobId(null);
      window.localStorage.removeItem(JOB_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  const refreshOverview = useCallback(async () => {
    if (!repositoryId) {
      setRepositoryOverview(null);
      return;
    }
    setLoadingOverview(true);
    setError(null);
    try {
      const overview = await api.getRepositoryOverview(repositoryId);
      setRepositoryOverview(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repository overview");
    } finally {
      setLoadingOverview(false);
    }
  }, [repositoryId]);

  const refreshJob = useCallback(async () => {
    const jobId = trackedJobId ?? currentJob?.id;
    if (!jobId) return;
    setLoadingJob(true);
    try {
      const job = await api.getJob(jobId);
      setCurrentJob(job);
      if (TERMINAL_JOB_STATUSES.has(job.status)) {
        setTrackedJobId(null);
        window.localStorage.removeItem(JOB_STORAGE_KEY);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analysis job");
    } finally {
      setLoadingJob(false);
    }
  }, [currentJob?.id, trackedJobId]);

  useEffect(() => {
    if (!repositoryId) return;
    refreshOverview();
  }, [repositoryId, refreshOverview]);

  useEffect(() => {
    if (!repositoryId) return;
    let cancelled = false;

    const hydrateLatestJob = async () => {
      try {
        const latest = await api.getLatestRepositoryJob(repositoryId);
        if (cancelled) return;
        setCurrentJob(latest);
        if (!TERMINAL_JOB_STATUSES.has(latest.status)) {
          setTrackedJobId(latest.id);
          window.localStorage.setItem(JOB_STORAGE_KEY, String(latest.id));
        }
      } catch {
        // No jobs yet for this repository.
      }
    };

    void hydrateLatestJob();
    return () => {
      cancelled = true;
    };
  }, [repositoryId]);

  useEffect(() => {
    const jobId = trackedJobId;
    if (!jobId) return;

    setLoadingJob(true);
    const unsubscribe = subscribeJobStatus(
      jobId,
      (job) => {
        setCurrentJob(job);
        setLoadingJob(false);
        setError(null);
        if (TERMINAL_JOB_STATUSES.has(job.status)) {
          setTrackedJobId(null);
          window.localStorage.removeItem(JOB_STORAGE_KEY);
        }
      },
      (err) => {
        setLoadingJob(false);
        setError(err.message);
      }
    );

    return unsubscribe;
  }, [trackedJobId]);

  useEffect(() => {
    if (currentJob?.status === "completed") {
      refreshOverview();
    }
  }, [currentJob?.status, currentJob?.id, refreshOverview]);

  const startAnalysis = useCallback(
    async (repoUrl: string) => {
      setError(null);
      const response = await api.analyzeRepository({ url: repoUrl });
      setRepositoryId(response.repository_id);
      const startedJob = await api.getJob(response.job_id);
      setCurrentJob(startedJob);
      setTrackedJobId(startedJob.id);
      window.localStorage.setItem(JOB_STORAGE_KEY, String(startedJob.id));
    },
    [setRepositoryId]
  );

  const value = useMemo<RepositoryContextValue>(
    () => ({
      repositoryId,
      setRepositoryId,
      repositoryOverview,
      currentJob,
      loadingOverview,
      loadingJob,
      startAnalysis,
      refreshOverview,
      refreshJob,
      error,
    }),
    [
      repositoryId,
      setRepositoryId,
      repositoryOverview,
      currentJob,
      loadingOverview,
      loadingJob,
      startAnalysis,
      refreshOverview,
      refreshJob,
      error,
    ]
  );

  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepositoryContext() {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error("useRepositoryContext must be used within RepositoryProvider");
  }
  return context;
}
