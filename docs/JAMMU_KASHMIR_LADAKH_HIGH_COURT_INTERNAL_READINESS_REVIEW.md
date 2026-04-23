# Jammu & Kashmir and Ladakh High Court Internal Readiness Review

Current internal-readiness record for the common High Court of Jammu & Kashmir and Ladakh.

This document exists to answer one narrow question:

- what is true in repo state now, and what still must happen before this court can be treated as internally proven or publicly ready?

Latest review captured here reflects repo state on **April 22, 2026**. It does **not** claim a live deployed proof cycle yet.

## Current Status

- `courtCode=JKLHC`
- `courtSlug=jammu-kashmir-and-ladakh`
- `courtName=High Court of Jammu & Kashmir and Ladakh`
- HC NJDG selector value: `1~12`
- covered geographies:
  - Jammu and Kashmir
  - Ladakh
- repo posture:
  - internal-only
  - `publicBeta=false`
  - `sourceReviewStatus=queued`

What is true in repo state after this slice:

- the common High Court now has an explicit court-first profile in repo code
- the profile uses the current official institutional name in public-facing copy fields
- the profile models both covered union territories explicitly through `coveredGeographies[]`
- local and remote operator tooling can target the court slug once this branch is deployed

What is **not** yet true in evidence:

- no live `fetch -> publish -> replay -> rollback` proof cycle is recorded yet
- no deployed operator namespace evidence is recorded yet
- no published snapshot exists yet
- no public High Court beta decision has been made for this court

## Internal Proof Bar

This court should not be considered internally ready until all of the following are true on the live operator lane:

1. an active published High Court snapshot exists
2. at least one replayed run exists from stored evidence
3. at least one rollback publication exists
4. the reference-date contract is explicit and defensible
5. the source-review decision is complete and the common-court naming boundary is documented

## Important Source Nuance

The upstream aggregate source still uses an older Jammu and Kashmir-only label, even though the current official institutional name is `High Court of Jammu & Kashmir and Ladakh`.

Internal readiness here therefore depends on two separate truths staying aligned:

- NyaayWatch public copy should use the current official court name
- the ingest target should still bind to the upstream HC NJDG selector that exists today

That naming mismatch is a documentation and methodology constraint, not a reason to create a fake second High Court.

## Next Validation Command

After deploy and once `OPERATOR_API_TOKEN` is available, use:

```bash
npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=jammu-kashmir-and-ladakh
```

The first live internal proof step before that is:

```bash
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court jammu-kashmir-and-ladakh fetch "Initial Jammu & Kashmir and Ladakh High Court fetch"
```

## Recommendation

Keep this court internal-only until:

- the source review is treated as complete
- the first live proof cycle succeeds
- the common-court naming posture is reflected in the public High Court methodology copy

Do not create separate Jammu and Kashmir and Ladakh High Court pages. The right next step is one common High Court proof cycle, not a split.
