# Punjab Public Readiness Review

Review of what we can already validate for Punjab before the next spaced publish window.

This is useful work that can happen before the second Punjab release window. It is not itself a public-launch approval.

## Review Basis

Based on the first real Punjab internal trial recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- initial run id: `run_e440dc29-3f34-42da-a5ad-36b3b67e2b3a`
- initial publication id: `publication_24a9da44-47d5-4bdb-94f4-3dc3d07c8e2c`
- replay run id: `run_ba5643f1-cfdb-4a13-8615-aaed8a4d4142`
- replay publication id: `publication_8ed4484e-a3dd-4950-a1a5-88ecd46c5dd3`
- rollback publication id: `publication_d7cc5d03-2ad4-4a14-a842-d54f10563fa7`

Observed Punjab snapshot metadata:

- `stateCode=PB`
- `stateName=Punjab`
- `sourceSnapshotAt=2026-04-16T00:00:00.000Z`
- `methodologyVersion=2026.04-alpha`
- `qualityState=complete`
- `sourceAttribution=National Judicial Data Grid public district dashboard for Punjab`

## What Already Looks Good

### 1. Trust Metadata Shape

Punjab already carries the same trust-critical metadata shape the Himachal model depends on:

- state code
- state name
- source snapshot date
- publication date
- methodology version
- quality state
- source attribution
- published-from-run lineage
- replay lineage when relevant

That means Punjab is not blocked on a missing metadata field problem.

### 2. Internal Snapshot Quality

The first Punjab candidate normalized cleanly with:

- 22 districts captured
- `qualityState=complete`
- a full ranked district list
- stable statewide stats
- replay support from stored raw evidence

That is strong enough to keep investing in Punjab rather than switching to a different next state.

### 3. Copy Posture In The Data Layer

The generated Punjab district summaries and flag reasons stayed within the current trust model:

- they describe signals, not verdicts
- they reference the latest published snapshot rather than real-time monitoring
- they avoid predictive or legal-analysis language

That reduces the risk that Punjab requires a fundamentally different copy style from Himachal.

## What Still Needs Explicit Public Work

### 1. Public Surface Parity

Punjab is not yet exposed on the public site, so we have not yet verified:

- Punjab homepage or entry-state rendering
- Punjab district index rendering
- Punjab district detail rendering
- Punjab CSV/API/UI parity through public routes

This is the biggest unresolved public-launch work item besides the second spaced release window.

### 2. Scope Copy

The current live website is explicitly Himachal-first. Before Punjab goes public, copy needs a deliberate update such as:

- `starting with Himachal and now covering Punjab`, or
- another equally explicit formulation

What we should not do:

- silently swap Himachal-only wording for vague national wording
- add empty nationwide scaffolding
- imply all-state comparability

### 3. Exposure Boundary

Punjab does not currently introduce a new exposure-boundary issue, but public launch still needs a fresh check that:

- public Punjab downloads stay inside published read-model fields
- no raw or unpublished Punjab artifacts leak
- attribution and dates remain visible on every public Punjab trust surface

## Recommendation

Punjab looks viable for a soft public release path once two things are done:

1. one additional Punjab publish window at least `1 hour` after the first window, with `2+ hours` preferred
2. a concrete public-surface implementation and parity review

Until then, Punjab should remain internal-only.

## Useful Work Completed By This Review

This review closes part of the “meanwhile” work:

- metadata-shape review: done
- signal/copy posture review on the Punjab payload: done
- launch blockers reduced to a smaller set:
  - second independent Punjab release window
  - public-surface implementation
  - public-surface parity verification
