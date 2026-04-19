# Himachal High Court Internal Readiness Review

Current internal-readiness review for the Himachal High Court pilot.

This document is the High Court-tier analogue of the earlier state internal-readiness reviews. It exists to answer one narrow question:

- has Himachal High Court accumulated enough real internal operator evidence to justify a later public beta discussion?

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

What is still **not** yet true in repo evidence:

- this repo does not yet record multiple separate public-release windows for the Himachal High Court beta
- the Himachal High Court tier still depends on `captured_at` because the official HC NJDG surface does not expose a defensible source snapshot timestamp

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

Himachal High Court should not be considered ready for public-beta review until all of the following are true in live operator evidence:

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

## Recommendation

Himachal High Court is now ready enough for a narrow public beta route.

That does **not** mean:

- the High Court tier is already mature enough for a national High Court UX
- the High Court date contract is ideal
- the next product layer should automatically be more High Courts instead of Supreme Court

The next concrete action is:

- verify the live public Himachal High Court beta after deploy
- then decide whether Supreme Court, not more High Courts, should be the next top-down product tier
