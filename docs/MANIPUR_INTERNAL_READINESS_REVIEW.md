# Manipur Internal Readiness Review

Source-viability and internal-readiness review for Manipur, with the first live internal proof cycle now completed.

Manipur is now validated internal-only operating evidence for the north-east expansion track after Assam, Meghalaya, Tripura, and Nagaland. This document records both the source review and the completed live internal proof cycle. It does not approve public exposure.

## Review Basis

Verified live-source checks against the NJDG Manipur district dashboard observed:

- `stateCode=MN`
- `stateName=Manipur`
- `stateSlug=manipur`
- `njdgStateValue=14~25`
- source page footer updated on `2026-04-17`
- 9 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `14,860`
- instituted last month shown on the live state page: `1,174`
- disposed last month shown on the live state page: `869`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Imphal East` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Manipur exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Manipur is not blocked on a missing metric class or a clearly different page family.

### 2. North-East Continuity Value

Manipur adds another north-east source surface without widening the public site. Its 9-district footprint is compact enough to make it a practical internal-only proof candidate while still adding a distinct regional source boundary.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and the verified `Imphal East` district request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## Live Internal Trial Outcome

Manipur has now cleared the full internal proof bar on the live AWS stack.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:58`
- first live fetch run: `run_ce3e086f-84f5-40d7-9540-366fe1c40a25`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `9`
- statewide pending cases captured: `14860`
- first live publication: `publication_d747187e-cc5e-4071-9fba-75a73e96058c`
- first live snapshot: `snapshot_8dbdd101-5f56-4d56-92ac-887c4028f64a`
- replay run from stored evidence: `run_bdfe0d4a-770d-49cb-9f04-952999686779`
- replay publication: `publication_bf0bd251-57dd-4807-b084-bbbac79e106e`
- rollback publication: `publication_29505d10-5434-4237-8b0d-89a9dfcf08cf`
- operator validation: `GET /operator/publications?stateCode=MN` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/manipur` and `https://nyaaywatch.in/v1/states/manipur/stats` both returned `404`, so Manipur remained internal-only throughout the trial

### Remaining Constraint

No Manipur-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope until a separate public-readiness review is complete.

## Recommendation

Manipur should now be treated as validated north-east internal-only operating evidence.

It should remain internal-only until:

1. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
2. explicit public-route parity, trust-copy review, and stable-URL verification are in place
3. the next public-state decision deliberately chooses Manipur rather than promoting it automatically
