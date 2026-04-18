# Kerala Go-Live Checklist

Checklist for deciding whether Kerala can move from internal trial to soft public availability.

This is narrower than a nationwide launch checklist. Kerala has already cleared the internal proof bar, but it should stay dark on the public site until the state-specific rollout gates below are complete.

## Release Metadata

- Candidate state: `Kerala`
- State code: `KL`
- Current decision: `public rollout completed`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Readiness review: `docs/KERALA_PUBLIC_READINESS_REVIEW.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Internal Operating Evidence

- [x] Kerala has completed a live `fetch -> inspect -> publish -> replay -> rollback` cycle.
- [x] Multiple additional internal-only states have since cleared the same live proof cycle.
- [x] The release history and expansion review log record the Kerala internal publication lineage.

Why this gate exists:

- It keeps public expansion narrower than internal expansion and avoids treating a single clean Kerala run as enough evidence on its own.

### 2. Snapshot Integrity

- [x] Kerala public routes are wired to read only from the active published snapshot in the state-scoped runtime.
- [x] No public Kerala route or download reads unpublished run state in local verification.
- [x] Kerala CSV, API, and UI resolve to the same publication lineage in local verification.
- [x] Kerala rollback target is recorded in live public release history after the first public publication.

### 3. Trust Metadata And Caveats

- [x] Kerala entry, district index, and district detail surfaces show source snapshot date, publication date, freshness, methodology version, and source attribution in local verification.
- [x] Kerala copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics in local verification.
- [x] Kerala copy avoids live, predictive, or verdict-like framing in local verification.
- [x] Live hostname/browser checks confirm the same trust posture after rollout.

### 4. Product And IA Discipline

- [x] Kerala exposure stays concrete through explicit `/states/kerala/...` routes rather than broader national scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal remains the default unscoped surface.
- [x] No UI implies nationwide parity or cross-state breadth that does not exist.

### 5. Source And Export Boundary

- [x] Kerala public downloads are limited to normalized published read-model fields in local verification.
- [x] Raw Kerala NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [x] `npm run typecheck`
- [x] `npm test -- tests/kerala-public-rollout.test.ts`
- [x] `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug kerala`
- [x] Browser verification on `https://nyaaywatch.in/states/kerala`

### 7. Deployment

- [x] The AWS runtime configuration for the public stack is updated intentionally rather than ad hoc.
- [x] `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, `docs/RELEASE_HISTORY.md`, and `docs/MVP_EXECUTION_PLAN.md` are updated with the actual rollout result.
- [x] The first Kerala public publication id and rollback posture are recorded explicitly.

## Decision

- [x] Ready for soft public availability
- [ ] Keep internal only

If blocked, record the blocker and exact next action in `docs/EXPANSION_REVIEW_LOG.md`.
