# Assam Public Readiness Review

Review of what we can already validate for Assam before exposing any public Assam route family.

This review closes the Assam go / no-go question at the trust-surface level. The remaining work after this review is the actual live hostname rollout and stable-URL verification, not more repo-level public-surface design.

## Review Basis

Based on the live Assam internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_32e2194a-027d-4ec2-8d50-b3c282446b90`
- first live publication id: `publication_688f053e-53a4-4662-9367-a4ffba4973ce`
- replay run id: `run_c28d9a91-0543-40b2-adac-1ca5e0c2e85d`
- replay publication id: `publication_c8e143f6-61f4-4c1b-9423-b49e53b17399`
- rollback publication id: `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f`

Observed Assam source notes:

- `stateCode=AS`
- `stateName=Assam`
- `njdgStateValue=18~6`
- source page footer updated on `2026-04-16`
- 34 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `5,81,244`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Assam exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, and Tamil Nadu flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Assam is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Assam already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Assam routes continued to return `404`, which is the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Assam pipeline inherits the same trust-critical metadata shape used for Himachal, Punjab, Haryana, and Tamil Nadu:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Assam candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

Assam is now wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still need to verify:

- `/states/assam`
- `/v1/states/assam/...`
- `/states/assam/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Tamil Nadu provides the immediate pattern. Assam does not need invention or repo-level public-surface work beyond that parity pass, but it still needs the actual live-host verification before launch.

The verification artifacts for that pass now live in:

- `docs/ASSAM_GO_LIVE_CHECKLIST.md`
- targeted Assam public-route parity coverage that exercises the intended `/states/assam/...` and `/v1/states/assam/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

The product is no longer Himachal-only, but it is still intentionally not nationwide. Assam public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That gate is satisfied for Assam because Uttarakhand, Rajasthan, Uttar Pradesh, Kerala, and Meghalaya now provide surrounding operating evidence while Tamil Nadu has already completed the previous public slot.

## Outcome

Assam should now be treated as the next approved narrow public rollout candidate.

The conditions below still need to be satisfied on the live hostname before launch:

1. Assam passes stable-URL UI/API/CSV verification on the live hostname
2. the preflight artifacts in `docs/ASSAM_GO_LIVE_CHECKLIST.md` are green on the integrated branch
3. public copy remains explicit about which states are live, without implying nationwide coverage

## Useful Work Completed By This Review

This review closes the open Assam trust question in `TODOS.md`:

- source-shape review: done
- trust-surface review: done
- public recommendation: approved as the next public rollout candidate pending live execution
- remaining blockers moved off Assam design itself and onto the actual rollout window plus verification
