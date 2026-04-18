# Madhya Pradesh Internal Readiness Review

Internal-readiness review for Madhya Pradesh after the first live operator trial and before any public exposure.

Madhya Pradesh has now cleared the full live internal proof bar. This document records both the source evidence and the completed internal-only operator cycle. It still does not approve public exposure.

## Review Basis

Source checks run against the live NJDG Madhya Pradesh district dashboard on `2026-04-17`.

Observed Madhya Pradesh source notes:

- `stateCode=MP`
- `stateName=Madhya Pradesh`
- `stateSlug=madhya-pradesh`
- `njdgStateValue=23~23`
- source page footer updated on `2026-04-16`
- 51 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `21,01,244`
- instituted last month shown on the live state page: `70,528`
- disposed last month shown on the live state page: `96,846`
- first visible district labels: `Jabalpur`, `Narsinghpur`, `Hoshangabad`, `Harda`, `Umaria`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Jabalpur` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Madhya Pradesh exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Madhya Pradesh is not blocked on a missing metric class or a clearly different page family.

### 2. Scale Value

Madhya Pradesh is a meaningful heavier-state candidate for the next internal-only wave. Its 51-district footprint is materially larger than the lighter north-east states and larger than the recent southern proofs, which makes it useful operating evidence before any further public expansion decisions.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and a sample district page request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:60`
- first live fetch run: `run_14520fbf-0fea-4bd9-95cb-e77b100a807f`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `51`
- statewide pending cases captured: `2101244`
- first live publication: `publication_18e27b87-5922-40da-a084-8af808be3ecb`
- first live snapshot: `snapshot_d82b181f-f934-4b32-a358-2513971b5801`
- replay run from stored evidence: `run_bfdce54a-47ac-4a5f-854d-fcd744fd9513`
- replay publication: `publication_d37491d5-5714-4590-a542-ebda13b14b03`
- rollback publication: `publication_3f08b92a-ac96-4a4a-9041-c02d90b1a2f2`
- public-surface validation: `https://nyaaywatch.in/states/madhya-pradesh` and `https://nyaaywatch.in/v1/states/madhya-pradesh/stats` both returned `404`, so Madhya Pradesh remained internal-only throughout the trial

## What Still Needs Explicit Work

### 1. Public Trust Review

No Madhya Pradesh-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope.

## Recommendation

Madhya Pradesh should now be treated as validated internal operating evidence rather than a source-only candidate.

It should remain internal-only until:

1. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
2. it reaches the front of the deliberate public queue instead of being exposed implicitly
