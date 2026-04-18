# Chhattisgarh Public Readiness Review

Review of what Chhattisgarh required before exposing the public Chhattisgarh route family.

Chhattisgarh had already cleared the internal proof bar on the live stack before launch. This review records why the remaining public question was narrow: Chhattisgarh no longer needed extractor invention or source-shape debate, but it still needed stable-URL verification and a deliberate public rollout before exposure on the live hostname.

## Review Basis

Based on the completed public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- `stateCode=CG`
- `stateName=Chhattisgarh`
- `stateSlug=chhattisgarh`
- `njdgStateValue=22~18`
- public rollout fetch run id: `run_6fe389aa-d51c-48b4-9bfd-a5186a41f21d`
- public rollout publication id: `publication_2400d34a-2320-483e-866d-f529b4b81172`
- public rollout snapshot id: `snapshot_ef3bc9f9-4aaa-4d9a-92cd-c4bcf34e1310`
- rollback target retained from the prior internal proof cycle: `publication_412a4d67-73fe-4bdd-b149-24c05cbaf973`
- source snapshot date observed in the published snapshot: `2026-04-18`
- 25 districts exposed in the published snapshot
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Chhattisgarh exposes the same minimum state-level metric shape that the earlier public rollouts already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Chhattisgarh was not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Chhattisgarh had already cleared the operating bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the internal proof publication before the public launch

That is why the final question here was public-route discipline and stable-URL verification rather than pipeline viability.

### 3. Trust Metadata And Copy Posture

The Chhattisgarh pipeline inherits the same trust-critical metadata shape used for the public rollout chain:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Chhattisgarh candidate suggested we needed a looser trust standard or a different copy posture to expose it narrowly.

## What This Review Required Before Launch

### 1. Stable-URL Public Verification

Chhattisgarh was wired into the approved public-state set in repo config with dedicated preflight coverage for the explicit state-scoped route family. Before launch on the live hostname we still needed to verify:

- `/states/chhattisgarh`
- `/v1/states/chhattisgarh/...`
- `/states/chhattisgarh/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

The Chhattisgarh-specific artifact for that pass is:

- `docs/CHHATTISGARH_GO_LIVE_CHECKLIST.md`

### 2. Information Architecture Discipline

The product is intentionally not a surprise nationwide shell. Chhattisgarh public exposure needed to stay concrete through explicit state-scoped navigation, without widening public claims beyond the states actually live.

### 3. Expansion Risk Management

The operational system is good enough to qualify states in parallel. Public exposure still needed to lag stable-URL verification and a deliberate rollout slot.

That gate was satisfied for Chhattisgarh because Bihar, Gujarat, Odisha, West Bengal, and Jharkhand were already live publicly, and the remaining supported states had already cleared the internal proof bar before this rollout window.

## Outcome

Chhattisgarh is now live on the public site as part of the completed all-supported-states rollout window on 2026-04-18.

The launch conditions that cleared were:

1. Chhattisgarh was deliberately promoted into the approved public-state set rather than exposed by implication
2. the Chhattisgarh-specific public-route parity artifacts went green under that configuration
3. `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug chhattisgarh` succeeded on the stable hostname with `districtCount=25`, `trendCount=2`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`
4. rollout docs now record the actual public publication lineage after launch

## Useful Work Completed By This Review

This review now closes the Chhattisgarh trust question at the launched-public-state level:

- source-shape review: done
- trust-surface review: done
- public rollout: completed
- remaining blockers: none for Chhattisgarh itself
