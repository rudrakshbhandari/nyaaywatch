# Assam Go-Live Checklist

Checklist for moving Assam from internal trial to soft public availability.

This is narrower than a nationwide launch checklist. Assam cleared the repo-level gates first, and the live rollout checks are now complete.

## Release Metadata

- Candidate state: `Assam`
- State code: `AS`
- Current decision: `live on the public site`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Readiness review: `docs/ASSAM_PUBLIC_READINESS_REVIEW.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Internal Operating Evidence

- [x] Assam has completed a live `fetch -> inspect -> publish -> replay -> rollback` cycle.
- [x] Multiple additional internal-only states have since cleared the same live proof cycle.
- [x] The release history and expansion review log record the Assam internal publication lineage.

Why this gate exists:

- It keeps public expansion narrower than internal expansion and avoids treating a single clean Assam run as enough evidence on its own.

### 2. Snapshot Integrity

- [x] Assam public routes can be wired to read only from the active published snapshot in the state-scoped runtime.
- [x] No public Assam route or download reads unpublished run state in local verification.
- [x] Assam CSV, API, and UI can resolve to the same publication lineage once promoted in verification.
- [x] Assam rollback target is recorded in live public release history after the first public publication.

### 3. Trust Metadata And Caveats

- [x] Assam entry, district index, and district detail surfaces can show source snapshot date, publication date, freshness, methodology version, and source attribution in local verification.
- [x] Assam copy can use `published snapshot`, `flagged signal`, and `operator-published` semantics in local verification.
- [x] Assam copy can avoid live, predictive, or verdict-like framing in local verification.
- [x] Live hostname/browser checks confirm the same trust posture after rollout.

### 4. Product And IA Discipline

- [x] Assam exposure stays concrete through explicit `/states/assam/...` routes rather than broader national scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal remains the default unscoped surface.
- [x] No UI implies nationwide parity or cross-state breadth that does not exist.

### 5. Source And Export Boundary

- [x] Assam public downloads are limited to normalized published read-model fields in local verification.
- [x] Raw Assam NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [x] `npm run typecheck`
- [x] targeted regression tests for Assam-related pipeline or public-surface changes
- [x] `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug assam`
- [x] Browser verification on `https://nyaaywatch.in/states/assam`

### 7. Deployment

- [x] The AWS runtime configuration for the public stack is updated intentionally rather than ad hoc.
- [x] `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, `docs/RELEASE_HISTORY.md`, and `docs/MVP_EXECUTION_PLAN.md` are updated with the actual rollout result.
- [x] The first Assam public publication id and rollback posture are recorded explicitly.

## Decision

- [x] Ready for live rollout once verification and deployment steps complete
- [x] Live on the public site
- [ ] Keep internal only

If blocked, record the blocker and exact next action in `docs/EXPANSION_REVIEW_LOG.md`.
