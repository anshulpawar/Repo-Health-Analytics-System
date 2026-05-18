import pytest

from app.core.security import normalize_github_url, parse_and_validate_github_url


def test_parse_valid_github_url():
    owner, repo = parse_and_validate_github_url("https://github.com/openai/openai-python")
    assert owner == "openai"
    assert repo == "openai-python"


def test_normalize_url_adds_git_suffix():
    normalized = normalize_github_url("https://github.com/openai/openai-python")
    assert normalized == "https://github.com/openai/openai-python.git"


def test_invalid_url_rejected():
    with pytest.raises(ValueError):
        parse_and_validate_github_url("https://gitlab.com/org/repo")

