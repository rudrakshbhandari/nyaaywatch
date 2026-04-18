# Uttar Pradesh Go-Live Checklist

Checklist for deciding whether Uttar Pradesh can move from approved public-prep state to public availability.

This is narrower than a nationwide launch checklist. Uttar Pradesh had already cleared the internal proof bar and was wired in repo config as an approved public state before launch.

## Release Metadata

- Candidate state: `Uttar Pradesh`
- State code: `UP`
- Current decision: `public rollout completed`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Readiness review: `docs/UTTAR_PRADESH_PUBLIC_READINESS_REVIEW.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Internal Operating Evidence

- [x] Uttar Pradesh completed a live `fetch -> inspect -> publish -> replay -> rollback` cycle before public launch.
- [x] Multiple additional states had already cleared the same live proof cycle before this rollout window.
- [x] The release history and expansion review log record the Uttar Pradesh publication lineage.

### 2. Snapshot Integrity

- [x] Uttar Pradesh public routes read only from the active published snapshot in the state-scoped runtime.
- [x] No public Uttar Pradesh route or download reads unpublished run state.
- [x] Uttar Pradesh CSV, API, and UI resolve to the same publication lineage.
- [x] Uttar Pradesh rollback target is recorded in the public release history.

### 3. Trust Metadata And Caveats

- [x] Uttar Pradesh entry, district index, and district detail surfaces show source snapshot date, publication date, freshness, methodology version, and source attribution.
- [x] Uttar Pradesh copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics.
- [x] Uttar Pradesh copy avoids live, predictive, or verdict-like framing.
- [x] Stable-hostname verification confirmed the same trust posture after rollout.

### 4. Product And IA Discipline

- [x] Uttar Pradesh exposure stays concrete through explicit `/states/uttar-pradesh/...` routes rather than broader national scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal Pradesh remains the default unscoped surface.
- [x] No UI implies nationwide parity beyond the states actually live.

### 5. Source And Export Boundary

- [x] Uttar Pradesh public downloads are limited to normalized published read-model fields.
- [x] Raw Uttar Pradesh NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [x] `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug uttar-pradesh`
- [x] Stable state route `https://nyaaywatch.in/states/uttar-pradesh` returned `200`
- [x] Stable stats route `https://nyaaywatch.in/v1/states/uttar-pradesh/stats` returned `200`
- [x] Verification recorded `districtCount=74`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`

### 7. Deployment

- [x] Public rollout completed during the PR `#83` post-merge deploy window that settled the ECS service on task definition `:74`
- [x] `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, `docs/RELEASE_HISTORY.md`, `docs/MVP_EXECUTION_PLAN.md`, and `TODOS.md` are synced with the rollout result
- [x] The first Uttar Pradesh public publication id and rollback posture are recorded explicitly

## Decision

- [x] Ready for public availability
- [x] Public rollout completed
