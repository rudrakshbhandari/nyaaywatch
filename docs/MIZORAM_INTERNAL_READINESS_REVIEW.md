# Mizoram Internal Readiness Review

Initial source-viability and internal-readiness review for Mizoram before any live operator trial or public exposure.

Mizoram is a plausible internal-only candidate for a very small north-east follow-on source check. This document records the currently verified live source notes only. It does not approve public exposure.

Historical note:

- repo wiring for `MZ` is not done yet
- no live `fetch -> inspect -> publish -> replay -> rollback` proof cycle has been run yet
- use `docs/EXPANSION_REVIEW_LOG.md` later if Mizoram moves into the live internal trial queue

## Review Basis

Source checks used the verified live NJDG Mizoram district dashboard notes available for this planning pass.

Observed Mizoram source notes:

- `stateCode=MZ`
- `stateName=Mizoram`
- `stateSlug=mizoram`
- `njdgStateValue=15~19`
- 3 districts exposed on the live NJDG state page
- sample visible district label: `Aizawl`
- caveat: the source surface is small

## What Already Looks Good

### 1. Source Reachability

Mizoram appears to expose a valid state page with district-level coverage and a stable state selector value.

That is enough to justify a later repo-wiring pass if we want a very small additional north-east internal candidate.

### 2. North-East Coverage Value

Mizoram would widen the internal north-east map without forcing a heavier public or operator decision immediately.

That makes it a reasonable optional follow-on if the goal is breadth of regional source validation more than operational stress testing.

## What Still Needs Explicit Work

### 1. Metric-Shape Confirmation

The currently verified notes do not yet record the full statewide metric surface.

Before Mizoram should enter the live internal queue, we still need to confirm that the current extractor assumptions hold for:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown reachability

### 2. Repo Wiring

Mizoram is not yet wired into the repo as an internal-only state profile.

That means no extractor, operator, or test-path support exists yet for `MZ`.

### 3. Operating Evidence

No Mizoram-specific live operating evidence exists yet.

Mizoram still needs to clear:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

### 4. Stress-Test Limits

Mizoram's 3-district surface is likely too small to tell us much about heavier-state behavior.

It may still be valuable as a source-compatibility check, but it should not be mistaken for a meaningful stress or scale qualification.

### 5. Public Trust Review

No Mizoram-specific public-route parity, copy, or methodology review has been done yet. Public exposure should lag any future internal proof cycle.

## Recommendation

Mizoram should be treated as a small-surface optional internal candidate, not as a priority public-state contender.

It is most useful if we explicitly want:

1. another north-east source-compatibility check
2. a very small internal surface that is cheap to qualify

It should remain internal-only unless a later proof cycle and separate public-readiness review justify anything more.
