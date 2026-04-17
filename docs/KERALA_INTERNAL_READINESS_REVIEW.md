# Kerala Internal Readiness Review

Initial source-viability and internal-readiness review for Kerala before any live operator trial or public exposure.

Kerala is a strong internal-only candidate for the next southern expansion track after Tamil Nadu. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Kerala district dashboard on `2026-04-17`.

Observed Kerala source notes:

- `stateCode=KL`
- `stateName=Kerala`
- `stateSlug=kerala`
- `njdgStateValue=32~4`
- source page footer updated on `2026-04-16`
- 14 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `18,01,417`
- instituted last month shown on the live state page: `57,299`
- disposed last month shown on the live state page: `77,311`
- first visible district labels: `Kasaragod`, `Ernakulam`, `Kannur`, `Thrissur`, `Kozhikode`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Kerala exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Kerala is not blocked on a missing metric class or a clearly different page family.

### 2. Southern Continuity Value

Kerala lets the internal expansion track keep building the southern operating story after Tamil Nadu without forcing another public-state decision first. Its 14-district footprint is lighter than Tamil Nadu, which makes it a good complementary internal proof candidate rather than another heavy run immediately.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Kerala is now wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Kerala has not yet cleared:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until those are complete, Kerala remains only a source-viability candidate.

### 3. Public Trust Review

No Kerala-specific public-route parity, copy, or methodology review has been done yet. Public exposure should not be considered until the internal proof cycle succeeds first.

## Recommendation

Kerala should now be treated as the next southern internal proof state behind Tamil Nadu.

It should remain internal-only until:

1. the first live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
2. the resulting publication lineage is recorded in the deployment and expansion docs
3. a separate public-readiness review concludes that the narrow state-scoped rollout is defensible
