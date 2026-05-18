from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession

from app.graph import KnowledgeGraphService
from app.repositories import AnalyticsRepository
from app.schemas.dependency import DependencyEdgeResponse, DependencyGraphResponse, DependencyNodeResponse


class DependencyService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.analytics_repo = AnalyticsRepository(session)
        self.graph_service = KnowledgeGraphService()

    async def graph(self, repository_id: int) -> DependencyGraphResponse:
        edges_db = await self.analytics_repo.get_dependency_edges(repository_id)
        nodes: dict[str, DependencyNodeResponse] = {}
        edges: list[DependencyEdgeResponse] = []

        if edges_db:
            connection_count = defaultdict(int)
            for edge in edges_db:
                connection_count[edge.source_file] += 1
                connection_count[edge.target_file] += 1

            for edge in edges_db:
                for path in (edge.source_file, edge.target_file):
                    if path not in nodes:
                        nodes[path] = DependencyNodeResponse(
                            id=path,
                            label=path.split("/")[-1] if "/" in path else path,
                            type="file",
                            layer=self._layer(path),
                            complexity=0,
                            connections=connection_count[path],
                        )
                edges.append(
                    DependencyEdgeResponse(
                        source=edge.source_file,
                        target=edge.target_file,
                        type=edge.relationship_type.lower(),
                        weight=edge.weight,
                        is_cyclic=edge.is_cyclic,
                    )
                )
        else:
            graph = self.graph_service.dependency_graph_snapshot(repository_id)
            nodes = {item["id"]: DependencyNodeResponse(**item) for item in graph["nodes"]}
            edges = [DependencyEdgeResponse(**edge) for edge in graph["edges"]]

        has_data = len(nodes) > 0
        return DependencyGraphResponse(
            nodes=list(nodes.values()),
            edges=edges,
            has_data=has_data,
            no_data_message="No repository analyzed yet",
        )

    @staticmethod
    def _layer(path: str) -> str:
        lowered = path.lower()
        if "/api/" in lowered:
            return "presentation"
        if "/db/" in lowered:
            return "data"
        if "/infra/" in lowered:
            return "infrastructure"
        return "business"

