# Metric Strategy

Decision note for which NyaayWatch metrics should exist next, and which should not be promoted until the data model can defend them.

This document is about product metrics, not source expansion. Use `docs/LONG_TERM_DATA_STRATEGY.md` for the broader data-layer roadmap.

## Bottom Line

NyaayWatch already has the core delay spine:

- cases waiting
- cleared per 100 filed
- last-month backlog change
- typical wait or age-bucket burden
- trends
- watchlists or pressure ranking

The next useful metrics should not repeat that spine. They should answer harder public questions:

1. Is the backlog merely large, or is it growing faster than the court can absorb?
2. Is delay concentrated in a few places or spread across the system?
3. Are old cases becoming a structural burden?
4. Are the same courts or districts repeatedly under pressure?
5. Where does the current aggregate model stop, and where would a deeper source be required?

## Current Metric Inventory

### Lower Courts

Already public or available in the lower-court read model:

- pending cases
- cleared per 100 filed
- typical wait estimate from age buckets
- flagged district count
- district rank
- district backlog
- district clearance pace
- district file-clear gap
- district flag reason and summary
- published trend series for pending cases and clearance pace
- snapshot movers between two published snapshots
- lower-court pressure index on the national map

Current lower-court source facts are still aggregate NJDG facts: geography names, source date, total pending/open cases, last-month filed and cleared counts, and age-bucket totals.

### High Courts

Already public or available in the High Court read model:

- pending civil cases
- pending criminal cases
- pending total cases
- filed last month, split by civil/criminal/total
- cleared last month, split by civil/criminal/total
- cleared per 100 filed
- last-month backlog change
- five age buckets
- older-than-10-years burden on the public overview
- optional case-type breakdown where the captured source exposes it
- published trend points for pending, filed, and cleared totals

### Supreme Court

Already public or available in the Supreme Court read model:

- pending registered cases
- pending unregistered cases
- pending total cases
- civil and criminal pending splits
- filed last month, split by civil/criminal/total
- cleared last month, split by civil/criminal/total
- filed current year, split by civil/criminal/total
- cleared current year, split by civil/criminal/total
- cleared per 100 filed
- last-month backlog change
- published trend points for pending, filed, and cleared totals
- finalized monthly filed/cleared totals once reset boundaries are observed

## Add Next: Derivable From Current Public Snapshots

These can be implemented without adding a new upstream source, though some require preserving additional fields in the lower-court published schema.

### 1. Backlog Movement As Share Of Pending Load

Question:

- Is the monthly pile change large relative to the size of the court or geography?

Formula:

- `(filed last month - cleared last month) / pending cases`

Why it matters:

- A `+10,000` case increase means different things in a huge state and a small territory.
- This gives a scale-aware signal without pretending different court tiers are identical.

Public label:

- `Backlog grew by 1.8% of the pending pile last month.`

Use:

- High Court cards
- Supreme Court page
- lower-court state pages
- district workspace sort option after lower-court schema support

### 2. Break-Even Clearances Needed

Question:

- How many more cases needed to be cleared last month just to stop the backlog growing?

Formula:

- `max(0, filed last month - cleared last month)`

Why it matters:

- It is more concrete than "clearance rate".
- It avoids fake forecasts while still showing the workload gap.

Public label:

- `Needed 4,200 more clearances last month to break even.`

Use:

- overview tiles
- High Court directory ordering support
- alert-style notes when the gap is unusually large

### 3. Catch-Up Burden

Question:

- What extra monthly clearance would be needed to reduce backlog by a modest target?

Formula:

- `ceil((pending cases * targetReductionShare) / months) + current monthly file-clear gap`

Initial target:

- `10% backlog reduction over 12 months`

Why it matters:

- It gives the public a concrete sense of scale without saying "this court will clear its backlog in X years."
- It works only as a scenario, not a prediction.

Public label:

- `To cut the backlog by 10% in a year, this court would need about 8,300 extra clearances per month.`

Guardrail:

- Always call this a scenario.
- Never describe it as a forecast.

### 4. Old-Case Burden Share

Question:

- What share of the pending load is already old?

Formula:

- `cases older than threshold / total age-bucket cases`

Thresholds:

- lower courts: `3+ years`, `5+ years`, `10+ years`
- High Courts: `3+ years`, `5+ years`, `10+ years`
- Supreme Court: only if a defensible age-bucket source is captured later

Why it matters:

- This is the most human delay metric after pending load.
- It separates a busy court from a court carrying deep delay.

Public label:

- `31.4% of pending cases are older than 5 years.`

Implementation note:

- High Courts already preserve age buckets.
- Lower-court published snapshots currently collapse age buckets into `medianCaseAgeDays`; add explicit age-bucket fields before surfacing this widely.

### 5. Watchlist Persistence

Question:

- Is this place repeatedly under pressure, or did it just spike once?

Formula:

- `number of recent published snapshots where the district/court was flagged / window size`

Initial windows:

- last `3`
- last `6`

Why it matters:

- Repeated pressure is more newsworthy and more operationally meaningful than one bad snapshot.

Public label:

- `Flagged in 5 of the last 6 snapshots.`

Use:

- district pages
- movers page
- state overview
- possible future High Court watchlist once tier-specific flagging exists

### 6. Backlog Concentration

Question:

- Is delay concentrated in a few districts/case types, or distributed broadly?

Formula examples:

- `top 5 districts pending / state pending`
- `top 10 districts pending / state pending`
- `top 5 case types pending / High Court pending` where case-type breakdown exists

Why it matters:

- A concentrated backlog suggests targeted investigation.
- A broad backlog suggests system-wide capacity pressure.

Public label:

- `The top 5 districts hold 58% of this state's pending cases.`

Use:

- lower-court state pages
- district workspace summary
- High Court pages with case-type breakdown

### 7. Civil-Criminal Imbalance

Question:

- Is one side of the docket falling behind the other?

Formula examples:

- `criminal pending share - criminal clearance share`
- `civil pending share - civil clearance share`
- separate cleared-per-100-filed values for civil and criminal

Why it matters:

- High Courts and the Supreme Court already carry civil/criminal fields.
- This can surface structurally important imbalance without case-level records.

Public label:

- `Criminal cases are 42% of pending cases but 31% of clearances this month.`

Guardrail:

- Do not imply cause. Show imbalance as a signal for inspection.

## Add Later: Requires Current Sources But Better Schema Preservation

These are good metrics, but first require preserving fields that are currently extracted or source-visible but not always carried through the public schema.

### Lower-Court Age-Bucket Shares

Preserve lower-court age buckets in state and district published snapshots, not just median age.

This unlocks:

- old-case burden share
- districts with the deepest long-pending load
- age-bucket trend over time
- "newer backlog versus older backlog" framing

### Lower-Court Filed And Cleared Counts

Preserve explicit filed and cleared counts in state and district published snapshots, not only `disposalRate` and `filingVsDisposalGap`.

This unlocks:

- break-even clearances needed
- backlog movement as share of pending load
- catch-up burden
- more transparent CSV/API formulas

### High Court Case-Type Concentration

Where `caseTypeBreakdown` is available, expose concentration carefully:

- top case types by pending load
- civil/criminal composition within the top case types
- case-type concentration share

Do not make this a required High Court metric until all public High Court sources reliably provide it.

## Add Later: Requires External Or Deeper Sources

These could be valuable, but they should not enter the main metric spine until the source and methodology are proven.

### Judge-Adjusted Pressure

Examples:

- pending cases per sitting judge
- clearances per sitting judge
- vacancy-adjusted backlog

Why it matters:

- It is one of the fairest ways to discuss capacity.

Why it is not immediate:

- It requires reliable judge-strength and vacancy data, scoped by court and date.
- It must handle sanctioned strength, working strength, transfers, and reporting lag.

### Population-Normalized Pressure

Examples:

- pending cases per 100,000 residents
- old cases per 100,000 residents

Why it matters:

- It makes state-to-state public burden easier to understand.

Why it is not immediate:

- Population denominators must be sourced and dated.
- District boundaries and court districts may not map cleanly to census districts.

### Case-Level Duration

Examples:

- median time from filing to disposal
- share of disposed cases older than 5 years
- reopened or transferred case patterns

Why it matters:

- It moves from pending-stock estimates to actual lifecycle duration.

Why it is not immediate:

- It requires case-level records and a much larger reproducibility burden.

### Conviction Rate

Do not add this to the core delay product.

It belongs, if ever, in a separate criminal-justice outcomes module because:

- it is criminal-case-only
- it depends on outcome classification, not just pendency
- denominator choices can mislead
- it is not comparable across Supreme Court, High Courts, and lower courts in the same way backlog and clearance signals are

## Recommended Implementation Order

Implementation status:

1. Done: preserve lower-court filed/cleared counts and age buckets in the public snapshot schema, JSON endpoints, and CSV exports.
2. Done: add old-case burden share to lower-court state and district pages.
3. Done: add backlog movement as share of pending load to Supreme Court, High Court, and lower-court overview pages.
4. Done: add break-even clearances needed as a plain-language companion to clearance pace.
5. Done: add watchlist persistence to district pages and the movers surface.
6. Done: add backlog concentration to lower-court state pages and High Court overview pages where case-type source support exists.
7. Done: add civil-criminal imbalance to Supreme Court and High Court pages.
8. Only after those ship, evaluate judge-adjusted pressure and population-normalized pressure as sourced-data expansion projects.

## Public Copy Rules

- Say `filed` and `cleared`, not `instituted` and `disposed`, outside methodology and raw source labels.
- Say `cases`, not `matters`, unless quoting a fixed legal/source phrase.
- Describe scenario metrics as scenarios, not predictions.
- Describe repeated pressure as a signal, not a verdict.
- Keep cross-tier comparisons limited to shared concepts like backlog pressure and clearance pace; do not flatten tier-specific semantics into one national scoreboard.
