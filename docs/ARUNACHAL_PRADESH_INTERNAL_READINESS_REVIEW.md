# Arunachal Pradesh Internal Readiness Review

Initial source-viability and internal-readiness review for Arunachal Pradesh before the first live operator trial or public exposure.

Arunachal Pradesh is a strong internal-only candidate for the next north-east expansion track after Assam, Meghalaya, Tripura, and Nagaland. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Verified live-source checks against the NJDG Arunachal Pradesh district dashboard observed:

- `stateCode=AR`
- `stateName=Arunachal Pradesh`
- `stateSlug=arunachal-pradesh`
- `njdgStateValue=12~36`
- source page footer updated on `2026-04-16`
- 27 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `15,539`
- instituted last month shown on the live state page: `572`
- disposed last month shown on the live state page: `678`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Lohit` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Arunachal Pradesh exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Arunachal Pradesh is not blocked on a missing metric class or a clearly different page family.

### 2. North-East Continuity Value

Arunachal Pradesh deepens the north-east operating story without forcing another public-state decision first. Its 27-district footprint is materially larger than Tripura, Nagaland, and Meghalaya, which makes it useful additional internal operating evidence rather than only another light-state proof.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and the verified `Lohit` district request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Arunachal Pradesh still needs explicit repo wiring as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Arunachal Pradesh has not yet cleared the full internal proof bar. It still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until that happens, it should be treated as a source-viability candidate rather than validated internal operating evidence.

### 3. Public Trust Review

No Arunachal Pradesh-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Arunachal Pradesh should be treated as a viable next north-east internal-only candidate.

It should remain internal-only until:

1. repo wiring and internal-only regression coverage are in place
2. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
