#!/usr/bin/env bash

set -euo pipefail

usage() {
  echo "Usage: $0 <type> <slug> [base-branch]" >&2
  echo "Example: $0 feat published-snapshot-api main" >&2
}

if [[ $# -lt 2 || $# -gt 3 ]]; then
  usage
  exit 1
fi

task_type="$1"
task_slug="$2"
base_branch="${3:-main}"

case "$task_type" in
  feat|fix|docs|refactor|test|chore|build)
    ;;
  *)
    echo "Unsupported task type: $task_type" >&2
    exit 1
    ;;
esac

if [[ ! "$task_slug" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Slug must be lowercase kebab-case." >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

current_branch="$(git branch --show-current)"
if [[ "$current_branch" == "main" ]]; then
  echo "Refusing to start a task branch while checked out on main. Create a separate worktree or switch away first." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash changes before starting a new task branch." >&2
  exit 1
fi

branch_name="${task_type}/${task_slug}"

if git show-ref --verify --quiet "refs/heads/${branch_name}"; then
  echo "Local branch already exists: ${branch_name}" >&2
  exit 1
fi

if ! git show-ref --verify --quiet "refs/heads/${base_branch}"; then
  echo "Base branch does not exist locally: ${base_branch}" >&2
  exit 1
fi

git checkout -b "$branch_name" "$base_branch"
echo "Created and switched to ${branch_name}"
