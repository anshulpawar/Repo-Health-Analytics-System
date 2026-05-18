from contextlib import contextmanager
from typing import Generator

from neo4j import GraphDatabase

from app.core.config import get_settings

settings = get_settings()

driver = GraphDatabase.driver(
    settings.neo4j_uri,
    auth=(settings.neo4j_username, settings.neo4j_password),
)


@contextmanager
def get_neo4j_session() -> Generator:
    with driver.session() as session:
        yield session

