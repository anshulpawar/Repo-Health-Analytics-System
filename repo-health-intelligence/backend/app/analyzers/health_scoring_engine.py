from app.utils.scoring import clamp


class HealthScoringEngine:
    def compute(
        self,
        *,
        complexity_score: float,
        coupling_score: float,
        maintainability_score: float,
        architecture_violations: int,
        hotspot_score: float,
        ownership_concentration: float,
        test_coverage: float,
    ) -> dict:
        normalized_complexity = clamp(100 - complexity_score)
        normalized_coupling = clamp(100 - coupling_score)
        normalized_architecture = clamp(100 - architecture_violations * 8)
        normalized_hotspot = clamp(100 - hotspot_score)
        normalized_ownership = clamp(100 - ownership_concentration)
        normalized_coverage = clamp(test_coverage)
        normalized_maintainability = clamp(maintainability_score)

        health_score = (
            normalized_complexity * 0.16
            + normalized_coupling * 0.14
            + normalized_maintainability * 0.2
            + normalized_architecture * 0.14
            + normalized_hotspot * 0.14
            + normalized_ownership * 0.12
            + normalized_coverage * 0.1
        )
        risk_score = clamp(100 - health_score)

        return {
            "health_score": round(clamp(health_score), 2),
            "risk_score": round(risk_score, 2),
            "complexity_score": round(complexity_score, 2),
            "coupling_score": round(coupling_score, 2),
            "maintainability_score": round(maintainability_score, 2),
            "architecture_score": round(normalized_architecture, 2),
            "hotspot_severity": round(hotspot_score, 2),
            "ownership_concentration": round(ownership_concentration, 2),
            "test_coverage_score": round(test_coverage, 2),
        }

