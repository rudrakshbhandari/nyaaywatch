# Haryana Public Readiness Review

Review of what we can already validate for Haryana before exposing any public Haryana route family.

This review closes the Haryana go / no-go question at the trust-surface level. Haryana is viable as the next narrow public rollout candidate, and the earlier "wait for one more internal state" gate is now satisfied by the completed Uttarakhand, Rajasthan, and Uttar Pradesh internal proof cycles. The remaining work is Haryana public-route parity, stable-URL verification, and the live rollout itself.

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

The verification artifacts for that pass should now live in:

- `docs/HARYANA_GO_LIVE_CHECKLIST.md`
- targeted Haryana public-route parity tests that exercise the intended `/states/haryana/...` and `/v1/states/haryana/...` surfaces under a test-only public-state promotion

### 2. Information Architecture Discipline

The product is no longer Himachal-only, but it is still intentionally not nationwide. Haryana public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That earlier expansion-risk gate is now cleared. Uttarakhand, Rajasthan, and Uttar Pradesh have all since completed the same internal-only `fetch -> inspect -> publish -> replay -> rollback` bar, so Haryana no longer needs to wait on an additional internal proof state before public-route work can proceed.

## Recommendation

Haryana should be treated as the next narrow public rollout candidate.

It should move forward once the conditions below are true:

1. Haryana public routes are implemented and pass stable-URL UI/API/CSV parity verification
2. the preflight artifacts in `docs/HARYANA_GO_LIVE_CHECKLIST.md` and `tests/haryana-public-rollout.test.ts` are green on the integrated branch
3. public copy remains explicit about which states are live, without implying nationwide coverage

## Useful Work Completed By This Review

This review closes the open Haryana trust question in `TODOS.md`:

- source-shape review: done
- trust-surface review: done
- public recommendation: Haryana is the next public candidate, and the next slice is rollout execution rather than further readiness debate
- remaining blockers reduced to:
  - Haryana public-route implementation and parity verification
  - live release evidence on the public hostname
