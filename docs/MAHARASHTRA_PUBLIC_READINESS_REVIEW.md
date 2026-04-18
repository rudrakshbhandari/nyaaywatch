# Maharashtra Public Readiness Review

Review of what Maharashtra required before exposing the public Maharashtra route family.

Maharashtra had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Maharashtra no longer needed extractor invention or source-shape debate, but it still needed stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the completed public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- `stateCode=MH`
- `stateName=Maharashtra`
- `stateSlug=maharashtra`
- `njdgStateValue=27~1`
- public rollout fetch run id: `run_1e58aef7-5966-4ce2-b24c-ebdd6e8fcb6c`
- public rollout publication id: `publication_7a82419f-059a-456c-8797-bb33dbf5ab89`
- public rollout snapshot id: `snapshot_fc9ed37f-a226-4abe-98e7-ed2e2d025be3`
- rollback target retained from the prior internal proof cycle: `publication_f000da6a-79d1-4683-8acf-2a1b235611b4`
- source snapshot date observed in the published snapshot: `2026-04-16`
- 42 districts exposed in the published snapshot
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Maharashtra exposes the same minimum state-level metric shape that the earlier public rollouts already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Maharashtra was not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Maharashtra had already cleared the operating bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the internal proof publication before the public launch

That is why the final question here was public-route discipline and stable-URL verification rather than pipeline viability.

### 3. Trust Metadata And Copy Posture

The Maharashtra pipeline inherits the same trust-critical metadata shape used for the public rollout chain:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Maharashtra candidate suggested we needed a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Required Before Launch

### 1. Stable-URL Public Verification

Maharashtra was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/maharashtra`
- `/v1/states/maharashtra/...`
- `/states/maharashtra/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

The Maharashtra-specific artifact for that pass is:

- `docs/MAHARASHTRA_GO_LIVE_CHECKLIST.md`

### 2. Information Architecture Discipline

The product is intentionally not a surprise nationwide shell. Maharashtra public exposure needed to stay concrete through explicit state-scoped navigation, without widening public claims beyond the states actually live.

### 3. Expansion Risk Management

The operational system is good enough to qualify states in parallel. Public exposure still needed to lag stable-URL verification and a deliberate rollout slot.

That gate was satisfied for Maharashtra because Manipur, Uttarakhand, Rajasthan, Uttar Pradesh, and Madhya Pradesh were already live publicly, and the remaining supported states had already cleared the internal proof bar before this rollout window.

## Outcome

Maharashtra is now live on the public site as part of the completed all-supported-states rollout window on 2026-04-18.

The launch conditions that cleared were:

1. Maharashtra was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Maharashtra-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug maharashtra` succeeded on the stable hostname with `districtCount=42`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
4. rollout docs now record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review now closes the Maharashtra trust question at the launched-public-state level:

- source-shape review: done
- trust-surface review: done
- public rollout: completed
- remaining blockers: none for Maharashtra itself
