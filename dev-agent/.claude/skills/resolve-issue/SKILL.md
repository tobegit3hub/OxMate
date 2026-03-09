---
name: resolve-issue
description: Implement a GitHub issue by creating a feature branch, implementing the solution, pushing changes, and creating a pull request. Use this skill whenever the user wants to resolve an issue, fix a bug, implement a feature request, or work on any GitHub issue. Also use this when the user mentions implementing issues, working on issues, creating PRs for issues, or fixing bugs in repositories.
---

# Resolve Issue

A skill for implementing GitHub issues end-to-end through the complete workflow.

## Workflow Overview

1. **Fetch Issue Details** - Get the issue information from GitHub
2. **Plan Implementation** - Understand what needs to be done
3. **Create Feature Branch** - Branch off from the default branch
4. **Implement Solution** - Make the code changes (delegate to feature-dev skill)
5. **Commit Changes** - Create commits with appropriate messages
6. **Push Branch** - Push to remote
7. **Create Pull Request** - Open a PR linking back to the issue

## Required Inputs

Before starting, you need:
- `issue_number` - The GitHub issue number to resolve
- `owner` - Repository owner (organization or user)
- `repo` - Repository name

If any of these are missing, ask the user for them.

## Step-by-Step Instructions

### Step 1: Fetch Issue Details

Use the GitHub MCP to get the full issue details:

```
mcp__github__issue_read with:
- owner: <repo owner>
- repo: <repo name>
- issue_number: <issue number>
- method: get
```

Extract the issue title, body, and any labels. These will inform your implementation and PR description.

### Step 2: Plan Implementation

Read the issue carefully and identify:
- What files need to be modified
- What new files need to be created
- What the expected behavior should be
- Any existing code patterns to follow

If the issue description is unclear or lacks sufficient detail, ask the user for clarification before proceeding.

### Step 3: Create Feature Branch

1. First, determine the base branch. Typically this is `main` or `master`, but check if the repository has a different default branch.

2. Create the feature branch with a descriptive name following this pattern:
   - For features: `feature/issue-<number>-<brief-description>`
   - For bugs: `fix/issue-<number>-<brief-description>`
   - For documentation: `docs/issue-<number>-<brief-description>`

Use the GitHub MCP to create the branch:

```
mcp__github__create_branch with:
- owner: <repo owner>
- repo: <repo name>
- branch: <new branch name>
- from_branch: <base branch>
```

### Step 4: Implement Solution

Use the `feature-dev:feature-dev` subagent skill to implement the solution. Delegate the actual coding work to this specialized agent:

**Spawn a subagent with:**
- Skill: `feature-dev:feature-dev` (the guided feature development skill)
- Task: The implementation task based on the issue details
- Context: Include the issue title, body, and any relevant file paths or patterns
- Branch: The feature branch just created

Wait for the subagent to complete the implementation. It will handle:
- Understanding the codebase structure
- Making appropriate code changes
- Following existing code patterns
- Creating/updating tests as needed

### Step 5: Verify Changes

Before committing, verify:
- The changes address the issue requirements
- Code follows the repository's style and patterns
- No unintended files were modified
- Tests pass (if applicable)

Ask the user if they want to review the changes before committing, especially for complex modifications.

### Step 6: Commit Changes

Create a meaningful commit message following conventional commit format:

```
<type>(<scope>): <subject>

<body referencing the issue>

Fixes #<issue_number>
```

Where `<type>` is one of:
- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation changes
- `style` - formatting, missing semicolons, etc.
- `refactor` - code refactoring
- `test` - adding tests
- `chore` - maintenance tasks

Use the Bash tool to create the commit:
```bash
git add <files>
git commit -m "<commit message>"
```

### Step 7: Push Branch

Push the feature branch to the remote repository:

```bash
git push origin <branch-name>
```

### Step 8: Create Pull Request

Create a pull request using the GitHub MCP:

```
mcp__github__create_pull_request with:
- owner: <repo owner>
- repo: <repo name>
- title: <descriptive PR title, often same as issue title>
- body: <PR description>
- head: <feature branch name>
- base: <base branch>
- draft: <true if work-in-progress, false otherwise>
```

**PR Body Template:**
```markdown
## Summary
<Brief description of the changes made>

## Changes
- <List of specific changes>

## Testing
<How the changes were tested>

## Related Issue
Fixes #<issue_number>

---
🤖 Generated with Claude Code
```

## Output

After completing the workflow, provide the user with:
1. Confirmation that the issue has been implemented
2. The name of the feature branch created
3. A link to the created pull request
4. Any important notes or next steps

## Error Handling

If any step fails:
1. Report the error clearly to the user
2. Do not proceed to subsequent steps
3. Ask the user how they want to proceed
4. Common issues:
   - Branch already exists - ask if they want to use existing or create new
   - Push rejected - may need to pull first or force push
   - PR creation fails - check if PR already exists for this branch

## Best Practices

- Always create a feature branch - never commit directly to main/master
- Keep commits focused and atomic
- Reference the issue number in commits and PR
- Use draft PRs for work-in-progress
- Follow the repository's existing code style and patterns
- When in doubt about implementation details, ask the user
