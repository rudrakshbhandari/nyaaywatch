# Himachal High Court Internal Readiness Review

Current internal-readiness review for the Himachal High Court pilot.

This document is the High Court-tier analogue of the earlier state internal-readiness reviews. It exists to answer one narrow question:

- had Himachal High Court accumulated enough real internal operator evidence to justify a public beta, and what live evidence exists now that the beta is exposed?

Latest live verification referenced here was run against `https://nyaaywatch.in` on **April 19, 2026**.

## Current Status

- `courtCode=HPHC`
- `courtSlug=himachal`
- `courtName=High Court of Himachal Pradesh`
- internal operator namespace: `/operator/high-courts/himachal/...`
- public High Court beta routes: `/high-courts/himachal`, `/high-courts/himachal/data`, `/high-courts/himachal/methodology`, `/high-courts/himachal/api`
- High Court date contract: explicit `captured_at` fallback when HC NJDG does not expose a trustworthy source snapshot date

What is true in repo state now:

- stored-evidence High Court capture, inspect, publish, replay, and rollback are implemented
- the internal High Court read surface is implemented and test-covered
- local and remote operator tooling can target Himachal High Court explicitly
- a live Himachal High Court internal proof cycle has now cleared `fetch -> publish -> replay -> rollback`
- the narrow public Himachal High Court beta namespace is now implemented in repo code
- the narrow public High Court beta route family is deployed and reachable

What is still **not** yet true in repo evidence:

- this repo does not yet record multiple separate public-release windows for the Himachal High Court beta
- the Himachal High Court tier still depends on `captured_at` because the official HC NJDG surface does not expose a defensible source snapshot timestamp
- this repo still has only one live Himachal High Court public-beta window
- this repo does not yet record a second, later public High Court publication cycle after the beta route went live

## Readiness Command

Use the internal readiness verifier after each real Himachal High Court proof cycle:

```bash
npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=himachal
```

Requires:

- `OPERATOR_API_TOKEN` in the environment

The command verifies:

- the High Court operator auth boundary
- the dedicated High Court internal namespace
- current published snapshot metadata
- publication history depth
- replay evidence
- rollback evidence
- the explicit High Court reference-date contract

## Internal Proof Bar

Himachal High Court should not have been considered ready for public-beta review until all of the following were true in live operator evidence:

1. an active published High Court snapshot exists
2. at least one replayed High Court run exists from stored evidence
3. at least one rollback publication exists
4. the reference-date contract is explicit and defensible
5. the above has been repeated across separate internal release windows, not just one isolated cycle

The new readiness verifier covers items 1 through 4 directly. Item 5 still requires human review of repeated runs across time.

## Live Evidence

Live `npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=himachal` results on **April 19, 2026**:

- `publicationId=publication_e66cb2f9-b307-46d6-b00c-51b01e901fee`
- `snapshotId=snapshot_eacb324b-2572-4ce6-84a9-1217abf2d14b`
- `publishedAt=2026-04-19T03:40:28.731Z`
- `referenceDateAt=2026-04-19T03:39:31.512Z`
- `referenceDateKind=captured_at`
- `sourceSnapshotAt=null`
- `methodologyVersion=2026.04-high-court-draft`
- `runCount=2`
- `publicationCount=3`
- `publishCount=2`
- `rollbackCount=1`
- `replayedRunCount=1`
- `internalProofBarSatisfied=true`

Current active public-facing High Court snapshot metrics from the same live run:

- `pendingTotalCases=105599`
- `institutedLastMonthTotalCases=7046`
- `disposedLastMonthTotalCases=6528`

This means the repo has now recorded the first real Himachal High Court proof cycle with:

- one active published High Court snapshot
- one replayed run from stored evidence
- one rollback publication
- an explicit and defensible reference-date contract

## Live Public Beta Evidence

Verified on `2026-04-19` after PR `#105` merged and GitHub deploy run `24621281752` completed on `main`.

- settled ECS task definition: `nyaaywatch-staging:93`
- active High Court publication id: `publication_e66cb2f9-b307-46d6-b00c-51b01e901fee`
- active published snapshot id: `snapshot_eacb324b-2572-4ce6-84a9-1217abf2d14b`
- active publication action: `rollback`
- active publication note: `Internal himachal High Court rollback 2026-04-19`
- previous publication id: `publication_af21ed65-7a07-4c1c-93f8-e77ba054bef6`
- published-from run id: `run_288288e1-f32b-45d1-86cd-c2384bba38ac`
- replay run id retained in history: `run_46c29931-2079-403c-a273-e8e062e4314b`
- reference date: `2026-04-19T03:39:31.512Z`
- reference date kind: `captured_at`
- published at: `2026-04-19T03:40:28.731Z`
- methodology version: `2026.04-high-court-draft`
- public route verification:
  - `200 /high-courts/himachal`
  - `200 /high-courts/himachal/data`
  - `200 /high-courts/himachal/methodology`
  - `200 /high-courts/himachal/api`
  - `200 /v1/high-courts/himachal/stats`
  - `200 /v1/high-courts/himachal/trends`
- active public snapshot metrics:
  - pending total cases: `105,599`
  - instituted last month total cases: `7,046`
  - disposed last month total cases: `6,528`

Important nuance:

- the public beta route exposure happened during the PR `#105` deploy window
- the currently visible High Court data itself comes from the already-reviewed active Himachal High Court publication chain, not from a brand-new public-only data publish

## Recommendation

Himachal High Court has cleared the first public-beta gate and is now live as a narrow public High Court surface.

The next concrete action is:

- keep Himachal High Court public and boring through additional operator cycles
- move the next public top-down planning track to Supreme Court before broadening the High Court UX layer
