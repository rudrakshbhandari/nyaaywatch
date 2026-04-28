# Contributing To NyaayWatch

Thanks for contributing. NyaayWatch is an open-source civic-data project, so contributions need to preserve public trust, reproducibility, and source discipline.

## Before You Start

Read these files first:

1. `README.md`
2. `AGENTS.md`
3. `CODE_OF_CONDUCT.md`
4. `SECURITY.md`
5. `docs/NYAAYWATCH_DESIGN.md`
6. `docs/ENG_REVIEW_TEST_PLAN.md`
7. `TODOS.md`

This project is Himachal-first, snapshot-based, and evidence-first. Do not add product claims or UX that contradict those constraints.

## Workflow

- Keep changes small and scoped.
- Start with an issue or a clear pull request description for non-trivial work.
- Open one branch per task.
- Use Conventional Commits.
- Open a pull request before merging to `main`.
- Add or update tests for behavior changes.
- Update docs in the same change when APIs, methodology, operator workflows, or public claims change.
- Keep public copy calm, exact, and reproducible.

## Branch Naming

Use descriptive branch names with a clear scope:

- `feat/published-snapshot-api`
- `fix/district-trend-labels`
- `docs/methodology-caveats`

Avoid sharing the same branch across simultaneous worktrees or multiple AI coding sessions.

Do not implement directly on `main`.

## Commit Format

Use Conventional Commits:

- `feat(api): add published district snapshot endpoint`
- `fix(web): show snapshot freshness on district page`
- `docs(readme): clarify local setup`
- `test(normalize): cover disposal-rate transform`

Recommended types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `build`

## Pull Requests

PRs should be easy to review and should explain:

- what changed
- why it changed
- how it was tested
- what docs were updated
- what caveats or follow-up work remain

If a PR changes public metrics, methodology, anomaly logic, or provenance handling, call that out explicitly.

Treat pull requests as the default merge path for all code changes. Direct pushes to `main` should be rare, explicit exceptions.

For first-time contributors, a good PR usually does one of these:

- fixes a reproducible bug with a test or clear verification note
- improves documentation that is stale, confusing, or missing operational detail
- adds a small public-data or accessibility improvement while preserving provenance
- tightens tests around existing behavior

## Testing

At minimum:

- run the relevant automated tests for the changed area
- add coverage for new behavior where practical
- note any missing coverage or unrun checks in the PR

Do not merge behavior changes with no testing explanation.

## Documentation

Update docs when you change:

- public routes or UX behavior
- API contracts
- schemas
- methodology or formulas
- operator workflows
- setup instructions

Important decisions should live in versioned docs, not only in chat threads or PR comments.

## Security And Data Handling

- Never commit secrets, credentials, or tokens.
- Never commit private raw data by accident.
- Be source-aware about raw upstream artifact redistribution.
- Treat provenance and auditability as product requirements, not cleanup work.
- Report vulnerabilities through `SECURITY.md` instead of opening public issues with exploit details.

## Code Review Expectations

- Prefer focused PRs over large mixed changes.
- Flag assumptions instead of burying them in code.
- Keep naming, schemas, and copy explicit.
- If a claim cannot be defended from stored evidence, it should not ship.
