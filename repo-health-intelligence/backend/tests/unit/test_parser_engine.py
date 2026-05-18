from app.analyzers.parser_engine import TreeSitterParserEngine


def test_parser_extracts_python_symbols():
    engine = TreeSitterParserEngine()
    code = """
import os
from typing import List

class Sample:
    pass

def run():
    return os.getcwd()
"""
    result = engine.parse_file("sample.py", code)
    assert "run" in result.functions
    assert "Sample" in result.classes
    assert len(result.imports) >= 1

