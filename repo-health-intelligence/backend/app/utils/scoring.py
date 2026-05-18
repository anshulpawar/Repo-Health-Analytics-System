def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def percentage(part: float, whole: float) -> float:
    if whole <= 0:
        return 0.0
    return (part / whole) * 100.0

