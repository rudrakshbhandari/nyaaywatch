# Punjab Go-Live Checklist

Checklist for deciding whether Punjab can move from internal trial to soft public availability.

This is narrower than a nationwide launch checklist. Punjab should clear this before any public website exposure, even if traffic is expected to be low.

## Release Metadata

- Candidate state: `Punjab`
- State code: `PB`
- Current decision: `approved for internal trial only`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Independent Publish Windows

- [ ] At least two live Punjab publish windows exist.
- [ ] The second publish window starts at least **1 hour** after the first one.
- [ ] `2+ hours` spacing is preferred when practical.
- [ ] At least one replay or rollback exercise has succeeded for Punjab.
- [ ] The release history and expansion review log record the exact run ids and publication ids.

Why this gate exists:

- It proves Punjab is repeatable across distinct operator windows rather than one uninterrupted session.

### 2. Snapshot Integrity

- [ ] Punjab public routes would read only from the active published snapshot.
- [ ] No public Punjab route or download reads unpublished run state.
- [ ] Punjab CSV, API, and UI would all resolve to the same Punjab publication lineage.
- [ ] Punjab rollback target is clear in publication history.

### 3. Trust Metadata And Caveats

- [ ] Punjab homepage or state entry surface would show source snapshot date, publication date, freshness, methodology version, and source attribution.
- [ ] Punjab district index and district detail surfaces would show the same trust metadata.
- [ ] Punjab copy would use `published snapshot`, `flagged signal`, and `operator-published` semantics.
- [ ] Punjab copy would avoid live, predictive, or verdict-like framing.

### 4. Product And IA Discipline

- [ ] Punjab exposure is concrete, not placeholder scaffolding.
- [ ] The website remains explicit about what is covered now.
- [ ] Himachal-first trust language is updated carefully rather than silently removed.
- [ ] No UI implies nationwide parity or cross-state coverage breadth that does not exist.

### 5. Source And Export Boundary

- [ ] Punjab public downloads are limited to normalized published read-model fields.
- [ ] Raw Punjab NJDG HTML bundles remain internal.
- [ ] Replay copies and unpublished snapshot candidates remain internal.
- [ ] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [ ] `npm run typecheck`
- [ ] targeted regression tests for Punjab-related pipeline or public-surface changes
- [ ] public route/browser verification for the intended Punjab exposure shape
- [ ] release verification passes against the public hostname after rollout

### 7. Deployment

- [ ] The AWS runtime configuration for the public stack is updated intentionally rather than ad hoc.
- [ ] The deploy plan is explicit about whether Punjab is exposed via:
  - a minimal supported-state selector, or
  - a direct linked route, or
  - another concrete public entry point
- [ ] `docs/DEPLOYMENT_STATUS.md` and `docs/EXPANSION_REVIEW_LOG.md` are updated with the actual rollout result.

## Decision

- [ ] Ready for soft public availability
- [ ] Keep internal only

If blocked, record the blocker and the exact next action in `docs/EXPANSION_REVIEW_LOG.md`.
