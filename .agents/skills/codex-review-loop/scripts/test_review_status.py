#!/usr/bin/env python3
"""Fixture-based regression tests for Codex review-loop terminal actions."""

from datetime import datetime, timezone
import importlib.util
from pathlib import Path
import sys
import unittest
from subprocess import CompletedProcess
from unittest.mock import patch


MODULE_PATH = Path(__file__).with_name("review_status.py")
SPEC = importlib.util.spec_from_file_location("review_status", MODULE_PATH)
review_status = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = review_status
SPEC.loader.exec_module(review_status)

HEAD = "a" * 40
REQUESTED_AT = "2026-08-01T12:00:00Z"
NOW = datetime(2026, 8, 1, 12, 5, tzinfo=timezone.utc)


def fixture(**overrides):
    data = {
        "repository": "rudrakshbhandari/nyaaywatch",
        "pr": 428,
        "url": "https://github.com/rudrakshbhandari/nyaaywatch/pull/428",
        "state": "OPEN",
        "head": HEAD,
        "request": {"id": 100, "created_at": REQUESTED_AT},
        "reviews": [],
        "comments": [],
        "reactions": [],
        "unresolved_threads": [],
        "checks": [{"name": "CI", "bucket": "pass"}],
    }
    data.update(overrides)
    return review_status.Snapshot(**data)


class ReviewLoopClassifierTest(unittest.TestCase):
    def test_no_reported_checks_are_synthesized_pending_before_review_request(self):
        with patch.object(
            review_status.subprocess,
            "run",
            return_value=CompletedProcess(
                args=["gh", "pr", "checks"],
                returncode=1,
                stdout="",
                stderr="no required checks reported on the 'feature' branch",
            ),
        ):
            checks = review_status.required_check_snapshot(
                428,
                "rudrakshbhandari/nyaaywatch",
                ["CI"],
            )

        self.assertEqual(checks[0]["bucket"], "pending")
        verdict = review_status.classify(fixture(request=None, checks=checks), NOW)
        self.assertEqual(verdict["action"], "request_review")
        self.assertFalse(verdict["terminal"])

    def test_unexpected_empty_checks_error_still_pauses_snapshot(self):
        with patch.object(
            review_status.subprocess,
            "run",
            return_value=CompletedProcess(
                args=["gh", "pr", "checks"],
                returncode=1,
                stdout="",
                stderr="error connecting to api.github.com",
            ),
        ):
            with self.assertRaisesRegex(
                review_status.GitHubError,
                "error connecting to api.github.com",
            ):
                review_status.required_check_snapshot(
                    428,
                    "rudrakshbhandari/nyaaywatch",
                    ["CI"],
                )

    def test_missing_required_context_is_synthesized_as_pending(self):
        checks = review_status.add_missing_required_checks(
            [{"name": "CI", "bucket": "pass"}],
            ["CI", "Azure Preview Build"],
        )
        self.assertEqual(checks[-1]["name"], "Azure Preview Build")
        self.assertEqual(checks[-1]["bucket"], "pending")

    def test_head_change_during_snapshot_is_rejected(self):
        with self.assertRaises(review_status.GitHubError):
            review_status.require_same_head(HEAD, "b" * 40)

    def test_snapshot_confirms_head_after_fetching_threads(self):
        threads_fetched = []
        pr_reads = 0

        def fake_gh_json(*args, **_kwargs):
            nonlocal pr_reads
            if args[:3] == ("pr", "view", "428"):
                pr_reads += 1
                if pr_reads == 2:
                    self.assertTrue(threads_fetched)
                    return {"headRefOid": HEAD}
                return {"state": "OPEN", "baseRefName": "main", "headRefOid": HEAD, "url": "https://example.test/pr/428"}
            if args[:3] == ("pr", "checks", "428"):
                return []
            if args[:2] == ("api", "repos/rudrakshbhandari/nyaaywatch/branches/main/protection/required_status_checks"):
                return {"contexts": []}
            self.fail(f"unexpected gh call: {args}")

        def fake_threads(_repo, _pr):
            threads_fetched.append(True)
            return []

        with (
            patch.object(review_status, "gh_json", side_effect=fake_gh_json),
            patch.object(
                review_status.subprocess,
                "run",
                return_value=CompletedProcess(
                    args=["gh", "pr", "checks"],
                    returncode=1,
                    stdout="",
                    stderr="no required checks reported on the 'main' branch",
                ),
            ),
            patch.object(review_status, "paginated_api", side_effect=[[], []]),
            patch.object(review_status, "fetch_threads", side_effect=fake_threads),
        ):
            snapshot = review_status.fetch_snapshot(428, "rudrakshbhandari/nyaaywatch")
        self.assertEqual(snapshot.head, HEAD)

    def test_requires_an_exact_full_head_marker(self):
        comment = {"body": "@codex review\n<!-- codex-review-head:" + HEAD + " -->", "user": {"type": "User"}}
        self.assertTrue(review_status.is_marked_request(comment, HEAD))
        self.assertFalse(review_status.is_marked_request({**comment, "body": "@codex review"}, HEAD))
        self.assertFalse(review_status.is_marked_request({**comment, "body": comment["body"].replace(HEAD, HEAD[:7])}, HEAD))

    def test_clean_review_with_passing_checks_is_ready_and_never_polls_again(self):
        review = {"user": {"login": "openai-codex"}, "commit_id": HEAD, "submitted_at": REQUESTED_AT, "state": "APPROVED", "body": ""}
        verdict = review_status.classify(fixture(reviews=[review]), NOW)
        self.assertEqual(verdict["action"], "ready")
        self.assertTrue(verdict["terminal"])

    def test_empty_commented_review_with_no_threads_is_a_terminal_clean_verdict(self):
        review = {"user": {"login": "openai-codex"}, "commit_id": HEAD, "submitted_at": REQUESTED_AT, "state": "COMMENTED", "body": ""}
        verdict = review_status.classify(fixture(reviews=[review]), NOW)
        self.assertEqual(verdict["action"], "ready")
        self.assertTrue(verdict["terminal"])

    def test_boilerplate_commented_review_with_no_threads_is_a_terminal_clean_verdict(self):
        review = {"user": {"login": "openai-codex"}, "commit_id": HEAD, "submitted_at": REQUESTED_AT, "state": "COMMENTED", "body": "### 💡 Codex Review\n**Reviewed commit:** `abc`\nAbout Codex in GitHub"}
        verdict = review_status.classify(fixture(reviews=[review]), NOW)
        self.assertEqual(verdict["action"], "ready")
        self.assertTrue(verdict["terminal"])

    def test_clean_review_waits_only_for_pending_required_checks(self):
        review = {"user": {"login": "openai-codex"}, "commit_id": HEAD, "submitted_at": REQUESTED_AT, "state": "APPROVED", "body": ""}
        verdict = review_status.classify(fixture(reviews=[review], checks=[{"name": "CI", "bucket": "pending"}]), NOW)
        self.assertEqual(verdict["action"], "wait")
        self.assertFalse(verdict["terminal"])

    def test_codex_clear_waits_for_required_checks_without_timing_out(self):
        review = {"user": {"login": "openai-codex"}, "commit_id": HEAD, "submitted_at": REQUESTED_AT, "state": "APPROVED", "body": ""}
        verdict = review_status.classify(
            fixture(reviews=[review], checks=[{"name": "CI", "bucket": "pending"}]),
            datetime(2026, 8, 1, 12, 45, tzinfo=timezone.utc),
        )
        self.assertEqual(verdict["action"], "wait")
        self.assertFalse(verdict["terminal"])

    def test_completed_review_is_ready_regardless_of_elapsed_time(self):
        review = {"user": {"login": "openai-codex"}, "commit_id": HEAD, "submitted_at": REQUESTED_AT, "state": "APPROVED", "body": ""}
        verdict = review_status.classify(fixture(reviews=[review]), datetime(2026, 8, 1, 12, 16, tzinfo=timezone.utc))
        self.assertEqual(verdict["action"], "ready")
        self.assertTrue(verdict["terminal"])

    def test_codex_thumbs_up_is_a_clean_review(self):
        reaction = {"content": "+1", "created_at": REQUESTED_AT, "user": {"login": "openai-codex"}}
        verdict = review_status.classify(fixture(reactions=[reaction]), NOW)
        self.assertEqual(verdict["action"], "ready")
        self.assertTrue(verdict["terminal"])

    def test_clean_comment_from_prior_head_does_not_approve_current_head(self):
        stale_comment = {
            "user": {"login": "openai-codex"},
            "created_at": "2026-08-01T12:01:00Z",
            "body": "No issues found on bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        }
        verdict = review_status.classify(fixture(comments=[stale_comment]), NOW)
        self.assertEqual(verdict["action"], "wait")
        self.assertFalse(verdict["terminal"])

    def test_exact_request_thumbsup_comment_is_a_clean_verdict(self):
        comment = {
            "user": {"login": "openai-codex"},
            "created_at": REQUESTED_AT,
            "body": "👍 100",
        }
        verdict = review_status.classify(fixture(comments=[comment]), NOW)
        self.assertEqual(verdict["action"], "ready")

    def test_exact_head_clean_comment_receipt_is_accepted(self):
        self.assertTrue(review_status.clean_text("Codex Review: Didn’t find any major issues."))

    def test_clean_receipt_comment_must_name_current_head(self):
        comment = {
            "user": {"login": "openai-codex"},
            "created_at": REQUESTED_AT,
            "body": f"Codex Review: Didn’t find any major issues. **Reviewed commit:** `{HEAD[:12]}`",
        }
        self.assertTrue(review_status.clean_comment_matches_request(comment, HEAD, {"id": 100}))
        stale = {**comment, "body": "Codex Review: Didn’t find any major issues. **Reviewed commit:** `bbbbbbb`"}
        self.assertFalse(review_status.clean_comment_matches_request(stale, HEAD, {"id": 100}))

    def test_boilerplate_review_does_not_mask_a_clean_reaction(self):
        review = {"user": {"login": "openai-codex"}, "commit_id": HEAD, "submitted_at": REQUESTED_AT, "state": "COMMENTED", "body": "### 💡 Codex Review\n**Reviewed commit:** `abc`\nAbout Codex in GitHub"}
        reaction = {"content": "+1", "created_at": REQUESTED_AT, "user": {"login": "openai-codex"}}
        verdict = review_status.classify(fixture(reviews=[review], reactions=[reaction]), NOW)
        self.assertEqual(verdict["action"], "ready")
        self.assertTrue(verdict["terminal"])

    def test_codex_change_request_requires_remediation(self):
        review = {"user": {"login": "openai-codex"}, "commit_id": HEAD, "submitted_at": REQUESTED_AT, "state": "CHANGES_REQUESTED", "body": "Fix this"}
        verdict = review_status.classify(fixture(reviews=[review]), NOW)
        self.assertEqual(verdict["action"], "fix_feedback")
        self.assertFalse(verdict["terminal"])

    def test_failed_required_check_requires_remediation(self):
        verdict = review_status.classify(fixture(checks=[{"name": "CI", "bucket": "fail"}]), NOW)
        self.assertEqual(verdict["action"], "fix_ci")
        self.assertFalse(verdict["terminal"])

    def test_no_verdict_keeps_waiting_without_a_timeout(self):
        verdict = review_status.classify(fixture(), datetime(2026, 8, 1, 13, 0, tzinfo=timezone.utc))
        self.assertEqual(verdict["action"], "wait")
        self.assertFalse(verdict["terminal"])

    def test_new_head_without_a_marker_requests_one_new_review(self):
        verdict = review_status.classify(fixture(request=None), NOW)
        self.assertEqual(verdict["action"], "request_review")
        self.assertFalse(verdict["terminal"])
        self.assertIn(HEAD, verdict["request_command"])

    def test_failed_required_check_does_not_suppress_a_missing_review_request(self):
        verdict = review_status.classify(
            fixture(request=None, checks=[{"name": "CI", "bucket": "fail"}]),
            NOW,
        )
        self.assertEqual(verdict["action"], "request_review")
        self.assertFalse(verdict["terminal"])

    def test_closed_pr_pauses_without_another_poll(self):
        verdict = review_status.classify(fixture(state="MERGED"), NOW)
        self.assertEqual(verdict["action"], "paused")
        self.assertTrue(verdict["terminal"])


if __name__ == "__main__":
    unittest.main()
