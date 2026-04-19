# High Court Wave Validation Plan

Concrete next-step plan after the internal multi-High-Court setup landed.

This document answers one narrow question:

- which courts should be validated next in live operator cycles, and how should that validation happen?

## Recommendation

Do **not** try to validate the whole internal High Court wave at once.

Validate this pair first:

- Uttar Pradesh via Allahabad High Court
- Rajasthan via High Court of Rajasthan

This is a product and operations recommendation from current repo state, not an official source fact.

## Why This Pair

These two courts are the best next internal validation pair because they are:

- already inside the new single-jurisdiction High Court registry
- already aligned with supported lower-court state profiles
- clearly distinct in scale and operational risk
- still simple enough to fit the current one-state-per-High-Court snapshot contract

The point of this pair is not representativeness theater.

The point is to pressure-test the internal High Court lane on:

- a very large court with obvious operational weight: Uttar Pradesh
- a still-substantial but less extreme court: Rajasthan

If both hold up, the repo will have much better evidence that the internal wave setup is real rather than merely configured.

## Validation Command

Use the batch readiness sweep:

```bash
npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=uttar-pradesh,rajasthan
```

Requires:

- `OPERATOR_API_TOKEN` in the environment

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

What still remains after this repo-side fix:

- deploy the parser hardening to the live stack
- rerun the Uttar Pradesh and Rajasthan High Court fetches
- only then decide whether publish, replay, and rollback proof should begin for this pair

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

- promote these courts into public beta just because the internal wave is configured
- start multi-jurisdiction High Court validation before the schema is widened intentionally
- treat one clean fetch as equivalent to operational readiness

## Follow-Up After This Pair

If Uttar Pradesh and Rajasthan clear the internal proof bar, the next likely internal validation candidates should be:

- Gujarat
- Madhya Pradesh

Only after that should the repo revisit:

- whether a broader queued-court batch should be run automatically
- whether any second public High Court beta is methodologically defensible
