# Madhya Pradesh Internal Readiness Review

Initial source-viability and internal-readiness review for Madhya Pradesh before the first live operator trial or public exposure.

Madhya Pradesh is a strong internal-only candidate for the next central and western expansion wave after the current south-plus-north-east batch. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Madhya Pradesh district dashboard on `2026-04-17`.

Observed Madhya Pradesh source notes:

- `stateCode=MP`
- `stateName=Madhya Pradesh`
- `stateSlug=madhya-pradesh`
- `njdgStateValue=23~23`
- source page footer updated on `2026-04-16`
- 51 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `21,01,244`
- instituted last month shown on the live state page: `70,528`
- disposed last month shown on the live state page: `96,846`
- first visible district labels: `Jabalpur`, `Narsinghpur`, `Hoshangabad`, `Harda`, `Umaria`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Jabalpur` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Madhya Pradesh exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Madhya Pradesh is not blocked on a missing metric class or a clearly different page family.

### 2. Scale Value

Madhya Pradesh is a meaningful heavier-state candidate for the next internal-only wave. Its 51-district footprint is materially larger than the lighter north-east states and larger than the recent southern proofs, which makes it useful operating evidence before any further public expansion decisions.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Madhya Pradesh still needs explicit repo wiring as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Madhya Pradesh has not yet cleared the full internal proof bar. It still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until that happens, it should be treated as a source-viability candidate rather than validated internal operating evidence.

### 3. Public Trust Review

No Madhya Pradesh-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Madhya Pradesh should be treated as a viable next heavier internal-only candidate for the post-Telangana wave.

It should remain internal-only until:

1. repo wiring and internal-only regression coverage are in place
2. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
