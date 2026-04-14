# AGENTS.md

High-signal repository guidance for AI agents and contributors working in NyaayWatch.

## Source Of Truth

Use this file for operating rules, not full project context.

Primary repo context lives in:

1. `README.md`
2. `docs/NYAAYWATCH_DESIGN.md`
3. `docs/ENG_REVIEW_TEST_PLAN.md`
4. `TODOS.md`

If this file and those docs conflict, update the work so it matches the repo docs or fix the docs intentionally.

## Before Starting

At the start of every new session:

1. Run `git rev-parse --abbrev-ref HEAD`.
2. If the result is `HEAD` or `main`, create or switch to a named branch before planning or implementation.
3. Read `README.md` first.
4. Read the design, test-plan, and TODO docs when the task touches product behavior, public claims, architecture, testing, or roadmap priorities.
5. Summarize the implementation slice before editing.

Never make code or documentation changes before branch creation succeeds.

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
- Prefer explicit schemas, typed boundaries, and deterministic transforms over implicit behavior.
- Preserve reproducibility. Ingestion, normalization, and publish steps should be replayable and auditable.
- Do not introduce hidden background behavior that changes published data without an explicit run or publish step.

## Public Claim Discipline

- Write calm, exact, evidence-first copy.
- Surface caveats, freshness, methodology version, and source attribution near important metrics.
- If a claim cannot be defended from stored evidence, do not ship it.
- Prefer “we observed in this published snapshot” over real-time framing.

## Git And Worktree Rules

- Use one active branch per worktree.
- Do not reuse the same branch across multiple simultaneous worktrees or AI sessions.
- Use descriptive lowercase kebab-case branch names scoped to one task.
- Use Conventional Commits.
- Prefer small, atomic commits.
- Default to opening a pull request for every code change before merging to `main`.
- Treat `main` as protected even if branch protection is not configured yet.
- Do not force-push shared branches unless the user explicitly asks for it.

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
