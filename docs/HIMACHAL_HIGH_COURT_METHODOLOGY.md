# Himachal High Court Methodology Draft

Working methodology contract for the first Himachal High Court pilot inside NyaayWatch.

This is not yet a public launch methodology page. It is the repo-side contract that should guide the first implementation.

Use it to answer:

- which High Court metrics are safe to publish first?
- which values are sourced versus derived?
- which comparisons are in scope or out of scope for the first beta?

## Bottom Line

The first public Himachal High Court beta should be conservative.

It should emphasize:

- sourced aggregate metrics
- clear provenance
- snapshot date when the official source exposes one
- capture date as an explicit fallback when the official High Court source does not expose a trustworthy source snapshot date
- freshness and methodology labeling
- tier-specific caveats

It should avoid:

- ambitious derived scoring
- cross-tier ranking
- unsupported historical claims
- case-level inference from aggregate inputs

## Tier Definition

For NyaayWatch, the Himachal High Court pilot is:

- one High Court observability module
- within the national NyaayWatch product shell
- using aggregate High Court observability data as the canonical public source

It is not:

- a district-ranking surface
- a case search product
- a judgment repository

## Proposed V0 Public Metrics

## Date And Freshness Contract

The High Court tier cannot assume the official source always exposes a source snapshot date.

Working rule for the Himachal High Court pilot:

- if HC NJDG exposes a trustworthy source snapshot date, store and display it as `sourceSnapshotAt`
- if HC NJDG does **not** expose one, store `sourceSnapshotAt=null`
- in that case, store and display the official page capture timestamp as the High Court `referenceDateAt`
- label the basis explicitly as `captured_at`, not as an implied source snapshot date

Freshness should be measured from:

- `sourceSnapshotAt` when available
- otherwise `referenceDateAt` with an explicit `captured_at` label

Public implication:

- NyaayWatch can still publish a High Court snapshot honestly
- but the High Court page must not claim that the official source exposed an underlying snapshot/update date when it did not

### Sourced Metrics

The first beta should focus on metrics that come directly from the official aggregate source boundary.

Expected sourced metrics:

- pending civil cases
- pending criminal cases
- total pending cases
- instituted in last month
- disposed in last month
- age buckets:
  - less than 1 year
  - 1 to 3 years
  - 3 to 5 years
  - 5 to 10 years
  - above 10 years

Conditional sourced metrics:

- case-type breakdowns, but only if repeated captures show the labels and buckets are stable enough to normalize

### Derived Metrics Allowed In Principle

These are acceptable only if the formulas are published clearly and the numerator / denominator semantics are stable:

- monthly clearance rate
  - disposed in last month divided by instituted in last month
- age-bucket share
  - each age bucket divided by total pending cases

### Derived Metrics To Withhold For V0

Do not ship these in the first public High Court beta:

- rank
- watchlist score
- "years to clear backlog"
- tier-mixing composite scores
- national High Court leaderboard
- district-versus-High-Court implied comparisons

## Sourced Versus Derived Contract

Every public metric in the pilot should fall into one of two buckets:

### Bucket 1: Sourced

The number appears directly in the official aggregate source.

Examples:

- total pending cases
- instituted in last month
- disposed in last month
- age-bucket counts

### Bucket 2: Derived

The number is computed by NyaayWatch from sourced values using a plain-English formula.

Examples:

- clearance rate
- age-bucket share

Rule:

- the public page must not blur sourced and derived values into one undifferentiated metric strip

## Comparison Rules

### Safe Comparisons

The pilot may compare:

- Himachal High Court against itself over time
- sourced and derived High Court metrics within the same published snapshot

### Unsafe Comparisons For V0

The pilot should not imply:

- that High Court metrics are directly comparable to district/subordinate metrics in a single ranking framework
- that Himachal High Court is directly comparable to every other High Court before the common model is proven
- that aggregate backlog behavior reveals case-level causes

## Quality-State Rules

The High Court pilot should reuse the common NyaayWatch quality-state language:

- `complete`
- `partial`
- `stale`

But the actual rules must be re-validated for the High Court source shape.

Working expectation:

- `complete`
  - all expected pilot fields captured from the source
- `partial`
  - one or more trust-critical fields missing or malformed
- `stale`
  - the last clean publication is older than the freshness threshold

No partial High Court run should be published.

## Historical Trends

The beta may show trend context only after NyaayWatch has accumulated enough stored snapshots.

Working rule:

- do not imply a long-term High Court trend from one or two captures

Until enough history exists:

- show the latest snapshot cleanly
- describe history as limited or still accumulating

## Public Caveats That Should Appear Near The Tier

The first public beta should state, in substance:

- this is a published snapshot, not a live feed
- the page covers aggregate High Court signals, not case-level outcomes
- official case, order, and judgment detail remains available through the linked official court services
- cross-tier comparisons are still limited and tier-aware

## Link-Out Policy

The High Court beta should link out to official sources for:

- case status
- cause lists
- orders
- judgments

This is preferable to pretending NyaayWatch already owns those record-level workflows.

## Publication Rule

The High Court pilot should follow the same publication discipline as the rest of NyaayWatch:

- store raw evidence first
- normalize deterministically
- publish reviewed snapshots only
- keep replay and rollback available

## Decision

The first Himachal High Court beta should be:

- sourced-metric-heavy
- lightly derived
- tier-explicit
- comparison-conservative

That is the right methodology posture for proving the High Court tier without weakening the national trust model.
