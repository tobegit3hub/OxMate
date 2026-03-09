# OxMate

> Your personal dedicated coding agent to work with GitHub.

OxMate is an intelligent GitHub automation framework that uses specialized AI agents to streamline your development workflow. It automates issue analysis, implementation, and testing through a coordinated multi-agent system.

## Overview

OxMate consists of three specialized agents working together to handle your GitHub workflow:

| Agent | Purpose | Location |
|-------|---------|----------|
| **PM Agent** | Analyzes GitHub issues, identifies patterns, and creates summary reports | `pm-agent/` |
| **Dev Agent** | Implements issues end-to-end, from branch creation to pull request | `dev-agent/` |
| **Test Agent** | Generates tests for pull requests and provides quality reports | `test-agent/` |

## Features

- **Issue Analysis**: Automatically analyze open issues, categorize feedback, and identify common themes
- **End-to-End Implementation**: Resolve issues with automated branch creation, coding, and PR creation
- **Automated Testing**: Generate and run tests for pull requests with coverage reports
- **Multi-Language Support**: Works with Python, JavaScript/TypeScript, Go, Rust, Java, and more
- **GitHub Integration**: Native MCP (Model Context Protocol) integration with GitHub

## Installation

```bash
# Clone the repository
git clone https://github.com/tobegit3hub/OxMate.git
cd OxMate

# Install Claude Code CLI (required for skills)
# Follow instructions at: https://github.com/anthropics/claude-code
```

## Usage

### PM Agent - Analyze Issues

Analyze all open issues in a repository and create a summary report:

```bash
# Trigger the PM analysis skill
claude /origin-issue-analyse
```

This will:
1. Fetch all open issues from the repository
2. Categorize by type (bugs, features, questions)
3. Identify patterns and themes
4. Create a comprehensive analysis issue

### Dev Agent - Resolve Issues

Implement a GitHub issue end-to-end:

```bash
# Trigger the resolve issue skill
claude /resolve-issue
```

This will:
1. Fetch issue details from GitHub
2. Create a feature branch
3. Implement the solution
4. Push changes and create a pull request

### Test Agent - Test Pull Requests

Generate and run tests for a pull request:

```bash
# Trigger the test PR skill
claude /test-pull-request
```

This will:
1. Analyze changed files in the PR
2. Detect project type and test framework
3. Generate appropriate tests
4. Run tests and collect coverage metrics
5. Post a detailed report as a PR comment

## Project Structure

```
OxMate/
├── pm-agent/
│   └── .claude/skills/origin-issue-analyse/
│       ├── SKILL.md          # PM analysis workflow
│       └── evals/
├── dev-agent/
│   └── .claude/skills/resolve-issue/
│       └── SKILL.md          # Issue resolution workflow
├── test-agent/
│   ├── .claude/skills/test-pull-request/
│   │   ├── SKILL.md          # PR testing workflow
│   │   └── scripts/          # Helper scripts
│   │       ├── detect_project.py
│   │       ├── run_quality_checks.py
│   │       └── generate_report.py
│   └── game.js               # Example test file
├── LICENSE                   # Apache 2.0
└── README.md
```

## Skills Architecture

Each agent is implemented as a Claude Code skill:

- **Skills** are defined with YAML frontmatter specifying name, description, and trigger conditions
- **Workflows** are documented in Markdown with step-by-step instructions
- **Scripts** (where needed) provide helper functionality for complex tasks

Skills are located in `.claude/skills/<skill-name>/` directories and integrate with the Claude Code CLI.

## Requirements

- [Claude Code CLI](https://github.com/anthropics/claude-code)
- GitHub account with repository access
- Git configured with appropriate credentials

## Supported Languages & Frameworks

| Language | Test Frameworks | Quality Tools |
|----------|-----------------|---------------|
| Python | pytest, unittest | flake8, black, mypy, pylint |
| JavaScript/TypeScript | jest, mocha, vitest | eslint, prettier, tsc |
| Go | built-in testing | gofmt, golint, go vet |
| Rust | cargo test | clippy, rustfmt |
| Java | JUnit, TestNG | checkstyle, spotbugs |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Claude Code](https://github.com/anthropics/claude-code)
- Uses [GitHub MCP](https://github.com/github/github-mcp-server) for GitHub integration
