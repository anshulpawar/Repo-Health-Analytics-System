from pydantic import BaseModel


class DependencyNodeResponse(BaseModel):
    id: str
    label: str
    type: str
    layer: str
    complexity: float
    connections: int


class DependencyEdgeResponse(BaseModel):
    source: str
    target: str
    type: str
    weight: float
    is_cyclic: bool = False


class DependencyGraphResponse(BaseModel):
    nodes: list[DependencyNodeResponse]
    edges: list[DependencyEdgeResponse]
    has_data: bool
    no_data_message: str

