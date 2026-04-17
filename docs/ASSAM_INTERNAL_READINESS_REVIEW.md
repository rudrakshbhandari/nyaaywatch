# Assam Internal Readiness Review

Initial source-viability and internal-readiness review for Assam before any live operator trial or public exposure.

Assam is a strong internal-only candidate for the north-east expansion track. This document records live source evidence only. It does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Assam district dashboard on `2026-04-17`.

Observed Assam source notes:

- `stateCode=AS`
- `stateName=Assam`
- `stateSlug=assam`
- `njdgStateValue=18~6`
- source page footer updated on `2026-04-16`
- 34 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `5,81,244`
- instituted last month shown on the live state page: `14,498`
- disposed last month shown on the live state page: `15,074`
- first visible district labels: `Kamrup Metro`, `Tinsukia`, `Sivasagar`, `Morigaon`, `Lakhimpur`
- all five age-bucket widgets were present on the live state page
- sample district drilldown `dist_code=1` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Assam exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Assam is not blocked on a missing metric class or a clearly different page family.

### 2. Regional Coverage Value

Assam gives the internal expansion track an explicit north-east proof state without forcing broad national scaffolding. That makes it a better narrative fit for the current expansion direction than simply adding more north or west-belt states first.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## What Still Needs Explicit Work

### 1. Repo Wiring

Assam still needs to be wired into the repo as an internal-only state profile with tests that keep it dark on the public site.

### 2. Operating Evidence

Assam has not yet cleared:

- live `fetch`
- live `inspect`
- live `publish`
- live `replay`
- live `rollback`

Until those are complete, Assam remains only a source-viability candidate.

### 3. Public Trust Review

No Assam-specific public-route parity, copy, or methodology review has been done yet. Public exposure should not be considered until the internal proof cycle succeeds first.

## Recommendation

Assam should be added as an internal-only candidate state and used as the first north-east proof state.

It should remain internal-only until:

1. repo wiring lands for `AS`
2. the first live `fetch -> inspect -> publish -> replay -> rollback` cycle succeeds
3. a separate public-readiness review concludes that the narrow state-scoped rollout is defensible
