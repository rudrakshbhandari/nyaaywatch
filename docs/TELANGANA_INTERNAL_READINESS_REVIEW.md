# Telangana Internal Readiness Review

Initial source-viability and internal-readiness review for Telangana before the first live operator trial or public exposure.

Telangana is a strong internal-only candidate for the next southern expansion track after Tamil Nadu, Kerala, and Karnataka. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Verified live-source checks against the NJDG Telangana district dashboard observed:

- `stateCode=TS`
- `stateName=Telangana`
- `stateSlug=telangana`
- `njdgStateValue=36~29`
- source page footer updated on `2026-04-16`
- 33 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `9,84,793`
- instituted last month shown on the live state page: `49,090`
- disposed last month shown on the live state page: `60,884`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Adilabad` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Telangana exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Telangana is not blocked on a missing metric class or a clearly different page family.

### 2. Southern Continuity Value

Telangana adds another meaningful southern source boundary without forcing another public-state decision. Its 33-district footprint is close to Tamil Nadu's scale, which makes it useful heavier internal-only operating evidence rather than only another light-state proof.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and the verified `Adilabad` district request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Telangana still needs explicit repo wiring as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Telangana has not yet cleared the full internal proof bar. It still needs:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until that happens, it should be treated as a source-viability candidate rather than validated internal operating evidence.

### 3. Public Trust Review

No Telangana-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Telangana should be treated as a viable next southern internal-only candidate.

It should remain internal-only until:

1. repo wiring and internal-only regression coverage are in place
2. a full live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
