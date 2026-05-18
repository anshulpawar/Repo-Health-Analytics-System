from collections import defaultdict

from app.utils.scoring import clamp


class BusFactorEngine:
    def calculate_ownership(self, file_authors: dict[str, dict[str, int]]) -> tuple[dict[str, dict[str, float]], float]:
        ownership_percentages: dict[str, dict[str, float]] = {}
        coverage_counts = defaultdict(int)

        for file_path, contributions in file_authors.items():
            total = sum(contributions.values())
            if total <= 0:
                continue
            ownership_percentages[file_path] = {}
            for author, count in contributions.items():
                percentage = (count / total) * 100
                ownership_percentages[file_path][author] = round(percentage, 2)
                if percentage >= 50:
                    coverage_counts[author] += 1

        # Bus factor: how many top contributors are needed to cover 50%+ ownership on all files.
        sorted_coverages = sorted(coverage_counts.values(), reverse=True)
        covered = 0
        required_people = 0
        total_files = max(len(file_authors), 1)
        for coverage in sorted_coverages:
            required_people += 1
            covered += coverage
            if covered >= total_files:
                break
        bus_factor = float(required_people if required_people > 0 else 1)
        return ownership_percentages, bus_factor

    @staticmethod
    def ownership_risk(max_owner_percentage: float) -> float:
        return clamp(max_owner_percentage)

