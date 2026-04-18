# Himachal High Court Pilot Plan

Execution plan for the first High Court tier pilot inside NyaayWatch.

This document turns the national product architecture into a concrete next implementation slice.

Use this plan when the question is:

- what exactly should we build next for High Courts?
- how should Himachal High Court fit into the one-product national NyaayWatch shell?
- what has to be true before any High Court public beta or multi-High-Court wave begins?

This plan assumes the current district/subordinate rollout is already live and that NyaayWatch remains one product with tier-specific methodology tracks.

## Why This Pilot Exists

NyaayWatch now has:

- a live lower-court observability layer across the current approved state set
- one shared publication model with stored evidence, snapshots, replay, and rollback
- a product direction that now explicitly converges toward one national judicial observability layer across all tiers

The next meaningful expansion is not "add another state."

It is:

- prove that a new court tier can fit into the same product shell without weakening the trust model

Himachal High Court is the correct first tier pilot because:

- Himachal remains the repo's reference geography
- the product already speaks in Himachal-first terms
- the High Court source surface is public and legible enough to support a narrow pilot
- it lets NyaayWatch test tier expansion without taking on a multi-High-Court wave immediately

## Product Position

Himachal High Court should ship as:

- the first High Court observability module inside NyaayWatch

It should not ship as:

- a separate product
- a hidden internal-only fork with no public UX destination
- a flat extension of the district ranking model

The user-facing implication is:

- NyaayWatch remains one product
- High Court becomes the next tier inside that product
- the first concrete High Court page is Himachal High Court

## Pilot Goal

Build a narrow, trustworthy, snapshot-based Himachal High Court observability surface that:

- reads from stored evidence
- uses tier-specific normalization
- publishes through the existing replayable publication system
- exposes trust metadata and methodology with the same discipline as the lower-court layer
- fits the long-term national top-down UX instead of creating a parallel product path

## Non-Goals

This pilot is not trying to become:

- a full Himachal High Court case search engine
- a PDF archive
- a judgment text corpus
- a cross-tier ranking engine
- a national High Court rollout
- a Supreme Court implementation

## Source Boundary

The pilot should use only the narrowest public-source set needed for a first trustworthy release.

Primary sources:

- HC NJDG for Himachal High Court aggregate observability
- official High Court service links for case status, cause lists, orders, and judgments
- official Himachal High Court site only where it provides durable supporting context or official links

Working rule:

- NyaayWatch should ingest aggregate High Court observability data first
- NyaayWatch should link out to official case/order surfaces before trying to ingest case-level records or PDFs

## Product Shape In The Final Architecture

This pilot should be designed as part of the final national shell described in `docs/NATIONAL_PRODUCT_ARCHITECTURE.md`.

That means:

- the top-level product remains one NyaayWatch experience
- High Court sits as the middle layer between Supreme Court and district/subordinate courts
- Himachal High Court is the first concrete High Court drilldown page

The pilot does not need the full national shell implemented first.

But it should avoid route or data choices that would force a redesign later.

## Proposed Routes

For the pilot, add or reserve this route family:

- `/high-courts`
  - national High Court landing placeholder or internal shell
- `/high-courts/himachal`
  - Himachal High Court overview page
- `/high-courts/himachal/methodology`
  - Himachal High Court methodology and caveats
- `/v1/high-courts/himachal/stats`
  - High Court overview API payload
- `/v1/high-courts/himachal/trends`
  - High Court trend API payload

Do not overload:

- `/states/:stateSlug`
- `/districts`
- existing lower-court endpoints

High Court should be a first-class tier namespace.

## Proposed Data Model Boundary

The pilot should reuse the shared publication envelope and add a High Court-specific normalized snapshot model.

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

### Himachal High Court Snapshot

Expected first-pilot fields:

- `courtTier=high_court`
- `courtSlug=himachal`
- `courtName`
- `sourceSnapshotAt`
- `pendingCivil`
- `pendingCriminal`
- `pendingTotal`
- `institutedLastMonthCivil`
- `institutedLastMonthCriminal`
- `institutedLastMonthTotal`
- `disposedLastMonthCivil`
- `disposedLastMonthCriminal`
- `disposedLastMonthTotal`
- age buckets:
  - less than 1 year
  - 1 to 3 years
  - 3 to 5 years
  - 5 to 10 years
  - above 10 years
- optional case-type breakdowns only if the source shape is stable enough to normalize confidently
- tier-specific derived signals that are explicitly documented

Do not add:

- district rank logic
- watchlist logic copied from the lower-court layer without review
- case-level or order-level normalized entities in the first pilot

## Methodology Questions To Resolve Before Public Beta

The High Court pilot needs a tier-specific methodology note before public launch.

It must answer:

1. Which fields are directly sourced from HC NJDG?
2. Which fields are NyaayWatch-derived?
3. Are registered and unregistered distinctions relevant for the Himachal High Court view, and if so how will they be presented?
4. Which age buckets are directly comparable to the lower-court layer, if any?
5. What signals are safe to frame as "flagged" at High Court tier?
6. What can be compared over time within Himachal High Court?
7. What should explicitly not be compared against district/subordinate data yet?

Hard rule:

- if a High Court metric cannot be explained calmly and exactly from stored evidence, do not ship it

## UX Scope For The First Public Beta

The first public Himachal High Court release should be narrow.

It should include:

- one High Court overview page
- headline metrics
- trend context if historical snapshots exist
- age-bucket burden
- freshness and methodology strip
- explicit source attribution
- links to official High Court case status, order, and judgment surfaces

It should not include:

- national High Court comparisons unless the pilot proves the common model first
- broad "all High Courts" ranking UI
- mixed Supreme Court / High Court / district leaderboard surfaces

## Implementation Phases

### Phase 1: Source Review And Contract

Outcome:

- the repo has a written and defended source contract for Himachal High Court

Tasks:

- document the official source URLs and their roles
- confirm which aggregate metrics are present and stable
- record redistribution posture for raw artifacts versus normalized outputs
- write the first High Court methodology outline

Done when:

- the source boundary is specific enough that ingestion can begin without guesswork

### Phase 2: Capture, Extract, Normalize

Outcome:

- Himachal High Court aggregate data can be converted into a deterministic snapshot candidate

Tasks:

- add High Court source capture support
- add stored raw artifact handling
- add extract and normalize steps for the High Court source shape
- create representative fixtures
- add regression coverage for deterministic replay

Done when:

- the same stored input yields the same normalized output

### Phase 3: Internal Publication Flow

Outcome:

- the pilot works through the same operator boundary as the rest of NyaayWatch

Tasks:

- integrate High Court candidates into run inspection
- publish through the current publication lineage model
- support replay and rollback
- ensure publication records stay unambiguous even with mixed tiers

Done when:

- `fetch -> inspect -> publish -> replay -> rollback` works for Himachal High Court

### Phase 4: Internal Read Surface

Outcome:

- there is an internal-only read surface for validating the public model

Tasks:

- implement the High Court overview page
- implement High Court API endpoints
- implement trust-strip and methodology scaffolding
- verify page/API/export parity where applicable

Done when:

- an internal reviewer can validate the complete High Court observability surface without manual data spelunking

### Phase 5: Public Beta Decision

Outcome:

- NyaayWatch can decide whether Himachal High Court is ready for a narrow public beta

Required gates:

- source viability is clear
- extract and normalize are deterministic
- stored raw evidence exists
- methodology is written
- trust metadata appears near every public metric
- replay and rollback are tested
- at least three successful internal cycles exist across distinct windows

Decision values:

- `approved for public beta`
- `approved for internal-only continuation`
- `blocked`

## Testing Requirements

At minimum, add:

- fixture-backed parser tests for the High Court source
- normalization regression tests
- publish gating tests
- replay / rollback tests for the High Court tier
- route tests for the High Court API and HTML pages

If the public beta is shipped, also add:

- browser trust-surface checks for the Himachal High Court page
- parity checks across HTML and API

## Rollout Rule After Himachal

Do not jump from one working Himachal High Court page to "all High Courts."

The next step after a successful Himachal beta should be:

- a small High Court wave

Wave selection should optimize for:

- source-shape similarity
- stable metric availability
- low methodology exceptions
- repeatable internal proof cycles

The first wave should be chosen only after Himachal High Court has stayed stable across multiple release windows.

## Relationship To Supreme Court

This pilot does not block the long-term Supreme Court layer.

But it should come first because:

- it is structurally closer to the current lower-court aggregate observability model
- it proves tier expansion inside the common product shell
- it reduces the risk that Supreme Court becomes a one-off apex page with no reusable tier architecture

## Recommended Immediate Tasks

Do these next:

1. add a Himachal High Court source-review doc
2. add a High Court methodology draft
3. scaffold the High Court route and data namespaces
4. implement the High Court capture / normalize pipeline
5. prove internal publication and rollback
6. only then decide on public beta timing

## Definition Of Done

This pilot is done only when:

- Himachal High Court data is captured from stored evidence
- normalization is deterministic
- the operator flow works end to end
- the public-facing semantics are tier-specific and defensible
- the pilot clearly fits the final one-product national architecture
- the repo has an explicit basis for choosing the first multi-High-Court wave
