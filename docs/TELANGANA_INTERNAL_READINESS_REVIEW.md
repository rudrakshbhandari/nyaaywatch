# Telangana Internal Readiness Review

Source-viability and internal-readiness review for Telangana, with the first live internal proof cycle now completed.

Telangana is now validated internal-only operating evidence for the southern expansion track after Tamil Nadu, Kerala, and Karnataka. This document records both the source review and the completed live internal proof cycle. It does not approve public exposure.

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

## Live Internal Trial Outcome

Telangana has now cleared the full internal proof bar on the live AWS stack.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:58`
- first live fetch run: `run_b48f6632-d59e-4bf9-9cdf-30125e045538`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `33`
- statewide pending cases captured: `984793`
- first live publication: `publication_eebf7779-60ed-4f91-967e-ab8dd6006fb8`
- first live snapshot: `snapshot_16dda47e-b151-4528-810c-fecc6b0eacbd`
- replay run from stored evidence: `run_e350d3ba-98d9-4d55-b073-638e69a8039d`
- replay publication: `publication_64116adc-188e-4753-8cdb-a6a21d114e61`
- rollback publication: `publication_83bbcec4-3402-4f8c-9014-6646255a64a0`
- operator validation: `GET /operator/publications?stateCode=TS` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/telangana` and `https://nyaaywatch.in/v1/states/telangana/stats` both returned `404`, so Telangana remained internal-only throughout the trial

### Remaining Constraint

No Telangana-specific public-route parity, copy, or methodology review has been done yet. Public exposure should remain out of scope until a separate public-readiness review is complete.

## Recommendation

Telangana should now be treated as validated southern internal-only operating evidence.

It should remain internal-only until:

1. a separate public-readiness review concludes that a narrow state-scoped rollout is defensible
2. explicit public-route parity, trust-copy review, and stable-URL verification are in place
3. the next public-state decision deliberately chooses Telangana rather than promoting it automatically
