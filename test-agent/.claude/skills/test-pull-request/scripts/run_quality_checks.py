#!/usr/bin/env python3
"""
Run code quality checks and return structured results.
"""

import json
import os
import subprocess
import sys
from pathlib import Path


def run_command(cmd: str, cwd: str = ".") -> tuple:
    """Run a command and return (success, output)."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode == 0, result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        return False, "Command timed out"
    except Exception as e:
        return False, str(e)


def check_python_quality(files: list, repo_path: str) -> dict:
    """Run Python quality checks."""
    results = {
        "linting": {"passed": True, "issues": 0, "output": ""},
        "formatting": {"passed": True, "issues": 0, "output": ""},
        "type_check": {"passed": True, "issues": 0, "output": ""},
    }

    # Filter to Python files only
    py_files = [f for f in files if f.endswith(".py")]
    if not py_files:
        return results

    file_str = " ".join(py_files)

    # Flake8 linting
    success, output = run_command(f"flake8 {file_str}", repo_path)
    if not success:
        results["linting"]["passed"] = False
        results["linting"]["issues"] = output.count("\n")
        results["linting"]["output"] = output

    # Black formatting check
    success, output = run_command(f"black --check --diff {file_str}", repo_path)
    if not success:
        results["formatting"]["passed"] = False
        results["formatting"]["issues"] = output.count("---")
        results["formatting"]["output"] = output

    # MyPy type checking (if config exists)
    if any(Path(repo_path).glob("**/mypy.ini")) or (Path(repo_path) / "pyproject.toml").exists():
        success, output = run_command(f"mypy {file_str}", repo_path)
        if not success:
            results["type_check"]["passed"] = False
            results["type_check"]["issues"] = output.count("error:")
            results["type_check"]["output"] = output

    return results


def check_javascript_quality(files: list, repo_path: str) -> dict:
    """Run JavaScript/TypeScript quality checks."""
    results = {
        "linting": {"passed": True, "issues": 0, "output": ""},
        "formatting": {"passed": True, "issues": 0, "output": ""},
        "type_check": {"passed": True, "issues": 0, "output": ""},
    }

    # Filter to JS/TS files
    js_files = [f for f in files if f.endswith((".js", ".ts", ".jsx", ".tsx"))]
    if not js_files:
        return results

    file_str = " ".join(js_files)

    # ESLint
    success, output = run_command(f"npx eslint {file_str}", repo_path)
    if not success:
        results["linting"]["passed"] = False
        results["linting"]["issues"] = output.count("error")
        results["linting"]["output"] = output

    # Prettier
    success, output = run_command(f"npx prettier --check {file_str}", repo_path)
    if not success:
        results["formatting"]["passed"] = False
        results["formatting"]["issues"] = output.count("Would reformat")
        results["formatting"]["output"] = output

    # TypeScript check
    if any(f.endswith(".ts") for f in js_files):
        success, output = run_command("npx tsc --noEmit", repo_path)
        if not success:
            results["type_check"]["passed"] = False
            results["type_check"]["issues"] = output.count("error TS")
            results["type_check"]["output"] = output

    return results


def check_go_quality(files: list, repo_path: str) -> dict:
    """Run Go quality checks."""
    results = {
        "linting": {"passed": True, "issues": 0, "output": ""},
        "formatting": {"passed": True, "issues": 0, "output": ""},
        "type_check": {"passed": True, "issues": 0, "output": ""},
    }

    go_files = [f for f in files if f.endswith(".go")]
    if not go_files:
        return results

    # gofmt
    success, output = run_command(f"gofmt -l {' '.join(go_files)}", repo_path)
    if output.strip():
        results["formatting"]["passed"] = False
        results["formatting"]["issues"] = len(output.strip().split("\n"))
        results["formatting"]["output"] = output

    # go vet
    success, output = run_command("go vet ./...", repo_path)
    if not success:
        results["linting"]["passed"] = False
        results["linting"]["issues"] = output.count(":")
        results["linting"]["output"] = output

    return results


def check_rust_quality(files: list, repo_path: str) -> dict:
    """Run Rust quality checks."""
    results = {
        "linting": {"passed": True, "issues": 0, "output": ""},
        "formatting": {"passed": True, "issues": 0, "output": ""},
        "type_check": {"passed": True, "issues": 0, "output": ""},
    }

    rust_files = [f for f in files if f.endswith(".rs")]
    if not rust_files:
        return results

    # cargo clippy
    success, output = run_command("cargo clippy -- -D warnings", repo_path)
    if not success:
        results["linting"]["passed"] = False
        results["linting"]["issues"] = output.count("warning:") + output.count("error:")
        results["linting"]["output"] = output

    # cargo fmt
    success, output = run_command("cargo fmt -- --check", repo_path)
    if not success:
        results["formatting"]["passed"] = False
        results["formatting"]["issues"] = 1  # fmt doesn't give count
        results["formatting"]["output"] = output

    return results


def main():
    if len(sys.argv) < 3:
        print("Usage: run_quality_checks.py <language> <file1> [file2] ...", file=sys.stderr)
        sys.exit(1)

    language = sys.argv[1]
    files = sys.argv[2:]
    repo_path = os.getenv("REPO_PATH", ".")

    checkers = {
        "python": check_python_quality,
        "javascript": check_javascript_quality,
        "typescript": check_javascript_quality,
        "go": check_go_quality,
        "rust": check_rust_quality,
    }

    checker = checkers.get(language)
    if not checker:
        print(json.dumps({
            "error": f"No quality checker for {language}",
            "linting": {"passed": True, "issues": 0},
            "formatting": {"passed": True, "issues": 0},
            "type_check": {"passed": True, "issues": 0},
        }))
        return

    results = checker(files, repo_path)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
