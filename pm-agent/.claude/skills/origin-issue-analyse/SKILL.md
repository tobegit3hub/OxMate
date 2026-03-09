---
name: origin-issue-analyse
description: Analyze GitHub repository issues and create detailed summary issues. Use this skill when the user wants to analyze open issues in a GitHub repository, summarize issue patterns, categorize feedback, identify common themes, or create a comprehensive analysis issue based on existing issues. This is especially useful for product managers and maintainers who need to understand the state of their issue backlog and communicate findings to stakeholders.
---

# AI Platform PM Analysis Skill

This skill helps you analyze GitHub repository issues and create detailed summary issues with insights, patterns, and recommendations.

## Workflow Overview

1. **Fetch Issues**: Retrieve all open issues from the target repository using GitHub MCP
2. **Analyze**: Process and analyze the issues to identify patterns, themes, and priorities
3. **Create Summary Issue**: Generate a new detailed issue with the analysis results

## Step 1: Fetch Open Issues

Use the GitHub MCP `list_issues` tool to retrieve all open issues:

```
Tool: mcp__github__list_issues
Parameters:
  - owner: Repository owner (e.g., "tobegit3hub")
  - repo: Repository name (e.g., "OxMate")
  - state: "OPEN"
  - perPage: 100 (maximum to get all issues)
```

If there are more than 100 issues, paginate through results using the `page` parameter.

## Step 2: Analyze Issues

For each issue, extract and consider:
- **Title and description**: What is the issue about?
- **Labels**: Categorization tags
- **Creation date**: How old is the issue?
- **Comments**: Engagement level
- **Author**: Who reported it?

### Analysis Dimensions

Perform analysis across these dimensions:

1. **Category Distribution**
   - Bug reports
   - Feature requests
   - Questions/Discussions
   - Documentation issues

2. **Priority Assessment**
   - Critical: Blocks usage, security issues
   - High: Major functionality missing/broken
   - Medium: Improvements, minor bugs
   - Low: Nice-to-have, cosmetic

3. **Theme Identification**
   - Common keywords/topics
   - Related issues that could be grouped
   - Recurring pain points

4. **Timeline Analysis**
   - Recently created issues
   - Stale issues (no activity for 30+ days)
   - Issue velocity (creation rate)

## Step 3: Create Analysis Issue

Use the GitHub MCP `issue_write` tool with method "create" to create a new issue:

```
Tool: mcp__github__issue_write
Parameters:
  - method: "create"
  - owner: Repository owner
  - repo: Repository name
  - title: Descriptive title with [PM Analysis] prefix
  - body: Formatted analysis content
  - labels: ["pm-analysis", "meta"]
```

### Issue Body Template

```markdown
# Issue Analysis Report

**Repository**: owner/repo
**Analysis Date**: YYYY-MM-DD
**Total Open Issues**: N

## Summary

Brief overview of the current state of open issues.

## Category Breakdown

| Category | Count | Percentage |
|----------|-------|------------|
| Bug Reports | N | X% |
| Feature Requests | N | X% |
| Questions | N | X% |
| Documentation | N | X% |

## Priority Distribution

- 🔴 **Critical**: N issues
- 🟠 **High**: N issues
- 🟡 **Medium**: N issues
- 🟢 **Low**: N issues

## Key Themes

### Theme 1: [Theme Name]
- Issue #123: Brief description
- Issue #124: Brief description

### Theme 2: [Theme Name]
- Issue #125: Brief description
- Issue #126: Brief description

## Stale Issues (30+ days inactive)

- Issue #100: Title (last activity: date)
- Issue #101: Title (last activity: date)

## Recommendations

1. **Immediate Action**: Critical issues requiring urgent attention
2. **Short-term**: High priority bugs to fix this sprint
3. **Long-term**: Feature requests to consider for roadmap

## Notable Issues

- Most discussed: Issue #X (N comments)
- Most recent: Issue #Y (created on date)
```

## Example Usage

**User prompt**: "Analyze all open issues in tobegit3hub/OxMate and create a summary"

**Execution**:
1. List all open issues from tobegit3hub/OxMate
2. Analyze the data
3. Create a new issue titled "[PM Analysis] Open Issues Summary - YYYY-MM-DD"

## Edge Cases

- **No open issues**: Create an issue stating "No open issues found" with congratulations message
- **Many issues (>100)**: Note in the analysis that pagination was used and provide sampling methodology
- **All issues are similar**: Focus analysis on specific sub-categories rather than broad themes
- **Repository not found**: Report error to user with suggested fixes

## Tips for Better Analysis

- Look for patterns in issue titles (common words, similar requests)
- Consider the age of issues when prioritizing
- Group related issues together for easier tracking
- Highlight issues with high community engagement (many comments)
- Note any issues that appear to be duplicates
