# Bihar Internal Readiness Review

Initial source-viability and internal-readiness review for Bihar before the first live operator trial or public exposure.

Bihar is a strong internal-only candidate for the next central and eastern expansion wave after the current south-plus-north-east batch. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Bihar district dashboard on `2026-04-17`.

Observed Bihar source notes:

- `stateCode=BR`
- `stateName=Bihar`
- `stateSlug=bihar`
- `njdgStateValue=10~8`
- source page footer updated on `2026-04-16`
- 38 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `37,22,495`
- instituted last month shown on the live state page: `58,238`
- disposed last month shown on the live state page: `60,273`
- first visible district labels: `Patna`, `Kaimur at Bhabhua`, `Samastipur`, `Saran at Chapra`, `Katihar`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Patna` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Bihar exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Bihar is not blocked on a missing metric class or a clearly different page family.

### 2. Scale Value

Bihar adds another large-case eastern state surface without forcing immediate public exposure. Its 38-district footprint and high pending volume make it useful internal-only evidence for whether the operator lane stays stable beyond the current regional cluster.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Bihar still needs explicit repo wiring as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Bihar has not yet cleared the full internal proof bar. It still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until that happens, it should be treated as a source-viability candidate rather than validated internal operating evidence.

### 3. Public Trust Review

No Bihar-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Bihar should be treated as a viable next internal-only candidate for the post-Telangana wave.

It should remain internal-only until:

1. repo wiring and internal-only regression coverage are in place
2. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
