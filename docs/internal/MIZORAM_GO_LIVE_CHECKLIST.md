# Mizoram Go-Live Checklist

Historical rollout note: this dated readiness record preserves the rollout scope and evidence available when it was written. The current public scope is India-first: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Use `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md` for current coverage.


Checklist for deciding whether Mizoram can move from approved public-prep state to public availability.

This is narrower than a nationwide launch checklist. Mizoram had already cleared the internal proof bar and was wired in repo config as an approved public state before launch.

## Release Metadata

- Candidate state: `Mizoram`
- State code: `MZ`
- Current decision: `public rollout completed`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Readiness review: `docs/MIZORAM_PUBLIC_READINESS_REVIEW.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Internal Operating Evidence

- [x] Mizoram completed a live `fetch -> inspect -> publish -> replay -> rollback` cycle before public launch.
- [x] Multiple additional states had already cleared the same live proof cycle before this rollout window.
- [x] The release history and expansion review log record the Mizoram publication lineage.

### 2. Snapshot Integrity

- [x] Mizoram public routes read only from the active published snapshot in the state-scoped runtime.
- [x] No public Mizoram route or download reads unpublished run state.
- [x] Mizoram CSV, API, and UI resolve to the same publication lineage.
- [x] Mizoram rollback target is recorded in the public release history.

### 3. Trust Metadata And Caveats

- [x] Mizoram entry, district index, and district detail surfaces show source snapshot date, publication date, freshness, methodology version, and source attribution.
- [x] Mizoram copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics.
- [x] Mizoram copy avoids live, predictive, or verdict-like framing.
- [x] Stable-hostname verification confirmed the same trust posture after rollout.

### 4. Product And IA Discipline

- [x] Mizoram exposure stays concrete through explicit `/states/mizoram/...` routes rather than broader national scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal Pradesh remains the default unscoped surface.
- [x] No UI implies nationwide parity beyond the then-live states.

### 5. Source And Export Boundary

- [x] Mizoram public downloads are limited to normalized published read-model fields.
- [x] Raw Mizoram NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [x] `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug mizoram`
- [x] Stable state route `https://nyaaywatch.in/states/mizoram` returned `200`
- [x] Stable stats route `https://nyaaywatch.in/v1/states/mizoram/stats` returned `200`
- [x] Verification recorded `districtCount=3`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`

### 7. Deployment

- [x] Public rollout completed during the PR `#83` post-merge deploy window that settled the ECS service on task definition `:74`
- [x] `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, `docs/RELEASE_HISTORY.md`, `docs/MVP_EXECUTION_PLAN.md`, and `TODOS.md` are synced with the rollout result
- [x] The first Mizoram public publication id and rollback posture are recorded explicitly

## Decision

- [x] Ready for public availability
- [x] Public rollout completed
