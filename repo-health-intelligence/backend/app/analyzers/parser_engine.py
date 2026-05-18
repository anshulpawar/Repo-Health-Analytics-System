from dataclasses import dataclass, field
import re
from pathlib import Path

from tree_sitter_languages import get_parser

from app.utils.language import detect_language


@dataclass
class ParseResult:
    file_path: str
    language: str
    functions: list[str] = field(default_factory=list)
    classes: list[str] = field(default_factory=list)
    imports: list[str] = field(default_factory=list)
    calls: list[tuple[str, str]] = field(default_factory=list)
    inherits: list[tuple[str, str]] = field(default_factory=list)
    dependencies: set[str] = field(default_factory=set)


class TreeSitterParserEngine:
    def __init__(self):
        self.parsers = {}
        for lang_key in ("python", "javascript", "typescript", "java", "go"):
            try:
                self.parsers[lang_key] = get_parser(lang_key)
            except Exception:
                self.parsers[lang_key] = None

    def parse_file(self, file_path: str, content: str) -> ParseResult:
        language = detect_language(file_path)
        result = ParseResult(file_path=file_path, language=language)

        language_key = language.lower()
        parser = self.parsers.get(language_key)
        if parser is not None:
            tree = parser.parse(bytes(content, "utf-8"))
            root = tree.root_node
            self._walk_tree(root, content, result)

        # Lightweight regex fallbacks to improve robustness on unsupported files.
        result.functions.extend(self._regex_functions(content, language))
        result.classes.extend(self._regex_classes(content, language))
        result.imports.extend(self._regex_imports(content, language))
        result.calls.extend(self._regex_calls(content, language))
        result.dependencies.update(result.imports)
        return result

    def _walk_tree(self, node, source: str, result: ParseResult) -> None:
        node_type = node.type
        text = source[node.start_byte : node.end_byte]
        if node_type in {"function_definition", "function_declaration", "method_definition"}:
            name = self._extract_identifier(text)
            if name:
                result.functions.append(name)
        elif node_type in {"class_definition", "class_declaration", "type_declaration"}:
            name = self._extract_identifier(text)
            if name:
                result.classes.append(name)
        elif node_type in {"import_statement", "import_declaration"}:
            result.imports.append(text.splitlines()[0].strip())
        for child in node.children:
            self._walk_tree(child, source, result)

    @staticmethod
    def _extract_identifier(raw: str) -> str:
        match = re.search(r"([A-Za-z_][A-Za-z0-9_]*)", raw)
        return match.group(1) if match else ""

    @staticmethod
    def _regex_functions(content: str, language: str) -> list[str]:
        if language == "Python":
            return re.findall(r"^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)", content, flags=re.MULTILINE)
        if language in {"JavaScript", "TypeScript"}:
            return re.findall(r"^\s*(?:export\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)", content, flags=re.MULTILINE)
        if language == "Java":
            return re.findall(r"(?:public|private|protected)?\s+\w+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(", content)
        if language == "Go":
            return re.findall(r"^\s*func\s+([A-Za-z_][A-Za-z0-9_]*)", content, flags=re.MULTILINE)
        return []

    @staticmethod
    def _regex_classes(content: str, language: str) -> list[str]:
        if language == "Python":
            return re.findall(r"^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)", content, flags=re.MULTILINE)
        return re.findall(r"\bclass\s+([A-Za-z_][A-Za-z0-9_]*)", content)

    @staticmethod
    def _regex_imports(content: str, language: str) -> list[str]:
        if language == "Python":
            matches = re.findall(r"^\s*(?:from\s+([A-Za-z0-9_\.]+)\s+import|import\s+([A-Za-z0-9_\.]+))", content, flags=re.MULTILINE)
            return [left or right for left, right in matches]
        if language in {"JavaScript", "TypeScript"}:
            return re.findall(r"from\s+[\"']([^\"']+)[\"']", content)
        if language == "Go":
            return re.findall(r"\"([A-Za-z0-9_\/\.\-]+)\"", content)
        if language == "Java":
            return re.findall(r"^\s*import\s+([A-Za-z0-9_\.]+);", content, flags=re.MULTILINE)
        return []

    @staticmethod
    def _regex_calls(content: str, language: str) -> list[tuple[str, str]]:
        callers = []
        if language == "Python":
            for line in content.splitlines():
                match = re.findall(r"([A-Za-z_][A-Za-z0-9_]*)\(", line)
                if match:
                    caller = match[0]
                    for callee in match[1:]:
                        callers.append((caller, callee))
        return callers


def relative_repo_path(repo_root: Path, absolute_path: Path) -> str:
    try:
        return absolute_path.resolve().relative_to(repo_root.resolve()).as_posix()
    except Exception:
        return absolute_path.name
