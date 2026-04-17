# Manipur Internal Readiness Review

Initial source-viability and internal-readiness review for Manipur before the first live operator trial or public exposure.

Manipur is a strong internal-only candidate for the next north-east expansion track after Assam, Meghalaya, Tripura, and Nagaland. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Verified live-source checks against the NJDG Manipur district dashboard observed:

- `stateCode=MN`
- `stateName=Manipur`
- `stateSlug=manipur`
- `njdgStateValue=14~25`
- source page footer updated on `2026-04-17`
- 9 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `14,860`
- instituted last month shown on the live state page: `1,174`
- disposed last month shown on the live state page: `869`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Imphal East` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Manipur exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Manipur is not blocked on a missing metric class or a clearly different page family.

### 2. North-East Continuity Value

Manipur adds another north-east source surface without widening the public site. Its 9-district footprint is compact enough to make it a practical internal-only proof candidate while still adding a distinct regional source boundary.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and the verified `Imphal East` district request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Manipur still needs explicit repo wiring as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Manipur has not yet cleared the full internal proof bar. It still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until that happens, it should be treated as a source-viability candidate rather than validated internal operating evidence.

### 3. Public Trust Review

No Manipur-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Manipur should be treated as a viable next north-east internal-only candidate.

It should remain internal-only until:

1. repo wiring and internal-only regression coverage are in place
2. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
