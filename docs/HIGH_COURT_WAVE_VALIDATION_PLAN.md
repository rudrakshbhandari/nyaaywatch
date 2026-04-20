# High Court Wave Validation Plan

Concrete next-step plan after the internal multi-High-Court setup landed.

This document answers one narrow question:

- which courts should be validated next in live operator cycles, and how should that validation happen?

## Recommendation

The next public High Court beta expansion is now concrete rather than theoretical.

The original seven-court public High Court beta is no longer the terminal public set:

- Himachal
- Andhra Pradesh
- Telangana
- Gujarat
- Madhya Pradesh
- Uttar Pradesh via Allahabad High Court
- Rajasthan

Every queued single-jurisdiction High Court in the current registry now has live internal proof coverage, and the court-first multi-jurisdiction model has already cleared the Punjab and Haryana, Delhi, Kerala, and Madras public beta launches. The next gating problem is no longer whether Wave 1 should exist. The only remaining near-term gate is to keep the Wave 1 stable window clean enough to justify the Wave 2 internal proof batch and public rollout deliberately.

The initial design answer for that next phase now lives in `docs/HIGH_COURT_MULTI_JURISDICTION_DESIGN.md`.
The first execution-plan answer for that next phase now lives in `docs/HIGH_COURT_MULTI_JURISDICTION_PHASE_1_PLAN.md`.
PR 3 from that plan is now landed too, so Punjab and Haryana High Court is configured with explicit Punjab, Haryana, and Chandigarh coverage and is already live in the public beta.

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

The sixth validation pair was:

- Sikkim
- Tripura

That pair has now also cleared the internal proof bar on the live operator lane.

The seventh validation pair was:

- Meghalaya
- Manipur

That pair has now also cleared the internal proof bar on the live operator lane.

Delhi High Court, High Court of Kerala, and Madras High Court have now also cleared live internal `fetch -> publish -> replay -> rollback` proof on `https://nyaaywatch.in`, and PR `#141` plus deploy run `24686545934` have already carried that batch through to live public rollout with public-route verification and explicit cache purge evidence.

This is a repo recommendation from current project state, not an official source fact.

## Why Wave 2

Calcutta High Court, Bombay High Court, and Gauhati High Court are now the correct next public-wave target because they are:

- the only remaining deferred courts in the approved multi-jurisdiction batch plan
- broader and more operationally complex than the now-live Wave 1 courts
- no longer blocked on the court-first model itself, because Wave 1 has already proven the public batch discipline under live traffic

The point of Wave 2 is not to reopen the model debate.

The point of Wave 2 is to prove that the repo can keep expanding the public High Court beta in larger deliberate batches once the narrower Wave 1 courts stay stable.

The immediate repo slice before any public flip is now concrete:

- Bombay High Court configured as reviewed internal profile via HC NJDG selector `27~1`
- Calcutta High Court configured as reviewed internal profile via HC NJDG selector `19~16`
- Gauhati High Court configured as reviewed internal profile via HC NJDG selector `18~6`
- live `fetch -> publish -> replay -> rollback` proof for all three courts
- only then the three-court public route flip plus purge and rollout-evidence sync

## Wave 1 Launch Evidence

The decisive launch evidence for the completed Wave 1 public rollout was:

```bash
npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=delhi,kerala,madras
npm run release:purge-public-routes -- --high-court=delhi,kerala,madras
```

Wave 1 also now has:

- GitHub deploy run `24686545934` completed successfully on `main`, with `verify`, `secret-scan`, and `deploy` all green and `preview` skipped
- the live ECS service steady on task definition `:134`
- all three scheduler targets pointing at task definition `:134`
- `/`, `/high-courts`, `/high-courts/{delhi,kerala,madras}`, `/high-courts/{delhi,kerala,madras}/{data,methodology,api}`, and `/v1/high-courts/{delhi,kerala,madras}/{stats,trends}` all returning `200`

Requires:

- `OPERATOR_API_TOKEN` in the environment

The final queued-pair validation command was:

```bash
npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=meghalaya,manipur
```

The batch command reuses the existing High Court readiness verifier for each selected court and returns:

- per-court operator auth verification
- current active published snapshot state
- replay evidence
- rollback evidence
- explicit High Court reference-date posture
- aggregate ready / not-ready totals across the selected set

That batch command is now recorded live evidence, not an open court-selection step.

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
- the original seven-court public High Court beta was Himachal, Andhra Pradesh, Telangana, Gujarat, Madhya Pradesh, Uttar Pradesh, and Rajasthan
- the next decision is no longer "which already-proven court should go live next"
- the next decision was whether the repo should hold that set fixed until a multi-jurisdiction High Court design was ready

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

Follow-up live check on **April 20, 2026** for the then-recommended Sikkim and Tripura pair:

- `npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=sikkim,tripura`
- result: `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, `rollbackReadyCourts=2`

Live operator proof-cycle evidence now recorded:

- Sikkim:
  - active publication `publication_c1228f24-f667-4515-93fe-650281d256d3`
  - active snapshot `snapshot_68b41eca-274f-43cb-a918-69a2b537a0d2`
  - first fetch run `run_8eedeee8-3388-41a4-8c50-113d692bf3ef`
  - replay run `run_d0b6fffb-4889-4600-86e5-d76c2e39fcce`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`
- Tripura:
  - active publication `publication_11fa9e09-2810-45e5-a522-aa45b761916b`
  - active snapshot `snapshot_c78f7953-1772-4a2e-b1a1-a9d55c6a41f7`
  - first fetch run `run_54d4661c-ab6f-4534-9e4f-fcb653993e0b`
  - replay run `run_65bba8a7-ae2b-4ffa-83e0-a9dea1928b0b`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`

Current conclusion from live evidence:

- Sikkim and Tripura have now both cleared the internal High Court proof bar
- the next remaining question is no longer whether the live operator path works for very small queued single-jurisdiction courts
- the next remaining question is whether the final remaining queued pair clears cleanly enough to close out the single-jurisdiction queue before any additional public-beta decision

Follow-up live check on **April 20, 2026** for the then-recommended Meghalaya and Manipur pair:

- `npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=meghalaya,manipur`
- result: `configuredCourts=2`, `readyCourts=2`, `publishedCourts=2`, `replayReadyCourts=2`, `rollbackReadyCourts=2`

Live operator proof-cycle evidence now recorded:

- Meghalaya:
  - active publication `publication_f3f58f7b-a7d9-4703-957c-1db2f3134fa4`
  - active snapshot `snapshot_1815db27-d18e-46cf-ad3d-9680c12d2da3`
  - first fetch run `run_65902f29-1875-41b7-aa95-0f1a728f31f9`
  - replay run `run_fbc73342-720c-4443-9547-489663897e6b`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`
- Manipur:
  - active publication `publication_e32ba995-cb8b-4121-8a0c-a4516d6b6431`
  - active snapshot `snapshot_866397e4-9e67-4b59-abd0-3aeacd121f71`
  - first fetch run `run_0d5b0fcd-57c3-4e3c-858d-c7bbce687dc6`
  - replay run `run_3ebeb879-dab1-4dfd-854b-2e29db35615e`
  - `runCount=2`
  - `publicationCount=3`
  - `rollbackCount=1`
  - `internalProofBarSatisfied=true`

Current conclusion from live evidence:

- Meghalaya and Manipur have now both cleared the internal High Court proof bar
- every queued single-jurisdiction High Court in the current registry now has live publish, replay, and rollback evidence
- the next remaining question is not whether more internal queued-court proof is needed
- the next remaining question is whether any additional public High Court wave or any multi-jurisdiction expansion is methodologically defensible
- the original decision was to keep the seven-court public High Court beta fixed until the multi-jurisdiction court problem was intentionally designed
- the first explicit design pass for that problem now exists in `docs/HIGH_COURT_MULTI_JURISDICTION_DESIGN.md`

Follow-up live check on **April 20, 2026** for the internal Punjab and Haryana High Court pilot:

- `npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=punjab-and-haryana`
- result: `operatorAuthProtected=true`, `runCount=2`, `publicationCount=3`, `publishCount=2`, `rollbackCount=1`, `replayedRunCount=1`, `canonicalScopeAligned=true`, and `internalProofBarSatisfied=true`

Live operator proof-cycle evidence now recorded:

- Punjab and Haryana:
  - court code `PHHC`
  - fetch run `run_642f9d1d-5246-42a5-b3e0-1b5bb78def50`
  - first publish publication `publication_83b3d316-cdaf-4729-bcea-a875599af83f`
  - first publish snapshot `snapshot_44c791fb-2db5-4aea-9ef2-c26b562c1da5`
  - replay run `run_84726b0e-7732-4d4b-8a6b-da3c10d17ae4`
  - replay publication `publication_adade273-f47c-4b4e-8501-75ea35e06814`
  - rollback publication `publication_797e59da-9032-42dc-a891-f68f3d83fc0b`
  - `hasPublishedSnapshot=true`
  - `hasReplayEvidence=true`
  - `hasRollbackEvidence=true`
  - `referenceDateContractDefensible=true`
  - `canonicalScopeAligned=true`
  - `internalProofBarSatisfied=true`

Current conclusion from live evidence:

- the internal Punjab and Haryana pilot has now cleared the live High Court proof bar
- the first court-first multi-jurisdiction High Court phase is now technically complete
- the next remaining question is no longer whether the operator lane can handle a multi-jurisdiction court
- the public methodology and route language pass for explicit covered geographies is now landed across the shipped High Court public surfaces
- the next remaining question has now been resolved in favor of one public multi-jurisdiction beta promotion: Punjab and Haryana is the first such court

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

Now that Himachal, Andhra Pradesh, Telangana, Gujarat, Madhya Pradesh, Uttar Pradesh, Rajasthan, and Punjab and Haryana are public beta High Courts, Chhattisgarh plus Jharkhand, Karnataka plus Odisha, Bihar plus Uttarakhand, Sikkim plus Tripura, and Meghalaya plus Manipur have all cleared the internal proof bar, and Punjab and Haryana has already cleared the first internal multi-jurisdiction proof pass, the remaining High Court work is no longer about missing operational evidence.

The harder questions that originally blocked a public multi-jurisdiction court now have working answers:

- multi-jurisdiction High Courts fit the product and schema through a court-first identity plus explicit `coveredGeographies[]`
- the public methodology language now remains honest once court-to-state mapping is no longer one-to-one
- Punjab and Haryana is the first public multi-jurisdiction High Court beta page, and the remaining deferred court-first High Courts are now approved for sequential public-beta waves larger than two courts at a time through `docs/HIGH_COURT_MULTI_JURISDICTION_PUBLIC_BETA_BATCH_PLAN.md`
- Delhi High Court, High Court of Kerala, and Madras High Court are now live public Wave 1 courts
- Bombay High Court, Calcutta High Court, and Gauhati High Court are now the reviewed internal Wave 2 courts
- the immediate live gate is no longer source review or model design; it is the three-court `fetch -> publish -> replay -> rollback` proof batch for Wave 2
