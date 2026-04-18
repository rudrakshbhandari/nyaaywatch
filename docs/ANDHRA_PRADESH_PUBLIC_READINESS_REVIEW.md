# Andhra Pradesh Public Readiness Review

Review of what Andhra Pradesh now requires before exposing the public Andhra Pradesh route family.

Andhra Pradesh has already cleared the internal proof bar on the live stack. This review records why the remaining public question is narrow: Andhra Pradesh no longer needs extractor invention or source-shape debate, but it still needs stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the live Andhra Pradesh internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_4cb87c2a-1c31-4437-98ef-dc7d082ad6ef`
- first live publication id: `publication_337af32e-4f9c-45ab-a4a4-52d43a2028b4`
- replay run id: `run_ce2ec512-176a-483e-ba9c-309054a0fff6`
- rollback publication id: `publication_c9d3057f-b1a2-4a0f-83ea-ac2b66886e1a`

Observed Andhra Pradesh source notes:

- `stateCode=AP`
- `stateName=Andhra Pradesh`
- `stateSlug=andhra-pradesh`
- `njdgStateValue=28~2`
- source page footer updated on `2026-04-17`
- 13 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `9,29,470`
- instituted last month shown on the live state page: `94,380`
- disposed last month shown on the live state page: `1,05,140`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Andhra Pradesh exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, Tamil Nadu, Assam, Telangana, Kerala, Meghalaya, Karnataka, Tripura, and Nagaland flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Andhra Pradesh is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Andhra Pradesh already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Andhra Pradesh routes still returned `404`, which was the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Andhra Pradesh pipeline inherits the same trust-critical metadata shape used for the existing public-state rollout path:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Andhra Pradesh candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

Andhra Pradesh is now wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still need to verify:

- `/states/andhra-pradesh`
- `/v1/states/andhra-pradesh/...`
- `/states/andhra-pradesh/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Nagaland provides the immediate rollout pattern. Andhra Pradesh does not need broader repo-level public-surface invention here, but it still needs the actual state-scoped verification pass before launch.

The Andhra Pradesh-specific artifacts for that pass are:

- `docs/ANDHRA_PRADESH_GO_LIVE_CHECKLIST.md`
- targeted Andhra Pradesh public-route parity coverage that exercises the intended `/states/andhra-pradesh/...` and `/v1/states/andhra-pradesh/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

The product is intentionally not nationwide. Andhra Pradesh public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify public-prep states in parallel. Public exposure should still lag stable-URL verification and a deliberate rollout slot.

That gate is satisfied for Andhra Pradesh because Haryana, Tamil Nadu, Assam, Telangana, Kerala, Meghalaya, Karnataka, Tripura, and Nagaland are already live publicly, while Arunachal Pradesh, Manipur, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, Chhattisgarh, Goa, Sikkim, and Mizoram provide surrounding operating evidence. Andhra Pradesh no longer needs more internal-proof debate before public-route work can proceed.

## Outcome

Andhra Pradesh should now be treated as the next viable narrow public candidate after Nagaland, not as a state that still needs basic source or operator validation.

Before launch, the remaining conditions are:

1. the Andhra Pradesh-specific public-route parity artifacts stay green under the approved public-state configuration
2. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug andhra-pradesh` and a live browser pass both succeed on the stable hostname
3. rollout docs record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review closes the Andhra Pradesh trust question at the pre-launch level:

- source-shape review: done
- trust-surface review: done
- public recommendation: Andhra Pradesh is a viable next narrow public candidate
- remaining blockers are rollout-specific rather than extractor- or source-specific
