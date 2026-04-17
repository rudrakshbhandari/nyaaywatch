# Tamil Nadu Go-Live Checklist

Checklist for deciding whether Tamil Nadu can move from internal trial to soft public availability.

This is narrower than a nationwide launch checklist. Tamil Nadu should clear this before any public website exposure, even if traffic is expected to be low.

## Release Metadata

- Candidate state: `Tamil Nadu`
- State code: `TN`
- Current decision: `next narrow public rollout candidate`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Readiness review: `docs/TAMIL_NADU_PUBLIC_READINESS_REVIEW.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Internal Operating Evidence

- [x] Tamil Nadu has completed a live `fetch -> inspect -> publish -> replay -> rollback` cycle.
- [x] Multiple additional internal-only states have since cleared the same live proof cycle.
- [x] The release history and expansion review log record the Tamil Nadu internal publication lineage.

Why this gate exists:

- It keeps public expansion narrower than internal expansion and avoids treating a single clean Tamil Nadu run as enough evidence on its own.

### 2. Snapshot Integrity

- [x] Tamil Nadu public routes can be wired to read only from the active published snapshot in the state-scoped runtime.
- [x] No public Tamil Nadu route or download reads unpublished run state in local verification.
- [x] Tamil Nadu CSV, API, and UI can resolve to the same publication lineage once promoted in verification.
- [ ] Tamil Nadu rollback target is recorded in live public release history after the first public publication.

### 3. Trust Metadata And Caveats

- [x] Tamil Nadu entry, district index, and district detail surfaces can show source snapshot date, publication date, freshness, methodology version, and source attribution in local verification.
- [x] Tamil Nadu copy can use `published snapshot`, `flagged signal`, and `operator-published` semantics in local verification.
- [x] Tamil Nadu copy can avoid live, predictive, or verdict-like framing in local verification.
- [ ] Live hostname/browser checks confirm the same trust posture after rollout.

### 4. Product And IA Discipline

- [x] Tamil Nadu exposure stays concrete through explicit `/states/tamil-nadu/...` routes rather than broader national scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal remains the default unscoped surface.
- [x] No UI implies nationwide parity or cross-state breadth that does not exist.

### 5. Source And Export Boundary

- [x] Tamil Nadu public downloads are limited to normalized published read-model fields in local verification.
- [x] Raw Tamil Nadu NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [ ] `npm run typecheck`
- [ ] targeted regression tests for Tamil Nadu-related pipeline or public-surface changes
- [ ] `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tamil-nadu`
- [ ] Browser verification on `https://nyaaywatch.in/states/tamil-nadu`

### 7. Deployment

- [ ] The AWS runtime configuration for the public stack is updated intentionally rather than ad hoc.
- [ ] `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, `docs/RELEASE_HISTORY.md`, and `docs/MVP_EXECUTION_PLAN.md` are updated with the actual rollout result.
- [ ] The first Tamil Nadu public publication id and rollback posture are recorded explicitly.

## Decision

- [ ] Ready for soft public availability
- [ ] Keep internal only

If blocked, record the blocker and exact next action in `docs/EXPANSION_REVIEW_LOG.md`.
