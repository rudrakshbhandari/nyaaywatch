# Source Caveat Review

Review date: **April 29, 2026**

Latest follow-up: **May 23, 2026**

Purpose: record when NyaayWatch needs a public page-level caveat because an upstream source shape changes how a reader should interpret a published snapshot.

This review is not a release ledger. Release evidence stays in:

- `docs/internal/RELEASE_HISTORY.md`
- `docs/internal/DEPLOYMENT_STATUS.md`
- `docs/internal/EXPANSION_REVIEW_LOG.md`

## Bottom Line

No lower-court state or Union Territory currently needs an extra public caveat beyond the common methodology text, the normal source date, the state/Union Territory label, and freshness/quality banners.

The May 23, 2026 live public-alpha sweep still supports that decision. `npm run ops:verify-public-alpha -- --base-url=https://nyaaywatch.in` reported `62/62` healthy public targets, with no stale snapshots, no daily-fetch lag, and no failing targets. No stronger per-state freshness banner or state-specific methodology note is needed right now.

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
