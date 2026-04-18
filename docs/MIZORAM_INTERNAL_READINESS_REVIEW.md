# Mizoram Internal Readiness Review

Initial source-viability and internal-readiness review for Mizoram before the first live operator trial or public exposure.

Mizoram is a viable internal-only candidate for a very small north-east follow-on source check. This document records live source evidence only. It does not approve public exposure.

Historical note:

- repo wiring for `MZ` is now complete
- no live `fetch -> inspect -> publish -> replay -> rollback` proof cycle has been run yet
- use `docs/EXPANSION_REVIEW_LOG.md` later if Mizoram moves into the live internal trial queue

## Review Basis

Source checks run against the live NJDG Mizoram district dashboard on `2026-04-18`.

Observed Mizoram source notes:

- `stateCode=MZ`
- `stateName=Mizoram`
- `stateSlug=mizoram`
- `njdgStateValue=15~19`
- source page footer updated on `2026-04-16`
- 3 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `7,677`
- instituted last month shown on the live state page: `1,009`
- disposed last month shown on the live state page: `760`
- first visible district labels: `Aizawl`, `Lunglei`, `Champhai`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Aizawl` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Mizoram exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Mizoram is not blocked on a missing metric class or a clearly different page family.

### 2. North-East Coverage Value

Mizoram widens the internal north-east map without forcing a heavier public or operator decision immediately.

That makes it a reasonable follow-on if the goal is breadth of regional source validation more than operational stress testing.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and the verified `Aizawl` district request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Operating Evidence

No Mizoram-specific live operating evidence exists yet.

Mizoram still needs to clear:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

### 2. Stress-Test Limits

Mizoram's 3-district surface is too small to tell us much about heavier-state behavior.

It is valuable as a source-compatibility check, but it should not be mistaken for a meaningful stress or scale qualification.

### 3. Public Trust Review

No Mizoram-specific public-route parity, copy, or methodology review has been done yet. Public exposure should lag any future internal proof cycle.

## Recommendation

Mizoram should be treated as a small-surface internal-only candidate for the final prep wave.

It should remain internal-only until:

1. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
2. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
3. the product deliberately chooses Mizoram rather than promoting it automatically
