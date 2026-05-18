from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    app_name: str = "Repo Health Intelligence API"
    app_env: str = "development"
    app_debug: bool = True
    app_version: str = "1.0.0"

    api_prefix: str = "/api/v1"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    postgres_user: str = "repohealth"
    postgres_password: str = "repohealth"
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "repohealth"

    redis_url: str = "redis://localhost:6379/0"

    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_username: str = "neo4j"
    neo4j_password: str = "neo4jpassword"

    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    local_repo_cache_dir: str = str(Path.cwd() / ".repo_cache")
    max_commits_per_analysis: int = 600
    analysis_batch_size: int = 100
    clone_timeout_seconds: int = 600
    rate_limit_per_minute: int = 120

    @property
    def async_database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def sync_database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @field_validator("app_env")
    @classmethod
    def validate_env(cls, value: str) -> str:
        allowed = {"development", "staging", "production", "test"}
        if value not in allowed:
            raise ValueError(f"app_env must be one of {allowed}")
        return value


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    Path(settings.local_repo_cache_dir).mkdir(parents=True, exist_ok=True)
    return settings

