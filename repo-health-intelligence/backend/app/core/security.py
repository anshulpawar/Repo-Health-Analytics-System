import re
from pathlib import Path
from urllib.parse import urlparse

from app.core.config import get_settings

GITHUB_URL_PATTERN = re.compile(
    r"^https://github\.com/(?P<owner>[A-Za-z0-9_.-]+)/(?P<repo>[A-Za-z0-9_.-]+?)(?:\.git)?/?$"
)


def parse_and_validate_github_url(url: str) -> tuple[str, str]:
    match = GITHUB_URL_PATTERN.match(url.strip())
    if not match:
        raise ValueError("Only public GitHub repository URLs are supported (https://github.com/org/repo).")
    owner = match.group("owner")
    repo = match.group("repo")
    return owner, repo


def normalize_github_url(url: str) -> str:
    owner, repo = parse_and_validate_github_url(url)
    return f"https://github.com/{owner}/{repo}.git"


def safe_repo_local_path(repo_url: str) -> Path:
    parsed = urlparse(normalize_github_url(repo_url))
    repo_name = Path(parsed.path).stem
    settings = get_settings()
    base = Path(settings.local_repo_cache_dir).resolve()
    target = (base / repo_name).resolve()
    if base not in target.parents and target != base:
        raise ValueError("Resolved repository path escaped cache directory.")
    return target

