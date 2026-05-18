from app.analyzers.hotspot_engine import HotspotEngine


def test_hotspot_scoring_high_risk():
    engine = HotspotEngine()
    result = engine.score(churn_score=90, complexity=85, ownership_risk=80, maintainability=30)
    assert result.hotspot_score >= 80
    assert result.risk_level.value in {"high", "critical"}


def test_hotspot_scoring_low_risk():
    engine = HotspotEngine()
    result = engine.score(churn_score=10, complexity=20, ownership_risk=15, maintainability=92)
    assert result.hotspot_score < 50
    assert result.risk_level.value in {"low", "medium"}

