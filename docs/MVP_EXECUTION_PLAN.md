# NyaayWatch MVP Execution Plan

Living execution plan for the Himachal Pradesh alpha MVP.

This file is the canonical task sequence for building NyaayWatch to MVP from the current repository state. It is intended to be the single file a human or AI agent can read to determine the next highest-leverage task.

If this file conflicts with `README.md`, `docs/NYAAYWATCH_DESIGN.md`, or `docs/ENG_REVIEW_TEST_PLAN.md`, update this plan so it matches those source docs or intentionally update those docs in the same change.

## Purpose

Use this plan for:

- determining the next implementation task
- understanding which MVP items are already complete
- tracking what remains open and what blocks later work
- forcing each task to have a concrete done condition

Do not use this file for:

- speculative post-MVP ideas
- broad product brainstorming
- duplicating detailed methodology or design-system rules that already live elsewhere

## How To Use This Plan

When starting a new implementation task:

1. Read `AGENTS.md`.
2. Read this file.
3. Find the first unchecked task in the earliest active milestone.
4. Complete that task or a clearly scoped subset if the user narrows the ask.
5. Update this file in the same PR:
   - check completed boxes
   - add a short completion note with the PR or commit if available
   - update blockers or sequencing only if reality changed

## Anti-Staleness Rules

This file should stay useful over time. To prevent drift:

- Only list MVP-critical work in the main milestones.
- Every unchecked item must be actionable in one focused implementation slice.
- Every checked item should have shipped code or an intentional doc decision behind it.
- If a task is superseded, rewrite or remove it in the same PR that changes direction.
- If a task is blocked, note the exact blocker under the milestone instead of leaving the item ambiguous.
- Keep post-MVP and “maybe later” work out of the main path. Put it in `TODOS.md`.

## Current Status

Current MVP phase: `Phase 5 complete, MVP launch gates satisfied`

Already shipped:

- published snapshot public boundary
- PostgreSQL-backed canonical run and publication state
- S3-backed raw artifact storage path
- operator replay and rollback controls
- initial homepage, district, methodology, and API surfaces
- local PostgreSQL plus LocalStack development stack

Main gap to MVP:

- none inside the current Himachal alpha MVP path

## Next Recommended Task

MVP-critical phases are complete.

Pull the next task from `TODOS.md` or from a deliberate post-MVP roadmap decision.

## MVP Definition

NyaayWatch MVP is done when all of the following are true:

- Himachal Pradesh public pages read only from a published snapshot generated from real stored source inputs
- operator can fetch, inspect, publish, replay, and rollback safely
- public trust surfaces show freshness, methodology, source attribution, and caveats consistently
- CSV/API/UI outputs remain in parity for the published snapshot
- launch-critical tests and QA flows pass
- raw source redistribution rules are explicitly documented

## Completed Foundation

- [x] `F1` Ship the narrow published snapshot vertical slice.
  Completed in merged alpha work before this plan was created.
- [x] `F2` Replace the fixture-backed store with PostgreSQL plus S3 storage adapters.
  Completed in PR #5.
- [x] `F3` Add operator replay and rollback primitives plus local Docker dev flow.
  Completed in PR #5.

## Phase 2: Real Run Pipeline

Outcome:

- the app can create a real Himachal run from upstream inputs and publish from stored evidence rather than relying on bootstrap-only seed data

Tasks:

- [x] `P2.1` Add `ingest/` capture for the Himachal aggregate source that writes raw artifacts to S3 and creates a `runs` record in PostgreSQL.
  Completed on 2026-04-14 by adding real NJDG Himachal HTML capture into stored raw run artifacts.
- [x] `P2.2` Add `extract/` and `normalize/` transforms that turn a stored raw artifact into a deterministic publishable snapshot candidate.
  Completed on 2026-04-14 with deterministic HTML extraction plus candidate normalization from stored artifacts.
- [x] `P2.3` Replace seed-only publish flow with operator publish from a completed real run.
  Completed on 2026-04-14 via operator fetch/inspect/publish endpoints and CLI commands.
- [x] `P2.4` Enforce publish gating on run completeness, transform validity, and artifact presence.
  Completed on 2026-04-14 with publish-time checks on run status, candidate validity, and required artifacts.
- [x] `P2.5` Add an operator runbook for `fetch -> inspect -> publish -> replay -> rollback`.
  Completed on 2026-04-14 in `docs/STORAGE_AND_OPERATIONS.md` and `docs/DEVELOPMENT_WORKFLOW.md`.

Done when:

- a fresh published snapshot can be created end to end from a real Himachal source capture
- rerunning the same captured input is deterministic
- replay reuses stored raw evidence, not ad hoc local files

Blockers:

- none

## Phase 3: Public Trust Surface Completion

Outcome:

- the public product matches the alpha information architecture and trust posture defined in the design doc

Tasks:

- [x] `P3.1` Complete `/districts` as the main district-browsing workspace for ranking and scanning.
  Completed on 2026-04-14 with server-rendered search, sort, flagged-only scanning, and trust metadata around the Himachal district workspace.
- [x] `P3.2` Expand `/districts/:id` to include historical context, supporting chart or table, and durable citation/export surfaces.
  Completed on 2026-04-14 with published district-history views, citation metadata, and district-specific CSV export.
- [x] `P3.3` Add `/data` or equivalent public download surface with CSV parity to the published snapshot.
  Completed on 2026-04-14 with `/data`, richer statewide CSV metadata columns, and district-history CSV parity from published snapshots.
- [x] `P3.4` Expand `/methodology` to cover formulas, caveats, snapshot semantics, and change history.
  Completed on 2026-04-14 with methodology sections for formulas, freshness/quality semantics, publish boundaries, and published snapshot lineage.
- [x] `P3.5` Ensure stale, partial, and freshness states are visible anywhere a trust-critical metric is shown.
  Completed on 2026-04-14 with explicit trust-status banners and snapshot metadata across overview, district workspace, district detail, data, and methodology routes.

Done when:

- the public routes in the design doc exist and are coherent
- every headline metric has visible trust metadata nearby
- district inspection is durable and shareable without relying on the homepage

Blockers:

- `P3.2` and `P3.3` depend on `P2.2` so the public surfaces can draw from real normalized outputs

## Phase 4: Verification And Launch Hardening

Outcome:

- the alpha is tested like a public trust product, not like an internal prototype

Tasks:

- [x] `P4.1` Add browser E2E coverage for the citizen flow, reporter flow, and developer parity flow.
  Completed on 2026-04-14 with Playwright browser coverage against a deterministic fixture-backed app server.
- [x] `P4.2` Add stable API contract tests for `/v1/stats/himachal`, `/v1/districts`, and `/v1/trends`.
  Completed on 2026-04-14 with strict schema contract tests across the public observability endpoints.
- [x] `P4.3` Add replay and rollback integration coverage against the persistent local Postgres plus S3 dev stack.
  Completed on 2026-04-14 with a Docker-backed integration test that exercises fetch, publish, replay, and rollback through real PostgreSQL and LocalStack S3 clients.
- [x] `P4.4` Add responsive and accessibility trust-surface QA checks now called out in `TODOS.md`.
  Completed on 2026-04-14 with Playwright mobile trust-surface coverage, keyboard-navigation checks, and axe smoke tests across the public routes.
- [x] `P4.5` Stand up a staging deployment on isolated AWS resources with basic logging and operator validation flow.
  Completed on 2026-04-15 with a live AWS staging stack in `ap-south-1`, successful `/health`, `fetch`, `inspect`, `publish`, `replay`, and `rollback` validation, and confirmation that the public API reads from the active publication pointer after rollback.

Done when:

- the critical flows in `docs/ENG_REVIEW_TEST_PLAN.md` are automated or explicitly covered by repeatable QA
- staging proves the AWS-hosted runtime and storage shape works outside local development

Blockers:

- none

## Phase 5: Launch Gates

Outcome:

- the alpha can ship publicly without making unsupported claims or ambiguous data-use decisions

Tasks:

- [x] `P5.1` Complete source terms and redistribution review for raw artifacts, evidence packs, and normalized exports.
  Completed on 2026-04-14 in `docs/PUBLIC_DATA_EXPOSURE_POLICY.md` using the current official eCourts copyright and disclaimer pages to lock alpha exposure to published read-model outputs while keeping raw captures and bundled evidence packs internal.
- [x] `P5.2` Add a release-readiness checklist covering caveats, freshness labels, methodology versioning, and publish safety.
  Completed on 2026-04-14 in `docs/ALPHA_RELEASE_CHECKLIST.md`.
- [x] `P5.3` Confirm public copy avoids live, predictive, or verdict-like framing across all routes and docs.
  Completed on 2026-04-14 with tightened public route wording, copy guardrail tests, and design/test-plan doc updates aligned to citation surfaces plus published snapshots.

Done when:

- a human reviewer can explain what is safe to expose publicly and what is not
- the launch checklist can be run before flipping the alpha public

Blockers:

- none

## Deferred Until After MVP

These matter, but they are not required to reach the Himachal alpha MVP:

- multi-state expansion readiness gates, now documented in `docs/MULTI_STATE_EXPANSION_GATES.md`
- extracting a standalone `DESIGN.md`
- release cadence and observability refinements, now partially documented in `docs/RELEASE_POLICY.md` and `docs/DEPLOYMENT_STATUS.md`
- broader post-MVP operational maturity work that does not affect the first public alpha

Track those in `TODOS.md`, not here.

## Update Log

- 2026-04-14: Initial execution plan created from `README.md`, design doc, engineering test plan, TODO backlog, and shipped storage work.
- 2026-04-14: Phase 2 completed with real NJDG Himachal capture, deterministic extract/normalize, gated publish, replay from stored raw evidence, and operator runbook updates.
- 2026-04-14: Added `docs/JUDICIARY_PUBLIC_DATA_LANDSCAPE.md` to document current public judiciary sources, digitization limits, and the realistic public-data-backed scope ceiling.
- 2026-04-14: Phase 3 completed with a full `/districts` workspace, district history and export surfaces, `/data`, expanded methodology, and visible freshness / quality state across public trust-critical metrics.
- 2026-04-14: Phase 4 verification started with GitHub Actions CI, Playwright browser E2E for public trust flows, and stable API contract tests.
- 2026-04-14: Added persistent-stack integration coverage for replay/rollback via Docker PostgreSQL plus LocalStack S3, plus responsive/accessibility trust-surface QA in Playwright.
- 2026-04-14: Staging deployment hardening updated the AWS stack to self-provision its VPC, pin a supported `ap-south-1` PostgreSQL engine version, and use an RDS TLS-compatible connection string; `P4.5` remains open until the operator validation flow succeeds on a live AWS stack.
- 2026-04-15: Completed `P4.5` on a live AWS staging stack after fixing container migration packaging, S3 bucket idempotence/tag-handling for CloudFormation-managed buckets, and missing `s3:GetBucketTagging` task-role access; operator `fetch -> inspect -> publish -> replay -> rollback` now succeeds end to end in staging.
- 2026-04-14: Completed Phase 5 launch gates with a written public exposure policy, a release-readiness checklist, and route-level copy guardrail coverage for published-snapshot wording.
- 2026-04-15: Documented post-MVP multi-state expansion readiness gates and synced `TODOS.md` so the completed Phase 5 redistribution review no longer appears as open backlog.
- 2026-04-15: Added post-MVP release policy, live deployment-status evidence, CloudWatch observability outputs, and a repeatable `linux/amd64` ECR build path after the first public-alpha review and post-deploy validation cycle.
- 2026-04-15: Added automatic `main` deploys that build a `linux/amd64` image in GitHub Actions, push to ECR, roll the live ECS service, and verify `/health` against the staging stack.
- 2026-04-15: Added fixture-backed App Runner preview deployments for pull requests so design and copy review no longer depend on the live AWS stack.
- 2026-04-16: Added a tracked release ledger in `docs/RELEASE_HISTORY.md` plus `release:record` so postpublish evidence is preserved as markdown, JSON, and reviewer-attributed history entries.
- 2026-04-16: Added internal multi-geography pipeline scaffolding with a state-profile-driven NJDG capture path, state-scoped artifact prefixes, and a first internal candidate-state profile for Punjab while keeping the public app Himachal-only.
