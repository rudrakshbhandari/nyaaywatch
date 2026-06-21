# Tamil Nadu Public Readiness Review

Historical rollout note: this dated readiness record preserves the rollout scope and evidence available when it was written. The current public scope is India-first: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Use `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md` for current coverage.


Review of what we can already validate for Tamil Nadu before exposing any public Tamil Nadu route family.

This review closed the Tamil Nadu go / no-go question at the trust-surface level. Tamil Nadu then completed stable-URL verification plus the live rollout itself on `2026-04-17`.

## Review Basis

Based on the live Tamil Nadu internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_329a8b74-2b9d-4c33-ba2f-46b19186935c`
- first live publication id: `publication_34aa96eb-f212-4cad-9412-086bfe3c41a6`
- replay run id: `run_c69af2d5-b2dd-455e-82aa-3a7125122d71`
- replay publication id: `publication_4965e74e-97de-47b2-b16e-eb2a2ccca25a`
- rollback publication id: `publication_43eefb27-a754-4590-91f1-0e38d9e40705`

Observed Tamil Nadu source notes:

- `stateCode=TN`
- `stateName=Tamil Nadu`
- `njdgStateValue=33~10`
- source page footer updated on `2026-04-16`
- 38 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `17,46,162`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Tamil Nadu exposes the same minimum state-level metric shape that the Himachal, Punjab, and Haryana flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Tamil Nadu is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Tamil Nadu already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Tamil Nadu routes continued to return `404`, which is the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Tamil Nadu pipeline inherits the same trust-critical metadata shape used for Himachal, Punjab, and Haryana:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Tamil Nadu candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Required Before Launch

### 1. Stable-URL Public Verification

Tamil Nadu was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/tamil-nadu`
- `/v1/states/tamil-nadu/...`
- `/states/tamil-nadu/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Haryana provided the pattern. Tamil Nadu did not need invention or repo-level public-surface work here, but it still needed the actual live-host verification pass before launch.

The verification artifacts for that pass now live in:

- `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md`
- targeted Tamil Nadu public-route parity coverage that exercises the intended `/states/tamil-nadu/...` and `/v1/states/tamil-nadu/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

At the time of this record, the product had moved beyond Himachal but did not yet claim all-India coverage. Tamil Nadu public exposure had to keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic all-India coverage language
- no silent widening of claims beyond the then-live states

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That gate is satisfied for Tamil Nadu because Assam, Uttarakhand, Rajasthan, Uttar Pradesh, and now Haryana public all provide the surrounding operating evidence. Tamil Nadu no longer needs more internal debate before public-route work can proceed.

## Outcome

Tamil Nadu should now be treated as a completed narrow public rollout.

The conditions below were satisfied before launch:

1. Tamil Nadu passes stable-URL UI/API/CSV verification on the live hostname
2. the preflight artifacts in `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md` are green on the integrated branch
3. public copy remains explicit about which states are live, without implying nationwide coverage

## Useful Work Completed By This Review

This review closes the open Tamil Nadu trust question in `TODOS.md`:

- source-shape review: done
- trust-surface review: done
- public recommendation: completed as a live Tamil Nadu rollout on `2026-04-17`
- remaining blockers moved off Tamil Nadu itself and onto the next public-state sequencing decision
