# West Bengal Internal Readiness Review

Initial source-viability and internal-readiness review for West Bengal before the first live operator trial or public exposure.

West Bengal is a strong internal-only candidate for the next eastern expansion wave after the current south-plus-north-east batch. This document records the verified source notes currently available. It does not approve public exposure.

## Review Basis

Verified live-source checks against the NJDG West Bengal district dashboard observed:

- `stateCode=WB`
- `stateName=West Bengal`
- `stateSlug=west-bengal`
- `njdgStateValue=19~16`
- 23 districts exposed on the live NJDG state page
- sample district checked during source review: `Malda`
- no obvious source-shape caveat was observed during the read-only review

## What Already Looks Good

### 1. Basic Source Reachability

West Bengal clears the first viability bar for an internal-only candidate:

- the state selector resolves cleanly
- the district list is present
- a sample district path was reviewable without an obvious source exception

That is enough to justify moving from read-only review toward internal operator wiring and a first stored-evidence capture attempt.

### 2. Expansion Value

West Bengal adds another meaningful eastern state source boundary without widening the public site. Its 23-district footprint is large enough to matter operationally while still staying within the current deliberate internal-only qualification flow.

## What Still Needs Explicit Work

### 1. Metric-Parity Confirmation

This read-only review does not yet record the full state metric surface. The first explicit capture pass should still confirm:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- stable district drilldown behavior across stored evidence

### 2. Repo Wiring

West Bengal still needs explicit repo wiring as an internal-only state profile with tests that keep it dark on the public site.

### 3. Operating Evidence

West Bengal has not yet cleared the full internal proof bar. It still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until that happens, it should be treated as a source-viability candidate rather than validated internal operating evidence.

### 4. Public Trust Review

No West Bengal-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

West Bengal should be treated as a viable next internal-only candidate for the eastern expansion wave.

It should remain internal-only until:

1. repo wiring and internal-only regression coverage are in place
2. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
