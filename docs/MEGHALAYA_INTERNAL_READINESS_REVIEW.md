# Meghalaya Internal Readiness Review

Initial source-viability and internal-readiness review for Meghalaya before any live operator trial or public exposure.

Meghalaya is a strong internal-only candidate for the next north-east expansion track after Assam. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Meghalaya district dashboard on `2026-04-17`.

Observed Meghalaya source notes:

- `stateCode=ML`
- `stateName=Meghalaya`
- `stateSlug=meghalaya`
- `njdgStateValue=17~21`
- source page footer updated on `2026-04-16`
- 14 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `18,450`
- instituted last month shown on the live state page: `1,456`
- disposed last month shown on the live state page: `778`
- first visible district labels: `East Khasi Hills`, `West Garo Hills`, `West Jaintia Hills`, `East Garo Hills`, `Ri Bhoi`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Meghalaya exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Meghalaya is not blocked on a missing metric class or a clearly different page family.

### 2. North-East Continuity Value

Meghalaya lets the internal expansion track keep building a real north-east operating story after Assam without widening the public site prematurely. Its 14-district footprint is manageable enough to make it a clean follow-on internal proof candidate.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Meghalaya is now wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Meghalaya has not yet cleared:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until those are complete, Meghalaya remains only a source-viability candidate.

### 3. Public Trust Review

No Meghalaya-specific public-route parity, copy, or methodology review has been done yet. Public exposure should not be considered until the internal proof cycle succeeds first.

## Recommendation

Meghalaya should now be treated as the next north-east internal proof state behind Assam.

It should remain internal-only until:

1. the first live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
2. the resulting publication lineage is recorded in the deployment and expansion docs
3. a separate public-readiness review concludes that the narrow state-scoped rollout is defensible
