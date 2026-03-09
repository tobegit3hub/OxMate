#!/usr/bin/env python3
"""
Detect project type, language, and test framework from repository structure.
Outputs JSON with detected configuration.
"""

import json
import os
import sys
from pathlib import Path


def detect_project_type(repo_path="."):
    """Detect project language and framework from files."""
    repo = Path(repo_path)
    result = {
        "languages": [],
        "primary_language": None,
        "test_framework": None,
        "test_pattern": None,
        "package_manager": None,
        "has_tests": False,
        "test_commands": []
    }

    # Check for Node.js
    if (repo / "package.json").exists():
        result["languages"].append("javascript")
        result["primary_language"] = "javascript"
        result["package_manager"] = "npm"

        pkg = json.loads((repo / "package.json").read_text())
        deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

        # Detect test framework
        if "jest" in deps:
            result["test_framework"] = "jest"
            result["test_pattern"] = ["*.test.js", "*.test.ts", "*.spec.js", "*.spec.ts"]
        elif "vitest" in deps:
            result["test_framework"] = "vitest"
            result["test_pattern"] = ["*.test.ts", "*.spec.ts"]
        elif "mocha" in deps:
            result["test_framework"] = "mocha"
            result["test_pattern"] = ["*.test.js", "*.spec.js"]
        elif "jasmine" in deps:
            result["test_framework"] = "jasmine"
            result["test_pattern"] = ["*.spec.js"]

        # Detect TypeScript
        if "typescript" in deps or (repo / "tsconfig.json").exists():
            result["languages"].append("typescript")
            if result["primary_language"] == "javascript":
                result["primary_language"] = "typescript"

    # Check for Python
    if any((repo / f).exists() for f in ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile"]):
        result["languages"].append("python")
        if not result["primary_language"]:
            result["primary_language"] = "python"
        result["package_manager"] = "pip"

        # Detect test framework
        if (repo / "pytest.ini").exists() or (repo / "pyproject.toml").exists():
            result["test_framework"] = "pytest"
        elif (repo / "setup.py").exists() or (repo / "tox.ini").exists():
            result["test_framework"] = "pytest"  # Default to pytest
        else:
            result["test_framework"] = "unittest"

        result["test_pattern"] = ["test_*.py", "*_test.py"]

    # Check for Go
    if (repo / "go.mod").exists():
        result["languages"].append("go")
        if not result["primary_language"]:
            result["primary_language"] = "go"
        result["test_framework"] = "go test"
        result["test_pattern"] = ["*_test.go"]
        result["package_manager"] = "go"

    # Check for Rust
    if (repo / "Cargo.toml").exists():
        result["languages"].append("rust")
        if not result["primary_language"]:
            result["primary_language"] = "rust"
        result["test_framework"] = "cargo test"
        result["test_pattern"] = ["tests/*.rs", "*_test.rs"]
        result["package_manager"] = "cargo"

    # Check for Java
    if any((repo / f).exists() for f in ["pom.xml", "build.gradle", "build.gradle.kts"]):
        result["languages"].append("java")
        if not result["primary_language"]:
            result["primary_language"] = "java"
        result["package_manager"] = "maven" if (repo / "pom.xml").exists() else "gradle"
        result["test_pattern"] = ["*Test.java", "*Tests.java"]

    # Check for existing tests
    test_dirs = ["tests", "test", "__tests__", "spec", "specs"]
    for test_dir in test_dirs:
        if (repo / test_dir).is_dir():
            result["has_tests"] = True
            break

    # Check for test files in root
    if not result["has_tests"] and result["test_pattern"]:
        for pattern in result["test_pattern"]:
            import glob
            if glob.glob(str(repo / pattern)):
                result["has_tests"] = True
                break

    # Build test commands
    result["test_commands"] = build_test_commands(result)

    return result


def build_test_commands(config):
    """Build appropriate test commands based on configuration."""
    commands = []
    lang = config["primary_language"]
    framework = config["test_framework"]

    if lang == "python":
        if framework == "pytest":
            commands = [
                "pytest --cov=. --cov-report=xml --cov-report=term-missing",
                "pytest -v"
            ]
        else:
            commands = ["python -m unittest discover -v"]
    elif lang == "javascript" or lang == "typescript":
        if framework == "jest":
            commands = ["npm test -- --coverage", "npx jest --coverage"]
        elif framework == "vitest":
            commands = ["npx vitest run --coverage", "npm test -- --coverage"]
        elif framework == "mocha":
            commands = ["npm test", "npx mocha"]
        else:
            commands = ["npm test"]
    elif lang == "go":
        commands = [
            "go test -v -coverprofile=coverage.out ./...",
            "go tool cover -func=coverage.out"
        ]
    elif lang == "rust":
        commands = ["cargo test", "cargo tarpaulin --out Xml"]
    elif lang == "java":
        if config["package_manager"] == "maven":
            commands = ["mvn test", "mvn jacoco:report"]
        else:
            commands = ["./gradlew test", "./gradlew jacocoTestReport"]

    return commands


def main():
    repo_path = sys.argv[1] if len(sys.argv) > 1 else "."
    result = detect_project_type(repo_path)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
