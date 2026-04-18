# Gujarat Internal Readiness Review

Initial source-viability and internal-readiness review for Gujarat before the first live operator trial or public exposure.

Gujarat is a strong internal-only candidate for the next central and western expansion wave after the current south-plus-north-east batch. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Gujarat district dashboard on `2026-04-17`.

Observed Gujarat source notes:

- `stateCode=GJ`
- `stateName=Gujarat`
- `stateSlug=gujarat`
- `njdgStateValue=24~17`
- source page footer updated on `2026-04-16`
- 33 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `15,75,559`
- instituted last month shown on the live state page: `3,37,567`
- disposed last month shown on the live state page: `6,24,868`
- first visible district labels: `GANDHINAGAR`, `Ahmedabad`, `SURAT`, `Mahesana`, `RAJKOT`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `GANDHINAGAR` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Gujarat exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Gujarat is not blocked on a missing metric class or a clearly different page family.

### 2. Scale Value

Gujarat is a useful mid-sized western proof candidate for the next internal-only batch. Its 33-district footprint is substantial enough to matter operationally, while its source surface still looks straightforward enough to justify a first stored-evidence capture attempt.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Gujarat still needs explicit repo wiring as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Gujarat has not yet cleared the full internal proof bar. It still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until that happens, it should be treated as a source-viability candidate rather than validated internal operating evidence.

### 3. Public Trust Review

No Gujarat-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Gujarat should be treated as a viable next internal-only candidate for the post-Telangana wave.

It should remain internal-only until:

1. repo wiring and internal-only regression coverage are in place
2. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
