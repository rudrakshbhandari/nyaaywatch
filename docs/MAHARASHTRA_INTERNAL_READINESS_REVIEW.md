# Maharashtra Internal Readiness Review

Internal-readiness review for Maharashtra after the first live operator trial and before any public exposure.

Maharashtra has now cleared the full live internal proof bar. This document records both the source evidence and the completed internal-only operator cycle. It still does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Maharashtra district dashboard on `2026-04-17`.

Observed Maharashtra source notes:

- `stateCode=MH`
- `stateName=Maharashtra`
- `stateSlug=maharashtra`
- `njdgStateValue=27~1`
- source page footer updated on `2026-04-16`
- 42 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `60,22,450`
- instituted last month shown on the live state page: `1,83,811`
- disposed last month shown on the live state page: `2,61,488`
- first visible district labels: `Nandurbar`, `Dhule`, `Jalgaon`, `Buldhana`, `Akola`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Nandurbar` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Maharashtra exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Maharashtra is not blocked on a missing metric class or a clearly different page family.

### 2. Scale Value

Maharashtra is the most operationally significant state in this next read-only batch. Its 42-district footprint and very large statewide case volume make it useful stress evidence for the internal operator lane before any decision about widening public state coverage.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:60`
- first live fetch run: `run_cfdf23ca-aa24-4dd4-b954-6b07d5c9701a`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `42`
- statewide pending cases captured: `6022450`
- first live publication: `publication_e19586db-da7e-4db7-a3f2-4fe484e05598`
- first live snapshot: `snapshot_4afad27d-e8ee-44f7-8637-d67415c6e17b`
- replay run from stored evidence: `run_7e93efa9-aafc-4ca0-8948-d3eb29d44a31`
- replay publication: `publication_dd6d8431-409e-401c-9320-9ab6c2ea8884`
- rollback publication: `publication_f000da6a-79d1-4683-8acf-2a1b235611b4`
- public-surface validation: `https://nyaaywatch.in/states/maharashtra` and `https://nyaaywatch.in/v1/states/maharashtra/stats` both returned `404`, so Maharashtra remained internal-only throughout the trial

## What Still Needs Explicit Work

### 1. Public Trust Review

No Maharashtra-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Maharashtra should now be treated as validated internal operating evidence rather than a source-only candidate.

It should remain internal-only until:

1. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
2. it reaches the front of the deliberate public queue instead of being exposed implicitly
