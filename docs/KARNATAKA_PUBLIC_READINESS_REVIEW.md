# Karnataka Public Readiness Review

Historical rollout note: this dated readiness record preserves the rollout scope and evidence available when it was written. The current public scope is India-first: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Use `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md` for current coverage.


Review of what Karnataka required before exposing the public Karnataka route family.

Karnataka had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Karnataka no longer needed extractor invention or source-shape debate, but it still needed stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the live Karnataka internal proof cycle and public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_c57e88aa-c6bf-40d8-a3fb-9343bd819174`
- first live publication id: `publication_54748fe1-5f7c-41d4-bc40-3c976d157f56`
- replay run id: `run_18f4c2a3-d811-496e-a277-d0d4574906c9`
- rollback publication id: `publication_30e8a0c5-9d15-4e9d-8f4b-ebf3143efb39`
- public rollout fetch run id: `run_79131eaf-bd31-4c4e-a95f-fc84b065a261`
- public rollout publication id: `publication_c58870a4-f378-4848-a8ce-ae38fb62f885`
- public rollout snapshot id: `snapshot_87bd1945-6b36-415f-965e-8c06cf60a989`

Observed Karnataka source notes:

- `stateCode=KA`
- `stateName=Karnataka`
- `stateSlug=karnataka`
- `njdgStateValue=29~3`
- source page footer updated on `2026-04-16`
- 31 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `22,30,354`
- instituted last month shown on the live state page: `1,99,126`
- disposed last month shown on the live state page: `2,87,712`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Karnataka exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, Tamil Nadu, Assam, Telangana, Kerala, and Meghalaya flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Karnataka is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Karnataka already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Karnataka routes still returned `404`, which was the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Karnataka pipeline inherits the same trust-critical metadata shape used for the existing public-state rollout path:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Karnataka candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

Karnataka was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/karnataka`
- `/v1/states/karnataka/...`
- `/states/karnataka/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Meghalaya provided the immediate rollout pattern. Karnataka did not need broader repo-level public-surface invention here, but it did need the actual state-scoped verification pass before launch.

The Karnataka-specific artifacts for that pass are:

- `docs/KARNATAKA_GO_LIVE_CHECKLIST.md`
- targeted Karnataka public-route parity coverage that exercises the intended `/states/karnataka/...` and `/v1/states/karnataka/...` surfaces under the approved public-state configuration

### 2. Information Architecture Discipline

At the time of this record, the product did not yet claim all-India coverage. Karnataka public exposure had to keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic all-India coverage language
- no silent widening of claims beyond the then-live states

### 3. Expansion Risk Management

The operational system is now good enough to qualify public-prep states in parallel. Public exposure should still lag stable-URL verification and a deliberate rollout slot.

That gate is satisfied for Karnataka because Haryana, Tamil Nadu, Assam, Telangana, Kerala, and Meghalaya are already live publicly, while Tripura, Nagaland, Andhra Pradesh, Arunachal Pradesh, Manipur, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, and Chhattisgarh provide surrounding operating evidence. Karnataka no longer needed more internal-proof debate before public-route work could proceed.

## Outcome

Karnataka is now live on the public site as the eighth additional public state.

The launch conditions that cleared were:

1. Karnataka was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Karnataka-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug karnataka` and a live HTML verification pass both succeeded on the stable hostname
4. rollout docs now record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review now closes the Karnataka trust question at the launched-public-state level:

- source-shape review: done
- trust-surface review: done
- public rollout: completed
- remaining blockers: none for Karnataka itself; the queue now advances to Tripura
