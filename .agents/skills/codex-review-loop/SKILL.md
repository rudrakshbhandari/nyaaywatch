---
name: codex-review-loop
description: Keep a NyaayWatch pull request in an exact-head Codex review loop until Codex gives a clean verdict and required checks pass.
---

# NyaayWatch Codex Review Loop

Use this skill when asked to get a Codex review on a NyaayWatch pull request and keep addressing feedback until the current head is clear.

Get one current-head snapshot with:

```bash
python3 .agents/skills/codex-review-loop/scripts/review_status.py --pr <number> --repo rudrakshbhandari/nyaaywatch
```

Read `action`, `terminal`, and `reason` first. Follow the action table:

| Action | Work |
| --- | --- |
| `request_review` | Post the exact `request_command` returned by the helper, once for this full head SHA. |
| `wait` | Wait 3–5 minutes, then take a fresh snapshot. Continue until the verdict arrives; do not impose a time limit. Keep user updates concise during long waits. |
| `fix_feedback` | Inspect every reported Codex thread and fix actionable findings. Run the relevant tests. Commit and push the fix before resolving the addressed threads. |
| `fix_ci` | Inspect current-head required check details/logs, fix the failure, run relevant tests, then commit and push. |
| `ready` | Stop: Codex has given a clean verdict and required checks pass on this exact head. Report the PR URL and status. |
| `paused` | Stop only if the PR is closed/merged or the GitHub snapshot failed; report the concrete reason. |

## Loop rules

1. Only a human comment containing `@codex review` and the exact full-head marker counts as a request for the current head. Post exactly the helper's command.
2. A push or rebase starts a new review cycle. Before editing, run `git fetch origin main`, verify `git merge-base --is-ancestor origin/main HEAD`, and sync the task branch with `origin/main` if needed.
3. Never resolve review threads until the fixes are pushed. After the push, resolve only threads actually addressed, then run the helper again. Request a fresh review for the new head.
4. Do not merge the PR as part of this skill. Stop only at `ready` or a genuine `paused` condition.
5. Treat required branch-protection contexts as required checks. For this repository, `CI` is the key required context; include any additional required contexts reported by GitHub. Azure preview build/deploy checks are useful signals but are not substitutes for Codex's verdict or required checks.
6. Keep edits scoped to the review findings and preserve NyaayWatch's product, provenance, and Azure-only AWS-account guardrails in `AGENTS.md`.

The helper is read-only. It never posts comments, resolves threads, mutates a PR, or schedules polling. The agent owns the loop and continues polling at bounded intervals until a terminal result.
