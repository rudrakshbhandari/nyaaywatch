# Contributing To NyaayWatch

Thanks for contributing.

## Before You Start

Read these files first:

1. `README.md`
2. `AGENTS.md`
3. `docs/NYAAYWATCH_DESIGN.md`
4. `docs/ENG_REVIEW_TEST_PLAN.md`
5. `TODOS.md`

This project is Himachal-first, snapshot-based, and evidence-first. Do not add product claims or UX that contradict those constraints.

## Workflow

- Keep changes small and scoped.
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

## Code Review Expectations

- Prefer focused PRs over large mixed changes.
- Flag assumptions instead of burying them in code.
- Keep naming, schemas, and copy explicit.
- If a claim cannot be defended from stored evidence, it should not ship.
