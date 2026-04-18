# Telangana Public Readiness Review

Review of the public-readiness work that preceded Telangana's first public rollout.

Telangana had already cleared the internal proof bar on the live stack before public exposure. This review recorded why the remaining public question was narrow, and the rollout is now complete on the public hostname.

## Review Basis

Based on the live Telangana internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_b48f6632-d59e-4bf9-9cdf-30125e045538`
- first live publication id: `publication_eebf7779-60ed-4f91-967e-ab8dd6006fb8`
- replay run id: `run_e350d3ba-98d9-4d55-b073-638e69a8039d`
- replay publication id: `publication_64116adc-188e-4753-8cdb-a6a21d114e61`
- rollback publication id: `publication_83bbcec4-3402-4f8c-9014-6646255a64a0`

Observed Telangana source notes:

- `stateCode=TS`
- `stateName=Telangana`
- `stateSlug=telangana`
- `njdgStateValue=36~29`
- source page footer updated on `2026-04-16`
- 33 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `9,84,793`
- instituted last month shown on the live state page: `49,090`
- disposed last month shown on the live state page: `60,884`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Telangana exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, Tamil Nadu, and Assam flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Telangana is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Telangana already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Telangana routes continued to return `404`, which is the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Telangana pipeline inherits the same trust-critical metadata shape used for the existing live public states:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Telangana candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

Once Telangana is promoted into the approved public-state set in repo config, the live hostname still needs verification on:

- `/states/telangana`
- `/v1/states/telangana/...`
- `/states/telangana/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Tamil Nadu and Assam provide the immediate rollout pattern. Telangana does not need broader repo-level public-surface invention here, but it still needs the actual state-scoped verification pass before launch.

The Telangana-specific artifacts for that pass are:

- `docs/TELANGANA_GO_LIVE_CHECKLIST.md`
- targeted Telangana public-route parity coverage that exercises the intended `/states/telangana/...` and `/v1/states/telangana/...` surfaces once Telangana is deliberately promoted into the public-state set

### 2. Information Architecture Discipline

The product is no longer Himachal-only, but it is still intentionally not nationwide. Telangana public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That gate is satisfied for Telangana because Haryana, Tamil Nadu, and Assam are already live publicly, while Kerala, Meghalaya, Karnataka, Tripura, Nagaland, Andhra Pradesh, Arunachal Pradesh, and Manipur provide surrounding internal-only operating evidence. Telangana no longer needs more internal-proof debate before public-route work can proceed.

## Outcome

Telangana is now publicly live and no longer belongs in the "next narrow public candidate" bucket.

The rollout completed on `2026-04-18` with:

1. deliberate promotion into the approved public-state set
2. green Telangana-specific route-parity artifacts in repo validation
3. passing `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug telangana`
4. a live browser pass on `https://nyaaywatch.in/states/telangana`
5. rollout evidence recorded in `docs/DEPLOYMENT_STATUS.md`, `docs/EXPANSION_REVIEW_LOG.md`, and `docs/RELEASE_HISTORY.md`

## Useful Work Completed By This Review

This review closes the Telangana trust question at the pre-launch level:

- source-shape review: done
- trust-surface review: done
- public recommendation: Telangana is a viable next narrow public candidate
- remaining blockers are rollout-specific rather than extractor- or source-specific
