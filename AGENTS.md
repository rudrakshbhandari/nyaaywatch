# AGENTS.md

Repository guidance for AI agents and contributors working in NyaayWatch.

## Read First

Before making changes, read:

1. `README.md`
2. `docs/NYAAYWATCH_DESIGN.md`
3. `docs/ENG_REVIEW_TEST_PLAN.md`
4. `TODOS.md`

Do not start implementation from assumptions that contradict those files.

## Startup Workflow

At the start of every new agent session:

1. Read the required repository documents before implementation.
2. Check the current branch state before planning or coding.
3. Summarize the implementation slice you intend to take.
4. Begin work only after the branch bootstrap rules below are satisfied.

## Product Guardrails

- Build for Himachal Pradesh first. Do not add nationwide scaffolding to public UX unless explicitly requested.
- Treat all public data as snapshot-based, not live.
- Do not make predictive, AI-forward, or legal-analysis claims.
- Every public metric must have reproducible provenance.
- Public anomaly language should describe flagged signals, not verdicts.
- Be source-aware about raw upstream data redistribution. Do not assume raw artifacts are safe to expose publicly.

## Architecture Defaults

Unless the user explicitly changes direction, default to:

- one AWS-hosted containerized app
- PostgreSQL as the canonical store
- S3 for raw scrape artifacts
- persisted ingestion run state machine
- published snapshot read model for public surfaces
- operator-only publish and replay controls

Keep boundaries legible as the repo grows:

- `ingest/` for source acquisition and run orchestration
- `extract/` for parsing source payloads into structured intermediates
- `normalize/` for metric definitions and canonical transformations
- `warehouse/` for persisted analytical/read-model shaping
- `api/` for public and operator-facing server endpoints
- `web/` for public and operator-facing UI
- `docs/` for methodology, architecture, and operational documentation

## Change Discipline

- Keep changes small and scoped. Avoid mixing unrelated refactors with feature work.
- Update docs when product behavior, methodology, schema, or operator workflows change.
- Add or update tests for every behavior change.
- Prefer explicit schemas, typed boundaries, and deterministic transforms over implicit behavior.
- Preserve reproducibility. Ingestion, normalization, and publish steps should be replayable and auditable.
- Do not introduce hidden background behavior that changes published data without an explicit run or publish step.

## Public Claim Discipline

- Write calm, exact, evidence-first copy.
- Surface caveats, freshness, methodology version, and source attribution near important metrics.
- If a claim cannot be defended from stored evidence, do not ship it.
- Prefer “we observed in this published snapshot” over “this is true in real time.”

## Git And Commit Practice

- Use Conventional Commits.
- Make small, atomic commits after each logical code change unless the user asks to batch work differently.
- Do not combine unrelated changes into one commit.
- Prefer commit types such as `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, and `build`.
- Example subjects:
  - `feat(api): add published district snapshot endpoint`
  - `fix(web): show snapshot freshness on district page`
  - `docs(methodology): clarify anomaly caveat language`

## Branch And Worktree Practice

- Before any implementation or planning work, run `git rev-parse --abbrev-ref HEAD`.
- Do not work from detached `HEAD`. Create or switch to a named branch before implementation work starts.
- If the result is `HEAD`, do not proceed until a named branch has been created and checked out.
- Do not implement directly on `main`.
- Use one active branch per worktree.
- Do not reuse the same branch across multiple simultaneous worktrees or AI coding sessions.
- Branch names should describe one scoped task, for example `feat/published-district-api` or `fix/freshness-badge-copy`.
- Infer branch names from the task:
  - product or feature implementation: `feat/<area>-<outcome>`
  - bug or regression fix: `fix/<area>-<issue>`
  - docs-only change: `chore/docs-<topic>`
  - repo workflow or tooling change: `chore/<tooling-topic>`
  - test coverage expansion without major product changes: `test/<area>-coverage`
- Branch slug rules:
  - use lowercase kebab-case
  - use 2 to 6 words when possible
  - prefer scope plus outcome, for example `feat/alpha-vertical-slice`
  - if the request is ambiguous, choose a reasonable default and proceed
- Report the chosen branch name in the first progress update after branch creation.
- Never make code or documentation changes before branch creation succeeds.
- Rebase or merge intentionally; do not force-push shared branches unless the user explicitly asks for it.
- Before starting a new task in a new worktree, branch from the latest intended base branch rather than from another in-progress feature branch unless the dependency is explicit.
- If parallel sessions may touch the same files or subsystem, stop and coordinate scope rather than creating hidden merge conflicts.
- Treat each worktree as owning a narrow slice of responsibility until integration happens.

Examples:

- "implement the alpha vertical slice" -> `feat/alpha-vertical-slice`
- "fix stale snapshot banner logic" -> `fix/stale-snapshot-banner`
- "update architecture docs for publish flow" -> `chore/docs-publish-flow`
- "add publish-gate regression tests" -> `test/publish-gate-coverage`
- "tighten repo guardrails for agents" -> `chore/repo-guardrails`

## Multi-Agent Session Rules

- When multiple AI agents are working in parallel, assign each session a distinct branch and a distinct task boundary.
- Prefer splitting work by directory or subsystem, such as `api/`, `web/`, or `docs/`, to reduce overlap.
- Land shared contract changes first or document them clearly before parallel implementation starts.
- If a change modifies shared schemas, interfaces, or methodology definitions, call that out explicitly in commit messages and PR descriptions.
- Do not silently fix unrelated issues discovered in another agent's scope.
- When integrating parallel branches, review for schema drift, copy drift, and public-claim inconsistencies before merge.

## Pull Request Rule

- Default to opening a pull request for every code change before merging to `main`.
- Do not push feature work directly to `main`.
- Treat `main` as protected even if GitHub branch protection has not been configured yet.
- If a change is truly urgent and must bypass the normal PR flow, that should be an explicit exception, not the default workflow.

## Open Source Hygiene

- Keep setup and local development instructions current.
- Prefer OSS-friendly tooling and avoid depending on hidden local state.
- Never commit secrets, credentials, or raw private data.
- Keep public APIs and schemas documented before calling them stable.
- Record important product and methodology decisions in versioned docs, not only in chat threads.

## Definition Of Done

A change is not done until, where relevant:

- code is implemented
- tests pass or missing coverage is explicitly called out
- docs are updated
- public-facing caveats and provenance still hold
- commit scope is clean and named with a Conventional Commit
