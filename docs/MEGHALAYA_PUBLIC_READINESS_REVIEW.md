# Meghalaya Public Readiness Review

Review of what Meghalaya now requires before exposing any public Meghalaya route family.

Meghalaya has already cleared the internal proof bar on the live stack. This review records why the remaining public question is narrow: Meghalaya no longer needs extractor invention or source-shape debate, but it still needs explicit public-route parity, stable-URL verification, and a deliberate rollout decision before any public exposure.

## Review Basis

Based on the live Meghalaya internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_3dd14fff-0791-45b4-9bd7-27ce798cc850`
- first live publication id: `publication_b1b1d691-d8bf-4e79-8d2d-119dff5b024c`
- replay run id: `run_5fda86c5-aefe-4e33-ae39-e25dac3f4830`
- replay publication id: `publication_503248fe-3cc6-4b24-96e9-1317a4ba6001`
- rollback publication id: `publication_7337df86-24c6-4290-8ee4-2b740e5110af`

Observed Meghalaya source notes:

- `stateCode=ML`
- `stateName=Meghalaya`
- `stateSlug=meghalaya`
- `njdgStateValue=17~21`
- source page footer updated on `2026-04-16`
- 14 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `18,450`
- instituted last month shown on the live state page: `1,456`
- disposed last month shown on the live state page: `778`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Meghalaya exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, Tamil Nadu, Assam, Telangana, and Kerala flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Meghalaya is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Meghalaya already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Meghalaya routes continued to return `404`, which is the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Meghalaya pipeline inherits the same trust-critical metadata shape used for the existing live public states:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Meghalaya candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

Once Meghalaya is promoted into the approved public-state set in repo config, the live hostname still needs verification on:

- `/states/meghalaya`
- `/v1/states/meghalaya/...`
- `/states/meghalaya/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Kerala provides the immediate rollout pattern. Meghalaya does not need broader repo-level public-surface invention here, but it still needs the actual state-scoped verification pass before launch.

The Meghalaya-specific artifacts for that pass are:

- `docs/MEGHALAYA_GO_LIVE_CHECKLIST.md`
- targeted Meghalaya public-route parity coverage that exercises the intended `/states/meghalaya/...` and `/v1/states/meghalaya/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

The product is intentionally not nationwide. Meghalaya public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That gate is satisfied for Meghalaya because Haryana, Tamil Nadu, Assam, Telangana, and Kerala are already live publicly, while Karnataka, Tripura, Nagaland, Andhra Pradesh, Arunachal Pradesh, Manipur, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, and Chhattisgarh provide surrounding internal-only operating evidence. Meghalaya no longer needs more internal-proof debate before public-route work can proceed.

## Outcome

Meghalaya should now be treated as the next viable narrow public candidate after Kerala, not as a state that still needs basic source or operator validation.

Before launch, the remaining conditions are:

1. Meghalaya is deliberately promoted into the approved public-state set rather than exposed by implication
2. the Meghalaya-specific public-route parity artifacts are green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug meghalaya` and a live browser pass both succeed on the stable hostname
4. rollout docs record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review closes the Meghalaya trust question at the pre-launch level:

- source-shape review: done
- trust-surface review: done
- public recommendation: Meghalaya is a viable next narrow public candidate
- remaining blockers are rollout-specific rather than extractor- or source-specific
