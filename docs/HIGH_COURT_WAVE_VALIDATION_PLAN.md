# High Court Wave Validation Plan

Concrete next-step plan after the internal multi-High-Court setup landed.

This document answers one narrow question:

- which courts should be validated next in live operator cycles, and how should that validation happen?

## Recommendation

Do **not** try to validate the whole internal High Court wave at once.

The first validation pair was:

- Uttar Pradesh via Allahabad High Court
- Rajasthan via High Court of Rajasthan

That pair has now cleared both the internal proof bar and the public rollout bar.

The second validation pair was:

- Gujarat
- Madhya Pradesh

That pair has now also cleared both the internal proof bar and the public rollout bar.

The third validation pair was:

- Chhattisgarh
- Jharkhand

That pair has now also cleared the internal proof bar on the live operator lane.

The fourth validation pair was:

- Karnataka
- Odisha

That pair has now also cleared the internal proof bar on the live operator lane.

The fifth validation pair was:

- Bihar
- Uttarakhand

That pair has now also cleared the internal proof bar on the live operator lane.

Validate this pair next:

- Sikkim
- Tripura

This is a product and operations recommendation from current repo state, not an official source fact.

## Why This Pair

These two courts are the best next internal validation pair because they are:

- already inside the new single-jurisdiction High Court registry
- already aligned with supported lower-court state profiles
- still internal-only instead of already public beta
- already backed by live lower-court public state profiles, so the High Court trial does not need new geography scaffolding
- meaningfully wider than the smallest remaining queued courts without forcing the repo into multi-jurisdiction logic
- materially meaningful without jumping straight to multi-jurisdiction courts
- still simple enough to fit the current one-state-per-High-Court snapshot contract

The point of this pair is not representativeness theater.

The point is to widen evidence for the next deliberate public-wave decision on:

- a smaller hill-state court that pressures the same operator flow with a compact pending docket and the narrowest remaining single-state footprint: Sikkim
- a north-east court that broadens internal proof without forcing multi-jurisdiction High Court logic: Tripura

If both hold up, the repo will have much better evidence that the next High Court wave can keep widening responsibly across smaller queued courts and north-east coverage without skipping straight to the multi-jurisdiction court problem.

## Validation Command

Use the batch readiness sweep:

```bash
npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=karnataka,odisha
```

Requires:

- `OPERATOR_API_TOKEN` in the environment

For the newly recommended pair, use:

```bash
npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=sikkim,tripura
```

The batch command reuses the existing High Court readiness verifier for each selected court and returns:

- per-court operator auth verification
- current active published snapshot state
- replay evidence
- rollback evidence
- explicit High Court reference-date posture
- aggregate ready / not-ready totals across the selected set

## Current Live Evidence

Latest recorded live check against `https://nyaaywatch.in` on **April 19, 2026**:

- `npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=uttar-pradesh,rajasthan`
- result: both courts were present on the live internal operator namespace, but both still had `runCount=0`, `publicationCount=0`, and no replay or rollback evidence

First live fetch attempt on the same date:

- Uttar Pradesh: `POST /operator/high-courts/uttar-pradesh/runs/fetch` returned `500 {"error":"Could not extract disposal in last month values from High Court HTML."}`
- Rajasthan: `POST /operator/high-courts/rajasthan/runs/fetch` returned the same `500` error

Root cause from the official HC NJDG HTML:

- the `Disposal in last month` row for both courts includes malformed markup in the criminal column, with the visible numeric value rendered without a closing `</a>`
- the original extractor assumed well-formed anchors and therefore missed the third numeric cell when parsing live HTML

Repo state after that finding:

- the extractor is now hardened to parse metric row values from cell text instead of requiring perfectly closed anchors
- regression coverage now includes this malformed-markup shape
- a local live-source parse check now succeeds for both Uttar Pradesh and Rajasthan

Follow-up live check on the same date after deploy and rerun:

- `npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=uttar-pradesh,rajasthan`
- result: `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, `rollbackReadyCourts=2`

Live operator proof-cycle evidence now recorded:

- Uttar Pradesh:
  - active publication `publication_91726f20-da84-4401-9da0-18c5ad711694`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`
- Rajasthan:
  - active publication `publication_40ac60e4-bb28-4628-b83d-2380d9dcf01f`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`

Current conclusion from live evidence:

- the recommended Uttar Pradesh and Rajasthan pair has now cleared the internal High Court proof bar
- Supreme Court is already the live public top-down shell
- Uttar Pradesh and Rajasthan were the correct next public High Court wave after Himachal

Follow-up live check after PR `#113` merged and deploy run `24636212237` settled the live service on task definition `:101`:

- the public `/high-courts` index returned `200`
- `/high-courts/uttar-pradesh`, `/high-courts/uttar-pradesh/data`, `/high-courts/uttar-pradesh/methodology`, `/high-courts/uttar-pradesh/api`, `/v1/high-courts/uttar-pradesh/stats`, and `/v1/high-courts/uttar-pradesh/trends` all returned `200`
- `/high-courts/rajasthan`, `/high-courts/rajasthan/data`, `/high-courts/rajasthan/methodology`, `/high-courts/rajasthan/api`, `/v1/high-courts/rajasthan/stats`, and `/v1/high-courts/rajasthan/trends` all returned `200`
- live operator publication history showed Uttar Pradesh active on `publication_91726f20-da84-4401-9da0-18c5ad711694` and Rajasthan active on `publication_40ac60e4-bb28-4628-b83d-2380d9dcf01f`
- the public High Court beta set is now Himachal, Uttar Pradesh, and Rajasthan

Follow-up live check after PR `#115` merged and deploy run `24637168455` settled the live service on task definition `:103`:

- the public `/high-courts` index still returned `200`
- `/high-courts/gujarat`, `/high-courts/gujarat/data`, `/high-courts/gujarat/methodology`, `/high-courts/gujarat/api`, `/v1/high-courts/gujarat/stats`, and `/v1/high-courts/gujarat/trends` all returned `200`
- `/high-courts/madhya-pradesh`, `/high-courts/madhya-pradesh/data`, `/high-courts/madhya-pradesh/methodology`, `/high-courts/madhya-pradesh/api`, `/v1/high-courts/madhya-pradesh/stats`, and `/v1/high-courts/madhya-pradesh/trends` all returned `200`
- live operator publication history showed Gujarat active on `publication_33428d3e-cc95-4c3c-9ace-643528cfb4a7` and Madhya Pradesh active on `publication_ff8a3e1c-c515-4bd3-a141-0ec3825f76b4`
- the public High Court beta set is now Himachal, Gujarat, Madhya Pradesh, Uttar Pradesh, and Rajasthan

Current repo posture after later High Court launches:

- Andhra Pradesh and Telangana are also now live inside the public High Court beta set
- the seven-court public High Court beta is now Himachal, Andhra Pradesh, Telangana, Gujarat, Madhya Pradesh, Uttar Pradesh, and Rajasthan
- the next decision is no longer "which already-proven court should go live next"
- the next decision is which still-queued single-jurisdiction court pair should become the next deliberate internal proof step after the current seven-court beta

Follow-up live check on **April 20, 2026** for the then-recommended Chhattisgarh and Jharkhand pair:

- `npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=chhattisgarh,jharkhand`
- result: `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, `rollbackReadyCourts=2`

Live operator proof-cycle evidence now recorded:

- Chhattisgarh:
  - active publication `publication_65890e9d-5cdd-451b-81c6-408d809cf55e`
  - active snapshot `snapshot_ba109b3b-cf7d-44eb-a448-d8d1baae5acc`
  - first fetch run `run_4131351e-cab9-45e9-b77f-dd2c70ce132d`
  - replay run `run_41fbbcb6-afc5-49b8-bfba-0ebba2603667`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`
- Jharkhand:
  - active publication `publication_8108ed78-c812-4302-8e6d-8c2d4dbba6d3`
  - active snapshot `snapshot_a091da10-6bb2-4185-b2bd-72b709dc7d85`
  - first fetch run `run_6bbadf6b-adfa-4680-bcb6-151a5c549ec8`
  - replay run `run_fd46f10b-63ef-472b-91d9-6c454b33d82f`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`

Current conclusion from live evidence:

- Chhattisgarh and Jharkhand have now both cleared the internal High Court proof bar
- the next remaining question is not whether the internal operator path works for queued single-jurisdiction courts
- the next remaining question is which queued pair should follow them before any additional public-beta decision

Follow-up live check on **April 20, 2026** for the then-recommended Karnataka and Odisha pair:

- `npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=karnataka,odisha`
- result: `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, `rollbackReadyCourts=2`

Live operator proof-cycle evidence now recorded:

- Karnataka:
  - active publication `publication_ae7cbffd-d539-4589-b8eb-f8ec0b7a71c0`
  - active snapshot `snapshot_d991bdf4-30aa-4463-bdf5-99f69e08ad24`
  - first fetch run `run_5635ab49-9db5-4053-8460-f8179d2f0f3f`
  - replay run `run_ea1ae5aa-92e7-4aa8-acac-11ccace981fb`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`
- Odisha:
  - active publication `publication_3f31d745-0a9c-40c5-955d-f69bb4fbcff6`
  - active snapshot `snapshot_76d48cd4-b40c-4520-8da1-3294fa0e20d9`
  - first fetch run `run_31acfb87-0cff-4aa0-a2ca-c177b6830223`
  - replay run `run_b5b746a2-c827-4e35-b356-deffa2367705`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`

Current conclusion from live evidence:

- Karnataka and Odisha have now both cleared the internal High Court proof bar
- the next remaining question is not whether the live operator path works for larger queued single-jurisdiction courts
- the next remaining question is which still-queued pair should follow them before any additional public-beta decision

Follow-up live check on **April 20, 2026** for the then-recommended Bihar and Uttarakhand pair:

- `npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=bihar,uttarakhand`
- result: `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, `rollbackReadyCourts=2`

Live operator proof-cycle evidence now recorded:

- Bihar:
  - active publication `publication_f5df6afc-42ee-4aed-9ee9-480141a9d64e`
  - active snapshot `snapshot_bf163712-e0a6-4e67-aeb0-35c92cdb11bd`
  - first fetch run `run_b0e15789-7d46-42e2-a66a-e761d738249c`
  - replay run `run_f421c0c5-c443-4d77-8375-20284f8ab765`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`
- Uttarakhand:
  - active publication `publication_df0e1e1f-98db-496a-936b-4058dd90d7c1`
  - active snapshot `snapshot_fa23d74a-1876-4beb-9dc7-4d097a177f2a`
  - first fetch run `run_1f26a1af-867a-47e2-9f5b-0741777d7082`
  - replay run `run_0fd1e949-8a0b-4335-b8bd-35b464a93295`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`

Current conclusion from live evidence:

- Bihar and Uttarakhand have now both cleared the internal High Court proof bar
- the next remaining question is not whether the live operator path works for medium-sized queued single-jurisdiction courts
- the next remaining question is which smaller queued pair should follow them before any additional public-beta decision

## What Counts As Success

For each selected court, live operator evidence should show:

1. a published snapshot exists
2. at least one replayed run exists
3. at least one rollback publication exists
4. the High Court reference-date contract remains explicit and defensible

For the pair as a whole, success means:

- both courts clear the four gates above
- both do so across separate operator windows, not one isolated run
- the operator path remains usable without Himachal-specific assumptions

## What To Avoid

Do not:

- start multi-jurisdiction High Court validation before the schema is widened intentionally
- treat one clean fetch as equivalent to operational readiness

## Follow-Up After This Pair

Now that Himachal, Andhra Pradesh, Telangana, Gujarat, Madhya Pradesh, Uttar Pradesh, and Rajasthan are already public beta High Courts, and Chhattisgarh plus Jharkhand, Karnataka plus Odisha, and Bihar plus Uttarakhand have now cleared the internal proof bar, the remaining queued single-jurisdiction High Courts are:

- Sikkim
- Tripura
- Meghalaya
- Manipur

If Sikkim and Tripura clear the same gates, the likely next follow-on queue should come from:

- Meghalaya
- Manipur

Only after that should the repo revisit:

- whether a broader queued-court batch should be run automatically
- whether any second broader public High Court wave is methodologically defensible
