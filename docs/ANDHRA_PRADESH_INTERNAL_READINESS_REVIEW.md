# Andhra Pradesh Internal Readiness Review

Source-viability and internal-readiness review for Andhra Pradesh, with the first live internal proof cycle now completed.

Andhra Pradesh is now validated operating evidence for the southern expansion track after Tamil Nadu, Kerala, and Karnataka. This document records the source review plus the completed live internal proof cycle that later supported public rollout.

## Review Basis

Verified live-source checks against the NJDG Andhra Pradesh district dashboard observed:

- `stateCode=AP`
- `stateName=Andhra Pradesh`
- `stateSlug=andhra-pradesh`
- `njdgStateValue=28~2`
- source page footer updated on `2026-04-17`
- 13 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `9,29,470`
- instituted last month shown on the live state page: `94,380`
- disposed last month shown on the live state page: `1,05,140`
- all five age-bucket widgets were present on the live state page
- sample district drilldown for `Ananthapur` returned `200 OK`

## What Already Looks Good

### 1. Source Shape Parity

Andhra Pradesh exposes the same metric families the current extractor and normalizer already expect:

- total pending cases
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown through the state page selector

That means Andhra Pradesh is not blocked on a missing metric class or a clearly different page family.

### 2. Southern Continuity Value

Andhra Pradesh extends the southern operating story into another meaningful state surface without widening the public site. Its 13-district footprint is lighter than Tamil Nadu and Karnataka but still substantial enough to make it useful internal-only operating evidence rather than only another tiny proof state.

### 3. Drilldown Reachability

The live state page exposes district drilldowns, and the verified `Ananthapur` district request returned `200 OK`. That is enough to justify internal operator wiring and the first stored-evidence capture attempt.

## Live Internal Trial Outcome

Andhra Pradesh has now cleared the full internal proof bar on the live AWS stack.

### Live Trial Evidence

- deployed task definition during proof cycle: `nyaaywatch-staging:58`
- first live fetch run: `run_4cb87c2a-1c31-4437-98ef-dc7d082ad6ef`
- source snapshot date: `2026-04-16`
- candidate quality state: `complete`
- district count captured: `13`
- statewide pending cases captured: `929470`
- first live publication: `publication_337af32e-4f9c-45ab-a4a4-52d43a2028b4`
- first live snapshot: `snapshot_95c7f026-6db2-46a8-a0d2-2641512df02f`
- replay run from stored evidence: `run_ce2ec512-176a-483e-ba9c-309054a0fff6`
- replay publication: `publication_89c24d14-008d-4ede-a6e8-2728976b8579`
- rollback publication: `publication_c9d3057f-b1a2-4a0f-83ea-ac2b66886e1a`
- operator validation: `GET /operator/publications?stateCode=AP` showed the rollback publication active after replay plus rollback
- public-surface validation: `https://nyaaywatch.in/states/andhra-pradesh` and `https://nyaaywatch.in/v1/states/andhra-pradesh/stats` both returned `404`, so Andhra Pradesh remained internal-only throughout the trial

### Later Public Outcome

Andhra Pradesh later cleared a separate public-readiness review, public-route parity, stable-URL verification, and a deliberate public rollout. See `docs/ANDHRA_PRADESH_PUBLIC_READINESS_REVIEW.md` for the public-state evidence.

## Recommendation

Andhra Pradesh should now be treated as validated southern operating evidence whose internal proof path is complete and later public rollout is also complete.
