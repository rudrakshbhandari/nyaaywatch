# Tamil Nadu Public Readiness Review

Review of what we can already validate for Tamil Nadu before exposing any public Tamil Nadu route family.

This review closes the Tamil Nadu go / no-go question at the trust-surface level. Tamil Nadu is now viable as the next narrow public rollout candidate after Haryana, and the remaining work is Tamil Nadu public-route parity, stable-URL verification, and the live rollout itself.

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

## What Still Needs Explicit Public Work

### 1. Public Surface Implementation And Parity

Tamil Nadu is still dark on the public site. Before any launch we still need to verify:

- `/states/tamil-nadu`
- `/v1/states/tamil-nadu/...`
- `/states/tamil-nadu/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Haryana now provides the pattern. Tamil Nadu does not need invention here, but it still needs the actual public verification pass.

The verification artifacts for that pass should now live in:

- `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md`
- targeted Tamil Nadu public-route parity coverage that exercises the intended `/states/tamil-nadu/...` and `/v1/states/tamil-nadu/...` surfaces under a test-only public-state promotion

### 2. Information Architecture Discipline

The product is no longer Himachal-only, but it is still intentionally not nationwide. Tamil Nadu public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That gate is satisfied for Tamil Nadu because Assam, Uttarakhand, Rajasthan, Uttar Pradesh, and now Haryana public all provide the surrounding operating evidence. Tamil Nadu no longer needs more internal debate before public-route work can proceed.

## Recommendation

Tamil Nadu should be treated as the next narrow public rollout candidate.

It should move forward once the conditions below are true:

1. Tamil Nadu public routes are implemented and pass stable-URL UI/API/CSV parity verification
2. the preflight artifacts in `docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md` are green on the integrated branch
3. public copy remains explicit about which states are live, without implying nationwide coverage

## Useful Work Completed By This Review

This review closes the open Tamil Nadu trust question in `TODOS.md`:

- source-shape review: done
- trust-surface review: done
- public recommendation: Tamil Nadu is the next public candidate
- remaining blockers reduced to:
  - Tamil Nadu public-route implementation and parity verification
  - live release evidence on the public hostname
