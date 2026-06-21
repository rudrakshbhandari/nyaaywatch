# Manipur Public Readiness Review

Historical rollout note: this dated readiness record preserves the rollout scope and evidence available when it was written. The current public scope is India-first: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Use `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md` for current coverage.


Review of what Manipur required before exposing the public Manipur route family.

Manipur had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Manipur no longer needed extractor invention or source-shape debate, but it still needed stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the completed public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- `stateCode=MN`
- `stateName=Manipur`
- `stateSlug=manipur`
- `njdgStateValue=14~25`
- public rollout fetch run id: `run_d8eee45f-ad4d-490e-b779-362a1737b2d6`
- public rollout publication id: `publication_0276261b-85da-4b6d-8fab-1d96a7aa3b02`
- public rollout snapshot id: `snapshot_6fe0c465-2714-4134-ad30-33ada9b559a5`
- rollback target retained from the prior internal proof cycle: `publication_29505d10-5434-4237-8b0d-89a9dfcf08cf`
- source snapshot date observed in the published snapshot: `2026-04-16`
- 9 districts exposed in the published snapshot
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Manipur exposes the same minimum state-level metric shape that the earlier public rollouts already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Manipur was not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Manipur had already cleared the operating bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the internal proof publication before the public launch

That is why the final question here was public-route discipline and stable-URL verification rather than pipeline viability.

### 3. Trust Metadata And Copy Posture

The Manipur pipeline inherits the same trust-critical metadata shape used for the public rollout chain:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Manipur candidate suggested we needed a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Required Before Launch

### 1. Stable-URL Public Verification

Manipur was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/manipur`
- `/v1/states/manipur/...`
- `/states/manipur/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

The Manipur-specific artifact for that pass is:

- `docs/MANIPUR_GO_LIVE_CHECKLIST.md`

### 2. Information Architecture Discipline

At the time of this record, the product was intentionally kept to explicit live geographies rather than presented as an all-India shell. Manipur public exposure needed to stay concrete through explicit state-scoped navigation, without widening public claims beyond the then-live states.

### 3. Expansion Risk Management

The operational system is good enough to qualify states in parallel. Public exposure still needed to lag stable-URL verification and a deliberate rollout slot.

That gate was satisfied for Manipur because Karnataka, Tripura, Nagaland, Andhra Pradesh, and Arunachal Pradesh were already live publicly, and the remaining supported states had already cleared the internal proof bar before this rollout window.

## Outcome

Manipur is now live on the public site as part of the completed all-supported-states rollout window on 2026-04-18.

The launch conditions that cleared were:

1. Manipur was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Manipur-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug manipur` succeeded on the stable hostname with `districtCount=9`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
4. rollout docs now record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review now closes the Manipur trust question at the launched-public-state level:

- source-shape review: done
- trust-surface review: done
- public rollout: completed
- remaining blockers: none for Manipur itself
