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
