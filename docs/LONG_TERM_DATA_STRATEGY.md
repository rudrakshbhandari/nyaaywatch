# Long-Term Data Strategy

Decision document for how NyaayWatch should evolve its data inputs without breaking the current trust model.

This doc exists to answer three questions clearly:

1. Is the current NJDG aggregate-snapshot model the right foundation?
2. When should NyaayWatch add case-level records, orders, judgments, or faster-moving feeds?
3. Which public metrics come directly from government dashboards versus NyaayWatch's own calculations?

## Bottom Line

Yes, the current strategy is the right foundation.

NyaayWatch should keep **aggregate public snapshots** as the canonical public truth layer, even as it grows into a deeper internal data system over time.

Long term, the product should become a **hybrid system**:

1. aggregate snapshot layer for public trust-critical metrics
2. case-level research layer for investigation and QA
3. document metadata layer for orders and judgments
4. selective document-text and richer event ingestion only where source quality, terms, and reproducibility support it

The mistake would be treating full records, PDFs, or real-time surfaces as the first and only foundation. That would increase theoretical flexibility, but it would also sharply increase fragility, ambiguity, and product risk.

## Why The Current Foundation Is Right

The current NJDG aggregate approach has four major advantages:

- it is reproducible because each public publication ties back to one stored snapshot date
- it is state-expandable because district/subordinate court NJDG pages are relatively similar across states
- it is easier to audit because the parser extracts a small, legible metric set instead of a huge event graph
- it keeps public claims narrow enough to defend

This is the correct posture for a public-interest product whose first job is trust, not maximal data volume.

## Why Not Switch To Full-Record-First

NyaayWatch should eventually work with deeper data, but full-record-first should not replace the current public foundation.

Problems with making case-level records, PDFs, and fast-moving feeds the primary source of truth too early:

- state-to-state schemas are inconsistent
- document availability and upload quality are uneven
- OCR and parsing quality are hard to defend publicly
- redistribution and privacy posture become much more complicated
- storage and compute costs rise quickly
- replay and audit become harder because the input surface is much larger and noisier
- "latest" becomes operationally tempting even when the upstream systems still lag or disagree

In short: it increases product power, but it also increases the chance of shipping something impressive-looking and untrustworthy.

## Recommended Long-Term Architecture

### Layer 1: Canonical Public Snapshot Layer

This remains the source for:

- homepage toplines
- district rankings
- state trends
- watchlist signals
- CSV exports
- public API read models

Properties:

- published, not live
- dated
- reproducible from stored evidence
- methodology-versioned
- easy to explain

### Layer 2: Case-Level Research Layer

This should be added later as an internal-first layer.

Use it for:

- validating unusual aggregate shifts
- investigating a flagged district or court
- reporter/research workflows
- checking whether aggregate anomalies reflect real underlying case movement
- building future drill-down products where quality is high enough

This layer should not automatically become the public homepage truth source.

### Layer 3: Order And Judgment Metadata Layer

Before trying to ingest every PDF as text, prefer a metadata-first approach:

- case or matter identifier when available
- court and bench
- order or judgment date
- document type
- upload timestamp
- official document URL

This creates useful structure without immediately taking on full OCR or full-text quality claims.

### Layer 4: Selective Document Text And Faster Signals

Only add full PDF extraction, text pipelines, or near-real-time feeds where all of the following are true:

- the user value is clear
- the source posture is acceptable
- the extraction is deterministic enough to audit
- the output can be labeled with clear confidence and caveats

Even then, public trust-critical surfaces should continue to publish reviewed snapshots rather than pretending the whole system is real-time.

## Roadmap

### Stage 1: Strengthen The Snapshot Observatory

Target horizon: `now -> next 6 months`

Primary goal:

- make the aggregate observability model robust across more states before widening the data model

Focus:

- keep NJDG aggregate district dashboards as the canonical public input
- support at least daily capture capability
- keep operator-controlled publish, replay, and rollback as the release model
- expand state-by-state only where the source shape is stable
- make sourced-versus-derived labeling explicit in docs, API fields, and exports
- improve release evidence and freshness discipline rather than adding deeper raw inputs too early

Public product posture:

- snapshot-based
- aggregate-first
- evidence-first
- no real-time claims

### Stage 2: Add Internal Deeper Data Pilots

Target horizon: `~6 to 18 months`

Primary goal:

- introduce deeper data without breaking the public trust boundary

Focus:

- pilot case-level ingest for a narrow court cohort or one state
- add order/judgment metadata capture before broad PDF-text extraction
- build internal investigation tools for anomaly review
- test linkages between aggregate shifts and underlying case/document activity
- document court-tier-specific differences instead of assuming one national schema

Public product posture:

- public toplines still come from published aggregate snapshots
- deeper data appears first as supporting evidence or operator tooling, not as a silent replacement of the public source layer

### Stage 3: Expand To A Hybrid Multi-Layer Platform

Target horizon: `18 months+`

Primary goal:

- combine trusted public observability with selectively deep record coverage

Focus:

- broader case-level coverage where terms and quality support it
- selective document-text extraction where quality is defensible
- richer court-tier products for High Courts and Supreme Court
- near-real-time internal alerting where useful
- explicit labels for which surfaces are snapshot-based, event-based, or document-derived

Public product posture:

- published snapshots remain the canonical citation layer
- richer live or quasi-live surfaces should be clearly separated from the published observability layer

## Current Government-Sourced Inputs

The current implementation takes these fields from public NJDG district dashboard pages:

- state and district names/codes from the district selector
- source snapshot date from the dashboard's own "Last Reviewed and Updated on" field
- total pending/open cases
- cases instituted in the last month
- cases disposed in the last month
- age-bucket totals for pending cases:
  - less than 1 year
  - 1 to 3 years
  - 3 to 5 years
  - 5 to 10 years
  - above 10 years

These are the public-source facts NyaayWatch currently extracts for both the state page and each district page.

## Current NyaayWatch-Derived Metrics

NyaayWatch currently calculates or assigns the following:

- `disposalRate`
  - derived as disposed last month divided by instituted last month, expressed per 100
- `filingVsDisposalGap`
  - derived from the difference between instituted and disposed cases in the latest month
- `medianCaseAgeDays`
  - estimated by locating the midpoint of pending cases across the published age buckets and mapping that bucket to a representative day count
- district rank
  - derived by sorting districts by backlog size, then by estimated median age
- watchlist membership
  - currently the top `3` districts after ranking
- `flagReason`
  - rule-based explanation written from the derived metrics and state comparison context
- district summary text
  - human-readable explanation generated from the extracted and derived values
- trend series
  - built from NyaayWatch's own stored history of prior published snapshots
- `qualityState`
  - assigned as `complete`, `partial`, or `stale` based on capture completeness and freshness rules
- methodology version
  - assigned by NyaayWatch to version the transform logic behind the publication
- publication timestamp and lineage
  - assigned by NyaayWatch during publish/replay/rollback flows

## What NyaayWatch Is Committing Itself To

As long as the current model remains in place, NyaayWatch is committing to:

- every public metric must point back to a stored source snapshot
- every publication must show the source snapshot date
- every derived formula must be explainable in plain English
- sourced facts and NyaayWatch-derived values must stay distinguishable
- public surfaces must not imply real-time accuracy when they are snapshot-based
- raw upstream captures remain internal unless the exposure policy changes intentionally

## Decision Rules For Adding Deeper Inputs

NyaayWatch should add case-level records, PDFs, or faster feeds only when all of these are true:

1. the user job is clear and important
2. the source posture is acceptable
3. the extraction can be replayed and audited
4. the added complexity improves the product more than it weakens trust
5. the resulting claims can still be explained calmly and exactly

## Anti-Goals

This roadmap does not justify:

- replacing the public snapshot layer with a "live" crawl of everything
- promising full nationwide case-level parity in the near term
- making PDF text extraction a prerequisite for state expansion
- silently mixing sourced facts and NyaayWatch calculations in one undifferentiated metric layer

## Practical Rule

If there is a conflict between:

- wider coverage, deeper data, or faster updates

and:

- reproducibility, provenance, and claim discipline

NyaayWatch should choose the second set first.
