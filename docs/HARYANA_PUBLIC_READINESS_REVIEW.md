# Haryana Public Readiness Review

Review of what we can already validate for Haryana before exposing any public Haryana route family.

This review closes the Haryana go / no-go question at the trust-surface level. Haryana is viable as the next narrow public rollout candidate, but it should remain internal-only until one more internal state clears the full proof cycle and Haryana public-route parity is verified end to end.

## Review Basis

Based on the live Haryana internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_171cccad-9fef-47cb-9cc1-c1ae4449fe4e`
- first live publication id: `publication_0d8a736d-1c27-4ae3-8cba-c0593057e3d2`
- replay run id: `run_76e23910-ffd8-4dcc-a3be-3eda0b130356`
- replay publication id: `publication_cc7b1068-b97e-470a-a079-570cad23061f`
- rollback publication id: `publication_09613d9d-ae89-4543-9028-8f5d971df587`

Observed Haryana source notes:

- `stateCode=HR`
- `stateName=Haryana`
- `njdgStateValue=6~14`
- source page footer updated on `2026-04-16`
- 22 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `15,09,969`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Haryana exposes the same minimum state-level metric shape that the Himachal and Punjab flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Haryana is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Haryana already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Haryana routes continued to return `404`, which is the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Haryana pipeline inherits the same trust-critical metadata shape used for Himachal and Punjab:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Haryana candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What Still Needs Explicit Public Work

### 1. Public Surface Implementation And Parity

Haryana is still dark on the public site. Before any launch we still need to verify:

- `/states/haryana`
- `/v1/states/haryana/...`
- `/states/haryana/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Punjab now provides the pattern. Haryana does not need invention here, but it still needs the actual public verification pass.

### 2. Information Architecture Discipline

The product is no longer Himachal-only, but it is still intentionally not nationwide. Haryana public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That means Haryana should not go public before at least one more internal-only state clears the same `fetch -> inspect -> publish -> replay -> rollback` bar. Otherwise we would be expanding the public surface and the internal confidence base at the same time.

## Recommendation

Haryana should be treated as the next narrow public rollout candidate.

It should remain internal-only until all three conditions below are true:

1. one more internal-only state clears the full live proof cycle
2. Haryana public routes are implemented and pass stable-URL UI/API/CSV parity verification
3. public copy remains explicit about which states are live, without implying nationwide coverage

## Useful Work Completed By This Review

This review closes the open Haryana trust question in `TODOS.md`:

- source-shape review: done
- trust-surface review: done
- public recommendation: Haryana is the next public candidate, but not an immediate go-live
- remaining blockers reduced to:
  - one more internal-only state proof cycle
  - Haryana public-route implementation and parity verification
