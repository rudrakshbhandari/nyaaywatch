# Karnataka Internal Readiness Review

Initial source-viability and internal-readiness review for Karnataka before the first live operator trial or public exposure.

Karnataka is a strong internal-only candidate for the next southern expansion track after Tamil Nadu and Kerala. This document records live source evidence only. It does not approve public exposure.

Historical note:

- repo wiring for `KA` is now complete
- the live `fetch -> inspect -> publish -> replay -> rollback` proof cycle is now complete
- use `docs/EXPANSION_REVIEW_LOG.md` for the actual live proof lineage

## Review Basis

Source checks run against the live NJDG Karnataka district dashboard on `2026-04-17`.

Observed Karnataka source notes:

- `stateCode=KA`
- `stateName=Karnataka`
- `stateSlug=karnataka`
- `njdgStateValue=29~3`
- source page footer updated on `2026-04-16`
- 31 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `22,30,354`
- instituted last month shown on the live state page: `1,99,126`
- disposed last month shown on the live state page: `2,87,712`
- first visible district labels: `BELAGAVI`, `BAGALKOT`, `VIJAYAPURA`, `KALABURAGI`, `BIDAR`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Karnataka exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Karnataka is not blocked on a missing metric class or a clearly different page family.

### 2. Southern Continuity Value

Karnataka lets the internal expansion track keep building a real southern operating story after Tamil Nadu and Kerala without forcing another public-state decision first. Its 31-district footprint is large enough to extend the southern proof surface meaningfully while staying well below the heaviest national stress cases.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Karnataka is now wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Karnataka has now cleared:

- live `fetch` as `run_c57e88aa-c6bf-40d8-a3fb-9343bd819174`
- live `inspect`
- live `publish` as `publication_54748fe1-5f7c-41d4-bc40-3c976d157f56`
- live `replay` as `run_18f4c2a3-d811-496e-a277-d0d4574906c9`
- live `rollback` as `publication_30e8a0c5-9d15-4e9d-8f4b-ebf3143efb39`

That closes the internal proof bar. Karnataka is no longer only a source-viability candidate.

### 3. Public Trust Review

No Karnataka-specific public-route parity, copy, or methodology review has been done yet. Public exposure should still lag the internal proof cycle.

## Recommendation

Karnataka should now be treated as the validated next southern internal-only candidate after Kerala.

It should remain internal-only until:

1. a separate public-readiness review concludes that the narrow state-scoped rollout is defensible
2. the product makes an explicit post-Assam public-state decision
