# Tripura Public Readiness Review

Review of what Tripura now requires before exposing the public Tripura route family.

Tripura has already cleared the internal proof bar on the live stack. This review records why the remaining public question is narrow: Tripura no longer needs extractor invention or source-shape debate, but it still needs stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the live Tripura internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_6b5e6751-0835-42b1-a89a-f3da080f5287`
- first live publication id: `publication_3936f6cd-c9fe-403a-84b2-ba22e3fdf39b`
- replay run id: `run_42e9b2bc-e00e-43b2-8f2b-f9c103ba2246`
- rollback publication id: `publication_81692c3c-e86a-4774-8619-32cc60f11a85`

Observed Tripura source notes:

- `stateCode=TR`
- `stateName=Tripura`
- `stateSlug=tripura`
- `njdgStateValue=16~20`
- source page footer updated on `2026-04-16`
- 8 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `63,981`
- instituted last month shown on the live state page: `10,656`
- disposed last month shown on the live state page: `15,663`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Tripura exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, Tamil Nadu, Assam, Telangana, Kerala, and Meghalaya flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Tripura is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Tripura already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Tripura routes still returned `404`, which was the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Tripura pipeline inherits the same trust-critical metadata shape used for the existing public-state rollout path:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Tripura candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

Tripura is now wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still need to verify:

- `/states/tripura`
- `/v1/states/tripura/...`
- `/states/tripura/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Meghalaya provides the immediate rollout pattern. Tripura does not need broader repo-level public-surface invention here, but it still needs the actual state-scoped verification pass before launch.

The Tripura-specific artifacts for that pass are:

- `docs/TRIPURA_GO_LIVE_CHECKLIST.md`
- targeted Tripura public-route parity coverage that exercises the intended `/states/tripura/...` and `/v1/states/tripura/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

The product is intentionally not nationwide. Tripura public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify public-prep states in parallel. Public exposure should still lag stable-URL verification and a deliberate rollout slot.

That gate is satisfied for Tripura because Haryana, Tamil Nadu, Assam, Telangana, and Kerala are already live publicly, Meghalaya is the active current rollout candidate, and Karnataka, Nagaland, Andhra Pradesh, Arunachal Pradesh, Manipur, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, and Chhattisgarh provide surrounding operating evidence. Tripura no longer needs more internal-proof debate before public-route work can proceed.

## Outcome

Tripura should now be treated as the next viable narrow public candidate after Meghalaya, not as a state that still needs basic source or operator validation.

Before launch, the remaining conditions are:

1. the Tripura-specific public-route parity artifacts stay green under the approved public-state configuration
2. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug tripura` and a live browser pass both succeed on the stable hostname
3. rollout docs record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review closes the Tripura trust question at the pre-launch level:

- source-shape review: done
- trust-surface review: done
- public recommendation: Tripura is a viable next narrow public candidate
- remaining blockers are rollout-specific rather than extractor- or source-specific
