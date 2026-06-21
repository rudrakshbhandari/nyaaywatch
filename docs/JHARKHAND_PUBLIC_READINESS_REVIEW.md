# Jharkhand Public Readiness Review

Historical rollout note: this dated readiness record preserves the rollout scope and evidence available when it was written. The current public scope is India-first: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Use `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md` for current coverage.


Review of what Jharkhand required before exposing the public Jharkhand route family.

Jharkhand had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Jharkhand no longer needed extractor invention or source-shape debate, but it still needed stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the completed public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- `stateCode=JH`
- `stateName=Jharkhand`
- `stateSlug=jharkhand`
- `njdgStateValue=20~7`
- public rollout fetch run id: `run_a64b3f23-836b-4f4e-b7e6-7693d035283e`
- public rollout publication id: `publication_5c30543e-2094-4616-aff3-b17ade4254a2`
- public rollout snapshot id: `snapshot_582d5802-ca16-47db-bb48-5662f8666c01`
- rollback target retained from the prior internal proof cycle: `publication_12683d90-942c-4050-b5f7-7ccca8932b07`
- source snapshot date observed in the published snapshot: `2026-04-16`
- 24 districts exposed in the published snapshot
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Jharkhand exposes the same minimum state-level metric shape that the earlier public rollouts already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Jharkhand was not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Jharkhand had already cleared the operating bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the internal proof publication before the public launch

That is why the final question here was public-route discipline and stable-URL verification rather than pipeline viability.

### 3. Trust Metadata And Copy Posture

The Jharkhand pipeline inherits the same trust-critical metadata shape used for the public rollout chain:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Jharkhand candidate suggested we needed a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Required Before Launch

### 1. Stable-URL Public Verification

Jharkhand was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/jharkhand`
- `/v1/states/jharkhand/...`
- `/states/jharkhand/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

The Jharkhand-specific artifact for that pass is:

- `docs/JHARKHAND_GO_LIVE_CHECKLIST.md`

### 2. Information Architecture Discipline

At the time of this record, the product was intentionally kept to explicit live geographies rather than presented as an all-India shell. Jharkhand public exposure needed to stay concrete through explicit state-scoped navigation, without widening public claims beyond the then-live states.

### 3. Expansion Risk Management

The operational system is good enough to qualify states in parallel. Public exposure still needed to lag stable-URL verification and a deliberate rollout slot.

That gate was satisfied for Jharkhand because Maharashtra, Bihar, Gujarat, Odisha, and West Bengal were already live publicly, and the remaining supported states had already cleared the internal proof bar before this rollout window.

## Outcome

Jharkhand is now live on the public site as part of the completed all-supported-states rollout window on 2026-04-18.

The launch conditions that cleared were:

1. Jharkhand was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Jharkhand-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug jharkhand` succeeded on the stable hostname with `districtCount=24`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
4. rollout docs now record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review now closes the Jharkhand trust question at the launched-public-state level:

- source-shape review: done
- trust-surface review: done
- public rollout: completed
- remaining blockers: none for Jharkhand itself
