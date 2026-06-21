# Kerala Public Readiness Review

Historical rollout note: this dated readiness record preserves the rollout scope and evidence available when it was written. The current public scope is India-first: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Use `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md` for current coverage.


Review of what Kerala required before exposing the public Kerala route family.

Kerala had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Kerala no longer needed extractor invention or source-shape debate, but it still needed explicit public-route parity, stable-URL verification, and a deliberate rollout decision before public exposure.

## Review Basis

Based on the live Kerala internal proof cycle and public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_60fc22fb-a2b2-41e5-9bf5-f01b6e7b39e3`
- first live publication id: `publication_4f53dbb3-7530-40ca-aeed-3a27bbd5b892`
- replay run id: `run_84af7110-13b1-4150-8be6-cc82e83a36c3`
- replay publication id: `publication_ddd7c94d-d4c9-4cad-8da9-13ef1d0b8ba1`
- rollback publication id: `publication_dafbab89-af38-4a41-a006-9153f126e785`
- public rollout fetch run id: `run_e4ce54db-1dd6-473e-8ea6-318856c3f1f5`
- public rollout publication id: `publication_4fff0bca-7b58-49d1-992d-a113c43f577a`
- public rollout snapshot id: `snapshot_99d7ad98-ff3c-40e2-9922-e4661998e839`

Observed Kerala source notes:

- `stateCode=KL`
- `stateName=Kerala`
- `stateSlug=kerala`
- `njdgStateValue=32~4`
- source page footer updated on `2026-04-16`
- 14 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `18,01,417`
- instituted last month shown on the live state page: `57,299`
- disposed last month shown on the live state page: `77,311`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Kerala exposes the same minimum state-level metric shape that the Himachal, Punjab, Haryana, Tamil Nadu, Assam, and Telangana flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Kerala is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Kerala already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Kerala routes continued to return `404`, which is the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Kerala pipeline inherits the same trust-critical metadata shape used for the existing live public states:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Kerala candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Requires Before Launch

### 1. Stable-URL Public Verification

The final launch verification needed confirmation on:

- `/states/kerala`
- `/v1/states/kerala/...`
- `/states/kerala/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Telangana provided the immediate rollout pattern. Kerala did not need broader repo-level public-surface invention here, but it did need the actual state-scoped verification pass before launch.

The Kerala-specific artifacts for that pass were:

- `docs/KERALA_GO_LIVE_CHECKLIST.md`
- targeted Kerala public-route parity coverage that exercises the intended `/states/kerala/...` and `/v1/states/kerala/...` surfaces once Kerala is deliberately promoted into the public-state set

### 2. Information Architecture Discipline

At the time of this record, the product did not yet claim all-India coverage. Kerala public exposure had to keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic all-India coverage language
- no silent widening of claims beyond the then-live states

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That gate is satisfied for Kerala because Haryana, Tamil Nadu, Assam, and Telangana are already live publicly, while Meghalaya, Karnataka, Tripura, Nagaland, Andhra Pradesh, Arunachal Pradesh, Manipur, Madhya Pradesh, Maharashtra, Bihar, and Gujarat provide surrounding internal-only operating evidence. Kerala no longer needs more internal-proof debate before public-route work can proceed.

## Outcome

Kerala is now live on the public site as the sixth additional public state.

The launch conditions that cleared were:

1. Kerala was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Kerala-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug kerala` and a live HTML verification pass both succeeded on the stable hostname
4. rollout docs now record the actual public publication lineage after launch
