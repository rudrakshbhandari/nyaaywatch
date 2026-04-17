# Tamil Nadu Internal Readiness Review

Initial source-viability and internal-readiness review for Tamil Nadu before any live operator trial or public exposure.

Tamil Nadu is a strong internal-only candidate for the southern expansion track. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Tamil Nadu district dashboard on `2026-04-17`.

Observed Tamil Nadu source notes:

- `stateCode=TN`
- `stateName=Tamil Nadu`
- `stateSlug=tamil-nadu`
- `njdgStateValue=33~10`
- source page footer updated on `2026-04-16`
- 38 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `17,46,162`
- instituted last month shown on the live state page: `1,20,781`
- disposed last month shown on the live state page: `1,44,236`
- first visible district labels: `Dharmapuri`, `Pudukkottai`, `Tirunelveli`, `Theni`, `Namakkal`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Tamil Nadu exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Tamil Nadu is not blocked on a missing metric class or a clearly different page family.

### 2. Scale Value

Tamil Nadu gives the internal expansion track a serious southern state without jumping immediately to a new public rollout. Its 38-district surface is meaningfully larger than Haryana and Uttarakhand while still staying below Uttar Pradesh's heavier stress profile.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Tamil Nadu still needs to be wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Tamil Nadu has not yet cleared:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until those are complete, Tamil Nadu remains only a source-viability candidate.

### 3. Public Trust Review

No Tamil Nadu-specific public-route parity, copy, or methodology review has been done yet. Public exposure should not be considered until the internal proof cycle succeeds first.

## Recommendation

Tamil Nadu should be added as an internal-only candidate state and used as the first southern proof state.

It should remain internal-only until:

1. repo wiring lands for `TN`
2. the first live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that the narrow state-scoped rollout is defensible
