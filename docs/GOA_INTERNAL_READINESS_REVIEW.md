# Goa Internal Readiness Review

Initial source-viability and internal-readiness review for Goa before the first live operator trial or public exposure.

Goa has now completed the live internal proof bar for the final low-complexity prep wave. This document records both the source evidence and the completed internal proof cycle. It does not approve public exposure.

Historical note:

- repo wiring for `GA` is complete
- live fetch `run_1e21db34-f85b-48ef-9f3b-aaeea6e92f35`, publish `publication_72807a9b-b91b-4f66-8b46-2b04bcaec370`, replay `run_710e9e5f-63b3-469b-a774-2e981fa7ade2`, replay publication `publication_bfb24816-c643-4953-9afc-496f116a9f36`, and rollback `publication_03355c7b-12b3-4d56-99ff-a88cffaf99fe` all succeeded on `2026-04-18`
- Goa remains internal-only because its public routes still returned `404`

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

Goa-specific live operating evidence now exists and is sufficient for the internal-only bar.

### 2. Internal Expansion Value

Goa's small 2-district surface is also its main limitation.

It is useful as a low-risk source check, but it is not a strong choice if the goal is to learn much about heavier-state behavior or broader district-surface variance.

### 3. Public Trust Review

No Goa-specific public-route parity, copy, or methodology review has been done yet. Public exposure should lag any future internal proof cycle.

## Recommendation

Goa should now be treated as an internal trial completed state with a small-surface operating profile.

It should remain internal-only until:

1. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
2. the product deliberately chooses Goa rather than promoting it automatically
3. the public rollout queue reaches Goa in internal-proof order
