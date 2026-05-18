import logging
import shutil
from pathlib import Path

from git import Repo

from app.core.config import get_settings
from app.core.security import normalize_github_url, safe_repo_local_path

logger = logging.getLogger(__name__)


class GitRepositoryService:
    def __init__(self):
        self.settings = get_settings()

    def clone_or_update(self, repo_url: str, force_refresh: bool = False) -> tuple[Path, str]:
        normalized_url = normalize_github_url(repo_url)
        local_path = safe_repo_local_path(normalized_url)

        if force_refresh and local_path.exists():
            shutil.rmtree(local_path, ignore_errors=True)

        if local_path.exists() and (local_path / ".git").exists():
            repo = Repo(local_path)
            repo.git.fetch("--all")
            default_branch = self._resolve_default_branch(repo)
            repo.git.checkout(default_branch)
            repo.git.pull("origin", default_branch)
            logger.info("Updated existing repository at %s", local_path)
            return local_path, default_branch

        repo = Repo.clone_from(
            normalized_url,
            local_path,
            multi_options=["--no-tags"],
        )
        default_branch = self._resolve_default_branch(repo)
        logger.info("Cloned repository to %s", local_path)
        return local_path, default_branch

    @staticmethod
    def list_commits(repo_path: Path, max_commits: int) -> list:
        repo = Repo(repo_path)
        commits = list(repo.iter_commits(max_count=max_commits))
        commits.reverse()  # oldest to newest for incremental analysis.
        return commits

    @staticmethod
    def get_changed_files(commit) -> list[str]:
        parents = commit.parents
        if not parents:
            return [item.a_path for item in commit.diff(NULL_TREE)]  # type: ignore[name-defined]
        diff = commit.diff(parents[0])
        changed: list[str] = []
        for item in diff:
            if item.a_path:
                changed.append(item.a_path)
            if item.b_path and item.b_path != item.a_path:
                changed.append(item.b_path)
        return sorted(set(path for path in changed if path))

    @staticmethod
    def checkout_commit(repo_path: Path, commit_hash: str) -> None:
        repo = Repo(repo_path)
        repo.git.checkout(commit_hash)

    @staticmethod
    def checkout_branch(repo_path: Path, branch: str) -> None:
        repo = Repo(repo_path)
        repo.git.checkout(branch)

    @staticmethod
    def _resolve_default_branch(repo: Repo) -> str:
        if repo.remotes.origin.refs:
            for ref in repo.remotes.origin.refs:
                if ref.remote_head in {"main", "master"}:
                    return ref.remote_head
            return repo.remotes.origin.refs[0].remote_head
        return "main"


# GitPython requires a symbolic hash for initial commit diffs.
NULL_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"

