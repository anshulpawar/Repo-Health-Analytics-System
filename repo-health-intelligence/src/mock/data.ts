import { Repository, HealthTimeline, Commit, Contributor, Hotspot, DependencyNode, DependencyEdge, ArchitectureViolation, AIInsight } from "@/types";

export const mockRepository: Repository = {
  id: "1",
  name: "nexus-platform",
  fullName: "acme-corp/nexus-platform",
  description: "Enterprise microservices platform with event-driven architecture",
  language: "TypeScript",
  stars: 4280,
  forks: 612,
  openIssues: 47,
  contributors: 34,
  commits: 8742,
  healthScore: 73,
  complexityScore: 62,
  couplingScore: 58,
  testCoverage: 71,
  busFactor: 3,
  riskLevel: "Medium",
  lastAnalyzed: "2026-05-18T10:30:00Z",
  languages: [
    { name: "TypeScript", percentage: 52, color: "#3178c6" },
    { name: "Python", percentage: 22, color: "#3572A5" },
    { name: "Go", percentage: 14, color: "#00ADD8" },
    { name: "Rust", percentage: 7, color: "#dea584" },
    { name: "Other", percentage: 5, color: "#6b7280" },
  ],
};

export const mockHealthTimeline: HealthTimeline[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2026, 3, 19 + i).toISOString().split("T")[0],
  healthScore: 65 + Math.sin(i * 0.3) * 12 + Math.random() * 5,
  complexity: 55 + Math.cos(i * 0.2) * 10 + Math.random() * 4,
  coupling: 50 + Math.sin(i * 0.25) * 8 + Math.random() * 6,
  coverage: 68 + Math.cos(i * 0.15) * 5 + Math.random() * 3,
}));

export const mockContributors: Contributor[] = [
  { id: "1", name: "Sarah Chen", avatar: "", email: "sarah@acme.dev", commits: 1842, linesAdded: 94200, linesRemoved: 31400, filesOwned: 127, lastActive: "2026-05-18T09:15:00Z", riskLevel: "Low" },
  { id: "2", name: "Marcus Rivera", avatar: "", email: "marcus@acme.dev", commits: 1356, linesAdded: 72800, linesRemoved: 28900, filesOwned: 89, lastActive: "2026-05-17T16:42:00Z", riskLevel: "Low" },
  { id: "3", name: "Aiko Tanaka", avatar: "", email: "aiko@acme.dev", commits: 967, linesAdded: 48300, linesRemoved: 19200, filesOwned: 64, lastActive: "2026-05-18T11:30:00Z", riskLevel: "Medium" },
  { id: "4", name: "James Okafor", avatar: "", email: "james@acme.dev", commits: 743, linesAdded: 35600, linesRemoved: 14800, filesOwned: 52, lastActive: "2026-05-16T14:20:00Z", riskLevel: "Medium" },
  { id: "5", name: "Elena Petrova", avatar: "", email: "elena@acme.dev", commits: 621, linesAdded: 29400, linesRemoved: 12100, filesOwned: 41, lastActive: "2026-05-15T08:55:00Z", riskLevel: "High" },
  { id: "6", name: "Dev Patel", avatar: "", email: "dev@acme.dev", commits: 518, linesAdded: 24100, linesRemoved: 9800, filesOwned: 38, lastActive: "2026-05-14T17:30:00Z", riskLevel: "Medium" },
];

export const mockCommits: Commit[] = [
  { id: "1", hash: "a3f8c2d", message: "refactor: migrate auth service to event-driven architecture", author: mockContributors[0], date: "2026-05-18T09:15:00Z", filesChanged: 24, additions: 1842, deletions: 967, complexityDelta: -8, couplingDelta: -12, maintainabilityDelta: 15, architectureImpact: "high" },
  { id: "2", hash: "b7e1f4a", message: "feat: implement distributed caching layer for API gateway", author: mockContributors[1], date: "2026-05-17T16:42:00Z", filesChanged: 18, additions: 1256, deletions: 234, complexityDelta: 12, couplingDelta: 5, maintainabilityDelta: -3, architectureImpact: "medium" },
  { id: "3", hash: "c9d2e5b", message: "fix: resolve race condition in payment processing pipeline", author: mockContributors[2], date: "2026-05-17T11:30:00Z", filesChanged: 7, additions: 342, deletions: 128, complexityDelta: -2, couplingDelta: 0, maintainabilityDelta: 5, architectureImpact: "low" },
  { id: "4", hash: "d1a3f6c", message: "feat: add real-time WebSocket notification system", author: mockContributors[3], date: "2026-05-16T14:20:00Z", filesChanged: 31, additions: 2467, deletions: 189, complexityDelta: 18, couplingDelta: 8, maintainabilityDelta: -7, architectureImpact: "high" },
  { id: "5", hash: "e4b7c8d", message: "refactor: extract shared validation utilities", author: mockContributors[0], date: "2026-05-16T10:05:00Z", filesChanged: 12, additions: 567, deletions: 892, complexityDelta: -15, couplingDelta: -6, maintainabilityDelta: 12, architectureImpact: "medium" },
  { id: "6", hash: "f2c9d0e", message: "chore: upgrade dependencies and fix security vulnerabilities", author: mockContributors[4], date: "2026-05-15T08:55:00Z", filesChanged: 4, additions: 187, deletions: 145, complexityDelta: 0, couplingDelta: 0, maintainabilityDelta: 2, architectureImpact: "none" },
  { id: "7", hash: "g5h8i1j", message: "feat: implement RBAC authorization middleware", author: mockContributors[1], date: "2026-05-14T15:30:00Z", filesChanged: 15, additions: 1023, deletions: 312, complexityDelta: 8, couplingDelta: 3, maintainabilityDelta: -2, architectureImpact: "medium" },
  { id: "8", hash: "h6i9j2k", message: "fix: memory leak in connection pool manager", author: mockContributors[2], date: "2026-05-14T09:20:00Z", filesChanged: 3, additions: 89, deletions: 45, complexityDelta: -1, couplingDelta: 0, maintainabilityDelta: 4, architectureImpact: "none" },
];

export const mockHotspots: Hotspot[] = [
  { id: "1", filePath: "src/services/payment/processor.ts", module: "Payment", complexity: 89, churn: 94, ownershipRisk: 82, maintainability: 31, hotspotScore: 95, severity: "critical", trend: "degrading" },
  { id: "2", filePath: "src/api/gateway/router.ts", module: "API Gateway", complexity: 78, churn: 87, ownershipRisk: 45, maintainability: 42, hotspotScore: 88, severity: "high", trend: "degrading" },
  { id: "3", filePath: "src/core/auth/session-manager.ts", module: "Auth", complexity: 72, churn: 76, ownershipRisk: 91, maintainability: 38, hotspotScore: 85, severity: "high", trend: "stable" },
  { id: "4", filePath: "src/services/notification/dispatcher.ts", module: "Notifications", complexity: 65, churn: 82, ownershipRisk: 67, maintainability: 45, hotspotScore: 78, severity: "high", trend: "degrading" },
  { id: "5", filePath: "src/core/events/event-bus.ts", module: "Events", complexity: 71, churn: 58, ownershipRisk: 38, maintainability: 52, hotspotScore: 65, severity: "medium", trend: "stable" },
  { id: "6", filePath: "src/utils/validators/schema.ts", module: "Utils", complexity: 45, churn: 72, ownershipRisk: 28, maintainability: 68, hotspotScore: 52, severity: "medium", trend: "improving" },
  { id: "7", filePath: "src/db/migrations/runner.ts", module: "Database", complexity: 58, churn: 42, ownershipRisk: 55, maintainability: 55, hotspotScore: 48, severity: "low", trend: "stable" },
  { id: "8", filePath: "src/services/analytics/aggregator.ts", module: "Analytics", complexity: 52, churn: 38, ownershipRisk: 72, maintainability: 61, hotspotScore: 42, severity: "low", trend: "improving" },
];

export const mockDependencyNodes: DependencyNode[] = [
  { id: "api-gateway", label: "API Gateway", type: "service", layer: "presentation", complexity: 78, connections: 8 },
  { id: "auth-service", label: "Auth Service", type: "service", layer: "business", complexity: 65, connections: 6 },
  { id: "payment-service", label: "Payment Service", type: "service", layer: "business", complexity: 89, connections: 5 },
  { id: "notification-service", label: "Notification Service", type: "service", layer: "business", complexity: 55, connections: 4 },
  { id: "user-module", label: "User Module", type: "module", layer: "business", complexity: 42, connections: 7 },
  { id: "event-bus", label: "Event Bus", type: "service", layer: "infrastructure", complexity: 71, connections: 9 },
  { id: "cache-layer", label: "Cache Layer", type: "service", layer: "infrastructure", complexity: 35, connections: 5 },
  { id: "postgres-db", label: "PostgreSQL", type: "database", layer: "data", complexity: 0, connections: 4 },
  { id: "redis-cache", label: "Redis", type: "database", layer: "data", complexity: 0, connections: 3 },
  { id: "external-api", label: "External API", type: "api", layer: "infrastructure", complexity: 0, connections: 2 },
  { id: "analytics-service", label: "Analytics", type: "service", layer: "business", complexity: 52, connections: 4 },
  { id: "file-storage", label: "File Storage", type: "service", layer: "infrastructure", complexity: 28, connections: 3 },
];

export const mockDependencyEdges: DependencyEdge[] = [
  { source: "api-gateway", target: "auth-service", type: "call", weight: 3 },
  { source: "api-gateway", target: "payment-service", type: "call", weight: 2 },
  { source: "api-gateway", target: "user-module", type: "call", weight: 4 },
  { source: "api-gateway", target: "notification-service", type: "call", weight: 1 },
  { source: "auth-service", target: "postgres-db", type: "call", weight: 3 },
  { source: "auth-service", target: "redis-cache", type: "call", weight: 2 },
  { source: "payment-service", target: "postgres-db", type: "call", weight: 3 },
  { source: "payment-service", target: "external-api", type: "call", weight: 2 },
  { source: "payment-service", target: "event-bus", type: "call", weight: 2 },
  { source: "notification-service", target: "event-bus", type: "call", weight: 3 },
  { source: "user-module", target: "postgres-db", type: "call", weight: 4 },
  { source: "user-module", target: "cache-layer", type: "call", weight: 2 },
  { source: "event-bus", target: "notification-service", type: "call", weight: 2, isCyclic: true },
  { source: "analytics-service", target: "postgres-db", type: "call", weight: 2 },
  { source: "analytics-service", target: "event-bus", type: "call", weight: 1 },
  { source: "cache-layer", target: "redis-cache", type: "call", weight: 3 },
  { source: "file-storage", target: "external-api", type: "call", weight: 1 },
  { source: "api-gateway", target: "analytics-service", type: "call", weight: 1 },
];

export const mockViolations: ArchitectureViolation[] = [
  { id: "1", type: "Layer Violation", description: "Controller directly accessing database layer bypassing service", severity: "critical", source: "src/api/users/controller.ts", target: "src/db/queries/users.ts", layer: "Presentation → Data", detectedAt: "2026-05-17T14:30:00Z", resolved: false },
  { id: "2", type: "Cyclic Dependency", description: "Circular import between notification service and event bus", severity: "error", source: "src/services/notification/dispatcher.ts", target: "src/core/events/event-bus.ts", layer: "Business ↔ Infrastructure", detectedAt: "2026-05-16T09:15:00Z", resolved: false },
  { id: "3", type: "Service Boundary Violation", description: "Payment service directly importing auth internals", severity: "error", source: "src/services/payment/processor.ts", target: "src/core/auth/internal/tokens.ts", layer: "Business → Business (Internal)", detectedAt: "2026-05-15T16:45:00Z", resolved: false },
  { id: "4", type: "Layer Violation", description: "UI component importing database utilities", severity: "critical", source: "src/components/dashboard/metrics.tsx", target: "src/db/utils/aggregation.ts", layer: "Presentation → Data", detectedAt: "2026-05-14T11:20:00Z", resolved: true },
  { id: "5", type: "Dependency Inversion", description: "Core module depending on infrastructure implementation", severity: "warning", source: "src/core/events/handler.ts", target: "src/infra/aws/sqs-client.ts", layer: "Business → Infrastructure", detectedAt: "2026-05-13T08:30:00Z", resolved: false },
  { id: "6", type: "Cyclic Dependency", description: "Mutual dependency between analytics and user modules", severity: "warning", source: "src/services/analytics/tracker.ts", target: "src/modules/user/activity.ts", layer: "Business ↔ Business", detectedAt: "2026-05-12T13:10:00Z", resolved: true },
];

export const mockInsights: AIInsight[] = [
  { id: "1", title: "Repository health dropped 18% after auth refactor", description: "The authentication service refactoring in the last sprint introduced significant complexity. While the event-driven migration improves scalability, the intermediate state has degraded overall maintainability scores.", category: "health", severity: "warning", timestamp: "2026-05-18T10:30:00Z", relatedFiles: ["src/core/auth/session-manager.ts", "src/core/auth/providers/oauth.ts"], recommendation: "Complete the migration by extracting remaining synchronous auth calls. Prioritize the 4 files still using legacy patterns.", impact: "Health score decreased from 81 to 73. Expected recovery in 2-3 sprints." },
  { id: "2", title: "Coupling between API and database layers increased 24%", description: "Recent commits introduced direct database queries from API controllers, bypassing the service layer. This violates the established layered architecture and increases coupling risk.", category: "architecture", severity: "critical", timestamp: "2026-05-17T14:00:00Z", relatedFiles: ["src/api/users/controller.ts", "src/api/payments/handler.ts"], recommendation: "Refactor direct DB calls through service layer. Add architectural linting rules to CI pipeline to prevent future violations.", impact: "3 new layer violations detected. Coupling score degraded from 52 to 58." },
  { id: "3", title: "Payment module becoming unstable — hotspot score 95", description: "The payment processor has the highest hotspot score in the codebase. High churn combined with increasing complexity and concentrated ownership creates significant risk.", category: "risk", severity: "critical", timestamp: "2026-05-16T16:00:00Z", relatedFiles: ["src/services/payment/processor.ts"], recommendation: "Split processor into smaller units. Add comprehensive test coverage (currently 34%). Distribute ownership across at least 2 additional engineers.", impact: "Single point of failure risk. Bus factor of 1 for critical payment flows." },
  { id: "4", title: "Test coverage trending downward in core modules", description: "Over the past 30 days, test coverage for core business modules has decreased from 78% to 71%. New features are being added without corresponding test coverage.", category: "health", severity: "warning", timestamp: "2026-05-15T09:00:00Z", relatedFiles: ["src/services/notification/dispatcher.ts", "src/core/events/event-bus.ts"], recommendation: "Implement coverage gates in CI. Require minimum 80% coverage for all new code. Schedule a testing sprint to cover gaps.", impact: "7% coverage decline. 12 critical paths currently untested." },
  { id: "5", title: "Architectural drift accelerating — 5 new violations this week", description: "The rate of architecture violations is increasing. Most violations involve bypassing the service layer and cross-boundary imports.", category: "architecture", severity: "warning", timestamp: "2026-05-14T11:00:00Z", relatedFiles: ["src/api/users/controller.ts", "src/components/dashboard/metrics.tsx"], recommendation: "Schedule architecture review. Consider implementing ArchUnit or dependency-cruiser rules. Add pre-commit hooks for import validation.", impact: "Total active violations: 4. Structural integrity score dropped to 62." },
  { id: "6", title: "Recommend extracting shared validation library", description: "Analysis detected 23 instances of duplicated validation logic across 8 modules. Extracting a shared validation library would reduce complexity by ~15% and improve maintainability.", category: "recommendation", severity: "info", timestamp: "2026-05-13T15:00:00Z", relatedFiles: ["src/utils/validators/schema.ts", "src/api/middleware/validate.ts"], recommendation: "Create @acme/validation package. Consolidate schema definitions. Estimated effort: 2-3 days for one engineer.", impact: "Projected complexity reduction: 15%. Estimated maintenance time savings: 4 hours/week." },
];

export const mockChurnComplexity = Array.from({ length: 40 }, (_, i) => ({
  name: `file-${i + 1}`,
  complexity: 20 + Math.random() * 80,
  churn: 10 + Math.random() * 90,
  size: 100 + Math.random() * 900,
  module: ["Auth", "Payment", "API", "Events", "Utils", "DB"][Math.floor(Math.random() * 6)],
}));

export const mockActivityData = Array.from({ length: 52 }, (_, week) =>
  Array.from({ length: 7 }, (_, day) => ({
    week,
    day,
    value: Math.floor(Math.random() * 10),
  }))
).flat();
