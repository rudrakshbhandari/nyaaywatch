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

There is no remaining approved-state rollout work inside the current roadmap. Pull any next task from `TODOS.md` only if it is maintenance or a deliberate expansion beyond the currently supported states.

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

- 2026-04-23: Promoted the 8 proven lower-court UT/UT-style profiles into public alpha after adding profile-level state/Union Territory metadata, UT-aware public copy, map aliases, route-label cleanup, and release-verification coverage. The existing `/states/:stateSlug` URL contract remains stable, but public copy now distinguishes states from Union Territories.
- 2026-04-23: Enabled daily internal fetch for the 8 lower-court UT/UT-style profiles after all eight cleared live `fetch -> inspect -> publish -> replay -> rollback` proof cycles on the ECS-backed operator lane.
- 2026-04-23: Promoted the common High Court of Jammu & Kashmir and Ladakh into the public High Court beta after the recorded proof cycle and source review, and added `docs/INDIA_COURT_COVERAGE_AUDIT.md` to pin the April 2026 official-source coverage boundary: all 25 High Court NJDG selectors are configured, and all 36 lower-court state/Union Territory NJDG selectors are now represented in the registry.
- 2026-04-23: Completed the live internal proof cycle for the common High Court of Jammu & Kashmir and Ladakh on the ECS-backed operator lane. The court now has `fetch -> publish -> replay -> rollback` evidence, `npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=jammu-kashmir-and-ladakh` reports `internalProofBarSatisfied=true`, and the profile is reviewed for internal raw-fetch scheduling while remaining `publicBeta=false`.
- 2026-04-22: Added an internal-only common High Court profile for Jammu & Kashmir and Ladakh using the current official court name, one HC NJDG selector (`1~12`), and explicit covered union territories. The repo docs now record the required source-review and internal-readiness posture before any live proof cycle or public-beta decision.
- 2026-04-20: Completed the first post-MVP public-alpha alerting slice by adding a scheduled ECS public-alpha monitor, alarmable `NYAAYWATCH_PUBLIC_ALPHA_OPS_ALERT=` log output, and a CloudWatch-to-SNS alarm path so `ops:verify-public-alpha` now produces dependable wake-up behavior outside manual release checks.
- 2026-04-19: Replaced the old Himachal-first homepage with a Supreme Court-first national front door at `/`, moved the Himachal lower-court overview to `/states/himachal`, and updated route/test/docs coverage so the public product now stages Supreme Court, High Courts, and district/subordinate courts without implying fake cross-tier comparability.
- 2026-04-22: Removed the remaining Himachal-biased lower-court summary copy from `/` by rebuilding that section around the currently published multi-state cohort, so the national homepage now points readers into state pages and relative pressure rather than a disguised default-state snapshot.
- 2026-04-19: Split the internal raw-fetch scheduler into three tier-specific ECS schedules: lower-court states at `8:00 AM Asia/Kolkata`, Supreme Court at `8:10 AM Asia/Kolkata`, and reviewed High Courts at `8:20 AM Asia/Kolkata`, while keeping publishes manual and reviewed.
- 2026-04-20: Added the post-MVP ops watchdog as a real scheduled GitHub Actions monitor in `.github/workflows/ops-watchdog.yml`, backed by the new repo-native `npm run ops:verify-internal-fetch-schedule` verifier for all three live internal fetch schedules. The watchdog now reads `OPERATOR_API_TOKEN` from the staging Secrets Manager output, opens or updates a durable GitHub issue on failure, and sends a first-incident SNS alert through the staging alarm topic.
- 2026-04-21: Hardened App Runner PR previews with repo-native stale-service reconciliation. Preview deploys now start after `secret-scan` instead of waiting for the full `verify` lane, reconcile `nyaaywatch-pr-*` services against the live open-PR set before deploy, retry once after quota recovery, and run an hourly `preview-reconcile` workflow so stale preview services do not accumulate behind missed close events or App Runner transitional-state races.
- 2026-04-23: Fixed the App Runner preview cleanup pagination gap. The preview reconcile, preview delete, and preview deploy lookup paths now page through the full `list-services` inventory instead of only the first page, with regression coverage for stale preview deletion beyond page one. This closes the real quota leak that left merged-PR previews consuming the 30-service App Runner cap.
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
- 2026-04-17: Split alpha cadence into internal raw fetches plus twice-weekly public publishes, and added a deploy-time schedule reconciler so the live AWS scheduler can follow the current ECS task definition instead of drifting behind GitHub Actions service rollouts.
- 2026-04-18: Completed the Telangana public rollout after PR `#70` merged and deploy run `24593998269` rolled the live stack to task definition `:60`; Telangana fetch `run_79ae11fb-75fa-460d-a47d-929d0889657c` published as `publication_7691e5be-23b5-46ca-9aff-dd84148b7e8b`, `release:verify` passed on the stable Telangana URLs, and the live browser check confirmed the expected trust metadata plus supported-state navigation.
- 2026-04-18: Completed the next internal-only wave on the same task definition `:60`: Madhya Pradesh (`MP`), Maharashtra (`MH`), Bihar (`BR`), and Gujarat (`GJ`) all cleared `fetch -> publish -> replay -> rollback` while their public state routes and `/v1/states/.../stats` endpoints remained dark with `404`s.
- 2026-04-18: Promoted Kerala (`KL`) into the approved public-state set in repo config, added `docs/KERALA_PUBLIC_READINESS_REVIEW.md`, `docs/KERALA_GO_LIVE_CHECKLIST.md`, and `tests/kerala-public-rollout.test.ts`, and wired Odisha (`OD`), West Bengal (`WB`), Jharkhand (`JH`), and Chhattisgarh (`CG`) into repo config as the next internal-only batch.
- 2026-04-18: Completed the Kerala public rollout after PR `#72` merged and deploy run `24594772675` rolled the live stack to task definition `:62`; Kerala fetch `run_e4ce54db-1dd6-473e-8ea6-318856c3f1f5` published as `publication_4fff0bca-7b58-49d1-992d-a113c43f577a`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug kerala` passed with `districtCount=14`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`, and stable Kerala page plus stats routes now return `200`.
- 2026-04-18: Promoted Meghalaya (`ML`) into the approved public-state set in repo config, added `docs/MEGHALAYA_PUBLIC_READINESS_REVIEW.md`, `docs/MEGHALAYA_GO_LIVE_CHECKLIST.md`, `tests/meghalaya-public-rollout.test.ts`, plus Meghalaya snapshot fixtures so the next public rollout can reuse the same parity pattern as Telangana and Kerala without widening national scaffolding.
- 2026-04-18: Completed the Odisha (`OD`), West Bengal (`WB`), Jharkhand (`JH`), and Chhattisgarh (`CG`) internal proof cycles after the same `:62` rollout: Odisha cleared fetch `run_eb64e8ff-b70b-4eda-be14-180441a38548`, publish `publication_24cc3461-c2e1-47b0-a870-907306ca183d`, replay `run_07c3627f-1f65-4915-9516-1d72d2ae9e18`, and rollback `publication_0b8376be-33ae-4c60-a534-835ebb199b57`; West Bengal cleared fetch `run_4af4d3ee-db7f-4570-995b-361d99bb6bcf`, publish `publication_4b085772-5b96-402c-81fb-2bc5a9b12060`, replay `run_3e45e064-d1b8-41ea-aefe-f1c7372d3a8f`, and rollback `publication_09fd4895-3a75-4c8f-97aa-5222e4137541`; Jharkhand cleared fetch `run_9555324e-3416-4c6d-8287-e666982f8bec`, publish `publication_ff13fc7e-1d39-44ad-ad17-c45f2515f159`, replay `run_ad91c0c0-59f9-4c50-be1c-26f387539e47`, and rollback `publication_12683d90-942c-4050-b5f7-7ccca8932b07`; Chhattisgarh cleared fetch `run_3deffe82-3ee7-477f-ae37-e70b93d544e6`, publish `publication_301acf9a-e2d2-46b2-940c-42a2cd989ece`, replay `run_d60f4c4b-8385-4193-9a63-efc5dcc3dcda`, and rollback `publication_412a4d67-73fe-4bdd-b149-24c05cbaf973`, while all four public route families stayed dark with `404`s.
- 2026-04-17: Enabled the live internal fetch scheduler on AWS as `nyaaywatch-staging-weekday-internal-fetch`, then verified it with a one-time smoke schedule that launched an ECS task through EventBridge Scheduler and completed fetch run `run_337a80ae-4980-415a-8585-d670e413dfed` without changing the public snapshot.
- 2026-04-18: Updated the documented raw-fetch policy to run every day at `8:00 AM Asia/Kolkata` across all implemented states while keeping public publishes operator-reviewed and manual on their existing cadence.
- 2026-04-18: Implemented the daily multi-state scheduler path in code by replacing the single-state `--state HP` schedule target with an ECS entrypoint that iterates through every implemented state sequentially, records per-state fetch notes, and fails the scheduled task only after attempting the full implemented-state set.
- 2026-04-18: Corrected the new ops sweep so daily-fetch lag is measured from each state's latest successful internal operator run instead of the currently published snapshot date; this removed a false-positive Himachal lag report and aligned the post-MVP backlog with the real next step of alerting and watchdogs rather than a nonexistent HP fetch outage.
- 2026-04-20: Tightened the ops sweep again so daily-fetch lag is measured from each state's latest successful internal operator run completion time instead of the run's `sourceSnapshotAt`; this removed a new false-positive batch of lag alerts across Andhra Pradesh, Arunachal Pradesh, Manipur, Kerala, Meghalaya, Karnataka, Tripura, Nagaland, Uttarakhand, Rajasthan, Uttar Pradesh, and Madhya Pradesh, where the scheduler had completed fresh runs without a newer upstream source date.
- 2026-04-17: Completed the Haryana public rollout after PR `#56` merged and deploy run `24582480598` rolled the live stack to task definition `:45`; ECS-backed fetch `run_bf1fd888-173c-4a58-9dde-f797b92f7c30` published Haryana as `publication_e57d5546-e9aa-4bee-a951-edeb2bc4789c`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug haryana` passed, and the live browser check confirmed the explicit Haryana trust surface on `https://nyaaywatch.in/states/haryana`.
- 2026-04-17: Completed the first southern and north-east internal proof cycles on the same live stack: Tamil Nadu cleared fetch `run_329a8b74-2b9d-4c33-ba2f-46b19186935c`, publish `publication_34aa96eb-f212-4cad-9412-086bfe3c41a6`, replay `run_c69af2d5-b2dd-455e-82aa-3a7125122d71`, and rollback `publication_43eefb27-a754-4590-91f1-0e38d9e40705`, while Assam cleared fetch `run_32e2194a-027d-4ec2-8d50-b3c282446b90`, publish `publication_688f053e-53a4-4662-9367-a4ffba4973ce`, replay `run_c28d9a91-0543-40b2-adac-1ca5e0c2e85d`, and rollback `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f`; both states stayed internal-only with public routes returning `404`.
- 2026-04-17: Chose Tamil Nadu as the next public state after Haryana, added `docs/TAMIL_NADU_PUBLIC_READINESS_REVIEW.md` plus `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md`, and shifted the next internal-only pair to Kerala (`KL`) and Meghalaya (`ML`) after live NJDG source checks confirmed stable source shapes for both.
- 2026-04-17: Completed the Kerala (`KL`) and Meghalaya (`ML`) internal proof cycles after PR `#58` merged and deploy run `24584550026` rolled the live stack to task definition `:47`; Kerala cleared fetch `run_60fc22fb-a2b2-41e5-9bf5-f01b6e7b39e3`, publish `publication_4f53dbb3-7530-40ca-aeed-3a27bbd5b892`, replay `run_84af7110-13b1-4150-8be6-cc82e83a36c3`, and rollback `publication_dafbab89-af38-4a41-a006-9153f126e785`, while Meghalaya cleared fetch `run_3dd14fff-0791-45b4-9bd7-27ce798cc850`, publish `publication_b1b1d691-d8bf-4e79-8d2d-119dff5b024c`, replay `run_5fda86c5-aefe-4e33-ae39-e25dac3f4830`, and rollback `publication_7337df86-24c6-4290-8ee4-2b740e5110af`; both states remained internal-only with public routes returning `404`.
- 2026-04-17: Promoted Tamil Nadu (`TN`) into the approved public-state set in repo config, added a dedicated `tests/tamil-nadu-public-rollout.test.ts` preflight suite plus TN snapshot fixtures, and checked off the local typecheck plus targeted regression gates in `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md` ahead of the live rollout.
- 2026-04-17: Completed the Tamil Nadu public rollout after PR `#64` merged and deploy run `24588602379` rolled the live stack to task definition `:54`; ECS-backed fetch `run_d7f79d01-99c7-41b5-b87d-a4145438b3fa` published Tamil Nadu as `publication_af06c306-b7e8-4c62-b4b8-e80f301f5b04`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tamil-nadu` passed, and the live browser check confirmed the explicit Tamil Nadu trust surface on `https://nyaaywatch.in/states/tamil-nadu`.
- 2026-04-17: Chose Assam (`AS`) as the next public state after Tamil Nadu, promoted Assam into the approved public-state set in repo config, and added `docs/ASSAM_PUBLIC_READINESS_REVIEW.md`, `docs/ASSAM_GO_LIVE_CHECKLIST.md`, `tests/assam-public-rollout.test.ts`, plus Assam snapshot fixtures so the next live rollout can use the same parity pattern as Haryana and Tamil Nadu.
- 2026-04-17: Chose Karnataka (`KA`), Tripura (`TR`), and Nagaland (`NL`) as the next internal-only trio after live NJDG source checks confirmed stable footer freshness, district drilldowns, and the current metric contract for all three; repo support plus internal-readiness reviews now exist for the trio without widening the public site.
- 2026-04-17: Chose Telangana (`TS`), Andhra Pradesh (`AP`), Arunachal Pradesh (`AR`), and Manipur (`MN`) as the next internal-only batch after live NJDG source checks confirmed contract-compatible state pages, age-bucket parity, and district drilldown reachability for all four; the next public state remains a deliberate later decision rather than an automatic promotion.
- 2026-04-17: Completed the Telangana (`TS`), Andhra Pradesh (`AP`), Arunachal Pradesh (`AR`), and Manipur (`MN`) internal proof cycles after PR `#68` merged and deploy run `24591817588` rolled the live stack to task definition `:58`; Telangana cleared fetch `run_b48f6632-d59e-4bf9-9cdf-30125e045538`, publish `publication_eebf7779-60ed-4f91-967e-ab8dd6006fb8`, replay `run_e350d3ba-98d9-4d55-b073-638e69a8039d`, and rollback `publication_83bbcec4-3402-4f8c-9014-6646255a64a0`, Andhra Pradesh cleared fetch `run_4cb87c2a-1c31-4437-98ef-dc7d082ad6ef`, publish `publication_337af32e-4f9c-45ab-a4a4-52d43a2028b4`, replay `run_ce2ec512-176a-483e-ba9c-309054a0fff6`, and rollback `publication_c9d3057f-b1a2-4a0f-83ea-ac2b66886e1a`, Arunachal Pradesh cleared fetch `run_330e608c-890c-47e2-a585-3171c3c44c42`, publish `publication_316b931a-30e2-418f-ae8b-ade91f1b4fa9`, replay `run_7067210b-fe7f-4366-a6a7-e0788824e727`, and rollback `publication_3acdfe73-8c9b-40a8-b882-472934a2fa90`, and Manipur cleared fetch `run_ce3e086f-84f5-40d7-9540-366fe1c40a25`, publish `publication_d747187e-cc5e-4071-9fba-75a73e96058c`, replay `run_bdfe0d4a-770d-49cb-9f04-952999686779`, and rollback `publication_29505d10-5434-4237-8b0d-89a9dfcf08cf`; all four states remained internal-only with public routes returning `404`.
- 2026-04-17: Revised the next public sequencing rule after the TS/AP/AR/MN internal proof wave: public rollout now advances in internal-proof order across the cleared batch, starting with Telangana (`TS`) and then moving to Andhra Pradesh (`AP`), Arunachal Pradesh (`AR`), and Manipur (`MN`) after each prior public rollout is complete.
- 2026-04-17: Added Telangana public preflight artifacts in `docs/TELANGANA_PUBLIC_READINESS_REVIEW.md`, `docs/TELANGANA_GO_LIVE_CHECKLIST.md`, `tests/telangana-public-rollout.test.ts`, and `tests/telangana-test-snapshot.ts`, and wired Madhya Pradesh (`MP`), Maharashtra (`MH`), Bihar (`BR`), and Gujarat (`GJ`) into repo config plus internal-readiness docs as the next internal-only batch.
- 2026-04-18: Wired Goa (`GA`), Sikkim (`SK`), and Mizoram (`MZ`) into repo config as the final internal-only prep wave, updated geographies regression coverage, and refreshed their readiness reviews from unsupported placeholders into active source-backed internal candidates without widening the public site.
- 2026-04-18: Completed the Meghalaya public rollout after PR `#74` merged and deploy run `24595471387` rolled the live stack to task definition `:64`; Meghalaya fetch `run_30e5689d-a0da-46e8-8c27-c8624b68cd9d` published as `publication_72eff473-ec6f-4f28-b4d6-fd1cffef04e5`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug meghalaya` passed with `districtCount=14`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`, and stable Meghalaya page plus stats routes now return `200`.
- 2026-04-18: Completed the final internal-only proof wave on the same `:64` rollout: Goa (`GA`), Sikkim (`SK`), and Mizoram (`MZ`) all cleared `fetch -> publish -> replay -> rollback` while their public page plus stats routes remained dark with `404`s, which closes the current states-only internal coverage map.
- 2026-04-18: Promoted Karnataka (`KA`), Tripura (`TR`), and Nagaland (`NL`) into the approved public-state set in repo config, added state-specific public readiness reviews plus go-live checklists, and introduced dedicated parity suites so the next three live rollouts can proceed sequentially in internal-proof order without reopening source-shape questions.
- 2026-04-18: Completed the Karnataka public rollout after PR `#76` merged and deploy run `24596186779` rolled the live stack to task definition `:66`; Karnataka fetch `run_79131eaf-bd31-4c4e-a95f-fc84b065a261` published as `publication_c58870a4-f378-4848-a8ce-ae38fb62f885`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug karnataka` passed with `districtCount=31`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`, and stable Karnataka page plus stats routes now return `200`.
- 2026-04-18: Completed the Tripura public rollout on task definition `:66`; Tripura fetch `run_fa4c7a48-6536-4e32-9d3a-63f6eecec153` published as `publication_a2308b8b-946e-4725-900e-14e638fe85dd`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tripura` passed with `districtCount=8`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`, and stable Tripura page plus stats routes now return `200`.
- 2026-04-18: Completed the Nagaland public rollout on task definition `:66`; Nagaland fetch `run_575e0ebe-fd32-4fda-88f2-1c6d69175d6c` published as `publication_b01df802-1d04-409b-b608-55500e1b47a9`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug nagaland` passed with `districtCount=11`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`, and stable Nagaland page plus stats routes now return `200`.
- 2026-04-18: Promoted Andhra Pradesh (`AP`) into the approved public-state set in repo config, added `docs/ANDHRA_PRADESH_PUBLIC_READINESS_REVIEW.md`, `docs/ANDHRA_PRADESH_GO_LIVE_CHECKLIST.md`, `tests/andhra-pradesh-public-rollout.test.ts`, and `tests/andhra-pradesh-test-snapshot.ts`, and checked the AP-specific public-route parity slice locally so the public rollout sequence can continue from Nagaland to Andhra Pradesh without reopening source-shape questions.
- 2026-04-18: Completed the Andhra Pradesh public rollout after PR `#79` merged and deploy run `24599082633` rolled the live stack to task definition `:69`; Andhra Pradesh fetch `run_60611cb7-7a5c-44b5-970e-4ca51355c1e7` published as `publication_b090f61a-3762-4bf5-8529-36b331b6e362`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug andhra-pradesh` passed with `districtCount=13`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`, and stable Andhra Pradesh page plus stats routes now return `200`.
- 2026-04-18: Promoted Arunachal Pradesh (`AR`) into the approved public-state set in repo config, added `docs/ARUNACHAL_PRADESH_PUBLIC_READINESS_REVIEW.md`, `docs/ARUNACHAL_PRADESH_GO_LIVE_CHECKLIST.md`, `tests/arunachal-pradesh-public-rollout.test.ts`, and `tests/arunachal-pradesh-test-snapshot.ts`, and checked the AR-specific public-route parity slice locally so the public rollout sequence can continue from Andhra Pradesh to Arunachal Pradesh without reopening source-shape questions.
- 2026-04-18: Completed the Arunachal Pradesh public rollout after PR `#81` merged and deploy run `24599656003` rolled the live stack to task definition `:71`; Arunachal Pradesh fetch `run_d2dadaec-bda6-4639-8629-28201a562708` published as `publication_ded2b9e1-f28a-4ead-90c4-1ba03a9890b0`, `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug arunachal-pradesh` passed with `districtCount=27`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`, and stable Arunachal Pradesh page plus stats routes now return `200`.
- 2026-04-18: Approved the remaining internally proven states (`MN`, `MP`, `MH`, `BR`, `GJ`, `OD`, `WB`, `JH`, `CG`, `GA`, `SK`, `MZ`, `UK`, `RJ`, and `UP`) into the repo-level public-prep set together, replaced one-off prep churn with a table-driven parity suite, and left the actual live rollout order to the same explicit operator-reviewed publish flow.

- 2026-04-18: Completed the remaining supported-state public rollout window after PR `#83` merged and deploy run `24600208536` settled the live ECS service on task definition `:74`; Manipur, Uttarakhand, Rajasthan, Uttar Pradesh, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, Chhattisgarh, Goa, Sikkim, and Mizoram are now publicly live, which closes the current states-only rollout program.
- 2026-04-18: Added a repo-native public-alpha ops sweep via `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in`, which verifies every public state, surfaces stale-snapshot and daily-fetch-lag conditions explicitly, and lets post-MVP operations focus on operational maturity instead of more rollout bookkeeping. `TODOS.md` now tracks that post-MVP backlog directly instead of duplicating rollout history.
- 2026-04-18: Audited the public-site copy after multi-state rollout drift surfaced on the homepage and methodology page, replaced the joined-state-list wording with state-switcher-aware scope copy, and expanded copy guardrails to cover stale default-route messaging.
- 2026-04-24: Promoted the final ten internally proven High Court profiles into the public beta gate in repo code: Chhattisgarh, Jharkhand, Karnataka, Odisha, Bihar via Patna High Court, Uttarakhand, Sikkim, Tripura, Meghalaya, and Manipur. After this slice, the public High Court beta covers all 25 configured HC NJDG selector-backed High Court profiles while keeping public data snapshot-based and operator-published.
- 2026-04-24: Tightened the manual deploy-only public-route purge workflow after the final High Court promotion exposed a local skip gap: `npm run release:purge-public-routes` now loads only purge-specific env, fails loudly by default when Cloudflare config is missing, and reserves `--allow-missing-cloudflare` for intentional local route-construction checks.
- 2026-04-24: Closed the first public-launch audit hardening slice by escaping source-derived script JSON, redacting newsletter tokens from request logs, expanding release verification and the public-alpha ops sweep across lower courts, High Courts, and the Supreme Court, and making the raw artifacts bucket explicitly private, encrypted, retained, and versioned.
- 2026-04-25: Closed the codebase-review hardening slice by removing scheduled and deploy-time auto-publish from the public path, verifying raw artifact checksums before replay/publish reads, aggregating national OG-card totals from all published state snapshots, opening ALB port `443` and validating health JSON through redirects, requiring re-confirmation after newsletter unsubscribe, sanitizing global `500` responses, excluding local worktrees from Vitest discovery, documenting the pressure-index formula near the public ranking, and replacing invalid JSON API samples.
- 2026-04-25: Clarified the production/staging split without changing live AWS resources: `https://nyaaywatch.in` remains production, the existing `nyaaywatch-staging` stack is documented as a legacy production backing stack, `npm run operator:production` is the current production operator alias, and the next infrastructure step is a parallel `nyaaywatch-production` cutover before reclaiming `nyaaywatch-staging` for dedicated staging.
- 2026-04-26: Added the first non-mutating production-cutover preflight slice: `npm run infra:production-preflight` checks the current production backing stack, detects an existing `nyaaywatch-production` target stack, and verifies public health before any parallel production deploy; CI and watchdog variables now call the live stack `PRODUCTION_STACK_NAME` while the actual current value remains `nyaaywatch-staging`.
