# Supreme Court Methodology Draft

Working methodology contract for the first Supreme Court pilot inside NyaayWatch.

This is the repo-side methodology page that should guide the first public Supreme Court release.

Use it to answer:

- which Supreme Court metrics are safe to publish first?
- which values are sourced versus derived?
- how should registered and unregistered pending matters be presented?
- what comparisons are in scope or out of scope for the first beta?

## Bottom Line

The first public Supreme Court beta should be narrow and explicit.

It should emphasize:

- sourced aggregate metrics from Supreme Court NJDG
- clear treatment of registered and unregistered pending matters
- explicit provenance
- capture time as a labeled fallback when upstream does not expose a defensible source snapshot timestamp
- freshness and methodology labeling
- tier-specific caveats

It should avoid:

- broad derived scoring
- cross-tier ranking
- unsupported historical claims
- case-level inference from aggregate inputs

## Tier Definition

For NyaayWatch, the Supreme Court pilot is:

- one apex-court observability module
- inside the national NyaayWatch product shell
- using aggregate Supreme Court NJDG data as the canonical public source

It is not:

- a national all-courts summary alias
- a case search product
- a judgment archive
- a mixed-tier ranking surface

## Date And Freshness Contract

The Supreme Court tier cannot assume the official source exposes a trustworthy source snapshot date on the captured page.

Working rule for the pilot:

- if Supreme Court NJDG exposes a defensible source snapshot date in stored evidence, store and display it as `sourceSnapshotAt`
- if it does not, store `sourceSnapshotAt=null`
- in that case, store and display the official page capture timestamp as `referenceDateAt`
- label the basis explicitly as `captured_at`, not as an implied source snapshot date

Freshness should be measured from:

- `sourceSnapshotAt` when available
- otherwise `referenceDateAt` with an explicit `captured_at` label

Public implication:

- NyaayWatch can publish a Supreme Court snapshot honestly even when the source page does not expose a stable update timestamp
- the public page must not pretend Supreme Court NJDG exposed an upstream snapshot date when it did not

## Proposed V0 Public Metrics

### Sourced Metrics

The first beta should focus on metrics that come directly from the official aggregate source boundary.

Expected sourced metrics:

- pending civil registered cases
- pending civil unregistered cases
- pending civil total cases
- pending criminal registered cases
- pending criminal unregistered cases
- pending criminal total cases
- pending registered cases
- pending unregistered cases
- pending total cases
- instituted in last month:
  - civil
  - criminal
  - total
- disposed in last month:
  - civil
  - criminal
  - total
- instituted in current year:
  - civil
  - criminal
  - total
- disposed in current year:
  - civil
  - criminal
  - total

### Derived Metrics Allowed In Principle

These are acceptable only if the formulas are published clearly and the numerator / denominator semantics are stable:

- monthly clearance rate
  - disposed in last month divided by instituted in last month
- current-year clearance rate
  - disposed in current year divided by instituted in current year
- registered share of pending
  - pending registered cases divided by pending total cases
- unregistered share of pending
  - pending unregistered cases divided by pending total cases

### Derived Metrics To Withhold For V0

Do not ship these in the first public Supreme Court beta:

- rank
- watchlist score
- “years to clear backlog”
- mixed-tier composite scores
- national all-courts leaderboard views
- bench or coram comparisons unless repeated captures prove the source shape is stable enough to normalize

## Sourced Versus Derived Contract

Every public metric in the pilot should fall into one of two buckets.

### Bucket 1: Sourced

The number appears directly in the official aggregate source.

Examples:

- pending total cases
- pending registered cases
- pending unregistered cases
- instituted in last month
- disposed in last month
- instituted in current year
- disposed in current year

### Bucket 2: Derived

The number is computed by NyaayWatch from sourced values using a plain-English formula.

Examples:

- monthly clearance rate
- current-year clearance rate
- registered or unregistered share of pending

Rule:

- the public page must not blur sourced and derived values into one undifferentiated metric strip

## Registered / Unregistered Contract

Supreme Court NJDG explicitly distinguishes registered and unregistered pending matters.

That distinction is public-facing and should remain visible.

Working rule:

- do not collapse registered and unregistered pending into one implied backlog number without showing the distinction nearby
- `pendingTotalCases` may be shown, but it must sit beside the registered and unregistered breakdown
- public copy should avoid implying that registered and unregistered matters are procedurally identical

## Comparison Rules

### Safe Comparisons

The pilot may compare:

- Supreme Court against itself over time
- sourced and derived Supreme Court metrics within the same published snapshot

### Unsafe Comparisons For V0

The pilot should not imply:

- that Supreme Court metrics are directly comparable to High Court or district/subordinate metrics in a single ranking framework
- that Supreme Court movement should be interpreted as the national judicial system’s overall movement
- that aggregate pendency patterns reveal case-level causes

## Quality-State Rules

The Supreme Court pilot should reuse the common NyaayWatch quality-state language:

- `complete`
- `partial`
- `stale`

Working expectation:

- `complete`
  - all expected pilot fields captured from the source
- `partial`
  - one or more trust-critical fields missing or malformed
- `stale`
  - the last clean publication is older than the freshness threshold

No partial Supreme Court run should be published.

## Historical Trends

The beta may show trend context only after NyaayWatch has accumulated enough stored snapshots.

Working rule:

- do not imply a meaningful long-term Supreme Court trend from one or two captures

Until enough history exists:

- show the latest snapshot cleanly
- describe trend history as limited or still accumulating

## Public Caveats That Should Appear Near The Tier

The first public beta should state, in substance:

- this is a published snapshot, not a live feed
- the page covers aggregate Supreme Court signals, not case-level outcomes
- official case status, cause lists, orders, and judgments remain available through the linked Supreme Court website
- cross-tier comparisons are still limited and tier-aware

## Link-Out Policy

The Supreme Court beta should link out to official sources for:

- case status
- cause lists
- daily orders
- judgments
- office reports

This is preferable to pretending NyaayWatch already owns those record-level workflows.

## Publication Rule

The Supreme Court pilot should follow the same publication discipline as the rest of NyaayWatch:

- store raw evidence first
- normalize deterministically
- publish reviewed snapshots only
- keep replay and rollback available

## Decision

The first Supreme Court beta should be:

- sourced-metric-heavy
- registered/unregistered explicit
- lightly derived
- tier-explicit
- comparison-conservative

That is the right methodology posture for proving the Supreme Court tier without weakening the national trust model.
