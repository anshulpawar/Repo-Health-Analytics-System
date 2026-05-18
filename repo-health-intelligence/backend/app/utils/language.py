from pathlib import Path

LANGUAGE_BY_EXTENSION = {
    ".py": "Python",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".java": "Java",
    ".go": "Go",
}


def detect_language(file_path: str) -> str:
    suffix = Path(file_path).suffix.lower()
    return LANGUAGE_BY_EXTENSION.get(suffix, "Unknown")

