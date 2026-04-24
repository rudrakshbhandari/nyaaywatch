# Jammu & Kashmir and Ladakh High Court Internal Readiness Review

Current internal-readiness record for the common High Court of Jammu & Kashmir and Ladakh.

This document exists to answer one narrow question:

- what is true in repo state now, and what evidence supports treating this court as internally proven and publicly ready?

Latest review captured here reflects live operator evidence on **April 23, 2026**.

## Current Status

- `courtCode=JKLHC`
- `courtSlug=jammu-kashmir-and-ladakh`
- `courtName=High Court of Jammu & Kashmir and Ladakh`
- HC NJDG selector value: `1~12`
- covered geographies:
  - Jammu and Kashmir
  - Ladakh
- repo posture:
  - public High Court beta
  - `publicBeta=true`
  - `sourceReviewStatus=reviewed`

What is true in repo state after this slice:

- the common High Court has an explicit court-first profile in repo code
- the profile uses the current official institutional name in public-facing copy fields
- the profile models both covered union territories explicitly through `coveredGeographies[]`
- local, remote, and ECS-backed operator tooling can target the court slug
- the public route family is intentionally exposed as one common-court page under `/high-courts/jammu-kashmir-and-ladakh`

Live evidence now recorded:

- fetch run: `run_e036f9ac-f0d2-4e73-b7c3-8017a054d677`
- initial publication: `publication_2957c01d-b451-4ae8-98a7-ecfe241d4297`
- replay run: `run_3caa55b9-8e1a-4b50-8a45-58afbcf974b9`
- replay publication: `publication_93ca29e7-651b-430e-b564-7386cb50465c`
- rollback publication: `publication_e183dc01-887e-4b02-8c41-fd9e58ab471e`
- active snapshot after rollback: `snapshot_164f1f63-2d04-4685-b8ef-33261bdb064d`
- public High Court route exposure is approved after the internal proof and source-review gates below

What remains true after public exposure:

- do not create separate Jammu and Kashmir and Ladakh High Court pages
- keep the upstream selector-label nuance visible in methodology and source-review docs

## Internal Proof Bar

This court is internally ready after the following live operator evidence:

1. an active published High Court snapshot exists
2. at least one replayed run exists from stored evidence
3. at least one rollback publication exists
4. the reference-date contract is explicit and defensible
5. the source-review decision is complete and the common-court naming boundary is documented

Live `npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=jammu-kashmir-and-ladakh` results on **April 23, 2026**:

- `publicationId=publication_e183dc01-887e-4b02-8c41-fd9e58ab471e`
- `snapshotId=snapshot_164f1f63-2d04-4685-b8ef-33261bdb064d`
- `publishedAt=2026-04-23T19:18:26.500Z`
- `referenceDateAt=2026-04-23T19:16:25.184Z`
- `referenceDateKind=captured_at`
- `sourceSnapshotAt=null`
- `methodologyVersion=2026.04-high-court-draft`
- `runCount=2`
- `publicationCount=3`
- `publishCount=2`
- `rollbackCount=1`
- `replayedRunCount=1`
- `canonicalScopeAligned=true`
- `internalProofBarSatisfied=true`

Active internal snapshot metrics from the same proof cycle:

- `pendingTotalCases=43849`
- `institutedLastMonthTotalCases=1010`
- `disposedLastMonthTotalCases=781`

## Important Source Nuance

The upstream aggregate source still uses an older Jammu and Kashmir-only label, even though the current official institutional name is `High Court of Jammu & Kashmir and Ladakh`.

Internal readiness here therefore depends on two separate truths staying aligned:

- NyaayWatch public copy should use the current official court name
- the ingest target should still bind to the upstream HC NJDG selector that exists today

That naming mismatch is a documentation and methodology constraint, not a reason to create a fake second High Court.

## Validation Commands

For internal proof validation, use:

```bash
npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=jammu-kashmir-and-ladakh
```

The live proof cycle used the ECS-backed operator lane:

```bash
npm run operator:staging -- --high-court jammu-kashmir-and-ladakh fetch "Initial J-K and Ladakh High Court fetch"
```

## Recommendation

Promote the common High Court of Jammu & Kashmir and Ladakh as one public High Court beta page after the recorded proof cycle and source review.

Do not create separate Jammu and Kashmir and Ladakh High Court pages. Future changes should treat this as one common-court surface unless the official court structure itself changes.
