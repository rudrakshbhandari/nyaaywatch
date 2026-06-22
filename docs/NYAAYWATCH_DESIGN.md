# NyaayWatch Design

Source of truth for product-specific route hierarchy, trust-surface rationale, and IA decisions. Earlier single-state launch language has been superseded by the current India-first public alpha described in `README.md` and `docs/INDIA_COURT_COVERAGE_AUDIT.md`.

## Canonical Product Definition

NyaayWatch makes Indian court-system data transparent and usable so the public can hold the judiciary accountable across India's Supreme Court, High Courts, and district/subordinate courts through reviewed, versioned snapshots.

## Problem Statement

Build a public judicial observability layer for India that keeps each court tier methodologically honest. The current product covers the Supreme Court, all 25 High Courts, and all 36 lower-court state and Union Territory geographies, while avoiding fake cross-tier comparability or unsupported live-data claims.

The public alpha should let an ordinary citizen, reporter, or civic group answer:

- How large is the backlog in the Supreme Court, a High Court, a state, a Union Territory, or a district?
- Which geographies are getting worse within a comparable tier?
- How old are pending cases?
- Is filing outpacing disposal?
- Which districts or courts show pressure signals in the latest published snapshot?

## Release Posture

NyaayWatch v1 should remain a clearly labeled public alpha with:

- explicit scope limits
- explicit data caveats
- visible freshness and methodology metadata
- clear language that all public metrics come from reviewed snapshots, not live or predictive analysis

## Open Source Posture

NyaayWatch should be genuinely open source for:

- pipeline code
- normalization logic
- schemas and API contracts
- methodology docs
- formula / transform / anomaly-rule changelogs

Raw snapshot redistribution remains source-aware and may require tighter rules than code and docs.

## Repository Shape

Start as a single repository with clear internal boundaries:

- `ingest/`
- `extract/`
- `normalize/`
- `warehouse/`
- `api/`
- `web/`
- `docs/`

## Development Workflow

NyaayWatch should assume a highly AI-native development workflow:

- heavy use of ChatGPT Pro and Codex
- rapid iteration on schemas, read models, tests, docs, and public copy
- explicit human review of formulas, methodology, caveats, and product claims

NyaayWatch should be AI-native in how it is built, not AI-branded in what it claims to be.

## Constraints

- no official self-serve API access assumed
- MVP relies on scraping aggregated NJDG dashboard views
- PDFs and case-level parsing are out of scope for alpha
- predictive or AI-forward claims are out of scope for alpha
- provenance is mandatory for every public metric
- collection posture must be publicly defensible

## Non-Goals

The alpha is not trying to become:

- a case-level search engine
- a PDF parsing system
- a judge-ranking product
- a predictive forecasting tool
- an AI legal analysis system
- a petitions or campaigning platform
- a general-purpose legal research suite
- a fake parity product that treats unlike court tiers as directly comparable
- a live real-time monitoring system
- a broad judicial API platform beyond the published snapshot read models

## Chosen Architecture

Snapshot Observatory:

- one India-first product shell across the Supreme Court, High Courts, and lower-court state/Union Territory geographies
- one trust model: every number comes from a dated public snapshot
- one public front door: a Supreme Court-first national overview with explicit lower-court drilldowns
- one urgency layer: anomaly callouts
- one enabling layer: public exports and developer-friendly API endpoints

The public front door stages multiple court tiers, but lower-court evidence stays explicit, tier-aware, and anchored to approved published snapshots rather than collapsing into one fake national scoreboard.

## Current Implementation Note

The repository now ships an India-first public alpha implementation of this architecture:

- one Node/TypeScript service with an operator boundary and public boundary
- server-rendered public pages for `/`, `/supreme-court`, `/high-courts`, `/high-courts/:courtSlug`, `/states/:stateSlug`, `/districts`, `/districts/:id`, `/data`, `/methodology`, and `/api`
- public JSON for `GET /v1/stats/himachal`, `GET /v1/districts`, and `GET /v1/trends`
- public Supreme Court and High Court beta routes with tier-specific methodology, data, and API surfaces
- explicit state/Union Territory-scoped public routes for all 36 lower-court NJDG selector geographies via `/states/:stateSlug/...` and `/v1/states/:stateSlug/...`
- PostgreSQL-backed run, publication, and published-snapshot state plus S3-backed raw evidence artifacts
- published district-history and CSV export surfaces that stay inside the active public snapshot lineage

Himachal remains only the legacy unscoped lower-court default for compatibility. It is no longer the product scope.

## Credit-Aware Infrastructure Direction

The user has confirmed access to `AWS $10k` in startup/student credits plus additional tooling credits from the YC student pack. That should influence implementation priority:

- prefer AWS for the first deploy rather than introducing a parallel hosting path
- use credits to fund the one-container app, PostgreSQL, S3 artifact storage, and logging around publish actions
- keep optional third-party credits in support roles only so the public product still stands on reproducible stored evidence even if those credits expire

## MVP Public Experience

Canonical homepage hero:

> Start at the Supreme Court. Then move down the system.

The first public page should include:

- Supreme Court headline plus apex-tier toplines
- compact freshness/source/methodology metadata in a supporting position
- High Courts beta section with only published-court entry cards, ordered by the clearest visible pressure signals rather than alphabetically
- district/subordinate courts section that opens the featured published lower-court snapshot without foregrounding one favored state in the homepage copy
- later state-coverage directory and drilldowns
- lightweight trust-action surfaces such as methodology, data, and API links

## Public Information Architecture

NyaayWatch alpha should feel like a public evidence front page, not a generic analytics dashboard. The first screen must answer three questions in order:

1. What is this?
2. Why should I trust it?
3. Where do I go to inspect my district?

### Homepage Hierarchy

The homepage should prioritize content in this order:

1. Supreme Court headline and one-sentence framing
2. Apex-tier toplines with a compact freshness/source/methodology line nearby
3. High Courts beta directory
4. District/subordinate courts handoff using the lower-court state and Union Territory coverage directory
5. Lower-court state coverage directory, issue watchrooms, and drilldowns
6. Supporting trust actions: methodology, data, API docs

The first viewport should be dominated by the Supreme Court story. Trust metadata must remain visible, but it should support the hero rather than leading it. Lower-court discovery belongs below the fold and on explicit state pages, not as a chip wall at the top of `/`.

### Homepage Screen Structure

```text
+---------------------------------------------------------------+
| Header: NyaayWatch | Supreme Court | High Courts | Districts  |
+---------------------------------------------------------------+
| Supreme Court headline                                        |
| One-sentence framing                                          |
| Compact accountability line: Snapshot | Methodology | Source  |
| Topline metric 1 | Topline metric 2 | Topline metric 3        |
| Primary actions: Open Supreme Court | Open High Courts        |
+---------------------------------------------------------------+
| High Courts beta directory                                    |
+---------------------------------------------------------------+
| District/subordinate courts handoff                           |
+---------------------------------------------------------------+
| Lower-court state coverage directory                          |
+---------------------------------------------------------------+
| Evidence / methodology / export support surfaces              |
+---------------------------------------------------------------+
```

### Navigation Flow

```text
Homepage
  -> Open statewide districts index
      -> Explore districts table, filters, and ranking views
  -> Open district permalink
      -> Read district explanation
      -> Inspect evidence and methodology context
      -> Download citation-ready CSV
  -> Open methodology page
  -> Open API docs
```

### Route Responsibilities

The alpha information architecture should separate overview from browsing so the product can scale beyond one state without turning the homepage into a dense control panel.

- `/` is the national front page for the latest published tier snapshots, toplines, pressure signals, and trust context
- `/districts` is the legacy unscoped district-browsing workspace for ranking, scanning, filtering, and opening district permalinks
- `/districts/:id` is the durable evidence page for a specific district in the legacy unscoped lower-court geography
- `/states/:stateSlug` is the explicit state/Union Territory-scoped overview page for supported lower-court geographies
- `/states/:stateSlug/districts` and `/states/:stateSlug/districts/:id` are the equivalent state-scoped district browsing and district evidence surfaces
- `/watch` is the issue-watchroom hub: a lower-court-only entry surface for choosing an inspection question before opening a route-specific evidence page
- `/watch/old-case-burden` is the first issue watchroom: a lower-court-only evidence page for old-case age buckets across public states and Union Territories, with missing-source states shown as missing rather than estimated
- `/watch/persistent-pressure` is the second issue watchroom: a lower-court-only evidence page for districts repeatedly flagged across recent published snapshots, with persistence framed as an inspection signal rather than a cause or verdict
- `/watch/backlog-concentration` is the third issue watchroom: a lower-court-only evidence page for geographies where pending cases are concentrated in a few districts, with district shares measured inside their own geography rather than as a national ranking
- `/methodology` explains formulas, caveats, snapshot semantics, and change history
- `/data` or an equivalent download surface handles CSV exports and public data access
- `/api` or equivalent docs surface explains the developer-facing read model

For alpha, the homepage may show a short preview of the district ranking, but it should hand off quickly to `/districts` for full browsing and `/watch` for issue-led inspection. This keeps the landing experience legible now and creates a clean place to absorb future state, metric, and filtering complexity.

### India-First IA Guardrail

The structure should preserve a consistent hierarchy across all lower-court geographies:

1. Geography overview page
2. Geography-specific district index
3. District evidence page

The alpha should not expose empty scaffolding such as disabled pickers, placeholder maps, or "coming soon" geography controls. It should state current coverage exactly: Supreme Court, all 25 High Courts, and all 36 lower-court state and Union Territory geographies, with tier-specific caveats where source shape or methodology differs.

### District Evidence Page Hierarchy

Each district page should answer, in order:

1. Why this district matters right now
2. What changed in the latest published snapshot
3. What evidence and caveats support that claim
4. How to cite or export the data

District pages should prioritize:

1. District name, rank or flagged status, and plain-language summary
2. Trust strip matching the homepage snapshot and methodology metadata
3. Key district metrics and directional change
4. Short anomaly explanation written as a flagged signal, not a verdict
5. Supporting chart or historical table
6. Citation metadata and CSV export actions
7. Caveats, quality state, and methodology links

District detail should not live primarily in modals, side panels, or expandable table rows. The district ranking table is the discovery surface; the district evidence page is the durable inspection and citation surface. Every district row should link to a dedicated permalink page that can be shared by reporters, civic groups, and citizens without requiring homepage context.

### District Evidence Page Structure

```text
+---------------------------------------------------------------+
| District name | Flagged status / rank                         |
| Plain-language summary                                        |
| Trust strip: Updated as of | Snapshot | Methodology | Source  |
+---------------------------------------------------------------+
| Key metric 1 | Key metric 2 | Key metric 3                    |
+---------------------------------------------------------------+
| Why this district is flagged                                  |
| Short evidence-backed explanation                             |
+---------------------------------------------------------------+
| Trend chart or historical table                               |
+---------------------------------------------------------------+
| Evidence pack | Download CSV                                  |
+---------------------------------------------------------------+
| Caveats | Quality status | Methodology links                  |
+---------------------------------------------------------------+
```

### Methodology And API Surface Placement

Methodology, download, and API docs are trust-supporting surfaces. They must be easy to reach from the header and footer, but they should not outrank the core public evidence workflow on the homepage.

## Public API

Current public endpoints:

- `GET /v1/stats/himachal`
- `GET /v1/districts`
- `GET /v1/trends`
- `GET /v1/states/:stateSlug/stats`
- `GET /v1/states/:stateSlug/districts`
- `GET /v1/states/:stateSlug/trends`
- `GET /v1/high-courts/:courtSlug/stats`
- `GET /v1/high-courts/:courtSlug/trends`
- `GET /v1/supreme-court/stats`
- `GET /v1/supreme-court/trends`

The API should expose the same evidence model the public page uses. No hidden richer truth than the public trust surface supports.

## Time To Justice Index

The `time_to_justice_index` remains in scope for alpha, but only as:

- a transparent system-stress score
- secondary to raw metrics and anomaly evidence
- relative within the relevant court-family cohort
- fully reproducible with public weights and formula versions
- stored as a derived fact with explicit lineage

It must not imply:

- exact expected wait time
- causal blame
- comparability across court families before the methodology explicitly supports it
- predictive forecasting or AI inference

## Anomaly Layer

Anomalies should be:

- rule-based
- reproducible
- cohort-relative within the relevant Supreme Court, High Court, or lower-court route family
- framed as flagged signals, not verdicts

## Freshness Promise

Alpha language should prefer:

- latest published snapshot
- updated as of
- last successful refresh

It should avoid:

- live
- real-time
- up to the minute

If the latest published snapshot is stale, NyaayWatch should continue showing it on public surfaces with a prominent freshness warning and trust context. The product should prefer "last trustworthy published snapshot with an explicit warning" over blank states or silent degradation.

## Interaction State Coverage

NyaayWatch must specify what the user sees in degraded states, not just what the backend stores. Trust is highest-risk when the data is stale, partial, or missing.

### Public Surface State Table

| Surface | Loading | Empty | Error | Success | Partial / Stale |
|---|---|---|---|---|---|
| Homepage `/` | Skeleton layout for headline, trust strip, metrics, and preview surfaces; no fake numbers | No published snapshot yet message, short explanation of what NyaayWatch is preparing, and links to methodology plus project status context | Calm error banner explaining the public snapshot could not be loaded, with a retry affordance and methodology link | Latest published Supreme Court hero, High Court section, lower-court handoff, trust strip, toplines, trends, and flagged signals | Continue showing last published snapshot with an amber freshness banner; if quality is partial, label affected metrics and point to caveats |
| District index `/districts` | Table skeleton with filter placeholders and note that rankings are loading from latest published snapshot | No districts available in current published snapshot, with explanation that publication is not ready or geography is not yet covered | Error banner above table with plain-language explanation and retry affordance | Sortable / scannable district table tied to the same published snapshot as the homepage | Rows with partial or inconsistent quality stay visible but are badged and may sort below fully trustworthy rows by default |
| District page `/districts/:id` | Skeleton for summary, trust strip, metrics, and chart | District not available in published coverage, with explanation of current geographic scope and a path back to the district index | Error state that preserves page shell and explains that district evidence could not be loaded | District summary, flagged explanation, evidence surfaces, export actions, and caveats | Keep district page visible with explicit badges for partial quality, stale snapshot, or changed methodology; never imply certainty the data does not have |
| Methodology `/methodology` | Text skeleton and section anchors loading | Not applicable | Error message with fallback link to the public repo docs if available | Formula explanations, caveats, change log, and snapshot semantics | If some methodology sections are unavailable, show the last published version with a note that a fuller update is pending |
| Data / API surfaces | Endpoint or download list skeletons without placeholder payload claims | No public downloads or endpoints for the selected court family yet, with explanation of the alpha boundary | Error state with status text and link to repo/API docs | Stable public CSV and API access matching the current published snapshot | If a download or endpoint is temporarily unavailable, keep the rest visible and mark the affected artifact as unavailable rather than implying the entire system is down |

### Stale Snapshot Presentation Rule

When a snapshot is stale:

- keep the published numbers visible
- show a prominent warning directly adjacent to the trust strip, not buried in a footer
- explain the age in plain language
- preserve access to methodology, exports, and district pages
- avoid panic language; the tone should be exact and transparent, not alarmist

### Pre-Publish Empty State

Before the first trustworthy public snapshot is published, the homepage should still feel intentional and public-facing. It should not look like a broken dashboard or an under-construction shell.

The pre-publish homepage should include:

- a clear statement of the current published scope for each court tier
- a plain explanation that the first public snapshot has not been published yet
- a short explanation of what will appear once publication is ready
- a methodology link so users can inspect how claims will be made
- a source coverage statement describing the upstream public data being prepared
- a lightweight project-status note that this is a public alpha being prepared carefully

The tone should be warm, exact, and restrained:

- warm enough to feel maintained by real people
- exact enough not to imply any claims that are not yet published
- restrained enough to avoid marketing filler or fake optimism

### Partial Quality Presentation Rule

If a district, metric, or snapshot is only partially trustworthy, NyaayWatch should keep it explorable when it still adds public value, but the design must make the downgrade unmistakable.

Rules:

- partial data remains visible by default when it is still directionally useful
- every affected metric or district row gets a strong quality badge, not a subtle tooltip
- affected surfaces include a short caveat in plain language near the data, not only inside methodology docs
- partially trustworthy rows may rank below fully trustworthy rows by default to avoid false precision
- exports and API responses must carry the same quality signals as the UI
- if a metric crosses from usable to misleading, it should be suppressed entirely rather than shown with cosmetic caveats

NyaayWatch should prefer "show with explicit qualification" over "silently hide," but it should also prefer suppression over displaying numbers that would create a false sense of certainty.

## MVP Data Model

Core principles:

- atomic facts, not blobs
- append-only history
- provenance is first-class
- observed time and coverage period are distinct
- slices like case type and age bucket are dimensions
- derived metrics have explicit lineage
- the public API is a versioned read model, not warehouse leakage

Recommended layers:

1. Raw artifact layer
2. Extracted source record layer
3. Canonical fact layer

Key entities:

- `sources`
- `snapshot_runs`
- `geographies`
- `metrics`
- `case_types`
- `age_buckets`
- `facts`
- `derived_metric_lineage`

Quality statuses should include:

- `raw`
- `normalized`
- `partial`
- `estimated`
- `inconsistent_with_previous`
- `superseded`

These statuses must map to visible public treatment rules rather than remaining internal-only metadata.

## Methodology Governance

NyaayWatch should publish visible change control for:

- metric formulas
- anomaly thresholds
- normalization rules
- transform logic

Public responses should make it possible to distinguish:

- upstream judicial system change
- NyaayWatch methodology or parser change

## Collection And Ethics Policy

NyaayWatch should:

- collect only publicly accessible aggregated data required for the observability product
- scrape at a conservative civic-tech frequency
- preserve source attribution on relevant public surfaces
- publish caveats when source data is delayed, partial, inconsistent, or limited
- avoid bypassing access restrictions or technical protections
- avoid case-level expansion until deliberately reviewed

## What Already Exists

This plan should align with the existing repo context:

- `README.md` already fixes the product voice as investigative, public-interest, calm, exact, and evidence-first
- `docs/ENG_REVIEW_TEST_PLAN.md` already defines the core public routes and trust-critical interactions that the UI must support
- `TODOS.md` already captures non-visual strategic follow-ups around redistribution rules and multi-state readiness

`DESIGN.md` now holds the reusable design-system rules for typography, color, spacing, component vocabulary, responsive behavior, and accessibility. This document remains the product-specific design plan for IA, trust surfaces, and route behavior.

## NOT In Scope

The following design decisions were considered and intentionally deferred from alpha:

- a top-of-page state chip wall: deferred because state coverage belongs later in the national homepage scroll or on explicit state pages
- map-first exploration: deferred because tables, trends, and evidence pages are the higher-trust surfaces for initial public accountability work
- richer data visualization storytelling beyond the core trend and ranking surfaces: deferred to keep the alpha focused on legibility and citation
- decorative brand campaigns or advocacy-style visual motifs: deferred because the public dossier posture is a better trust fit for alpha

## Success Criteria

The alpha is successful if:

- a non-technical user can understand the Supreme Court, High Court, and lower-court snapshot model in under 60 seconds
- a reporter can cite the data without custom maintainer help
- every published metric can be traced to a dated public source and transformation note
- a developer can reproduce homepage toplines from the API
- historical snapshots make "what changed?" answerable
- anomaly callouts surface something hard to notice in the upstream UI

## User Journey And Emotional Arc

NyaayWatch should guide users through a deliberate emotional sequence:

1. Calm orientation
2. Investigative focus
3. Evidence-backed urgency
4. Citation-ready confidence

The product should not begin in an alarmist tone. It should first help a user understand what they are looking at, then show why a district deserves attention, then give them enough proof and caveat context to share the finding responsibly.

### Storyboard

| Step | User Does | User Feels | Plan Must Support |
|---|---|---|---|
| 1 | Lands on homepage | Oriented, not overwhelmed | Clear headline, restrained visual hierarchy, trust strip, and three toplines that explain the public question quickly |
| 2 | Scans statewide signals | Curious and alert | District preview, trend surface, and flagged signals that show where to look next without shouting |
| 3 | Opens district index or district page | Focused and investigative | Strong ranking or flagged context, direct drill-down path, and plain-language summaries |
| 4 | Reads district explanation | Concerned, but still grounded | Short anomaly explanation framed as a signal with supporting numbers and caveats |
| 5 | Checks citation metadata, methodology, or exports | Reassured and confident | Snapshot metadata, formula links, quality badges, and reproducible evidence actions |
| 6 | Shares or cites the finding | Safe to reference publicly | Durable permalink, exportability, clear dates, source attribution, and caveat visibility |

### Time-Horizon Design

- first 5 seconds: understand what NyaayWatch is and that the data is grounded in a published snapshot
- first 5 minutes: inspect where a court family or lower-court geography appears to be under pressure and why specific districts or courts are flagged
- long-term relationship: trust that NyaayWatch is careful, reproducible, and worth returning to as more Indian geographies are added

### Tone Progression Rule

NyaayWatch copy and layout should move from calm to investigative without crossing into agitation:

- homepage tone: calm, public-interest, exact
- district exploration tone: sharper and more analytical
- evidence and export tone: rigorous, citation-oriented, caveat-aware

Urgency should come from the evidence, not from visual drama or activist slogans.

## Design System Handoff

The reusable visual-system rules now live in `DESIGN.md`.

Use `DESIGN.md` for:

- visual stance and AI-slop guardrails
- typography, color, spacing, and surface rules
- shared component vocabulary
- responsive layout rules
- accessibility baseline

Keep this document focused on the product-specific design decisions that are harder to express in a generic design system:

- route hierarchy
- homepage and district-page composition
- trust-surface behavior
- tone progression
- tier-aware public IA discipline with explicit lower-court state pages

## Distribution Plan

- public web app for scorecards and methodology
- public API for normalized aggregated metrics
- public CSV snapshot downloads
- GitHub as the open source home

## AWS Shape For Alpha

- S3 for raw scrape artifacts and immutable snapshots
- scheduled runs on AWS
- PostgreSQL as the normalized query layer
- one containerized app for web, API, admin, and jobs

## Current Product Direction

1. Keep the homepage oriented around Supreme Court-first public accountability without implying cross-tier totals.
2. Keep all 25 High Court beta surfaces discoverable, source-aware, and caveated.
3. Keep all 36 lower-court state/Union Territory route families plain-language and evidence-backed.
4. Preserve separate methodology tracks for Supreme Court, High Court, and lower-court data.
5. Keep public APIs and downloads aligned with the exact published snapshot shown in the UI.
6. Expand product storytelling only where stored evidence and public methodology can defend the claim.

## Design Review Completion Summary

```text
+====================================================================+
|         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
+====================================================================+
| System Audit         | UI scope confirmed; DESIGN.md extracted     |
| Step 0               | 5/10 initial rating; full 7-pass review     |
| Pass 1  (Info Arch)  | 4/10 -> 10/10                               |
| Pass 2  (States)     | 3/10 -> 10/10                               |
| Pass 3  (Journey)    | 4/10 -> 10/10                               |
| Pass 4  (AI Slop)    | 3/10 -> 10/10                               |
| Pass 5  (Design Sys) | 4/10 -> 10/10                               |
| Pass 6  (Responsive) | 2/10 -> 10/10                               |
| Pass 7  (Decisions)  | 11 resolved, 0 deferred                     |
+--------------------------------------------------------------------+
| NOT in scope         | written (4 items)                           |
| What already exists  | written                                     |
| TODOS.md updates     | 2 items proposed                            |
| Decisions made       | 11 added to plan                            |
| Decisions deferred   | 0                                            |
| Overall design score | 5/10 -> 10/10                               |
+====================================================================+
```

Plan is design-complete. Run `/plan-eng-review` next to validate architecture and test implications before implementation, and run `/design-review` after implementation for visual QA.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean | score: 5/10 -> 10/10, 11 decisions |

**UNRESOLVED:** 0
**VERDICT:** DESIGN CLEARED — eng review required before implementation
