# Tripura Internal Readiness Review

Initial source-viability and internal-readiness review for Tripura before the first live operator trial or public exposure.

Tripura is a strong internal-only candidate for the next north-east expansion track after Assam and Meghalaya. This document records live source evidence only. It does not approve public exposure.

Historical note:

- repo wiring for `TR` is now complete
- the live `fetch -> inspect -> publish -> replay -> rollback` proof cycle has not run yet
- use `docs/EXPANSION_REVIEW_LOG.md` once the actual live proof lineage exists

## Review Basis

Source checks run against the live NJDG Tripura district dashboard on `2026-04-17`.

Observed Tripura source notes:

- `stateCode=TR`
- `stateName=Tripura`
- `stateSlug=tripura`
- `njdgStateValue=16~20`
- source page footer updated on `2026-04-16`
- 8 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `63,981`
- instituted last month shown on the live state page: `10,656`
- disposed last month shown on the live state page: `15,663`
- first visible district labels: `West Tripura`, `North Tripura`, `South Tripura`, `Unakoti`, `Gomati`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Tripura exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Tripura is not blocked on a missing metric class or a clearly different page family.

### 2. North-East Continuity Value

Tripura lets the internal expansion track deepen the north-east operating story after Assam and Meghalaya without widening the public site prematurely. Its 8-district footprint is light enough to make it a clean parallel proof candidate.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Tripura is now wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Tripura still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

That operating evidence should land before any public-readiness discussion.

### 3. Public Trust Review

No Tripura-specific public-route parity, copy, or methodology review has been done yet. Public exposure should still lag the internal proof cycle.

## Recommendation

Tripura should now be treated as the next lighter north-east internal-only candidate after Meghalaya.

It should remain internal-only until:

1. the first live proof cycle concludes cleanly
2. a separate public-readiness review concludes that the narrow state-scoped rollout is defensible
