# NyaayWatch MVP Execution Plan

Living execution plan for the Himachal Pradesh alpha MVP.

This file is the canonical task sequence for building NyaayWatch to MVP from the current repository state. It is intended to be the single file a human or AI agent can read to determine the next highest-leverage task.

If this file conflicts with `README.md`, `DESIGN.md`, `docs/NYAAYWATCH_DESIGN.md`, or `docs/ENG_REVIEW_TEST_PLAN.md`, update this plan so it matches those source docs or intentionally update those docs in the same change.

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
- 2026-04-17: Post-MVP expansion moved forward again with Assam now live on the public site after stable-URL verification, while Karnataka, Tripura, and Nagaland all completed internal-only proof cycles and remained dark on public routes.
- 2026-04-14: Completed Phase 5 launch gates with a written public exposure policy, a release-readiness checklist, and route-level copy guardrail coverage for published-snapshot wording.
- 2026-04-15: Documented post-MVP multi-state expansion readiness gates and synced `TODOS.md` so the completed Phase 5 redistribution review no longer appears as open backlog.
- 2026-04-15: Added post-MVP release policy, live deployment-status evidence, CloudWatch observability outputs, and a repeatable `linux/amd64` ECR build path after the first public-alpha review and post-deploy validation cycle.
- 2026-04-15: Added automatic `main` deploys that build a `linux/amd64` image in GitHub Actions, push to ECR, roll the live ECS service, and verify `/health` against the staging stack.
- 2026-04-15: Added fixture-backed App Runner preview deployments for pull requests so design and copy review no longer depend on the live AWS stack.
- 2026-04-16: Added a tracked release ledger in `docs/RELEASE_HISTORY.md` plus `release:record` so postpublish evidence is preserved as markdown, JSON, and reviewer-attributed history entries.
- 2026-04-16: Added internal multi-geography pipeline scaffolding with a state-profile-driven NJDG capture path, state-scoped artifact prefixes, and a first internal candidate-state profile for Punjab while keeping the public app Himachal-only.
- 2026-04-16: Completed the first real live Punjab internal trial with a successful `fetch -> inspect -> publish -> replay -> rollback` cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`; Punjab remains internal-only pending a second independent publish window at least 1 hour later, with 2+ hours preferred, and a public-trust parity review.
- 2026-04-16: Added `docs/PUNJAB_GO_LIVE_CHECKLIST.md` and `docs/PUNJAB_PUBLIC_READINESS_REVIEW.md`, and revised the expansion-window rule to `>= 1 hour minimum` with `2+ hours` preferred so Punjab launch prep is tied to a defensible repeatability standard rather than an arbitrary fixed delay.
- 2026-04-16: Extracted a reusable repo-level `DESIGN.md`, updated source-of-truth references, and tightened release/cutover docs so routine publishes now point at the release checklist and policy while the domain checklist reads as recorded cutover state plus future-change guidance.
- 2026-04-16: Completed the second independent Punjab window with a clean `fetch -> inspect -> publish -> replay -> rollback` cycle more than 2 hours after the first Punjab trial; Punjab has now cleared the internal operating-evidence gate and the next slice is narrow public-surface implementation plus parity verification.
- 2026-04-16: Implemented the narrow Punjab public surface with explicit `/states/punjab/...` routes, state-scoped JSON endpoints, dynamic supported-state navigation, and local route/copy/contract parity coverage while keeping Himachal as the default unscoped surface pending live rollout verification.
- 2026-04-16: Completed the first live Punjab public rollout after deploy run `24537940704` moved the stack to task definition `:26`; one-off ECS operator tasks published Punjab as `publication_7db9a015-68d0-4182-8c77-f221797c7c2c`, `https://nyaaywatch.in/states/punjab` plus the state-scoped API and CSV surfaces verified successfully, and the rollout evidence is now recorded in the deployment, release-history, and expansion-review docs.
- 2026-04-16: Generalized operator and release tooling for multi-state live operation: the app operator routes now accept explicit state selection and auto-resolve run/publication ids across configured state services, while `release:prepublish`, `release:postpublish`, and `release:record` now support state-scoped releases and record the correct public URL for non-default state rollouts.
- 2026-04-16: Verified the state-aware live release flow on AWS after task definition `:28` rolled out: Punjab fetch and publish succeeded through the public HTTP operator routes, the state-scoped release helper scripts succeeded inside one-off ECS tasks, and the next operational issue is now explicit cache invalidation for state-scoped CSV exports because the API updated before the cached CSV edge response did.
- 2026-04-16: Closed the publish-time cache gap for public data by marking `/data` and CSV export routes as `no-store` for browsers and CDNs, and tightened `release:verify` so state-scoped releases fail verification if the public data page or district CSV remains cacheable.
- 2026-04-17: Live post-deploy verification showed the header-only fix was necessary but not sufficient: `https://nyaaywatch.in/states/punjab/data/districts.csv` still served the pre-fix Cloudflare-cached object as a `HIT`, so the remaining work is explicit purge support plus live runtime credential wiring before the next state trial can proceed.
- 2026-04-17: Closed the live Punjab cache-invalidity gap after PR `#45` merged: task definition `:34` now carries the Cloudflare purge credentials plus explicit public base URL wiring, `release:verify` passes on the stable Punjab URLs without cache-busting, and the next slice is selecting and wiring the next internal-only state candidate rather than doing more Punjab proof.
- 2026-04-17: Chose Haryana (`HR`) as the next internal subordinate-court candidate because the live NJDG Haryana page exposes the same metric set with a stable 22-district shape close to Punjab, and added internal-only state-profile support so the next trial can start without widening the public IA.
- 2026-04-17: Completed the live Haryana internal proof cycle after PR `#46` merged and task definition `:35` rolled out: Haryana fetch and publish succeeded through the live state-aware operator routes, a replay from stored evidence succeeded, rollback restored the original Haryana publication, and the public Haryana routes stayed dark with `404` responses throughout.
- 2026-04-17: Added `docs/HARYANA_PUBLIC_READINESS_REVIEW.md` to close the Haryana trust-surface review, then completed the actual Haryana public rollout later the same day after the additional live operating evidence held.
- 2026-04-17: Prepared Uttarakhand (`UK`) as the next internal-only state candidate after a live NJDG source viability check confirmed a stable 13-district page shape, the expected statewide metrics, and footer freshness dated `2026-04-16`; internal-only state-profile support and tests now include Uttarakhand without widening the public site.
- 2026-04-17: Prepared Rajasthan (`RJ`) and Uttar Pradesh (`UP`) as additional internal-only state candidates after live NJDG source viability checks: Rajasthan exposed a stable 44-district selector with expected statewide metrics, while Uttar Pradesh exposed the expected metric families but only 74 district options, so the first live UP proof cycle must explicitly confirm source completeness.
- 2026-04-17: Completed the first live internal proof cycles for Uttarakhand (`UK`), Rajasthan (`RJ`), and Uttar Pradesh (`UP`) after PR `#50` merged and deploy run `24548048035` rolled the live stack to task definition `:39`; all three states cleared `fetch -> publish -> replay -> rollback` as internal-only states with public routes still returning `404`.
- 2026-04-17: The Uttar Pradesh proof cycle also clarified the next real scaling gap: the first Cloudflare-fronted `POST /operator/runs/fetch` returned a `504` even though the origin completed the fetch, so heavier-state expansion now needs a more durable non-Cloudflare operator lane rather than more state-profile wiring.
- 2026-04-17: Added `npm run operator:staging` as the default repo-level heavy-state operator lane. It discovers the live staging ECS service from CloudFormation, runs the requested operator command inside a one-off ECS task, waits for completion, and returns the operator JSON payload from CloudWatch logs so heavier states do not depend on the Cloudflare-fronted public operator path.
- 2026-04-17: Closed the heavy-state live-proof backlog after PR `#54` merged and deploy run `24554574390` rolled the live stack to task definition `:43`; `npm run operator:staging -- --state UP fetch "UP ECS heavy-state proof cycle fetch"` completed as `run_a16bb291-e3fb-4238-8695-bc60e4d63a64`, stored both raw plus normalized artifacts, reproduced the observed 74-district UP source surface, and left the public Uttar Pradesh routes dark with `404` responses.
- 2026-04-17: Started the parallel next slice after the ECS-lane proof: Haryana is now wired as the next public state in repo config with a dedicated preflight checklist and parity test suite, while Tamil Nadu (`TN`) and Assam (`AS`) now have internal-only readiness reviews and state-profile support for south-plus-north-east expansion planning.
- 2026-04-17: Split alpha cadence into weekday internal raw fetches plus twice-weekly public publishes, and added a deploy-time schedule reconciler so the live AWS scheduler can follow the current ECS task definition instead of drifting behind GitHub Actions service rollouts.
- 2026-04-17: Enabled the live weekday internal fetch scheduler on AWS as `nyaaywatch-staging-weekday-internal-fetch`, then verified it with a one-time smoke schedule that launched an ECS task through EventBridge Scheduler and completed fetch run `run_337a80ae-4980-415a-8585-d670e413dfed` without changing the public snapshot.
- 2026-04-17: Completed the Haryana public rollout after PR `#56` merged and deploy run `24582480598` rolled the live stack to task definition `:45`; ECS-backed fetch `run_bf1fd888-173c-4a58-9dde-f797b92f7c30` published Haryana as `publication_e57d5546-e9aa-4bee-a951-edeb2bc4789c`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug haryana` passed, and the live browser check confirmed the explicit Haryana trust surface on `https://nyaaywatch.in/states/haryana`.
- 2026-04-17: Completed the first southern and north-east internal proof cycles on the same live stack: Tamil Nadu cleared fetch `run_329a8b74-2b9d-4c33-ba2f-46b19186935c`, publish `publication_34aa96eb-f212-4cad-9412-086bfe3c41a6`, replay `run_c69af2d5-b2dd-455e-82aa-3a7125122d71`, and rollback `publication_43eefb27-a754-4590-91f1-0e38d9e40705`, while Assam cleared fetch `run_32e2194a-027d-4ec2-8d50-b3c282446b90`, publish `publication_688f053e-53a4-4662-9367-a4ffba4973ce`, replay `run_c28d9a91-0543-40b2-adac-1ca5e0c2e85d`, and rollback `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f`; both states stayed internal-only with public routes returning `404`.
- 2026-04-17: Chose Tamil Nadu as the next public state after Haryana, added `docs/TAMIL_NADU_PUBLIC_READINESS_REVIEW.md` plus `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md`, and shifted the next internal-only pair to Kerala (`KL`) and Meghalaya (`ML`) after live NJDG source checks confirmed stable source shapes for both.
- 2026-04-17: Completed the Kerala (`KL`) and Meghalaya (`ML`) internal proof cycles after PR `#58` merged and deploy run `24584550026` rolled the live stack to task definition `:47`; Kerala cleared fetch `run_60fc22fb-a2b2-41e5-9bf5-f01b6e7b39e3`, publish `publication_4f53dbb3-7530-40ca-aeed-3a27bbd5b892`, replay `run_84af7110-13b1-4150-8be6-cc82e83a36c3`, and rollback `publication_dafbab89-af38-4a41-a006-9153f126e785`, while Meghalaya cleared fetch `run_3dd14fff-0791-45b4-9bd7-27ce798cc850`, publish `publication_b1b1d691-d8bf-4e79-8d2d-119dff5b024c`, replay `run_5fda86c5-aefe-4e33-ae39-e25dac3f4830`, and rollback `publication_7337df86-24c6-4290-8ee4-2b740e5110af`; both states remained internal-only with public routes returning `404`.
- 2026-04-17: Promoted Tamil Nadu (`TN`) into the approved public-state set in repo config, added a dedicated `tests/tamil-nadu-public-rollout.test.ts` preflight suite plus TN snapshot fixtures, and checked off the local typecheck plus targeted regression gates in `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md` ahead of the live rollout.
- 2026-04-17: Completed the Tamil Nadu public rollout after PR `#64` merged and deploy run `24588602379` rolled the live stack to task definition `:54`; ECS-backed fetch `run_d7f79d01-99c7-41b5-b87d-a4145438b3fa` published Tamil Nadu as `publication_af06c306-b7e8-4c62-b4b8-e80f301f5b04`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tamil-nadu` passed, and the live browser check confirmed the explicit Tamil Nadu trust surface on `https://nyaaywatch.in/states/tamil-nadu`.
- 2026-04-17: Chose Assam (`AS`) as the next public state after Tamil Nadu, promoted Assam into the approved public-state set in repo config, and added `docs/ASSAM_PUBLIC_READINESS_REVIEW.md`, `docs/ASSAM_GO_LIVE_CHECKLIST.md`, `tests/assam-public-rollout.test.ts`, plus Assam snapshot fixtures so the next live rollout can use the same parity pattern as Haryana and Tamil Nadu.
- 2026-04-17: Chose Karnataka (`KA`), Tripura (`TR`), and Nagaland (`NL`) as the next internal-only trio after live NJDG source checks confirmed stable footer freshness, district drilldowns, and the current metric contract for all three; repo support plus internal-readiness reviews now exist for the trio without widening the public site.
- 2026-04-17: Chose Telangana (`TS`), Andhra Pradesh (`AP`), Arunachal Pradesh (`AR`), and Manipur (`MN`) as the next internal-only batch after live NJDG source checks confirmed contract-compatible state pages, age-bucket parity, and district drilldown reachability for all four; the next public state remains a deliberate later decision rather than an automatic promotion.
