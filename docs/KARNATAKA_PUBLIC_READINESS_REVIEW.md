# Karnataka Public Readiness Review

Review of what Karnataka now requires before exposing the public Karnataka route family.

Karnataka has already cleared the internal proof bar on the live stack. This review records why the remaining public question is narrow: Karnataka no longer needs extractor invention or source-shape debate, but it still needs stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the live Karnataka internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_c57e88aa-c6bf-40d8-a3fb-9343bd819174`
- first live publication id: `publication_54748fe1-5f7c-41d4-bc40-3c976d157f56`
- replay run id: `run_18f4c2a3-d811-496e-a277-d0d4574906c9`
- rollback publication id: `publication_30e8a0c5-9d15-4e9d-8f4b-ebf3143efb39`

Observed Karnataka source notes:

- `stateCode=KA`
- `stateName=Karnataka`
- `stateSlug=karnataka`
- `njdgStateValue=29~3`
- source page footer updated on `2026-04-16`
- 31 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `22,30,354`
- instituted last month shown on the live state page: `1,99,126`
- disposed last month shown on the live state page: `2,87,712`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Karnataka exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, Tamil Nadu, Assam, Telangana, Kerala, and Meghalaya flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Karnataka is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Karnataka already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Karnataka routes still returned `404`, which was the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Karnataka pipeline inherits the same trust-critical metadata shape used for the existing public-state rollout path:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Karnataka candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

Karnataka is now wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still need to verify:

- `/states/karnataka`
- `/v1/states/karnataka/...`
- `/states/karnataka/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Meghalaya provides the immediate rollout pattern. Karnataka does not need broader repo-level public-surface invention here, but it still needs the actual state-scoped verification pass before launch.

The Karnataka-specific artifacts for that pass are:

- `docs/KARNATAKA_GO_LIVE_CHECKLIST.md`
- targeted Karnataka public-route parity coverage that exercises the intended `/states/karnataka/...` and `/v1/states/karnataka/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

The product is intentionally not nationwide. Karnataka public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify public-prep states in parallel. Public exposure should still lag stable-URL verification and a deliberate rollout slot.

That gate is satisfied for Karnataka because Haryana, Tamil Nadu, Assam, Telangana, and Kerala are already live publicly, Meghalaya is the active current rollout candidate, and Tripura, Nagaland, Andhra Pradesh, Arunachal Pradesh, Manipur, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, and Chhattisgarh provide surrounding operating evidence. Karnataka no longer needs more internal-proof debate before public-route work can proceed.

## Outcome

Karnataka should now be treated as the next viable narrow public candidate after Meghalaya, not as a state that still needs basic source or operator validation.

Before launch, the remaining conditions are:

1. the Karnataka-specific public-route parity artifacts stay green under the approved public-state configuration
2. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug karnataka` and a live browser pass both succeed on the stable hostname
3. rollout docs record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review closes the Karnataka trust question at the pre-launch level:

- source-shape review: done
- trust-surface review: done
- public recommendation: Karnataka is a viable next narrow public candidate
- remaining blockers are rollout-specific rather than extractor- or source-specific
