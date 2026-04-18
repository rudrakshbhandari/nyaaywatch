# Rajasthan Public Readiness Review

Review of what Rajasthan required before exposing the public Rajasthan route family.

Rajasthan had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Rajasthan no longer needed extractor invention or source-shape debate, but it still needed stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the completed public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- `stateCode=RJ`
- `stateName=Rajasthan`
- `stateSlug=rajasthan`
- `njdgStateValue=8~9`
- public rollout fetch run id: `run_692dc19a-c8a9-4061-a22b-2f0631475baa`
- public rollout publication id: `publication_fe0f7c25-a719-4120-bab4-8427163cd311`
- public rollout snapshot id: `snapshot_eede344a-7518-48ec-b5f0-adbadddd5805`
- rollback target retained from the prior internal proof cycle: `publication_90655c18-6088-44b7-9740-b4546a62242b`
- source snapshot date observed in the published snapshot: `2026-04-16`
- 44 districts exposed in the published snapshot
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Rajasthan exposes the same minimum state-level metric shape that the earlier public rollouts already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Rajasthan was not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Rajasthan had already cleared the operating bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the internal proof publication before the public launch

That is why the final question here was public-route discipline and stable-URL verification rather than pipeline viability.

### 3. Trust Metadata And Copy Posture

The Rajasthan pipeline inherits the same trust-critical metadata shape used for the public rollout chain:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Rajasthan candidate suggested we needed a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Required Before Launch

### 1. Stable-URL Public Verification

Rajasthan was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/rajasthan`
- `/v1/states/rajasthan/...`
- `/states/rajasthan/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

The Rajasthan-specific artifact for that pass is:

- `docs/RAJASTHAN_GO_LIVE_CHECKLIST.md`

### 2. Information Architecture Discipline

The product is intentionally not a surprise nationwide shell. Rajasthan public exposure needed to stay concrete through explicit state-scoped navigation, without widening public claims beyond the states actually live.

### 3. Expansion Risk Management

The operational system is good enough to qualify states in parallel. Public exposure still needed to lag stable-URL verification and a deliberate rollout slot.

That gate was satisfied for Rajasthan because Nagaland, Andhra Pradesh, Arunachal Pradesh, Manipur, and Uttarakhand were already live publicly, and the remaining supported states had already cleared the internal proof bar before this rollout window.

## Outcome

Rajasthan is now live on the public site as part of the completed all-supported-states rollout window on 2026-04-18.

The launch conditions that cleared were:

1. Rajasthan was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Rajasthan-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug rajasthan` succeeded on the stable hostname with `districtCount=44`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
4. rollout docs now record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review now closes the Rajasthan trust question at the launched-public-state level:

- source-shape review: done
- trust-surface review: done
- public rollout: completed
- remaining blockers: none for Rajasthan itself
