# Meghalaya Go-Live Checklist

Historical rollout note: this dated readiness record preserves the rollout scope and evidence available when it was written. The current public scope is India-first: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Use `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md` for current coverage.


Checklist for deciding whether Meghalaya can move from internal trial to soft public availability.

This is narrower than a nationwide launch checklist. Meghalaya has already cleared the internal proof bar, but it should stay dark on the public site until the state-specific rollout gates below are complete.

## Release Metadata

- Candidate state: `Meghalaya`
- State code: `ML`
- Current decision: `public rollout completed`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Readiness review: `docs/MEGHALAYA_PUBLIC_READINESS_REVIEW.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Internal Operating Evidence

- [x] Meghalaya has completed a live `fetch -> inspect -> publish -> replay -> rollback` cycle.
- [x] Multiple additional internal-only states have since cleared the same live proof cycle.
- [x] The release history and expansion review log record the Meghalaya internal publication lineage.

Why this gate exists:

- It keeps public expansion narrower than internal expansion and avoids treating a single clean Meghalaya run as enough evidence on its own.

### 2. Snapshot Integrity

- [x] Meghalaya public routes can be wired to read only from the active published snapshot in the state-scoped runtime.
- [x] No public Meghalaya route or download reads unpublished run state in local verification.
- [x] Meghalaya CSV, API, and UI can resolve to the same publication lineage once promoted in verification.
- [x] Meghalaya rollback target is recorded in live public release history after the first public publication.

### 3. Trust Metadata And Caveats

- [x] Meghalaya entry, district index, and district detail surfaces can show source snapshot date, publication date, freshness, methodology version, and source attribution in local verification.
- [x] Meghalaya copy can use `published snapshot`, `flagged signal`, and `operator-published` semantics in local verification.
- [x] Meghalaya copy can avoid live, predictive, or verdict-like framing in local verification.
- [x] Live hostname/browser checks confirm the same trust posture after rollout.

### 4. Product And IA Discipline

- [x] Meghalaya exposure stays concrete through explicit `/states/meghalaya/...` routes rather than broader national scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal remains the default unscoped surface.
- [x] No UI implies nationwide parity or cross-state breadth that does not exist.

### 5. Source And Export Boundary

- [x] Meghalaya public downloads are limited to normalized published read-model fields in local verification.
- [x] Raw Meghalaya NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [x] `npm run typecheck`
- [x] `npm test -- tests/geographies.test.ts tests/meghalaya-public-rollout.test.ts`
- [x] `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug meghalaya`
- [x] Browser verification on `https://nyaaywatch.in/states/meghalaya`

### 7. Deployment

- [x] The AWS runtime configuration for the public stack is updated intentionally rather than ad hoc.
- [x] `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, `docs/RELEASE_HISTORY.md`, and `docs/MVP_EXECUTION_PLAN.md` are updated with the actual rollout result.
- [x] The first Meghalaya public publication id and rollback posture are recorded explicitly.

## Decision

- [x] Ready for soft public availability
- [ ] Keep internal only

If blocked, record the blocker and exact next action in `docs/EXPANSION_REVIEW_LOG.md`.
