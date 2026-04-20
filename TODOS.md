# TODOS

`docs/MVP_EXECUTION_PLAN.md` is the ordered path to the Himachal alpha MVP.

Use this file for:

- post-MVP operational work
- backlog shaping after the completed supported-state rollout
- deliberate scope increases that are not yet approved for implementation

Do not use this file as a second release ledger. The detailed rollout evidence already lives in:

- `docs/DEPLOYMENT_STATUS.md`
- `docs/RELEASE_HISTORY.md`
- `docs/EXPANSION_REVIEW_LOG.md`

## Next Up

### 1. Public Alpha Operations And Alerting

- [ ] Wire `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in` into a scheduled monitor with a real alert path. The repo now has the verification sweep; the missing piece is dependable wake-up behavior when it fails.
- [ ] Add a scheduler-execution watchdog for `nyaaywatch-staging-weekday-internal-fetch` so the team can distinguish “public snapshot is still acceptable” from “the daily internal fetch stopped firing.”
- [ ] Keep the operator review loop boring and enforced: release windows should always produce aligned evidence in `docs/RELEASE_HISTORY.md`, `docs/DEPLOYMENT_STATUS.md`, and the generated release-evidence artifacts.

### 2. Freshness And Trust-Surface Hardening

- [ ] Decide whether any public state needs a stronger freshness banner or methodology note once the ops sweep has run across multiple real release windows.
- [ ] Add an explicit operator runbook for what to do when the ops sweep reports daily-fetch lag but the product is not yet stale by the 14-day public trust threshold.
- [ ] Review whether any public state has source-shape quirks that deserve state-specific caveats instead of silently relying on the common methodology text.

### 3. Deliberate Post-Rollout Scope Decisions

- [ ] Decide whether the legacy `.com -> .in` ALB redirect rules should stay externally managed or be imported/recreated so CloudFormation owns them too. The stack reconciliation now skips those pre-existing listener rules with `ManageCanonicalRedirectRules=false`, but everything else is back under stack control.
- [ ] Turn the initial multi-jurisdiction High Court design into a phase-1 implementation plan: storage identity cleanup, profile/schema widening, and the first internal pilot court.
- [ ] Do not add more geography just because the current state set is live. Any next expansion should clear `docs/MULTI_STATE_EXPANSION_GATES.md` after the operational loop above has held for a few stable windows.
- [ ] If the next scope increase is not another state, evaluate a single narrow candidate such as a new court tier or deeper operating evidence, not a broad “nationwide platform” step.

## Recently Completed

- [x] Implemented the Supreme Court-first national homepage so `/` now stages Supreme Court, High Courts, and district/subordinate courts in one scroll without fake cross-tier comparability; the Himachal lower-court overview moved to explicit `/states/himachal` while the unscoped district/data/methodology/API routes remain backward-compatible.
- [x] Reconciled the live `nyaaywatch-staging` CloudFormation stack onto the current secret-aware staging template generation: the stack now outputs `DatabaseUrlSecretArn`, `OperatorApiTokenSecretArn`, and `CloudflareApiTokenSecretArn`, and the live ECS service is stable on task definition `:119` with those three values injected through ECS `secrets`.
- [x] Wrote the first multi-jurisdiction High Court design doc in `docs/HIGH_COURT_MULTI_JURISDICTION_DESIGN.md`, grounding the next phase in the real one-state assumptions still present in `src/high-courts.ts`, the High Court snapshot schemas, and the warehouse `state_code` identity.
- [x] Implemented the public Supreme Court route family in repo code under `/supreme-court` and `/v1/supreme-court/...`, reusing the published-snapshot contract plus the in-repo Supreme Court methodology draft instead of inventing a new public data path.
- [x] Completed the live runtime secret posture for the current ECS service: the active service now runs task definition `:117`, which injects `DATABASE_URL`, `OPERATOR_API_TOKEN`, and `CLOUDFLARE_API_TOKEN` through ECS `secrets`; the remaining infra debt is stack-template parity, not live plaintext runtime env vars.
- [x] Wired the Cloudflare API token into the live ECS task definition and task-execution role, so the Supreme Court and High Court public-route purge path can execute in production instead of only existing in repo code.
- [x] Decided to keep the current seven-court public High Court beta fixed until the multi-jurisdiction court problem is intentionally designed; the queued single-jurisdiction High Court validation list is now exhausted.
- [x] Completed the Meghalaya and Manipur High Court internal proof pair on the live operator lane; both courts now have fresh fetch, publish, replay, and rollback evidence, the batch verifier reports `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, and `rollbackReadyCourts=2`, and the queued single-jurisdiction High Court list is now fully internally proven.
- [x] Completed the Sikkim and Tripura High Court internal proof pair on the live operator lane; both courts now have fresh fetch, publish, replay, and rollback evidence, the batch verifier reports `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, and `rollbackReadyCourts=2`, and the next deliberate queued-court pair is now Meghalaya plus Manipur.
- [x] Completed the Bihar and Uttarakhand High Court internal proof pair on the live operator lane; both courts now have fresh fetch, publish, replay, and rollback evidence, the batch verifier reports `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, and `rollbackReadyCourts=2`, and the next deliberate queued-court pair is now Sikkim plus Tripura.
- [x] Completed the Karnataka and Odisha High Court internal proof pair on the live operator lane; both courts now have fresh fetch, publish, replay, and rollback evidence, the batch verifier reports `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, and `rollbackReadyCourts=2`, and the next deliberate queued-court pair is now Bihar plus Uttarakhand.
- [x] Verified the live public Supreme Court beta after PR `#110` merged and deploy run `24624392748` settled the live ECS service on task definition `:98`; `/supreme-court`, `/supreme-court/data`, `/supreme-court/methodology`, `/supreme-court/api`, `/v1/supreme-court/stats`, and `/v1/supreme-court/trends` all returned `200`, and the release evidence is now recorded in the Supreme Court readiness review, deployment status, expansion log, and release history docs.
- [x] Verified the live public Gujarat and Madhya Pradesh High Court beta rollout after PR `#115` merged and deploy run `24637168455` settled the live ECS service on task definition `:103`; `/high-courts`, both High Court page families, and both `/v1/high-courts/...` route pairs all returned `200`, and the release evidence is now recorded in deployment, release-history, expansion-log, and High Court wave docs.
- [x] Verified the live public Uttar Pradesh and Rajasthan High Court beta rollout after PR `#113` merged and deploy run `24636212237` settled the live ECS service on task definition `:101`; `/high-courts`, both High Court page families, and both `/v1/high-courts/...` route pairs all returned `200`, and the release evidence is now recorded in deployment, release-history, expansion-log, and High Court wave docs.
- [x] Added explicit Cloudflare purge support for deploy-only Supreme Court and High Court public-beta route families, and wired High Court plus Supreme Court publish and rollback flows to invalidate their HTML and JSON public routes instead of leaving newly exposed pages vulnerable to stale edge `404`s.
- [x] Verified the live public Himachal High Court beta after PR `#105` merged and deploy run `24621281752` settled the live ECS service on task definition `:93`; `/high-courts/himachal`, `/high-courts/himachal/data`, `/high-courts/himachal/methodology`, `/high-courts/himachal/api`, `/v1/high-courts/himachal/stats`, and `/v1/high-courts/himachal/trends` all returned `200`, and the release evidence is now recorded in the High Court readiness review, deployment status, expansion log, and release history docs.
- [x] Completed the second live Supreme Court operator proof cycle after PR `#108` merged and deploy run `24623340754` settled the live ECS service on task definition `:96`; a second `fetch -> publish -> replay -> rollback` window now exists on the live `/operator/supreme-court/...` namespace, the methodology draft is in-repo, the public `/supreme-court` route still returns `404`, and the repeated-window internal proof bar is now recorded as satisfied.
- [x] Completed the first live Supreme Court operator proof cycle after PR `#107` merged and deploy run `24622868188` settled the live ECS service on task definition `:95`; the internal `/operator/supreme-court/...` namespace is now live behind auth, `fetch -> publish -> replay -> rollback` succeeded with real Supreme Court NJDG evidence, the public `/supreme-court` route still returns `404`, and the first live evidence is now recorded in the Supreme Court internal readiness review, deployment status, and expansion log.
- [x] Implemented the internal Supreme Court scaffold: repo config, capture schema, deterministic NJDG extractor, normalized snapshot candidate and published snapshot contracts, runtime bootstrapping, operator CLI/remote support, and the dedicated `/operator/supreme-court/...` lifecycle for fetch, inspect, publish, replay, and rollback.
- [x] Decided that Supreme Court should be the next public top-down tier before any broader High Court UX expansion, and wrote the source-review plus pilot-plan docs that define the source boundary, route family, shared-vs-tier-specific data contract, and homepage integration rules.
- [x] Designed the first homepage IA for a Supreme Court-first product shell inside `docs/SUPREME_COURT_PILOT_PLAN.md`, so the next implementation slice can begin with a concrete top-down route and UX contract instead of open-ended product debate.
- [x] Wrote the Supreme Court methodology draft in `docs/SUPREME_COURT_METHODOLOGY.md`, covering sourced versus derived metrics, the registered/unregistered contract, the explicit `captured_at` fallback date policy, and the comparison limits that should hold before any public `/supreme-court` page ships.
- [x] Enabled the narrow public Himachal High Court beta surface in repo code under `/high-courts/himachal`, with published-only HTML and JSON routes plus tier-specific methodology, data, and API pages.
- [x] Ran `npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=himachal` against the live stack after real Himachal operator proof cycles and recorded that Himachal now satisfies the internal High Court proof bar.
- [x] Deployed the High Court parser hardening, reran `npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=uttar-pradesh,rajasthan`, and completed the first live Uttar Pradesh and Rajasthan High Court fetch/publish/replay/rollback proof cycles.
- [x] Added a first internal multi-state High Court wave for the single-jurisdiction courts that already fit the current High Court snapshot contract, and documented the deliberate exclusions for multi-jurisdiction courts and Delhi in `docs/HIGH_COURT_INTERNAL_WAVE_1.md`.
- [x] Added a batch High Court wave-readiness verifier plus `docs/HIGH_COURT_WAVE_VALIDATION_PLAN.md`, so the first post-Himachal queued-court validation pair is now explicit: Uttar Pradesh and Rajasthan through `npm run high-court:wave-readiness`.
- [x] Ran the first live Uttar Pradesh and Rajasthan High Court proof attempt on `2026-04-19` and confirmed the real blocker is an HC NJDG markup defect in the `Disposal in last month` row, not missing operator wiring or credentials.
- [x] Added a Himachal High Court internal-readiness verifier plus a dedicated readiness review doc, so the “repeat internal proof cycles before beta” gate is now executable through `npm run high-court:readiness` instead of living only as prose.
- [x] Added the internal Himachal High Court read surface and operator entrypoints on top of the High Court operator lifecycle: the app now exposes a dedicated `/operator/high-courts/:courtSlug/...` namespace plus local/remote operator support for High Court fetch, inspect, publish, replay, rollback, and publication/history reads without touching any public High Court route.
- [x] Fixed the false-positive Himachal daily-fetch lag in `npm run ops:verify-public-alpha`: the sweep now reads each state's latest successful internal operator run instead of inferring internal cadence from the older published snapshot date. Live AWS evidence already showed Himachal's scheduled fetch `run_337a80ae-4980-415a-8585-d670e413dfed` completed on `2026-04-17` with `sourceSnapshotAt=2026-04-16`, and the corrected live sweep is now green across all 28 public states.
- [x] Implemented the Himachal High Court internal operator lifecycle on top of the explicit High Court date contract: capture, inspect, publish, replay, and rollback now work through a dedicated High Court service with warehouse round-tripping and focused regression coverage.
- [x] Resolved the Himachal High Court source-date contract at the methodology level: official HC NJDG HTML plus official AJAX responses did not expose a trustworthy source snapshot date on `2026-04-18`, so the High Court tier now adopts an explicit `captured_at` fallback trust label instead of faking `sourceSnapshotAt`.
- [x] Implemented the first real Himachal High Court HC NJDG capture and extract path: the repo now has a High Court source client, capture schema, deterministic aggregate parser coverage, and the source-review evidence that forced the High Court date-contract decision.
- [x] All currently supported states are publicly live on `https://nyaaywatch.in`; there is no remaining approved-state internal or public rollout queue in the current roadmap.
- [x] The repo now has a public-alpha ops sweep via `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in`, which verifies every public state and surfaces parity failures, stale public snapshots, and daily-fetch lag explicitly.
- [x] `TODOS.md` now tracks the actual post-MVP backlog instead of duplicating rollout history.
