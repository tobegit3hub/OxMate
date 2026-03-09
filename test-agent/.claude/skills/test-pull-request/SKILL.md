---
name: test-pull-request
description: |
  Use this skill when the user wants to test a pull request, analyze code changes for testing needs, or generate tests for PR code changes.
  Trigger when the user mentions: "test this PR", "generate tests for PR", "analyze PR #123", "check test coverage for pull request",
  "review PR changes for testing", or any mention of testing code in a pull request context.
  This skill pulls changed files from GitHub PRs, generates appropriate unit/integration tests, runs them, and posts a detailed report.
---

# Test Pull Request Skill

Analyze pull request changes and generate comprehensive tests with a detailed report posted as a PR comment.

## Workflow

1. **Get PR Info** - Fetch PR details and list of changed files from GitHub
2. **Analyze Codebase** - Detect project type, test framework, and existing test patterns
3. **Pull Changes** - Get the diff and changed file contents
4. **Generate Tests** - Create appropriate unit/integration tests for the changes
5. **Run Tests** - Execute tests and collect coverage metrics
6. **Analyze Quality** - Run code quality checks (linting, complexity, etc.)
7. **Post Report** - Publish comprehensive report as a PR comment

## Step-by-Step Instructions

### Step 1: Get PR Information

Ask the user for the PR number if not provided. Use the GitHub MCP tools to fetch:
- PR details (`mcp__github__pull_request_read` with method "get")
- List of changed files (`mcp__github__pull_request_read` with method "get_files")
- PR diff (`mcp__github__pull_request_read` with method "get_diff")

Extract:
- PR title and description
- Base and head branches
- Changed files with status (added, modified, removed)
- File extensions to determine languages

### Step 2: Detect Project Type and Test Framework

Analyze the repository structure to determine:

**Language/Framework Detection:**
- `package.json` exists → Node.js/JavaScript/TypeScript
- `requirements.txt`, `pyproject.toml`, `setup.py` → Python
- `Cargo.toml` → Rust
- `go.mod` → Go
- `pom.xml`, `build.gradle` → Java
- `Gemfile` → Ruby

**Test Framework Detection:**
| Language | Files to Check | Frameworks |
|----------|---------------|------------|
| Python | `pytest.ini`, `setup.cfg`, `pyproject.toml` | pytest, unittest |
| Node.js | `package.json` scripts/test field | jest, mocha, vitest, jasmine |
| Go | File naming convention | built-in testing |
| Rust | `Cargo.toml` | built-in cargo test |
| Java | `pom.xml`, `build.gradle` | JUnit, TestNG |

Look for existing test files to understand naming conventions:
- `*_test.py` or `test_*.py` (Python)
- `*.test.js`, `*.spec.js`, `*.test.ts`, `*.spec.ts` (Node.js)
- `*_test.go` (Go)
- `tests/` directory structure

### Step 3: Pull Changed Files

For each changed file (excluding deleted files):
1. Get file content at HEAD using `mcp__github__get_file_contents` with the PR's head ref
2. For modified files, also get base version if needed for understanding the change
3. Save files temporarily for analysis

### Step 4: Analyze Changes for Test Needs

For each changed file, determine:
- **New functionality** → Generate new tests
- **Modified logic** → Update existing tests or add new ones
- **Bug fixes** → Add regression tests
- **Refactoring** → Verify existing tests still pass

Focus on files that likely need tests:
- Source code files (not config, docs, or assets)
- Functions/classes with logic (not simple data structures)
- Files with low or no existing test coverage

### Step 5: Generate Tests

Based on detected framework, generate appropriate tests:

**Python (pytest):**
```python
# Follow existing project patterns
# Place in tests/ or alongside source
# Name: test_<module>.py or <module>_test.py
```

**JavaScript/TypeScript (jest/vitest):**
```javascript
// Place in __tests__/ or alongside source
// Name: <module>.test.ts or <module>.spec.ts
```

**Go:**
```go
// Place in same package
// Name: <module>_test.go
```

Test generation principles:
1. Cover new/changed functions and methods
2. Test edge cases and error conditions
3. Mock external dependencies appropriately
4. Follow existing test style in the codebase
5. Include docstrings/comments explaining test purpose

Generate tests incrementally - start with core logic, then edge cases.

### Step 6: Run Tests and Collect Metrics

Execute tests using the appropriate command:

```bash
# Python
pytest --cov=<source_dir> --cov-report=xml --cov-report=term

# Node.js
npm test -- --coverage
# or
npx jest --coverage

# Go
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out

# Rust
cargo test
cargo tarpaulin --out Xml  # for coverage
```

Collect:
- Test pass/fail counts
- Coverage percentage (line, branch if available)
- Failed test details with error messages
- Test execution time

### Step 7: Code Quality Analysis

Run appropriate quality checks:

```bash
# Python
flake8 <files>
black --check <files>
mypy <files>
pylint <files>

# Node.js
npx eslint <files>
npx prettier --check <files>
npx tsc --noEmit  # TypeScript

# Go
gofmt -l <files>
golint <files>
go vet ./...

# Rust
cargo clippy
cargo fmt --check
```

Document any issues found.

### Step 8: Generate Report

Create a comprehensive markdown report:

```markdown
## 🤖 Automated Test Report for PR #<number>

### Summary
- **Status**: ✅ All Passed / ❌ Some Failed
- **Tests Added**: <count>
- **Test Results**: <pass>/<total> passed
- **Coverage**: <percentage>% (<change from base if available>)
- **Quality Score**: <A/B/C/D based on issues>

### Files Analyzed
| File | Status | Tests Added | Coverage |
|------|--------|-------------|----------|
| <file> | <new/modified> | <count> | <percent> |

### Generated Tests
<details>
<summary>Click to expand test details</summary>

#### `<test_file_path>`
```<language>
<test code>
```
</details>

### Test Results
```
<test output summary>
```

### Coverage Report
| File | Lines | Covered | Percentage |
|------|-------|---------|------------|
| <file> | <total> | <covered> | <percent> |

### Code Quality
| Check | Status | Issues |
|-------|--------|--------|
| Linting | ✅/❌ | <count> |
| Formatting | ✅/❌ | <count> |
| Type Check | ✅/❌ | <count> |

### Recommendations
- <specific suggestion 1>
- <specific suggestion 2>
```

### Step 9: Post Report as PR Comment

Use `mcp__github__add_issue_comment` (treats PRs as issues):
- owner: from repo URL
- repo: from repo URL
- issue_number: PR number
- body: the generated report

If the report is too long for a single comment:
1. Post summary as main comment
2. Post detailed test files as follow-up comments
3. Or use collapsible sections liberally

## Output

- Tests are generated and saved to appropriate locations
- Test report is posted as a PR comment on GitHub
- Local test results are displayed to the user

## Edge Cases

**No test framework detected:**
- Suggest appropriate framework based on language
- Generate tests in a generic format
- Note in report that framework setup may be needed

**Large PR with many files:**
- Focus on the most critical files first
- Prioritize by: new features > bug fixes > refactors > config changes
- Note in report which files were skipped

**Tests fail to run:**
- Capture error output
- Note setup/configuration issues in report
- Provide recommendations for fixing

**PR is not from GitHub:**
- Check if GitHub MCP tools fail
- Inform user this skill requires GitHub PRs

## Example Usage

**User says:**
> "Test PR #42 for the new authentication module"

**Skill does:**
1. Fetches PR #42 details from GitHub
2. Detects Python/pytest project
3. Analyzes `auth.py` changes
4. Generates `test_auth.py` with unit tests for new functions
5. Runs pytest with coverage
6. Checks code with flake8 and mypy
7. Posts report as PR comment with test results, 87% coverage, and quality score
