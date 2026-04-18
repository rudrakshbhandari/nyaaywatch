# Odisha Internal Readiness Review

Internal readiness review for Odisha.

Odisha is now a validated internal-only state after clearing the full live proof cycle. This document records the source notes plus the live operating evidence. It still does not approve public exposure.

Historical note:

- repo wiring for `OD` is now complete
- the live `fetch -> inspect -> publish -> replay -> rollback` proof cycle is now complete
- use `docs/EXPANSION_REVIEW_LOG.md` for the full batch lineage

## Review Basis

Verified live-source checks against the NJDG Odisha district dashboard observed:

- `stateCode=OD`
- `stateName=Odisha`
- `stateSlug=odisha`
- `njdgStateValue=21~11`
- 30 districts exposed on the live NJDG state page
- sample district checked during source review: `Cuttack`
- no obvious source-shape caveat was observed during the read-only review

## What Already Looks Good

### 1. Basic Source Reachability

Odisha clears the first viability bar for an internal-only candidate:

- the state selector resolves cleanly
- the district list is present
- a sample district path was reviewable without an obvious source exception

That is enough to justify moving from read-only review toward internal operator wiring and a first stored-evidence capture attempt.

### 2. Expansion Value

Odisha gives the next internal wave a meaningful eastern state without forcing another public-state decision. Its 30-district footprint is substantial enough to matter operationally while still fitting the current state-by-state internal qualification posture.

## What Still Needs Explicit Work

### 1. Metric-Parity Confirmation

This read-only review does not yet record the full state metric surface. The first explicit capture pass should still confirm:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- stable district drilldown behavior across stored evidence

### 2. Repo Wiring

Odisha is now wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 3. Operating Evidence

Odisha has now cleared:

- live `fetch` as `run_eb64e8ff-b70b-4eda-be14-180441a38548`
- live `publish` as `publication_24cc3461-c2e1-47b0-a870-907306ca183d`
- live `replay` as `run_07c3627f-1f65-4915-9516-1d72d2ae9e18`
- replay publication as `publication_3df28695-e014-44d2-9b36-4bb7bb95a9cb`
- live `rollback` as `publication_0b8376be-33ae-4c60-a534-835ebb199b57`

That closes the internal proof bar. Odisha is no longer only a source-viability candidate.

### 4. Public Trust Review

No Odisha-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Odisha should now be treated as validated eastern internal operating evidence.

It should remain internal-only until:

1. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
2. a deliberate public rollout slot is chosen after the earlier cleared internal states already ahead of it in queue
