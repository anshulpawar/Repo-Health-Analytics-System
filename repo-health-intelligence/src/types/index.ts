export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  openIssues: number;
  contributors: number;
  commits: number;
  healthScore: number;
  complexityScore: number;
  couplingScore: number;
  testCoverage: number;
  busFactor: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  lastAnalyzed: string;
  languages: LanguageBreakdown[];
}

export interface LanguageBreakdown {
  name: string;
  percentage: number;
  color: string;
}

export interface HealthTimeline {
  date: string;
  healthScore: number;
  complexity: number;
  coupling: number;
  coverage: number;
}

export interface Commit {
  id: string;
  hash: string;
  message: string;
  author: Contributor;
  date: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  complexityDelta: number;
  couplingDelta: number;
  maintainabilityDelta: number;
  architectureImpact: "none" | "low" | "medium" | "high";
}

export interface Contributor {
  id: string;
  name: string;
  avatar: string;
  email: string;
  commits: number;
  linesAdded: number;
  linesRemoved: number;
  filesOwned: number;
  lastActive: string;
  riskLevel: "Low" | "Medium" | "High";
}

export interface Hotspot {
  id: string;
  filePath: string;
  module: string;
  complexity: number;
  churn: number;
  ownershipRisk: number;
  maintainability: number;
  hotspotScore: number;
  severity: "low" | "medium" | "high" | "critical";
  trend: "improving" | "stable" | "degrading";
}

export interface DependencyNode {
  id: string;
  label: string;
  type: "module" | "file" | "service" | "database" | "api";
  layer: "presentation" | "business" | "data" | "infrastructure";
  complexity: number;
  connections: number;
}

export interface DependencyEdge {
  source: string;
  target: string;
  type: "import" | "call" | "inheritance";
  weight: number;
  isCyclic?: boolean;
}

export interface ArchitectureViolation {
  id: string;
  type: string;
  description: string;
  severity: "warning" | "error" | "critical";
  source: string;
  target: string;
  layer: string;
  detectedAt: string;
  resolved: boolean;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  category: "health" | "architecture" | "complexity" | "risk" | "recommendation";
  severity: "info" | "warning" | "critical";
  timestamp: string;
  relatedFiles: string[];
  recommendation: string;
  impact: string;
}

export interface MetricCardData {
  title: string;
  value: number | string;
  change: number;
  changeLabel: string;
  icon: string;
  trend: "up" | "down" | "stable";
  sparkline?: number[];
}
