# Goa Public Readiness Review

Review of what Goa required before exposing the public Goa route family.

Goa had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Goa no longer needed extractor invention or source-shape debate, but it still needed stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the completed public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- `stateCode=GA`
- `stateName=Goa`
- `stateSlug=goa`
- `njdgStateValue=30~30`
- public rollout fetch run id: `run_f07af2ea-5cf4-4943-a602-bf673744c9e4`
- public rollout publication id: `publication_f55b59d8-e47a-4159-b166-ea89b8af29d4`
- public rollout snapshot id: `snapshot_7ba88b90-2d9a-4a68-9d98-b4aa026348a1`
- rollback target retained from the prior internal proof cycle: `publication_03355c7b-12b3-4d56-99ff-a88cffaf99fe`
- source snapshot date observed in the published snapshot: `2026-04-16`
- 2 districts exposed in the published snapshot
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Goa exposes the same minimum state-level metric shape that the earlier public rollouts already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Goa was not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Goa had already cleared the operating bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the internal proof publication before the public launch

That is why the final question here was public-route discipline and stable-URL verification rather than pipeline viability.

### 3. Trust Metadata And Copy Posture

The Goa pipeline inherits the same trust-critical metadata shape used for the public rollout chain:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Goa candidate suggested we needed a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Required Before Launch

### 1. Stable-URL Public Verification

Goa was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/goa`
- `/v1/states/goa/...`
- `/states/goa/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

The Goa-specific artifact for that pass is:

- `docs/GOA_GO_LIVE_CHECKLIST.md`

### 2. Information Architecture Discipline

The product is intentionally not a surprise nationwide shell. Goa public exposure needed to stay concrete through explicit state-scoped navigation, without widening public claims beyond the states actually live.

### 3. Expansion Risk Management

The operational system is good enough to qualify states in parallel. Public exposure still needed to lag stable-URL verification and a deliberate rollout slot.

That gate was satisfied for Goa because Gujarat, Odisha, West Bengal, Jharkhand, and Chhattisgarh were already live publicly, and the remaining supported states had already cleared the internal proof bar before this rollout window.

## Outcome

Goa is now live on the public site as part of the completed all-supported-states rollout window on 2026-04-18.

The launch conditions that cleared were:

1. Goa was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Goa-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug goa` succeeded on the stable hostname with `districtCount=2`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
4. rollout docs now record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review now closes the Goa trust question at the launched-public-state level:

- source-shape review: done
- trust-surface review: done
- public rollout: completed
- remaining blockers: none for Goa itself
