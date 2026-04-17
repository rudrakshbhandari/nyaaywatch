# Haryana Go-Live Checklist

Checklist for deciding whether Haryana can move from internal trial to soft public availability.

This is narrower than a nationwide launch checklist. Haryana should clear this before any public website exposure, even if traffic is expected to be low.

## Release Metadata

- Candidate state: `Haryana`
- State code: `HR`
- Current decision: `next narrow public rollout candidate`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Readiness review: `docs/HARYANA_PUBLIC_READINESS_REVIEW.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Internal Operating Evidence

- [x] Haryana has completed a live `fetch -> inspect -> publish -> replay -> rollback` cycle.
- [x] At least one additional internal-only state has since cleared the same live proof cycle.
- [x] The release history and expansion review log record the Haryana internal publication lineage.

Why this gate exists:

- It keeps public expansion narrower than internal expansion and avoids treating a single clean Haryana run as enough evidence on its own.

### 2. Snapshot Integrity

- [x] Haryana public routes can be wired to read only from the active published snapshot in the state-scoped runtime.
- [x] No public Haryana route or download reads unpublished run state in local verification.
- [x] Haryana CSV, API, and UI resolve to the same publication lineage in local verification.
- [ ] Haryana rollback target is recorded in live public release history after the first public publication.

### 3. Trust Metadata And Caveats

- [x] Haryana entry, district index, and district detail surfaces show source snapshot date, publication date, freshness, methodology version, and source attribution in local verification.
- [x] Haryana copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics in local verification.
- [x] Haryana copy avoids live, predictive, or verdict-like framing in local verification.
- [ ] Live hostname/browser checks confirm the same trust posture after rollout.

### 4. Product And IA Discipline

- [x] Haryana exposure stays concrete through explicit `/states/haryana/...` routes rather than broader national scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal remains the default unscoped surface.
- [x] No UI implies nationwide parity or cross-state breadth that does not exist.

### 5. Source And Export Boundary

- [x] Haryana public downloads are limited to normalized published read-model fields in local verification.
- [x] Raw Haryana NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [ ] `npm run typecheck`
- [ ] `npm test -- tests/geographies.test.ts tests/haryana-public-rollout.test.ts`
- [ ] `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug haryana`
- [ ] Browser verification on `https://nyaaywatch.in/states/haryana`

### 7. Deployment

- [ ] The AWS runtime configuration for the public stack is updated intentionally rather than ad hoc.
- [ ] `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, `docs/RELEASE_HISTORY.md`, and `docs/MVP_EXECUTION_PLAN.md` are updated with the actual rollout result.
- [ ] The first Haryana public publication id and rollback posture are recorded explicitly.

## Decision

- [ ] Ready for soft public availability
- [ ] Keep internal only

If blocked, record the blocker and exact next action in `docs/EXPANSION_REVIEW_LOG.md`.
