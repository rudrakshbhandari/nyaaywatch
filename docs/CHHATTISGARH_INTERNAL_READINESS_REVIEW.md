# Chhattisgarh Internal Readiness Review

Internal readiness review for Chhattisgarh.

Chhattisgarh is now a validated internal-only state after clearing the full live proof cycle. This document records the source notes plus the live operating evidence. It still does not approve public exposure.

Historical note:

- repo wiring for `CG` is now complete
- the live `fetch -> inspect -> publish -> replay -> rollback` proof cycle is now complete
- use `docs/EXPANSION_REVIEW_LOG.md` for the full batch lineage

## Review Basis

Verified live-source checks against the NJDG Chhattisgarh district dashboard observed:

- `stateCode=CG`
- `stateName=Chhattisgarh`
- `stateSlug=chhattisgarh`
- `njdgStateValue=22~18`
- 25 districts exposed on the live NJDG state page
- sample district checked during source review: `Korba`
- no obvious source-shape caveat was observed during the read-only review

## What Already Looks Good

### 1. Basic Source Reachability

Chhattisgarh clears the first viability bar for an internal-only candidate:

- the state selector resolves cleanly
- the district list is present
- a sample district path was reviewable without an obvious source exception

That is enough to justify moving from read-only review toward internal operator wiring and a first stored-evidence capture attempt.

### 2. Expansion Value

Chhattisgarh adds another meaningful central state surface without widening the public site. Its 25-district footprint is material enough to matter operationally while still fitting the current state-by-state internal qualification posture.

## What Still Needs Explicit Work

### 1. Metric-Parity Confirmation

This read-only review does not yet record the full state metric surface. The first explicit capture pass should still confirm:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- stable district drilldown behavior across stored evidence

### 2. Repo Wiring

Chhattisgarh is now wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 3. Operating Evidence

Chhattisgarh has now cleared:

- live `fetch` as `run_3deffe82-3ee7-477f-ae37-e70b93d544e6`
- live `publish` as `publication_301acf9a-e2d2-46b2-940c-42a2cd989ece`
- live `replay` as `run_d60f4c4b-8385-4193-9a63-efc5dcc3dcda`
- replay publication as `publication_e4502b2d-9466-434a-903e-53ff22426428`
- live `rollback` as `publication_412a4d67-73fe-4bdd-b149-24c05cbaf973`

That closes the internal proof bar. Chhattisgarh is no longer only a source-viability candidate.

### 4. Public Trust Review

No Chhattisgarh-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Chhattisgarh should now be treated as validated central and eastern internal operating evidence.

It should remain internal-only until:

1. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
2. a deliberate public rollout slot is chosen after the earlier cleared internal states already ahead of it in queue
