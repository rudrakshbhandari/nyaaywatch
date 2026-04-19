# National Product Architecture

Product architecture for NyaayWatch as a national judicial observability layer across all court tiers.

This document answers one strategic question:

- what should the final NyaayWatch product look like once it covers the Supreme Court, High Courts, and district/subordinate courts inside one system?

It is intentionally product-level, not implementation-level. Use:

- `docs/LONG_TERM_DATA_STRATEGY.md` for data-source and trust-model evolution
- `docs/JUDICIARY_PUBLIC_DATA_LANDSCAPE.md` for the current public-source inventory
- `docs/MULTI_STATE_EXPANSION_GATES.md` for public expansion gates
- `docs/ACCELERATED_EXPANSION_PLAN.md` for rollout sequencing

## Bottom Line

NyaayWatch should become **one national judicial observability product for India**.

It should not become:

- three disconnected products for three court tiers
- one flat dashboard that pretends all tiers share one identical data model

The correct model is:

- one product
- one shared trust model
- one shared publication system
- tier-specific observability modules

In plain terms:

- Supreme Court, High Courts, and district/subordinate courts should live inside the same product shell
- each tier can have its own source pipeline, normalization rules, and methodology notes
- cross-tier comparisons should be added only where the methodology is actually defensible

## Product Thesis

NyaayWatch should be the public front door for understanding how the Indian judicial system is moving, from the apex court down to state and district layers.

The final product should let a user answer:

- what is happening at the Supreme Court right now in the latest published snapshot?
- what is happening across High Courts?
- what is happening in district and subordinate courts, state by state and district by district?
- where are the largest backlog, delay, and disposal signals in the system?
- how do those signals change over time within a tier?

The product should stay:

- snapshot-based, not live
- evidence-first, not speculative
- provenance-rich, not dashboard-theater
- tier-aware, not falsely uniform

## UX Principle

The final UX should be **top-down**.

When a user opens the site, the first view should begin at the Supreme Court layer, then move downward through High Courts and district/subordinate courts in one seamless experience.

But the UX must also make one fact legible quickly:

- the district/subordinate system holds most of the national case volume

So the homepage should start at the apex, while still situating the apex inside the full judicial stack.

## Homepage Structure

Recommended order:

1. National headline and trust strip
2. Supreme Court overview
3. High Courts overview
4. District/subordinate courts overview
5. Drilldown entry points
6. Methodology, exports, and API trust surfaces

### 1. National Headline And Trust Strip

Above the fold:

- one-sentence explanation of NyaayWatch
- latest published snapshot date
- freshness state
- methodology version
- source attribution

### 2. Supreme Court Overview

The first major section on the homepage should show:

- total pending cases
- instituted in last month
- disposed in last month
- short trend context
- one or two significant tier-specific signals

### 3. High Courts Overview

The next section should show:

- aggregate High Court pendency
- institution/disposal context
- one or two structural signals such as age burden or large shifts
- a clear path into the High Court layer

### 4. District/Subordinate Courts Overview

The third section should show:

- the scale of the lower-court system
- national or state-entry context
- clear explanation that this layer carries most of the total system volume
- path into state and district exploration

### 5. Drilldown Entry Points

The user should be able to move naturally into:

- Supreme Court detail
- national High Courts view
- individual High Court view
- district/subordinate national view
- state lower-court view
- district evidence page

### 6. Trust Surfaces

The homepage should end with or persistently expose:

- methodology
- data downloads
- API docs
- caveats on scope and snapshot semantics

## Information Architecture

The product should converge toward this route structure:

- `/`
  - national overview across all tiers
- `/supreme-court`
  - Supreme Court observability
- `/supreme-court/methodology`
  - Supreme Court methodology and caveats
- `/high-courts`
  - national High Courts overview
- `/high-courts/:courtSlug`
  - individual High Court observability page
- `/high-courts/:courtSlug/methodology`
  - High Court-specific methodology and caveats
- `/district-courts`
  - national lower-court overview
- `/states/:stateSlug`
  - state lower-court overview
- `/states/:stateSlug/districts`
  - district browsing workspace
- `/states/:stateSlug/districts/:districtSlug`
  - district evidence page
- `/methodology`
  - shared methodology frame plus tier-specific links
- `/data`
  - public exports
- `/api`
  - public read-model documentation

This should still feel like one product, because the user is moving through one judicial system map rather than crossing between unrelated tools.

## Shared Product Layer

These parts should be common across every tier:

- brand and navigation
- trust-strip language
- snapshot and freshness semantics
- publication lifecycle
- replay and rollback model
- API and export naming conventions
- evidence and methodology posture

Every public surface should continue to show:

- source snapshot date
- publication timestamp
- freshness / quality state
- methodology version
- source attribution
- caveats where needed

## Tier Modules

The product shell should stay unified, but the underlying observability logic should remain tier-aware.

### Supreme Court Module

Focus:

- national apex-court observability
- pendency, institution, disposal, age, coram-aware signals where defensible
- official Supreme Court source links for judgments, orders, and notices

### High Courts Module

Focus:

- national High Court layer plus individual High Court drilldowns
- pendency, institution, disposal, age buckets, case-type mix
- tier-aware signals without pretending High Courts work like district systems

### District/Subordinate Module

Focus:

- national lower-court entry point
- state and district drilldowns
- district ranking and watchlist logic where methodology supports it

## Shared Publication Envelope

Every tier should publish through the same envelope fields:

- `courtTier`
- `geographyScope`
- `sourceSnapshotAt`
- `publishedAt`
- `qualityState`
- `methodologyVersion`
- `sourceUrls`
- `publicationId`
- lineage fields for replay and rollback

This keeps the trust model unified even while tier semantics differ.

## Tier-Specific Normalized Models

Below the shared envelope, each tier should keep its own normalized schema.

### Supreme Court Snapshot

Expected to include only what is defensible from the official source shape, such as:

- pending cases
- instituted and disposed counts
- registered and unregistered distinctions where present
- age or category breakdowns where exposed
- coram or bench-related signals where publicly available and stable

### High Court Snapshot

Expected to include:

- pending cases
- instituted and disposed counts
- age buckets
- case-type breakdowns
- High Court-specific operational signals where the source exposes them

### District/Subordinate Snapshot

Expected to include:

- pending cases
- instituted and disposed counts
- age buckets
- state and district hierarchy
- district-level derived signals and historical ranking logic

## Comparability Rules

NyaayWatch should distinguish between:

- metrics that are truly comparable across tiers
- metrics that are comparable only within a tier
- metrics that should remain tier-specific

### Safe Shared Metrics

These are the most plausible candidates for shared cross-tier display:

- total pending cases
- instituted in last month
- disposed in last month
- broad age-bucket burden where the bucket semantics align

### Tier-Bounded Metrics

These should stay within their tier unless methodology later proves otherwise:

- district rank
- watchlist membership
- coram-wise pending cases
- registered vs unregistered distinctions
- bench-specific signals
- stage and listing semantics

### Hard Rule

Do not ship one national ranking table that mixes Supreme Court, High Courts, and district/subordinate courts into one implied leaderboard until the methodology explicitly supports that claim.

## Data And Source Direction

The product should keep one common strategic posture:

- public trust-critical surfaces continue to read from published snapshots
- deeper case-level, order, and judgment layers can grow behind the same product later
- deeper data should enrich the product without silently replacing the snapshot truth layer

That means NyaayWatch can evolve into a deeper system without abandoning the current publication discipline.

## Implementation Implication

The final product architecture and the rollout sequence are not the same thing.

The product architecture should be designed now as one national top-down system.

The rollout sequence can still be:

1. district/subordinate court foundation
2. Himachal High Court pilot
3. High Court wave rollouts
4. Supreme Court module
5. later cross-tier synthesis improvements

This is not a contradiction. It is the normal way to build the final shape without lying about current coverage.

## Current Source Reality, Verified 2026-04-18

The current official public source landscape already supports thinking in three related tiers:

- Supreme Court NJDG:
  - [scdg.sci.gov.in/scnjdg](https://scdg.sci.gov.in/scnjdg/)
- High Court NJDG:
  - [njdg.ecourts.gov.in/hcnjdg_v2](https://njdg.ecourts.gov.in/hcnjdg_v2/)
- District NJDG:
  - [njdg.ecourts.gov.in/njdg_v3](https://njdg.ecourts.gov.in/njdg_v3/)
- e-Committee NJDG overview:
  - [ecommitteesci.gov.in/service/national-judicial-data-grid](https://ecommitteesci.gov.in/service/national-judicial-data-grid/)
- Department of Justice NJDG overview:
  - [doj.gov.in/the-national-judicial-data-grid-njdg](https://www.doj.gov.in/the-national-judicial-data-grid-njdg)

This source shape is a strong argument for one product with tier-aware modules rather than one undifferentiated dashboard.

## Decision

NyaayWatch should explicitly commit to this product direction:

- one national judicial observability layer
- one top-down product experience
- one trust model
- multiple tier-specific pipelines and methodology tracks

That is the scalable path to covering the country without weakening rigor.
