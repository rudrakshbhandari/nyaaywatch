# Source Caveat Review

Review date: **April 29, 2026**

Latest follow-up: **June 12, 2026**

Purpose: record when NyaayWatch needs a public page-level caveat because an upstream source shape changes how a reader should interpret a published snapshot.

This review is not a release ledger. Release evidence stays in:

- `docs/internal/RELEASE_HISTORY.md`
- `docs/internal/DEPLOYMENT_STATUS.md`
- `docs/internal/EXPANSION_REVIEW_LOG.md`

## Bottom Line

No lower-court state or Union Territory currently needs an extra public caveat beyond the common methodology text, the normal source date, the state/Union Territory label, and freshness/quality banners.

The May 23, 2026 live public-alpha sweep still supports that decision. `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in` reported `62/62` healthy public targets, with no stale snapshots, no daily-fetch lag, and no failing targets.

The June 12, 2026 CPC Meghalaya response to the NyaayWatch source-data check supports the current missing-zero treatment: when NJDG displays zero-valued monthly movement fields, those values may represent missing data for that period rather than true zero activity. The response wording referred to `0` pending backlog alongside `0` filed and `0` disposed cases, while the NyaayWatch examples included pending-positive rows. Until NJDG provides a broader source-side correction or general rule, NyaayWatch should continue showing pending-positive rows with `0` filed and `0` disposed monthly movement as `N/A`, not zero-rate performance.

That source-side clarification does not require a new state-specific public caveat because the common metric-level `N/A` treatment already protects readers from a false zero. It does, however, remain a public-interest source-quality issue: court movement data should not be missing or unreported on an official public dashboard in the first place. When monthly movement fields are unavailable, the public loses the ability to understand whether filings, clearances, and backlog movement are being reported for that period.

Tier-specific caveats do still matter:

- Supreme Court pages keep their registered/unregistered pending-case distinction and the `captured_at` fallback when the official aggregate page does not expose a defensible source snapshot date.
- High Court pages stay court-first, carry `coveredGeographies[]`, and use the `captured_at` fallback when HC NJDG does not expose a defensible source snapshot date.
- Lower-court pages keep the compatibility route shape `/states/:slug`, but public copy distinguishes states from Union Territories.

## When To Add A Public Caveat

Add a page-level caveat when a source condition changes reader interpretation, not merely because the pipeline has internal details.

Examples that should trigger a public caveat:

- the upstream selector label and current public institutional name diverge in a way that can confuse the reader
- a court covers more than one state or Union Territory
- the source does not expose a trustworthy source snapshot date
- the public page is intentionally partial because a source segment is excluded
- district coverage changes in a way that makes the current snapshot hard to compare with earlier snapshots
- a freshness or quality state is materially different from the normal public-alpha expectation

Do not add a page-level caveat for:

- ordinary operator capture details
- private raw artifact storage
- unchanged route compatibility details already explained in methodology
- release history that belongs in internal evidence docs

## Current Lower-Court Review

The lower-court public route family covers all 36 NJDG state and Union Territory selector geographies.

Current public posture:

- state pages say they cover a state
- Union Territory pages say they cover a Union Territory
- every lower-court public page continues to show source date, methodology version, source attribution, and quality/freshness state
- raw capture bundles and operator evidence artifacts stay outside the public download boundary

Review outcome:

- no lower-court geography currently needs a state-specific or Union Territory-specific caveat beyond that common posture
- future local caveats should be added only when a source change affects reader interpretation

## Current High Court Review

High Court pages already have tier-specific caveats because the source shape differs from lower-court pages.

Current public posture:

- each page is one High Court page, not a lower-court state page
- multi-geography courts list their coverage through `coveredGeographies[]`
- public copy names the court first and coverage second
- current High Court public pages use `captured_at` when HC NJDG does not expose a defensible source snapshot date
- lower-court monthly movement values are shown as `N/A` when NJDG reports pending cases but `0` filed and `0` disposed cases for last month; CPC Meghalaya's June 12, 2026 reply supports the missing-data interpretation, but follow-up should confirm whether the rule applies generally to pending-positive rows across CPC jurisdictions

Review outcome:

- the common High Court methodology page should continue to carry the coverage and reference-date caveats
- no extra one-off High Court caveat is needed unless a court-specific source review finds a new reader-facing mismatch

## Current Supreme Court Review

The Supreme Court page is its own tier and should not be folded into the lower-court or High Court caveat model.

Current public posture:

- registered and unregistered pending cases remain visible
- aggregate Supreme Court metrics are not ranked against lower courts or High Courts
- `captured_at` remains the fallback when the official aggregate page does not expose a defensible source snapshot date

Review outcome:

- the tier-specific Supreme Court methodology remains the source of truth for Supreme Court caveats
- no broader all-courts comparison caveat should be introduced unless the product later adds a comparison surface that needs it
