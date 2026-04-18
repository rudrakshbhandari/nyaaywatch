# Maharashtra Internal Readiness Review

Initial source-viability and internal-readiness review for Maharashtra before the first live operator trial or public exposure.

Maharashtra is a strong internal-only candidate for the next central and western expansion wave after the current south-plus-north-east batch. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Maharashtra district dashboard on `2026-04-17`.

Observed Maharashtra source notes:

- `stateCode=MH`
- `stateName=Maharashtra`
- `stateSlug=maharashtra`
- `njdgStateValue=27~1`
- source page footer updated on `2026-04-16`
- 42 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `60,22,450`
- instituted last month shown on the live state page: `1,83,811`
- disposed last month shown on the live state page: `2,61,488`
- first visible district labels: `Nandurbar`, `Dhule`, `Jalgaon`, `Buldhana`, `Akola`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Nandurbar` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Maharashtra exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Maharashtra is not blocked on a missing metric class or a clearly different page family.

### 2. Scale Value

Maharashtra is the most operationally significant state in this next read-only batch. Its 42-district footprint and very large statewide case volume make it useful stress evidence for the internal operator lane before any decision about widening public state coverage.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Maharashtra still needs explicit repo wiring as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Maharashtra has not yet cleared the full internal proof bar. It still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until that happens, it should be treated as a source-viability candidate rather than validated internal operating evidence.

### 3. Public Trust Review

No Maharashtra-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Maharashtra should be treated as a viable heavy-state internal-only candidate for the next post-Telangana wave.

It should remain internal-only until:

1. repo wiring and internal-only regression coverage are in place
2. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
