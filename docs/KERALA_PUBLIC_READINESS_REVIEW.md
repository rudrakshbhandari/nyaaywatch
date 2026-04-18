# Kerala Public Readiness Review

Review of what Kerala now requires before exposing any public Kerala route family.

Kerala has already cleared the internal proof bar on the live stack. This review records why the remaining public question is narrow: Kerala no longer needs extractor invention or source-shape debate, but it still needs explicit public-route parity, stable-URL verification, and a deliberate rollout decision before any public exposure.

## Review Basis

Based on the live Kerala internal proof cycle recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_60fc22fb-a2b2-41e5-9bf5-f01b6e7b39e3`
- first live publication id: `publication_4f53dbb3-7530-40ca-aeed-3a27bbd5b892`
- replay run id: `run_84af7110-13b1-4150-8be6-cc82e83a36c3`
- replay publication id: `publication_ddd7c94d-d4c9-4cad-8da9-13ef1d0b8ba1`
- rollback publication id: `publication_dafbab89-af38-4a41-a006-9153f126e785`

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

Once Kerala is promoted into the approved public-state set in repo config, the live hostname still needs verification on:

- `/states/kerala`
- `/v1/states/kerala/...`
- `/states/kerala/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

Telangana now provides the immediate rollout pattern. Kerala does not need broader repo-level public-surface invention here, but it still needs the actual state-scoped verification pass before launch.

The Kerala-specific artifacts for that pass are:

- `docs/KERALA_GO_LIVE_CHECKLIST.md`
- targeted Kerala public-route parity coverage that exercises the intended `/states/kerala/...` and `/v1/states/kerala/...` surfaces once Kerala is deliberately promoted into the public-state set

### 2. Information Architecture Discipline

The product is intentionally not nationwide. Kerala public exposure should keep that narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management

The operational system is now good enough to qualify internal states in parallel. Public exposure should still lag internal qualification.

That gate is satisfied for Kerala because Haryana, Tamil Nadu, Assam, and Telangana are already live publicly, while Meghalaya, Karnataka, Tripura, Nagaland, Andhra Pradesh, Arunachal Pradesh, Manipur, Madhya Pradesh, Maharashtra, Bihar, and Gujarat provide surrounding internal-only operating evidence. Kerala no longer needs more internal-proof debate before public-route work can proceed.

## Outcome

Kerala should now be treated as a viable next narrow public candidate, not as a state that still needs basic source or operator validation.

Before launch, the remaining conditions are:

1. Kerala is deliberately promoted into the approved public-state set rather than exposed by implication
2. the Kerala-specific public-route parity artifacts are green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug kerala` and a live browser pass both succeed on the stable hostname
4. rollout docs record the actual public publication lineage after launch
