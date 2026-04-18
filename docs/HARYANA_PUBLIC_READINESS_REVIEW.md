# Haryana Public Readiness Review

Review of the Haryana public go / no-go question and the resulting live rollout.

This review is now closed in favor of the live result. Haryana cleared the trust-surface gates, passed public-route parity, and went live on `https://nyaaywatch.in/states/haryana` on `2026-04-17`. The current remaining work is no longer Haryana readiness; it is keeping later public expansion narrower than the larger internal-only state set.

## Review Basis

Based on the live Haryana internal proof cycle plus the public rollout recorded in `docs/EXPANSION_REVIEW_LOG.md`:

- first live fetch run id: `run_171cccad-9fef-47cb-9cc1-c1ae4449fe4e`
- first live publication id: `publication_0d8a736d-1c27-4ae3-8cba-c0593057e3d2`
- replay run id: `run_76e23910-ffd8-4dcc-a3be-3eda0b130356`
- replay publication id: `publication_cc7b1068-b97e-470a-a079-570cad23061f`
- rollback publication id: `publication_09613d9d-ae89-4543-9028-8f5d971df587`
- public rollout fetch run id: `run_bf1fd888-173c-4a58-9dde-f797b92f7c30`
- public rollout publication id: `publication_e57d5546-e9aa-4bee-a951-edeb2bc4789c`
- public rollout snapshot id: `snapshot_68b8cf79-ee86-4644-a876-8222e2bce71a`

Observed Haryana source notes:

- `stateCode=HR`
- `stateName=Haryana`
- `njdgStateValue=6~14`
- source page footer updated on `2026-04-16`
- 22 districts exposed on the live NJDG state page
- statewide pending cases shown on the live state page: `15,09,969`
- methodology version for the current published pipeline: `2026.04-alpha`

## What Already Looks Good

### 1. Source Shape Parity

Haryana exposes the same minimum state-level metric shape that the Himachal and Punjab flows already normalize:

- civil, criminal, and total pending counts
- instituted and disposed counts for the last month
- all five age-bucket groupings
- district-level drilldown labels on the state page

That means Haryana is not blocked on a new extractor class, a new metric family, or a one-off source exception.

### 2. Live Operating Evidence

Haryana already cleared the operational bar that matters most before public exposure:

- live fetch succeeded
- live publish succeeded
- replay from stored evidence succeeded
- rollback restored the original publication

This happened on the production stack while the public Haryana routes continued to return `404`, which is the right safety posture for an internal-only trial.

### 3. Trust Metadata And Copy Posture

The Haryana pipeline inherits the same trust-critical metadata shape used for Himachal and Punjab:

- source snapshot date
- publication date
- methodology version
- source attribution
- run and publication lineage

Nothing observed in the Haryana candidate suggests we need a looser trust standard or a different copy posture to expose it narrowly.

## What Moved In The Live Rollout

### 1. Public Surface Implementation And Parity Cleared

Haryana is no longer dark on the public site. The explicit Haryana route family is now live and verified:

- `/states/haryana`
- `/v1/states/haryana/...`
- `/states/haryana/data/districts.csv`
- UI, API, and CSV metadata parity on the stable public URLs

`npm run release:verify -- --base-url https://nyaaywatch.in --state-slug haryana` passed on `2026-04-17` with `districtCount=22`, `trendCount=1`, `csvMetadataParity=true`, and `publicDataCacheProtected=true`. The live browser check also confirmed the expected trust metadata and explicit Haryana navigation on the stable hostname.

### 2. Information Architecture Discipline Held

The product is no longer Himachal-only, but it is still intentionally not nationwide. Haryana stayed within the narrow explicit posture:

- explicit state-scoped navigation
- no generic national coverage language
- no silent widening of claims beyond the states actually live

### 3. Expansion Risk Management Still Matters

The operational system is now good enough to qualify internal states in parallel, and this rollout did not require widening the public IA to match that larger internal set.

That earlier expansion-risk gate was cleared before go-live by the Uttarakhand, Rajasthan, and Uttar Pradesh proof cycles. After Haryana went live, Tamil Nadu and Assam also completed the same internal-only `fetch -> inspect -> publish -> replay -> rollback` bar, which means public expansion should keep lagging internal qualification rather than trying to match it one-for-one.

## Recommendation

Haryana should now be treated as a completed narrow public rollout, not a candidate.

The remaining discipline point is repository truthfulness, not Haryana launch readiness:

1. keep Haryana documented as a completed public rollout
2. preserve the explicit state-scoped IA and trust posture instead of implying national parity
3. treat later state decisions as separate rollout history rather than future Haryana work

## Useful Work Completed By This Review

This review now closes the Haryana trust and rollout question in `TODOS.md`:

- source-shape review: done
- trust-surface review: done
- public recommendation: completed as a live Haryana rollout on `2026-04-17`
- remaining blockers moved off Haryana itself and onto future public-state sequencing discipline
