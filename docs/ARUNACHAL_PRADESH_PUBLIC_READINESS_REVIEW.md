# Arunachal Pradesh Public Readiness Review

Review of what Arunachal Pradesh required before exposing the public Arunachal Pradesh route family.

Arunachal Pradesh had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Arunachal Pradesh no longer needed extractor invention or source-shape debate, but it still needed stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the live Arunachal Pradesh internal proof cycle and public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_330e608c-890c-47e2-a585-3171c3c44c42`
- first live publication id: `publication_316b931a-30e2-418f-ae8b-ade91f1b4fa9`
- replay run id: `run_7067210b-fe7f-4366-a6a7-e0788824e727`
- rollback publication id: `publication_3acdfe73-8c9b-40a8-b882-472934a2fa90`
- public rollout fetch run id: `run_d2dadaec-bda6-4639-8629-28201a562708`
- public rollout publication id: `publication_ded2b9e1-f28a-4ead-90c4-1ba03a9890b0`
- public rollout snapshot id: `snapshot_0daffe74-e0ec-46f0-89b1-bc3e4177392f`

Observed Arunachal Pradesh source notes:

- `stateCode=AR`
- `stateName=Arunachal Pradesh`
- `stateSlug=arunachal-pradesh`
- `njdgStateValue=12~36`
- source page footer updated on `2026-04-16`
- 27 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `15,539`
- instituted last month shown on the live state page: `572`
- disposed last month shown on the live state page: `678`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Arunachal Pradesh exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, Tamil Nadu, Assam, Telangana, Kerala, Meghalaya, Karnataka, Tripura, Nagaland, and Andhra Pradesh flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Arunachal Pradesh is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Arunachal Pradesh already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Arunachal Pradesh routes still returned `404`, which was the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Arunachal Pradesh pipeline inherits the same trust-critical metadata shape used for the existing public-state rollout path:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Arunachal Pradesh candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

Arunachal Pradesh was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/arunachal-pradesh`
- `/v1/states/arunachal-pradesh/...`
- `/states/arunachal-pradesh/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Andhra Pradesh provided the immediate rollout pattern. Arunachal Pradesh did not need broader repo-level public-surface invention here, but it did need the actual state-scoped verification pass before launch.

The Arunachal Pradesh-specific artifacts for that pass are:

- `docs/ARUNACHAL_PRADESH_GO_LIVE_CHECKLIST.md`
- targeted Arunachal Pradesh public-route parity coverage that exercises the intended `/states/arunachal-pradesh/...` and `/v1/states/arunachal-pradesh/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

The product is intentionally not nationwide. Arunachal Pradesh public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify public-prep states in parallel. Public exposure should still lag stable-URL verification and a deliberate rollout slot.

That gate is satisfied for Arunachal Pradesh because Haryana, Tamil Nadu, Assam, Telangana, Kerala, Meghalaya, Karnataka, Tripura, Nagaland, and Andhra Pradesh are already live publicly, while Manipur, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, Chhattisgarh, Goa, Sikkim, and Mizoram provide surrounding operating evidence. Arunachal Pradesh no longer needs more internal-proof debate before public-route work can proceed.

## Outcome

Arunachal Pradesh is now live on the public site as the twelfth additional public state.

The launch conditions that cleared were:

1. Arunachal Pradesh was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Arunachal Pradesh-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug arunachal-pradesh` and a live HTML verification pass both succeeded on the stable hostname
4. rollout docs now record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review now closes the Arunachal Pradesh trust question at the launched-public-state level:

- source-shape review: done
- trust-surface review: done
- public rollout: completed
- remaining blockers: none for Arunachal Pradesh itself; the queue now advances to Manipur
