# Goa Internal Readiness Review

Initial source-viability and internal-readiness review for Goa before the first live operator trial or public exposure.

Goa is a viable internal-only candidate for the final low-complexity prep wave. This document records live source evidence only. It does not approve public exposure.

Historical note:

- repo wiring for `GA` is now complete
- no live `fetch -> inspect -> publish -> replay -> rollback` proof cycle has been run yet
- use `docs/EXPANSION_REVIEW_LOG.md` later if Goa moves into the live internal trial queue

## Review Basis

Source checks run against the live NJDG Goa district dashboard on `2026-04-18`.

Observed Goa source notes:

- `stateCode=GA`
- `stateName=Goa`
- `stateSlug=goa`
- `njdgStateValue=30~30`
- source page footer updated on `2026-04-16`
- 2 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `62,407`
- instituted last month shown on the live state page: `2,449`
- disposed last month shown on the live state page: `2,487`
- first visible district labels: `North Goa`, `South Goa`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `North Goa` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Goa exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Goa is not blocked on a missing metric class or a clearly different page family.

### 2. Low-Complexity Trial Shape

With only 2 districts visible on the state page, Goa is operationally light.

That can be useful if the immediate goal is a very cheap internal-only source check rather than a broader stress test.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and the verified `North Goa` district request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Operating Evidence

No Goa-specific live operating evidence exists yet.

Goa still needs to clear:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

### 2. Internal Expansion Value

Goa's small 2-district surface is also its main limitation.

It is useful as a low-risk source check, but it is not a strong choice if the goal is to learn much about heavier-state behavior or broader district-surface variance.

### 3. Public Trust Review

No Goa-specific public-route parity, copy, or methodology review has been done yet. Public exposure should lag any future internal proof cycle.

## Recommendation

Goa should be treated as a low-complexity internal-only candidate for the final prep wave.

It should remain internal-only until:

1. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
2. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
3. the product deliberately chooses Goa rather than promoting it automatically
