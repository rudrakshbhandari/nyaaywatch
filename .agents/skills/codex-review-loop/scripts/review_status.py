#!/usr/bin/env python3
"""Classify one exact-head GitHub Codex review cycle without side effects."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import json
import re
import subprocess
from typing import Any


CODEX_ACTORS = {
    "chatgpt-codex-connector",
    "chatgpt-codex-connector[bot]",
    "openai-codex",
    "openai-codex[bot]",
    "openai-codex-connector",
    "openai-codex-connector[bot]",
}
class GitHubError(RuntimeError):
    """A GitHub read failed, so monitoring must stop rather than guess."""


@dataclass(frozen=True)
class Snapshot:
    repository: str
    pr: int
    url: str
    state: str
    head: str
    request: dict[str, Any] | None
    reviews: list[dict[str, Any]]
    comments: list[dict[str, Any]]
    reactions: list[dict[str, Any]]
    unresolved_threads: list[dict[str, Any]]
    checks: list[dict[str, Any]]


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def iso_time(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def gh_json(*args: str, accepted: set[int] | None = None) -> Any:
    accepted = accepted or {0}
    result = subprocess.run(["gh", *args], capture_output=True, text=True)
    if result.returncode not in accepted or not result.stdout.strip():
        detail = result.stderr.strip() or result.stdout.strip() or "no output"
        raise GitHubError(detail)
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as error:
        raise GitHubError(f"invalid GitHub JSON: {error}") from error


def required_check_snapshot(
    pr_number: int,
    repository: str,
    required_names: list[str],
) -> list[dict[str, Any]]:
    """Read required checks, treating only gh's explicit empty result as empty."""
    result = subprocess.run(
        [
            "gh", "pr", "checks", str(pr_number), "--repo", repository,
            "--required", "--json",
            "name,state,link,bucket,description,startedAt,completedAt",
        ],
        capture_output=True,
        text=True,
    )
    checks: list[dict[str, Any]]
    if result.stdout.strip():
        if result.returncode not in {0, 1, 8}:
            detail = result.stderr.strip() or result.stdout.strip() or "no output"
            raise GitHubError(detail)
        try:
            checks = json.loads(result.stdout)
        except json.JSONDecodeError as error:
            raise GitHubError(f"invalid GitHub JSON: {error}") from error
        if not isinstance(checks, list):
            raise GitHubError("required checks response was not a JSON array")
    else:
        detail = result.stderr.strip() or result.stdout.strip() or "no output"
        expected_empty = re.search(
            r"no (?:required )?checks reported on the .+ branch",
            detail,
            re.IGNORECASE,
        )
        if result.returncode not in {1, 8} or not expected_empty:
            raise GitHubError(detail)
        checks = []
    return add_missing_required_checks(checks, required_names)


def paginated_api(path: str) -> list[dict[str, Any]]:
    pages = gh_json("api", path, "--paginate", "--slurp")
    return [item for page in pages for item in page]


def add_missing_required_checks(
    checks: list[dict[str, Any]], required_names: list[str],
) -> list[dict[str, Any]]:
    reported_names = {str(check.get("name") or "") for check in checks}
    missing = [name for name in required_names if name not in reported_names]
    return checks + [
        {
            "name": name,
            "state": "PENDING",
            "bucket": "pending",
            "description": "required context has not reported for the captured head",
        }
        for name in missing
    ]


def require_same_head(captured_head: str, observed_head: str) -> None:
    if captured_head != observed_head:
        raise GitHubError(
            "PR head changed while collecting review status "
            f"({captured_head} -> {observed_head})",
        )


def is_marked_request(comment: dict[str, Any], head: str) -> bool:
    user = comment.get("user") or {}
    marker = f"<!-- codex-review-head:{head} -->"
    return (
        user.get("type") != "Bot"
        and "@codex review" in str(comment.get("body", "")).lower()
        and marker in str(comment.get("body", ""))
    )


def review_matches_head(review: dict[str, Any], head: str) -> bool:
    commit = str(review.get("commit_id") or "").lower()
    return bool(commit) and head.lower().startswith(commit)


def is_codex(item: dict[str, Any]) -> bool:
    return (item.get("user") or item.get("author") or {}).get("login") in CODEX_ACTORS


def clean_text(text: str) -> bool:
    normalized = text.lower()
    return (
        "didn't find any major issues" in normalized.replace("’", "'")
        or "no issues found" in normalized
    )


def is_boilerplate_review(text: str) -> bool:
    normalized = text.lower()
    return (
        "### 💡 codex review" in normalized
        and "**reviewed commit:**" in normalized
        and "about codex in github" in normalized
    )


def fetch_threads(repo: str, pr: int) -> list[dict[str, Any]]:
    owner, name = repo.split("/", 1)
    query = """query($owner:String!, $name:String!, $number:Int!, $after:String) {
      repository(owner:$owner, name:$name) { pullRequest(number:$number) {
        reviewThreads(first:100, after:$after) {
          nodes { id isResolved path line comments(first:20) { nodes { body url author { login } } } }
          pageInfo { hasNextPage endCursor }
        }
      } }
    }"""
    threads: list[dict[str, Any]] = []
    cursor: str | None = None
    while True:
        args = [
            "api", "graphql", "-f", f"query={query}", "-F", f"owner={owner}",
            "-F", f"name={name}", "-F", f"number={pr}",
        ]
        if cursor:
            args.extend(["-F", f"after={cursor}"])
        page = gh_json(*args)["data"]["repository"]["pullRequest"]["reviewThreads"]
        threads.extend(page["nodes"])
        if not page["pageInfo"]["hasNextPage"]:
            return threads
        cursor = page["pageInfo"]["endCursor"]


def fetch_snapshot(pr_number: int, repo: str | None) -> Snapshot:
    repo_args = ["--repo", repo] if repo else []
    pr = gh_json(
        "pr", "view", str(pr_number), *repo_args,
        "--json", "state,baseRefName,headRefOid,url",
    )
    repository = repo or gh_json("repo", "view", "--json", "nameWithOwner")["nameWithOwner"]
    head = pr["headRefOid"]
    comments = paginated_api(f"repos/{repository}/issues/{pr_number}/comments")
    requests = [comment for comment in comments if is_marked_request(comment, head)]
    request = max(requests, key=lambda comment: comment["created_at"], default=None)
    reactions = (
        paginated_api(f"repos/{repository}/issues/comments/{request['id']}/reactions")
        if request else []
    )
    reviews = paginated_api(f"repos/{repository}/pulls/{pr_number}/reviews")
    protection = gh_json(
        "api",
        f"repos/{repository}/branches/{pr['baseRefName']}/protection/required_status_checks",
    )
    checks = required_check_snapshot(
        pr_number,
        repository,
        protection.get("contexts") or [],
    )
    threads = fetch_threads(repository, pr_number)
    observed_head = gh_json(
        "pr", "view", str(pr_number), *repo_args, "--json", "headRefOid",
    )["headRefOid"]
    require_same_head(head, observed_head)
    return Snapshot(
        repository=repository,
        pr=pr_number,
        url=pr["url"],
        state=pr["state"],
        head=head,
        request=request,
        reviews=reviews,
        comments=comments,
        reactions=reactions,
        unresolved_threads=[thread for thread in threads if not thread["isResolved"]],
        checks=checks,
    )


def result(snapshot: Snapshot, action: str, reason: str, *, terminal: bool, **extra: Any) -> dict[str, Any]:
    return {
        "repository": snapshot.repository,
        "pr": snapshot.pr,
        "url": snapshot.url,
        "head": snapshot.head,
        "action": action,
        "terminal": terminal,
        "reason": reason,
        "unresolved_thread_count": len(snapshot.unresolved_threads),
        "unresolved_threads": snapshot.unresolved_threads,
        "checks": snapshot.checks,
        **extra,
    }


def classify(snapshot: Snapshot, now: datetime | None = None) -> dict[str, Any]:
    if snapshot.state != "OPEN":
        return result(snapshot, "paused", f"pull request is {snapshot.state.lower()}", terminal=True)

    if snapshot.unresolved_threads:
        return result(snapshot, "fix_feedback", "unresolved review threads", terminal=False)

    if not snapshot.request:
        return result(
            snapshot,
            "request_review",
            "no SHA-marked Codex request exists for this head; merge gates do not suppress a fresh review",
            terminal=False,
            request_command=f"@codex review\n<!-- codex-review-head:{snapshot.head} -->",
        )

    failed_checks = [
        check for check in snapshot.checks
        if check.get("bucket") in {"fail", "cancel", "skipping"}
    ]
    if failed_checks:
        return result(
            snapshot,
            "fix_ci",
            "required checks are not passing",
            terminal=False,
            failed_checks=failed_checks,
        )

    requested_at = snapshot.request["created_at"]
    request_comment_id = str(snapshot.request.get("id") or "")
    current_reviews = [
        review for review in snapshot.reviews
        if is_codex(review)
        and review_matches_head(review, snapshot.head)
        and review.get("submitted_at", "") >= requested_at
    ]
    requested_changes = [review for review in current_reviews if review.get("state") == "CHANGES_REQUESTED"]
    comment_feedback = [
        review for review in current_reviews
        if review.get("state") == "COMMENTED"
        and str(review.get("body") or "").strip()
        and not clean_text(str(review["body"]))
        and not is_boilerplate_review(str(review["body"]))
    ]
    if requested_changes or comment_feedback:
        return result(
            snapshot,
            "fix_feedback",
            "Codex returned review feedback",
            terminal=False,
            feedback_reviews=requested_changes + comment_feedback,
        )

    pending_checks = [check for check in snapshot.checks if check.get("bucket") == "pending"]
    clean_review = any(
        review.get("state") == "APPROVED"
        or clean_text(str(review.get("body") or ""))
        or (
            review.get("state") == "COMMENTED"
            and (
                not str(review.get("body") or "").strip()
                or is_boilerplate_review(str(review.get("body") or ""))
            )
        )
        for review in current_reviews
    )
    clean_reaction = any(
        reaction.get("content") == "+1"
        and is_codex(reaction)
        and reaction.get("created_at", "") >= requested_at
        for reaction in snapshot.reactions
    )
    exact_head_receipt = any(
        is_codex(comment)
        and comment.get("created_at", "") >= requested_at
        and bool(request_comment_id)
        and str(comment.get("body") or "").strip() == f"👍 {request_comment_id}"
        for comment in snapshot.comments
    )
    if clean_review or clean_reaction or exact_head_receipt:
        if pending_checks:
            return result(snapshot, "wait", "Codex is clear; required checks are pending", terminal=False)
        return result(snapshot, "ready", "Codex is clear and all required checks pass", terminal=True)

    return result(snapshot, "wait", "waiting for Codex review; continue polling until a verdict arrives", terminal=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pr", required=True, type=int)
    parser.add_argument("--repo")
    args = parser.parse_args()
    try:
        snapshot = fetch_snapshot(args.pr, args.repo)
        output = classify(snapshot, datetime.now(timezone.utc))
    except (GitHubError, KeyError, TypeError, ValueError) as error:
        output = {
            "action": "paused",
            "terminal": True,
            "reason": f"GitHub snapshot failed: {error}",
        }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
