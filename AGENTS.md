# AGENTS.md

High-signal repository guidance for AI agents and contributors working in NyaayWatch.

## Source Of Truth

Use this file for operating rules, not full project context.

Primary repo context lives in:

1. `README.md`
2. `DESIGN.md`
3. `docs/NYAAYWATCH_DESIGN.md`
4. `docs/ENG_REVIEW_TEST_PLAN.md`
5. `docs/MVP_EXECUTION_PLAN.md`
6. `TODOS.md`

If this file and those docs conflict, update the work so it matches the repo docs or fix the docs intentionally.

## Before Starting

At the start of every new session:

1. Run `git fetch origin main`.
2. Run `git rev-parse --abbrev-ref HEAD`.
3. If the result is `HEAD` or `main`, create or switch to a named branch before planning or implementation.
4. Run `git merge-base --is-ancestor origin/main HEAD` and, if it fails, sync the worktree with the latest `origin/main` before planning or implementation.
5. Read `README.md` first.
6. Read the design, test-plan, and execution-plan docs when the task touches product behavior, public claims, architecture, testing, or roadmap priorities.
7. Summarize the implementation slice before editing.

Never make code or documentation changes before branch creation succeeds and the worktree is verified to include the latest `origin/main`.

## Critical Product Guardrails

- Build for Himachal Pradesh first. Do not add nationwide scaffolding to public UX unless explicitly requested.
- Treat public data as snapshot-based, not live.
- Do not make predictive, AI-forward, or legal-analysis claims.
- Every public metric must have reproducible provenance from stored evidence.
- Describe anomalies as flagged signals, not verdicts.
- Be source-aware about raw upstream data redistribution. Do not assume raw artifacts are safe to expose publicly.

## Default Architecture Direction

Unless the user explicitly changes direction, default to:

- one AWS-hosted containerized app
- PostgreSQL as the canonical store
- S3 for raw scrape artifacts
- explicit ingestion run state and operator-controlled publish / replay flow
- published snapshot read models for public surfaces

Keep boundaries legible as the repo grows:

- `ingest/`
- `extract/`
- `normalize/`
- `warehouse/`
- `api/`
- `web/`
- `docs/`

## While Editing

- Keep changes small and scoped. Do not mix unrelated refactors into the same task.
- Add or update tests for every behavior change.
- Update docs when product behavior, methodology, schema, or operator workflows change.
- Update `docs/MVP_EXECUTION_PLAN.md` in the same change when a plan item is completed, superseded, or reordered.
- Update `README.md` in the same PR when any of the following change: the Architecture bullets, the Repository Map (`src/` entries), the Operator Workflow scripts, the Scheduled Internal Fetches section, or the Public/Operator API shape. Do not leave these sections describing behavior that no longer exists — README.md is the first thing external contributors and operators read.
- Prefer explicit schemas, typed boundaries, and deterministic transforms over implicit behavior.
- Preserve reproducibility. Ingestion, normalization, and publish steps should be replayable and auditable.
- Do not introduce hidden background behavior that changes published data without an explicit run or publish step.

## Agent Working Style

- Be direct and opinionated. If there is a better approach, say so and explain why.
- Challenge weak ideas early, especially around security, performance, architecture, typing, error handling, and reproducibility.
- Stay focused on the assigned slice. Prefer implementing the change over writing long explanations unless tradeoffs or blockers need to be called out.
- Make reasonable assumptions when the path is clear. Ask clarifying questions only when ambiguity is likely to cause incorrect, unsafe, or misleading work.
- Do not ship placeholder logic, fake integrations, or open-ended TODOs as finished work.
- Run relevant tests yourself whenever feasible. If tests fail or cannot run, report the exact command, the output, and whether the blocker is repo-side or external.
- Every final user-facing completion message must end with a concise `Next steps` section or sentence. If there is nothing meaningful left to do, say that explicitly instead of omitting the section.

## Autonomous Execution

- Do everything you reasonably can yourself before asking the user for help.
- Do not ask the user to run commands, edit files, install dependencies, or debug work the agent can perform directly.
- When the path is clear, act on reasonable assumptions instead of stopping for confirmation.
- Try multiple programmatic approaches before concluding that something is blocked.

## Browser And Tool Recovery

- Treat browser-session failures as a recovery task, not a stopping point.
- If an embedded browser tool or MCP transport fails, first try to restore it or switch to another programmatic browser path before asking the user to intervene.
- Preferred fallback order for authenticated web work is:
  1. repair the existing browser or MCP session
  2. switch to a CLI-driven browser workflow
  3. reuse authenticated browser state such as cookies or saved session data
  4. call the underlying service API directly when the authenticated state is already available locally
- Only ask the user to log in again, provide a token, or perform a manual browser action after these recovery paths have been attempted and documented.

Ask the user only when:

1. required information is truly unavailable in the repo or environment, such as passwords, API keys, or 2FA codes
2. a physical or manual action is required outside the agent's execution environment
3. the system blocks further execution and there is no safe programmatic workaround

If asking becomes necessary, include:

- what you tried
- why it failed
- the minimal input or action needed from the user

## Public Claim Discipline

- Write calm, exact, evidence-first copy.
- Surface caveats, freshness, methodology version, and source attribution near important metrics.
- If a claim cannot be defended from stored evidence, do not ship it.
- Prefer “we observed in this published snapshot” over real-time framing.

## Public Copy Voice

Plain Indian English on every public-facing surface — home, Supreme Court / High Court overviews, district pages, `/api`, `/data`, `/press`, OG cards, 404s, and the flag reasons / tile notes generated in `src/normalize/` and `src/api/home/`.

The full spec lives in `docs/COPY_VOICE.md`. Read it before writing or editing any of those surfaces. Highlights:

- Name courts directly. "Supreme Court", not "the top of the court system" or bare "the Court".
- Time windows are concrete. "last month", not "the latest monthly window" or "the latest published month".
- "cases", not "matters". "filed/cleared", not "instituted/disposed".
- Tile notes describe what the number means, not where it came from. The publishing-pipeline vocabulary ("latest published snapshot", "captured run") is reserved for the methodology pages.
- Contractions are fine.

Banned phrases on public routes are enforced by the `disallowedPublicPhrases` regex list in `tests/public-copy-guardrails.test.ts`. If a copy change adds new jargon worth banning project-wide, extend that list in the same PR rather than writing a one-off test.

## Git And Worktree Rules

- Use one active branch per worktree.
- Do not reuse the same branch across multiple simultaneous worktrees or AI sessions.
- Use descriptive lowercase kebab-case branch names scoped to one task.
- Use Conventional Commits.
- Prefer small, atomic commits.
- Never commit directly to `main`.
- Default to opening a pull request for every code change before merging to `main`.
- Default to opening ready pull requests, not draft pull requests, unless the user explicitly asks for a draft PR.
- For code or doc edits, work on a task-specific branch, commit, push, and open a pull request unless the user explicitly asks for a different flow.
- For any code or doc change, the final user-facing completion message must include the actual pull request URL once it exists. Do not treat local edits, a local commit, or an unpushed branch as complete.
- Do not present "PR opened" as completion if required validation is still pending or failing. Report the current state of checks and any real blockers precisely.
- Treat `main` as protected even if branch protection is not configured yet.
- Do not force-push shared branches unless the user explicitly asks for it.
- Before pushing any follow-up commits to an existing branch (for example, after the user flags a regression on a PR you just opened), verify the branch's pull request is still open with `gh pr view <branch> --json state,mergedAt`. If the PR is already merged or closed, do not push to that branch — the commits will strand on a stale branch and nothing will deploy them. Instead, branch off the current `origin/main`, cherry-pick or re-apply the follow-up, and open a new PR.
- When a user review lands after a PR has auto-merged, assume the merge raced the feedback. Re-check PR state before choosing where to commit the fix.
- For PR bodies and substantial GitHub comments, use real multiline Markdown via stdin or a body file. Do not rely on escaped `\n` sequences for structure.

## Parallel Session Rule

When multiple agents are working in parallel:

- assign each session a distinct branch and task boundary
- split work by subsystem when possible
- call out shared schema, interface, or methodology changes explicitly
- do not silently fix unrelated issues outside the assigned slice

## Definition Of Done

A change is not done until, where relevant:

- code is implemented
- tests pass or missing coverage is explicitly called out
- docs are updated
- public-facing caveats and provenance still hold
- commit scope is clean and intentionally named
- the branch is pushed and a pull request link is included in the final output for any code or doc change, unless the user explicitly requested no-PR local work
- the final user-facing message includes clear next steps, recommended follow-up work, or an explicit statement that no further action is recommended right now
