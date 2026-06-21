# Assam Public Readiness Review

Historical rollout note: this dated readiness record preserves the rollout scope and evidence available when it was written. The current public scope is India-first: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Use `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md` for current coverage.


Review of what Assam required before exposing the public Assam route family, now updated with the completed live rollout evidence.

This review closed the Assam go / no-go question at the trust-surface level before launch. The remaining work at that point was the actual live hostname rollout and stable-URL verification, which are now complete.

## Review Basis

Based on the live Assam internal proof cycle and later public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_32e2194a-027d-4ec2-8d50-b3c282446b90`
- first live publication id: `publication_688f053e-53a4-4662-9367-a4ffba4973ce`
- replay run id: `run_c28d9a91-0543-40b2-adac-1ca5e0c2e85d`
- replay publication id: `publication_c8e143f6-61f4-4c1b-9423-b49e53b17399`
- rollback publication id: `publication_e6fcc230-9de5-42ed-9e29-1ed0fc287b8f`
- public rollout fetch run id: `run_e0f10a98-5e60-445a-b080-b9dafc962f61`
- public rollout publication id: `publication_111cc225-f1a6-455d-8d7e-fd6af06ed597`
- public rollout snapshot id: `snapshot_f296e9bb-fc95-476e-9f79-1bcd3ff1f1c7`

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

## What This Review Required Before Launch

### 1. Stable-URL Public Verification

Assam is now wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we needed to verify:

- `/states/assam`
- `/v1/states/assam/...`
- `/states/assam/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Tamil Nadu provided the immediate pattern. Assam did not need invention or repo-level public-surface work beyond that parity pass; it only needed the actual live-host verification before launch.

The verification artifacts for that pass now live in:

- `docs/ASSAM_GO_LIVE_CHECKLIST.md`
- targeted Assam public-route parity coverage that exercises the intended `/states/assam/...` and `/v1/states/assam/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

At the time of this record, the product had moved beyond Himachal but did not yet claim all-India coverage. Assam public exposure had to keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic all-India coverage language
- no silent widening of claims beyond the then-live states

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That gate is satisfied for Assam because Uttarakhand, Rajasthan, Uttar Pradesh, Kerala, Meghalaya, Karnataka, Tripura, and Nagaland now provide surrounding operating evidence while Tamil Nadu already completed the previous public slot.

## Outcome

Assam completed the next approved narrow public rollout on 2026-04-17.

The live conditions that this review required are now satisfied:

1. Assam passed stable-URL UI/API/CSV verification on the live hostname
2. the preflight artifacts in `docs/ASSAM_GO_LIVE_CHECKLIST.md` are green
3. public copy remains explicit about which states are live, without implying nationwide coverage

## Useful Work Completed By This Review

This review closed the open Assam trust question in `TODOS.md`:

- source-shape review: done
- trust-surface review: done
- public recommendation: executed and live
- remaining blockers were cleared by the actual rollout window plus verification
