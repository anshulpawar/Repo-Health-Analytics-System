export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function riskLevelFromScore(riskScore: number): string {
  if (riskScore >= 75) return "Critical";
  if (riskScore >= 55) return "High";
  if (riskScore >= 35) return "Medium";
  return "Low";
}

export function hotspotRiskLevel(score: number): string {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function hotspotTrend(score: number): string {
  if (score > 70) return "degrading";
  if (score > 45) return "stable";
  return "improving";
}

export function computeHealthScore(input: {
  complexityScore: number;
  couplingScore: number;
  maintainabilityScore: number;
  architectureViolations: number;
  hotspotScore: number;
  ownershipConcentration: number;
  testCoverage: number;
}) {
  const normalizedComplexity = clamp(100 - input.complexityScore);
  const normalizedCoupling = clamp(100 - input.couplingScore);
  const normalizedArchitecture = clamp(100 - input.architectureViolations * 8);
  const normalizedHotspot = clamp(100 - input.hotspotScore);
  const normalizedOwnership = clamp(100 - input.ownershipConcentration);
  const normalizedCoverage = clamp(input.testCoverage);
  const normalizedMaintainability = clamp(input.maintainabilityScore);

  const healthScore =
    normalizedComplexity * 0.16 +
    normalizedCoupling * 0.14 +
    normalizedMaintainability * 0.2 +
    normalizedArchitecture * 0.14 +
    normalizedHotspot * 0.14 +
    normalizedOwnership * 0.12 +
    normalizedCoverage * 0.1;

  const riskScore = clamp(100 - healthScore);

  return {
    healthScore: Math.round(clamp(healthScore) * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
    complexityScore: Math.round(input.complexityScore * 100) / 100,
    couplingScore: Math.round(input.couplingScore * 100) / 100,
    maintainabilityScore: Math.round(input.maintainabilityScore * 100) / 100,
    architectureScore: Math.round(normalizedArchitecture * 100) / 100,
    hotspotSeverity: Math.round(input.hotspotScore * 100) / 100,
    testCoverageScore: Math.round(input.testCoverage * 100) / 100,
  };
}
