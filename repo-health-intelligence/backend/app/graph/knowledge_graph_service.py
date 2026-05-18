from collections import defaultdict

import networkx as nx

from app.database.neo4j import get_neo4j_session


class KnowledgeGraphService:
    def upsert_repository(self, repository_id: int, name: str, url: str) -> None:
        query = """
        MERGE (r:Repository {id: $id})
        SET r.name = $name, r.url = $url
        """
        with get_neo4j_session() as session:
            session.run(query, id=repository_id, name=name, url=url)

    def add_commit_node(self, repository_id: int, commit_hash: str, author: str, timestamp: str) -> None:
        query = """
        MATCH (r:Repository {id: $repository_id})
        MERGE (c:Commit {hash: $hash})
        SET c.author = $author, c.timestamp = $timestamp
        MERGE (r)-[:CONTAINS]->(c)
        """
        with get_neo4j_session() as session:
            session.run(
                query,
                repository_id=repository_id,
                hash=commit_hash,
                author=author,
                timestamp=timestamp,
            )

    def add_file_relationships(
        self,
        repository_id: int,
        commit_hash: str,
        file_path: str,
        imports: list[str],
        classes: list[str],
        functions: list[str],
        calls: list[tuple[str, str]],
        inherits: list[tuple[str, str]],
        contributor: str,
    ) -> None:
        with get_neo4j_session() as session:
            session.run(
                """
                MERGE (f:File {path: $file_path, repository_id: $repository_id})
                WITH f
                UNWIND $classes AS class_name
                MERGE (c:Class {name: class_name, file_path: $file_path, repository_id: $repository_id})
                MERGE (f)-[:CONTAINS]->(c)
                """,
                file_path=file_path,
                repository_id=repository_id,
                classes=classes,
            )
            session.run(
                """
                MERGE (f:File {path: $file_path, repository_id: $repository_id})
                WITH f
                UNWIND $functions AS fn
                MERGE (func:Function {name: fn, file_path: $file_path, repository_id: $repository_id})
                MERGE (f)-[:CONTAINS]->(func)
                """,
                file_path=file_path,
                repository_id=repository_id,
                functions=functions,
            )
            session.run(
                """
                MERGE (file:File {path: $file_path, repository_id: $repository_id})
                WITH file
                UNWIND $imports AS dep
                MERGE (depFile:File {path: dep, repository_id: $repository_id})
                MERGE (file)-[:IMPORTS]->(depFile)
                MERGE (file)-[:DEPENDS_ON]->(depFile)
                """,
                file_path=file_path,
                repository_id=repository_id,
                imports=imports,
            )
            if calls:
                session.run(
                    """
                    UNWIND $calls AS call
                    MERGE (caller:Function {name: call.caller, file_path: $file_path, repository_id: $repository_id})
                    MERGE (callee:Function {name: call.callee, repository_id: $repository_id})
                    MERGE (caller)-[:CALLS]->(callee)
                    """,
                    file_path=file_path,
                    repository_id=repository_id,
                    calls=[{"caller": caller, "callee": callee} for caller, callee in calls],
                )
            if inherits:
                session.run(
                    """
                    UNWIND $inherits AS inh
                    MERGE (child:Class {name: inh.child, repository_id: $repository_id})
                    MERGE (parent:Class {name: inh.parent, repository_id: $repository_id})
                    MERGE (child)-[:INHERITS]->(parent)
                    """,
                    repository_id=repository_id,
                    inherits=[{"child": child, "parent": parent} for child, parent in inherits],
                )
            session.run(
                """
                MERGE (contrib:Contributor {name: $contributor, repository_id: $repository_id})
                MERGE (file:File {path: $file_path, repository_id: $repository_id})
                MERGE (contrib)-[:MODIFIED {commit_hash: $commit_hash}]->(file)
                """,
                contributor=contributor,
                repository_id=repository_id,
                file_path=file_path,
                commit_hash=commit_hash,
            )

    def dependency_graph_snapshot(self, repository_id: int) -> dict:
        with get_neo4j_session() as session:
            records = session.run(
                """
                MATCH (f:File {repository_id: $repository_id})-[r:IMPORTS]->(d:File {repository_id: $repository_id})
                RETURN f.path AS source, d.path AS target, type(r) AS relation
                """,
                repository_id=repository_id,
            )
            edges = [{"source": row["source"], "target": row["target"], "type": row["relation"]} for row in records]

        graph = nx.DiGraph()
        for edge in edges:
            graph.add_edge(edge["source"], edge["target"])

        cyclic_edges = set()
        for cycle in nx.simple_cycles(graph):
            if len(cycle) > 1:
                for idx, node in enumerate(cycle):
                    cyclic_edges.add((node, cycle[(idx + 1) % len(cycle)]))

        node_degree = defaultdict(int)
        for source, target in graph.edges():
            node_degree[source] += 1
            node_degree[target] += 1

        nodes = []
        for node in graph.nodes():
            layer = "business"
            lowered = node.lower()
            if "/api/" in lowered:
                layer = "presentation"
            elif "/db/" in lowered:
                layer = "data"
            elif "/infra/" in lowered:
                layer = "infrastructure"
            nodes.append(
                {
                    "id": node,
                    "label": node.split("/")[-1] if "/" in node else node,
                    "type": "file",
                    "layer": layer,
                    "complexity": 0.0,
                    "connections": node_degree[node],
                }
            )

        response_edges = []
        for edge in edges:
            response_edges.append(
                {
                    "source": edge["source"],
                    "target": edge["target"],
                    "type": edge["type"].lower(),
                    "weight": 1.0,
                    "is_cyclic": (edge["source"], edge["target"]) in cyclic_edges,
                }
            )
        return {"nodes": nodes, "edges": response_edges}
