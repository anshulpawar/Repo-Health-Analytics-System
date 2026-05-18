from dataclasses import dataclass
from typing import Iterable

from lizard import analyze_file
from radon.complexity import cc_visit
from radon.metrics import mi_visit

from app.utils.language import detect_language


@dataclass
class ComplexityResult:
    complexity: float
    maintainability: float
    lines_of_code: int
    duplication_score: float


class ComplexityAnalyzer:
    def analyze(self, file_path: str, content: str) -> ComplexityResult:
        language = detect_language(file_path)
        lines = content.splitlines()
        loc = len(lines)
        duplication_score = self._duplication_score(lines)

        if language == "Python":
            blocks = cc_visit(content)
            avg_complexity = sum(block.complexity for block in blocks) / max(len(blocks), 1)
            maintainability = float(mi_visit(content, multi=True))
            return ComplexityResult(
                complexity=float(avg_complexity),
                maintainability=max(0.0, min(100.0, maintainability)),
                lines_of_code=loc,
                duplication_score=duplication_score,
            )

        lizard_result = analyze_file.analyze_source_code(file_path, content)
        avg_complexity = float(lizard_result.average_cyclomatic_complexity)
        maintainability = max(0.0, min(100.0, 100.0 - avg_complexity * 1.5))
        return ComplexityResult(
            complexity=avg_complexity,
            maintainability=maintainability,
            lines_of_code=loc,
            duplication_score=duplication_score,
        )

    @staticmethod
    def _duplication_score(lines: Iterable[str]) -> float:
        normalized = [line.strip() for line in lines if line.strip()]
        total = len(normalized)
        if total == 0:
            return 0.0
        unique = len(set(normalized))
        return round(((total - unique) / total) * 100, 2)

