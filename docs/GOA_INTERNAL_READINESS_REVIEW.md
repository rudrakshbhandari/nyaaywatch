# Goa Internal Readiness Review

Initial source-viability and internal-readiness review for Goa before any live operator trial or public exposure.

Goa is a plausible internal-only candidate if the goal is to add one more low-complexity state to the pipeline. This document records the currently verified live source notes only. It does not approve public exposure.

Historical note:

- repo wiring for `GA` is not done yet
- no live `fetch -> inspect -> publish -> replay -> rollback` proof cycle has been run yet
- use `docs/EXPANSION_REVIEW_LOG.md` later if Goa moves into the live internal trial queue

## Review Basis

Source checks used the verified live NJDG Goa district dashboard notes available for this planning pass.

Observed Goa source notes:

- `stateCode=GA`
- `stateName=Goa`
- `stateSlug=goa`
- `njdgStateValue=30~30`
- 2 districts exposed on the live NJDG state page
- sample visible district label: `North Goa`
- caveat: the source surface is very small and offers low stress-testing value

## What Already Looks Good

### 1. Source Reachability

Goa appears to expose a valid state page with district-level coverage and a stable state selector value.

That is enough to justify a later repo-wiring pass if we deliberately want a very small-footprint internal state.

### 2. Low-Complexity Trial Shape

With only 2 districts visible on the state page, Goa would be operationally light.

That can be useful if the immediate goal is a very cheap source-parity check rather than a broad stress test.

## What Still Needs Explicit Work

### 1. Metric-Shape Confirmation

The currently verified notes do not yet record the full statewide metric surface.

Before Goa should enter the live internal queue, we still need to confirm that the current extractor assumptions hold for:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown reachability

### 2. Repo Wiring

Goa is not yet wired into the repo as an internal-only state profile.

That means no extractor, operator, or test-path support exists yet for `GA`.

### 3. Operating Evidence

No Goa-specific live operating evidence exists yet.

Goa still needs to clear:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

### 4. Internal Expansion Value

Goa's small 2-district surface is also its main limitation.

It is likely useful only as a low-risk source check. It is not a strong choice if the goal is to learn much about heavier-state behavior, route parity under pressure, or broader district-surface variance.

### 5. Public Trust Review

No Goa-specific public-route parity, copy, or methodology review has been done yet. Public exposure should lag any future internal proof cycle.

## Recommendation

Goa should be treated as a low-complexity optional internal candidate, not as a priority next state.

It is reasonable only if we explicitly want:

1. a very small-footprint internal source check
2. a low-risk add to the internal queue that does not claim much stress-testing value

It should remain out of the public rollout conversation unless later evidence shows a more compelling reason to expose it.
