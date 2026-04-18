# Manipur Go-Live Checklist

Checklist for deciding whether Manipur can move from approved public-prep state to public availability.

This is narrower than a nationwide launch checklist. Manipur had already cleared the internal proof bar and was wired in repo config as an approved public state before launch.

## Release Metadata

- Candidate state: `Manipur`
- State code: `MN`
- Current decision: `public rollout completed`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Readiness review: `docs/MANIPUR_PUBLIC_READINESS_REVIEW.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Internal Operating Evidence

- [x] Manipur completed a live `fetch -> inspect -> publish -> replay -> rollback` cycle before public launch.
- [x] Multiple additional states had already cleared the same live proof cycle before this rollout window.
- [x] The release history and expansion review log record the Manipur publication lineage.

### 2. Snapshot Integrity

- [x] Manipur public routes read only from the active published snapshot in the state-scoped runtime.
- [x] No public Manipur route or download reads unpublished run state.
- [x] Manipur CSV, API, and UI resolve to the same publication lineage.
- [x] Manipur rollback target is recorded in the public release history.

### 3. Trust Metadata And Caveats

- [x] Manipur entry, district index, and district detail surfaces show source snapshot date, publication date, freshness, methodology version, and source attribution.
- [x] Manipur copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics.
- [x] Manipur copy avoids live, predictive, or verdict-like framing.
- [x] Stable-hostname verification confirmed the same trust posture after rollout.

### 4. Product And IA Discipline

- [x] Manipur exposure stays concrete through explicit `/states/manipur/...` routes rather than broader national scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal Pradesh remains the default unscoped surface.
- [x] No UI implies nationwide parity beyond the states actually live.

### 5. Source And Export Boundary

- [x] Manipur public downloads are limited to normalized published read-model fields.
- [x] Raw Manipur NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [x] `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug manipur`
- [x] Stable state route `https://nyaaywatch.in/states/manipur` returned `200`
- [x] Stable stats route `https://nyaaywatch.in/v1/states/manipur/stats` returned `200`
- [x] Verification recorded `districtCount=9`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`

### 7. Deployment

- [x] Public rollout completed during the PR `#83` post-merge deploy window that settled the ECS service on task definition `:74`
- [x] `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, `docs/RELEASE_HISTORY.md`, `docs/MVP_EXECUTION_PLAN.md`, and `TODOS.md` are synced with the rollout result
- [x] The first Manipur public publication id and rollback posture are recorded explicitly

## Decision

- [x] Ready for public availability
- [x] Public rollout completed
