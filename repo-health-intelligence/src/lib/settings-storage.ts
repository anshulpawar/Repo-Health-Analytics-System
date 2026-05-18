export interface NotificationPreferences {
  email: boolean;
  slack: boolean;
  violations: boolean;
  insights: boolean;
  weekly: boolean;
}

export type AnalysisFrequency = "realtime" | "daily" | "weekly" | "manual";

export interface UserPreferences {
  notifications: NotificationPreferences;
  analysisFrequency: AnalysisFrequency;
}

const STORAGE_KEY = "rhi:preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    email: true,
    slack: false,
    violations: true,
    insights: true,
    weekly: true,
  },
  analysisFrequency: "manual",
};

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return {
      notifications: { ...DEFAULT_PREFERENCES.notifications, ...parsed.notifications },
      analysisFrequency: parsed.analysisFrequency ?? DEFAULT_PREFERENCES.analysisFrequency,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: UserPreferences): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

export function resetPreferences(): UserPreferences {
  window.localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_PREFERENCES;
}
