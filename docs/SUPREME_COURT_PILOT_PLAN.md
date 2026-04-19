# Supreme Court Pilot Plan

Execution plan for the Supreme Court tier as the next public top-down module inside NyaayWatch.

This document turns the national product architecture into a concrete next planning slice after the Himachal High Court public beta.

Use this plan when the question is:

- what exactly should we build next for Supreme Court?
- how should Supreme Court fit the one-product national NyaayWatch shell?
- how should the homepage begin with Supreme Court context without hiding the larger judicial system beneath it?

This plan assumes:

- the district/subordinate public rollout is already live
- the Himachal High Court public beta is live
- NyaayWatch remains one product with tier-specific methodology tracks

## Why This Pilot Exists

NyaayWatch now has:

- a live lower-court observability layer
- a live narrow High Court beta for Himachal
- a product architecture that aims for one national judicial observability layer across all tiers

The next public top-down move should not be "more High Court pages first."

It should be:

- add the Supreme Court module that gives the homepage its final top-level anchor

Why Supreme Court next:

- it is the natural opening layer for the final product UX
- the official source surface already exists and is structured
- it lets the homepage tell a national judicial story without waiting for all High Courts to be public
- it clarifies the top-down product shell before broader High Court UX expansion

## Current Implementation Status

The repo now has the internal Supreme Court scaffold:

- a dedicated Supreme Court source and profile module
- stored-evidence capture and deterministic aggregate extraction
- Supreme Court snapshot-candidate and published-snapshot schemas
- internal operator lifecycle under `/operator/supreme-court/...`
- local and remote operator CLI support
- the first live Supreme Court proof cycle recorded in `docs/SUPREME_COURT_INTERNAL_READINESS_REVIEW.md`

What it does **not** have yet:

- repeated live Supreme Court proof cycles across separate windows on the deployed stack
- a public `/supreme-court` route family
- a finished public methodology page for the Supreme Court tier

## Product Position

Supreme Court should ship as:

- the apex-court module inside NyaayWatch
- the first section of the eventual national homepage

It should not ship as:

- a separate product
- a generic "India overview" placeholder with no tier semantics
- a cross-tier ranking engine

## Pilot Goal

Build a narrow, trustworthy, snapshot-based Supreme Court observability surface that:

- reads from stored evidence
- uses tier-specific normalization
- publishes through the existing replayable publication system
- becomes the top-of-funnel entry point for the final homepage UX
- links naturally into High Courts and district/subordinate courts without faking comparability

## Non-Goals

This pilot is not trying to become:

- a Supreme Court case search engine
- a judgment archive
- a live hearing or bench tracker
- a unified national leaderboard across all tiers
- the final homepage redesign in one step

## Source Boundary

The pilot should use only the narrowest official source set needed for a first trustworthy release.

Primary sources:

- Supreme Court NJDG for aggregate observability
- the official Supreme Court website for case status, cause list, daily orders, judgments, office reports, and related link-outs

Working rule:

- NyaayWatch should ingest aggregate Supreme Court observability first
- NyaayWatch should link out to official case and document surfaces before trying to ingest case records or PDFs

## Product Shape In The Final Architecture

This pilot should be designed as part of the final national shell described in `docs/NATIONAL_PRODUCT_ARCHITECTURE.md`.

That means:

- the homepage can begin with Supreme Court context
- the user can move from Supreme Court to High Courts and then to district/subordinate courts in one flow
- Supreme Court remains a distinct tier module rather than an alias for "national"

## Proposed Routes

For the pilot, add or reserve this route family:

- `/supreme-court`
  - Supreme Court overview page
- `/supreme-court/data`
  - Supreme Court data and export notes
- `/supreme-court/methodology`
  - Supreme Court methodology and caveats
- `/supreme-court/api`
  - Supreme Court API documentation
- `/v1/supreme-court/stats`
  - Supreme Court overview payload
- `/v1/supreme-court/trends`
  - Supreme Court trend payload

Do not overload:

- `/`
- `/high-courts`
- `/states/:stateSlug`

Supreme Court should be a first-class tier namespace.

## Proposed Data Model Boundary

The pilot should reuse the shared publication envelope and add a Supreme Court-specific normalized snapshot model.

### Shared Publication Envelope

Reuse the platform-wide fields:

- `courtTier`
- `geographyScope`
- `sourceSnapshotAt`
- `publishedAt`
- `qualityState`
- `methodologyVersion`
- `sourceUrls`
- `publicationId`
- replay / rollback lineage

### Supreme Court Snapshot

Expected first-pilot fields:

- `courtTier=supreme_court`
- `courtSlug=supreme-court`
- `courtName=Supreme Court of India`
- `sourceSnapshotAt`
- `referenceDateAt`
- `referenceDateKind`
- `pendingRegisteredCases`
- `pendingUnregisteredCases`
- `pendingTotalCases`
- `institutedLastMonthCases`
- `disposedLastMonthCases`
- `institutedCurrentYearCases`
- `disposedCurrentYearCases`
- optional coram-wise pending views only if repeated captures make them stable enough to normalize

Do not add:

- High Court-style geography selectors
- district ranking logic
- case-level normalized entities in the first pilot

## Methodology Questions To Resolve Before Public Beta

The Supreme Court pilot needs a tier-specific methodology note before public launch.

It must answer:

1. Which fields are directly sourced from Supreme Court NJDG?
2. Which fields are NyaayWatch-derived?
3. How should registered and unregistered pending be presented?
4. What is comparable over time within the Supreme Court tier?
5. What should explicitly not be compared against High Court or district/subordinate data yet?
6. Are coram views safe for public beta, or should they wait?
7. What timestamp contract is actually defensible from stored evidence?

Hard rule:

- if a Supreme Court metric cannot be explained calmly and exactly from stored evidence, do not ship it

## UX Scope For The First Public Beta

The first public Supreme Court release should be narrow.

It should include:

- one Supreme Court overview page
- headline pending and movement metrics
- trust metadata and freshness
- explicit registered / unregistered treatment
- trend context if historical snapshots exist
- links to official Supreme Court case status, orders, judgments, and cause lists

It should not include:

- a national "all courts" ranking surface
- a mixed tier leaderboard
- broad High Court comparisons on the same page

## Homepage Integration

If Supreme Court becomes the next public tier, the homepage should evolve in this order:

1. trust strip
2. Supreme Court module
3. High Court module
4. district/subordinate module
5. drilldown links

The Supreme Court section should tell the user:

- what is happening at the apex
- when the data was captured and published
- where to go next for High Courts and district/subordinate courts

The page should also make one fact legible quickly:

- most national case volume still sits below the Supreme Court

## Implementation Phases

### Phase 1: Source Review And Contract

Outcome:

- the repo has a written and defended source contract for Supreme Court

Tasks:

- document the official source URLs and their roles
- confirm which aggregate metrics are present and stable
- record how registered / unregistered semantics should be handled
- write the first Supreme Court methodology outline

Done when:

- the source boundary is specific enough that ingestion can begin without guesswork

### Phase 2: Capture, Extract, Normalize

Outcome:

- Supreme Court aggregate data can be captured and extracted deterministically from stored evidence

Tasks:

- add a Supreme Court source client
- capture the official aggregate source HTML and supporting payloads
- extract the first narrow metrics set deterministically
- define the source-date contract without inventing timestamps

Done when:

- stored evidence can produce the same normalized Supreme Court snapshot repeatedly

### Phase 3: Internal Operator Lifecycle

Outcome:

- Supreme Court can run through `fetch -> inspect -> publish -> replay -> rollback`

Tasks:

- add a dedicated operator namespace
- persist Supreme Court snapshot candidates and published snapshots
- add tests for publication, replay, and rollback

Done when:

- the tier can accumulate internal proof cycles with no public exposure yet

### Phase 4: Public Beta

Outcome:

- the public `/supreme-court` surface is live

Tasks:

- expose the narrow public route family
- keep the page published-only
- surface methodology and trust metadata clearly
- verify live route behavior and record release evidence

Done when:

- the public module is live and honest, with no fake cross-tier synthesis

## Done Criteria Before Public Beta

Before any public Supreme Court beta, require all of these:

- real stored raw capture from the official Supreme Court aggregate source
- deterministic extract and normalize from stored evidence
- fixture-backed parser and normalizer tests
- `fetch -> inspect -> publish -> replay -> rollback` working end to end
- public trust metadata parity across page, API, and export surfaces
- tier-specific methodology reviewed
- at least 2 successful internal cycles across distinct windows

## Relationship To High Courts

This plan does not reverse the Himachal High Court beta.

Instead:

- Himachal High Court stays live as the first High Court proof surface
- Supreme Court becomes the next public top-down tier
- broader High Court UX expansion should happen after the Supreme Court shell is defined

That keeps the product aligned with the final top-down UX without discarding real High Court progress.

## Decision

Proceed with Supreme Court as the next public planning and implementation track before broader High Court UX expansion.

This is the cleanest route to the final NyaayWatch product:

- one national shell
- Supreme Court first on entry
- High Courts beneath it
- district/subordinate courts beneath that
