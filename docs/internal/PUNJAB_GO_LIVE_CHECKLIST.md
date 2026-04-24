# Punjab Go-Live Checklist

Checklist for deciding whether Punjab can move from internal trial to soft public availability.

This is narrower than a nationwide launch checklist. Punjab should clear this before any public website exposure, even if traffic is expected to be low.

## Release Metadata

- Candidate state: `Punjab`
- State code: `PB`
- Current decision: `live on the public site through explicit state-scoped routes`
- Review log: `docs/EXPANSION_REVIEW_LOG.md`
- Methodology version: `2026.04-alpha`

## Go-Live Gates

### 1. Independent Publish Windows

- [x] At least two live Punjab publish windows exist.
- [x] The second publish window starts at least **1 hour** after the first one.
- [x] `2+ hours` spacing is preferred when practical.
- [x] At least one replay or rollback exercise has succeeded for Punjab.
- [x] The release history and expansion review log record the exact run ids and publication ids.

Why this gate exists:

- It proves Punjab is repeatable across distinct operator windows rather than one uninterrupted session.

### 2. Snapshot Integrity

- [x] Punjab public routes read only from the active published snapshot in the state-scoped public runtime.
- [x] No public Punjab route or download reads unpublished run state.
- [x] Punjab CSV, API, and UI resolve to the same Punjab publication lineage in local verification.
- [x] Punjab rollback target is clear in publication history.

Punjab's first live public publication is `publication_7db9a015-68d0-4182-8c77-f221797c7c2c`, and there is no earlier Punjab public publication to roll back to yet. That absence is now explicit in `docs/RELEASE_HISTORY.md`.

### 3. Trust Metadata And Caveats

- [x] Punjab homepage or state entry surface shows source snapshot date, publication date, freshness, methodology version, and source attribution.
- [x] Punjab district index and district detail surfaces show the same trust metadata.
- [x] Punjab copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics.
- [x] Punjab copy avoids live, predictive, or verdict-like framing.

### 4. Product And IA Discipline

- [x] Punjab exposure is concrete, not placeholder scaffolding.
- [x] The website remains explicit about what is covered now.
- [x] Himachal-first trust language is updated carefully rather than silently removed.
- [x] No UI implies nationwide parity or cross-state coverage breadth that does not exist.

### 5. Source And Export Boundary

- [x] Punjab public downloads are limited to normalized published read-model fields.
- [x] Raw Punjab NJDG HTML bundles remain internal.
- [x] Replay copies and unpublished snapshot candidates remain internal.
- [x] Public citation surfaces still include clear source attribution and dates.

### 6. Verification

- [x] `npm run typecheck`
- [x] targeted regression tests for Punjab-related pipeline or public-surface changes
- [x] public route/browser verification for the intended Punjab exposure shape
- [x] release verification passes against the public hostname after rollout, including `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab`

### 7. Deployment

- [x] The AWS runtime configuration for the public stack is updated intentionally rather than ad hoc.
- [x] The deploy plan is explicit about whether Punjab is exposed via:
  - a minimal supported-state selector, or
  - a direct linked route, or
  - another concrete public entry point
- [x] `docs/DEPLOYMENT_STATUS.md` and `docs/EXPANSION_REVIEW_LOG.md` are updated with the actual rollout result.

Punjab is exposed through explicit state-scoped public routes, with Himachal remaining the default unscoped surface.

## Decision

- [x] Ready for soft public availability
- [ ] Keep internal only

If blocked, record the blocker and the exact next action in `docs/EXPANSION_REVIEW_LOG.md`.
