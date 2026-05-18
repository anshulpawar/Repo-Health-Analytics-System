from dataclasses import dataclass
from pathlib import PurePosixPath

import networkx as nx


@dataclass
class Violation:
    file_path: str
    violation_type: str
    severity: str
    source: str
    target: str
    layer: str
    description: str


class ArchitectureDriftEngine:
    def __init__(self):
        self.forbidden_edges = [
            ("presentation", "data", "critical", "No direct DB access from presentation layer"),
            ("business", "presentation", "error", "Business layer must not depend on presentation"),
        ]

    def detect(
        self,
        dependency_edges: list[tuple[str, str, str]],
    ) -> tuple[list[Violation], list[tuple[str, str]]]:
        graph = nx.DiGraph()
        violations: list[Violation] = []
        for source, target, relation_type in dependency_edges:
            graph.add_edge(source, target, relation=relation_type)
            source_layer = self._infer_layer(source)
            target_layer = self._infer_layer(target)
            for from_layer, to_layer, severity, reason in self.forbidden_edges:
                if source_layer == from_layer and target_layer == to_layer:
                    violations.append(
                        Violation(
                            file_path=source,
                            violation_type="Layer Violation",
                            severity=severity,
                            source=source,
                            target=target,
                            layer=f"{source_layer} -> {target_layer}",
                            description=reason,
                        )
                    )

        cyclic_edges: list[tuple[str, str]] = []
        for cycle in nx.simple_cycles(graph):
            if len(cycle) > 1:
                for idx, node in enumerate(cycle):
                    nxt = cycle[(idx + 1) % len(cycle)]
                    cyclic_edges.append((node, nxt))
                    violations.append(
                        Violation(
                            file_path=node,
                            violation_type="Cyclic Dependency",
                            severity="error",
                            source=node,
                            target=nxt,
                            layer=f"{self._infer_layer(node)} <-> {self._infer_layer(nxt)}",
                            description="Circular dependency detected between modules/files.",
                        )
                    )
        return violations, cyclic_edges

    @staticmethod
    def _infer_layer(file_path: str) -> str:
        lowered = PurePosixPath(file_path).as_posix().lower()
        if "/api/" in lowered or "/controllers/" in lowered or lowered.startswith("ui/"):
            return "presentation"
        if "/db/" in lowered or "/repository/" in lowered or "/data/" in lowered:
            return "data"
        if "/infra/" in lowered or "/infrastructure/" in lowered:
            return "infrastructure"
        return "business"

