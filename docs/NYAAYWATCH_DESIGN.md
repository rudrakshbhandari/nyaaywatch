# NyaayWatch Design

Source of truth copied from the approved `/office-hours` design artifact so the repo can travel cleanly across new Codex threads.

## Canonical Product Definition

NyaayWatch makes Indian court-system data transparent and usable so the public can hold the judiciary accountable, starting with Himachal Pradesh and expanding over time toward nationwide Indian coverage.

## Problem Statement

Build a public judicial observability layer for Himachal Pradesh first, with an explicit path to broader Indian coverage only after the trust model proves itself. The long-term ambition is nationwide Indian observability, but the near-term job is to turn hard-to-use Himachal court-system aggregates into legible, trustworthy public evidence without pretending the whole country is already covered.

The first version should let an ordinary citizen, reporter, or civic group answer:

- How large is the backlog in Himachal Pradesh?
- Which districts are getting worse?
- How old are pending cases?
- Is filing outpacing disposal?
- Which districts look unusually slow right now?

## Release Posture

NyaayWatch v1 should launch as a clearly labeled public alpha with:

- explicit scope limits
- explicit data caveats
- visible freshness and methodology metadata
- clear language that the Himachal observability model is being proven before wider rollout

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
- a nationwide parity product from day one
- a live real-time monitoring system
- a broad judicial API platform beyond the narrow Himachal observability read model

## Chosen Architecture

Snapshot Observatory:

- one state: Himachal Pradesh
- one trust model: every number comes from a dated public snapshot
- one public front door: scorecards and district comparisons
- one urgency layer: anomaly callouts
- one enabling layer: public exports and developer-friendly API endpoints

The alpha should be architected so the same model can expand state by state across India over time, but the user-facing product should remain explicitly Himachal-first until additional states clear the same trust, methodology, and operational readiness bar.

## Current Implementation Note

The repository now ships a narrow alpha reference implementation of this architecture:

- one Node/TypeScript service with an operator boundary and public boundary
- server-rendered public pages for `/`, `/districts`, `/districts/:id`, `/data`, `/methodology`, and `/api`
- public JSON for `GET /v1/stats/himachal`, `GET /v1/districts`, and `GET /v1/trends`
- PostgreSQL-backed run, publication, and published-snapshot state plus S3-backed raw evidence artifacts
- published district-history and CSV export surfaces that stay inside the active public snapshot lineage

This does not change the intended production direction. It proves the public trust boundary first while keeping the Himachal alpha legible, reproducible, and explicitly snapshot-based.

## Credit-Aware Infrastructure Direction

The user has confirmed access to `AWS $10k` in startup/student credits plus additional tooling credits from the YC student pack. That should influence implementation priority:

- prefer AWS for the first deploy rather than introducing a parallel hosting path
- use credits to fund the one-container app, PostgreSQL, S3 artifact storage, and logging around publish actions
- keep optional third-party credits in support roles only so the public product still stands on reproducible stored evidence even if those credits expire

## MVP Public Experience

Canonical homepage hero:

> See how slow justice is, district by district.

The first public page should include:

- Himachal topline scorecard
- district ranking table
- trend chart for backlog direction
- anomaly callouts
- visible trust metadata near headline metrics
- lightweight public-action surfaces such as district permalinks and evidence packs
- methodology page
- download CSV button
- API docs link

## Public Information Architecture

NyaayWatch alpha should feel like a public evidence front page, not a generic analytics dashboard. The first screen must answer three questions in order:

1. What is this?
2. Why should I trust it?
3. Where do I go to inspect my district?

### Homepage Hierarchy

The homepage should prioritize content in this order:

1. Investigative headline and one-sentence framing
2. Trust strip showing snapshot date, freshness state, methodology version, and source attribution
3. Three topline metrics for Himachal with short plain-language labels
4. District ranking table as the main working surface
5. Trend chart for backlog direction across snapshots
6. Flagged district callouts with direct links to district evidence pages
7. Supporting trust actions: methodology, CSV download, API docs

The first viewport should not try to show the full table, chart, anomalies, and trust copy at once. It should behave like a calm poster for a public-interest investigation, with the evidence surfaces starting immediately below the fold.

### Homepage Screen Structure

```text
+---------------------------------------------------------------+
| Header: NyaayWatch | Methodology | Data Download | API Docs   |
+---------------------------------------------------------------+
| Investigative headline                                        |
| One-sentence framing                                          |
| Trust strip: Updated as of | Snapshot | Methodology | Source  |
| Topline metric 1 | Topline metric 2 | Topline metric 3        |
| Primary action: Explore districts                            |
+---------------------------------------------------------------+
| District ranking table                                        |
+---------------------------------------------------------------+
| Backlog trend chart                                           |
+---------------------------------------------------------------+
| Flagged district callouts                                     |
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
      -> Download evidence pack / CSV
  -> Open methodology page
  -> Open API docs
```

### Route Responsibilities

The alpha information architecture should separate overview from browsing so the product can scale beyond one state without turning the homepage into a dense control panel.

- `/` is the statewide front page for the latest published snapshot, toplines, trend, flagged signals, and trust context
- `/districts` is the main district-browsing workspace for ranking, scanning, filtering, and opening district permalinks
- `/districts/:id` is the durable evidence page for a specific district
- `/methodology` explains formulas, caveats, snapshot semantics, and change history
- `/data` or an equivalent download surface handles CSV exports and public data access
- `/api` or equivalent docs surface explains the developer-facing read model

For alpha, the homepage may show a short preview of the district ranking, but it should hand off quickly to `/districts` for full browsing. This keeps the landing experience legible now and creates a clean place to absorb future state, metric, and filtering complexity.

### National Expansion IA Guardrail

The structure should scale from "one state with many districts" to "many states with their own district systems" by preserving a consistent hierarchy:

1. Geography overview page
2. Geography-specific district index
3. District evidence page

Alpha should implement this hierarchy for Himachal now rather than forcing a future redesign when additional states are added.

Alpha should not expose empty national scaffolding such as disabled state pickers, placeholder maps, or "coming soon" geography controls. It should instead state clearly in copy that NyaayWatch is starting with Himachal Pradesh and is being designed to expand across India over time once the trust model is proven.

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
6. Evidence pack / CSV export actions
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

## MVP API

Initial public endpoints:

- `GET /stats/himachal`
- `GET /districts`
- `GET /trends`

The API should expose the same evidence model the public page uses. No hidden richer truth than the public trust surface supports.

## Time To Justice Index

The `time_to_justice_index` remains in scope for alpha, but only as:

- a transparent system-stress score
- secondary to raw metrics and anomaly evidence
- relative within the Himachal comparison cohort
- fully reproducible with public weights and formula versions
- stored as a derived fact with explicit lineage

It must not imply:

- exact expected wait time
- causal blame
- national comparability before the system supports it
- predictive forecasting or AI inference

## Anomaly Layer

Anomalies should be:

- rule-based
- reproducible
- Himachal-cohort-relative in alpha
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
| Homepage `/` | Skeleton layout for headline, trust strip, metrics, and preview surfaces; no fake numbers | No published snapshot yet message, short explanation of what NyaayWatch is preparing, and links to methodology plus project status context | Calm error banner explaining the public snapshot could not be loaded, with a retry affordance and methodology link | Latest published Himachal snapshot with trust strip, toplines, preview ranking, trend, and flagged signals | Continue showing last published snapshot with an amber freshness banner; if quality is partial, label affected metrics and point to caveats |
| District index `/districts` | Table skeleton with filter placeholders and note that rankings are loading from latest published snapshot | No districts available in current published snapshot, with explanation that publication is not ready or geography is not yet covered | Error banner above table with plain-language explanation and retry affordance | Sortable / scannable district table tied to the same published snapshot as the homepage | Rows with partial or inconsistent quality stay visible but are badged and may sort below fully trustworthy rows by default |
| District page `/districts/:id` | Skeleton for summary, trust strip, metrics, and chart | District not available in published coverage, with explanation of current geographic scope and a path back to the district index | Error state that preserves page shell and explains that district evidence could not be loaded | District summary, flagged explanation, evidence surfaces, export actions, and caveats | Keep district page visible with explicit badges for partial quality, stale snapshot, or changed methodology; never imply certainty the data does not have |
| Methodology `/methodology` | Text skeleton and section anchors loading | Not applicable | Error message with fallback link to the public repo docs if available | Formula explanations, caveats, change log, and snapshot semantics | If some methodology sections are unavailable, show the last published version with a note that a fuller update is pending |
| Data / API surfaces | Endpoint or download list skeletons without placeholder payload claims | No public downloads or endpoints for current scope yet, with explanation of the alpha boundary | Error state with status text and link to repo/API docs | Stable public CSV and API access matching the current published snapshot | If a download or endpoint is temporarily unavailable, keep the rest visible and mark the affected artifact as unavailable rather than implying the entire system is down |

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

- a clear statement that NyaayWatch is starting with Himachal Pradesh
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

There is no standalone `DESIGN.md` yet, so the alpha design foundation in this document is currently the source of truth for visual and interaction decisions.

## NOT In Scope

The following design decisions were considered and intentionally deferred from alpha:

- visible multi-state selector UI: deferred because the alpha should remain explicitly Himachal-first even though the architecture must scale nationally
- map-first exploration: deferred because tables, trends, and evidence pages are the higher-trust surfaces for initial public accountability work
- richer data visualization storytelling beyond the core trend and ranking surfaces: deferred to keep the alpha focused on legibility and citation
- decorative brand campaigns or advocacy-style visual motifs: deferred because the public dossier posture is a better trust fit for alpha

## Success Criteria

The alpha is successful if:

- a non-technical user can understand Himachal backlog in under 60 seconds
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
| 5 | Checks evidence pack, methodology, or exports | Reassured and confident | Snapshot metadata, formula links, quality badges, and reproducible evidence actions |
| 6 | Shares or cites the finding | Safe to reference publicly | Durable permalink, exportability, clear dates, source attribution, and caveat visibility |

### Time-Horizon Design

- first 5 seconds: understand what NyaayWatch is and that the data is grounded in a published snapshot
- first 5 minutes: inspect where Himachal appears to be struggling and why specific districts are flagged
- long-term relationship: trust that NyaayWatch is careful, reproducible, and worth returning to as more Indian geographies are added

### Tone Progression Rule

NyaayWatch copy and layout should move from calm to investigative without crossing into agitation:

- homepage tone: calm, public-interest, exact
- district exploration tone: sharper and more analytical
- evidence and export tone: rigorous, citation-oriented, caveat-aware

Urgency should come from the evidence, not from visual drama or activist slogans.

## Visual Direction And AI Slop Guardrails

NyaayWatch alpha should look like an investigative public dossier, not a startup dashboard and not a glossy activism campaign.

### Core Visual Stance

- typography-led rather than decoration-led
- restrained, serious, and editorial
- tables, charts, metadata, and source context are the primary visual surfaces
- minimal card usage; cards must earn their existence through interaction or grouping value
- calm color system with one restrained accent, not a rainbow status palette
- dense enough to feel useful, but never cramped or bureaucratic

The specific target is a public dossier visual language:

- document-like hierarchy over app-like chrome
- strong metadata treatment and evidence labeling
- restrained serif/sans pairing rather than default startup typography
- citation-ready footnotes, caveats, and trust annotations as first-class UI elements
- enough warmth to feel maintained by people, but not enough ornament to feel like a campaign site

### Visual Hierarchy Rules

- first viewport behaves like a public-interest front page, not a widget board
- brand, headline, trust strip, and toplines form one composition
- district table and trend chart should read as the main evidence surfaces, not supporting decoration
- caveats and quality signals should be visible without overpowering the primary evidence
- methodology, download, and API links should feel like trust-supporting utilities, not competing calls to action

### AI Slop Blacklist For NyaayWatch

Do not ship:

- purple, violet, or blue-to-purple gradient brand treatments
- three-column feature grids with icon circles and short SaaS blurbs
- centered-everything marketing layouts
- decorative blob backgrounds, wavy section dividers, or ornamental floating shapes
- oversized rounded cards wrapping every metric, chart, and table by default
- generic hero copy such as "unlock judicial insights" or "all-in-one transparency platform"
- dashboard-card mosaics where every insight is trapped in a separate panel

### Preferred UI Primitives

- strong headlines with editorial rhythm
- compact trust strips and metadata rows
- full-width tables or near-full-width tables for district comparison
- charts with restrained annotation, not decorative illustration
- inline badges for freshness and quality status
- footnotes, caveat blocks, and methodology links that feel citation-ready

### Visual Density Rule

NyaayWatch should prefer fewer, stronger surfaces over many equal surfaces. If a layout can delete 30 percent of its chrome and still communicate better, it should. The design should feel cared for, not merely populated.

## Alpha Design Foundation

No standalone `DESIGN.md` exists yet, so this section acts as the design-system foundation for alpha implementation.

### Typography

- use a restrained serif for major editorial headings and a clear sans-serif for interface text
- avoid default stacks such as Inter, Arial, Roboto, or generic system-first typography
- headlines should feel investigative and public-interest oriented, not startup-promotional
- body text and metadata must optimize for long reading sessions, scanability, and evidence comprehension
- tables, badges, and trust strips should use disciplined typographic contrast rather than heavy borders or bright fills

### Color Tokens

Define CSS variables before implementation:

- `--color-bg`
- `--color-surface`
- `--color-surface-muted`
- `--color-text`
- `--color-text-muted`
- `--color-border`
- `--color-accent`
- `--color-warning`
- `--color-danger`
- `--color-success`

Rules:

- background colors stay light, calm, and document-like
- accent color should be restrained and used sparingly for links, active states, and data emphasis
- warning and quality colors should signal clearly without turning the interface into a traffic-light dashboard
- no purple-forward palette and no blue-to-purple gradients

### Spacing And Layout

- use a consistent spacing scale rather than one-off values
- prioritize generous vertical rhythm around headline, trust, and evidence sections
- tables and charts should have enough surrounding whitespace to read clearly, but should still occupy meaningful width
- mobile layouts should preserve hierarchy through reflow, not by shrinking everything into cramped cards

### Surface Rules

- cards are not the default container
- tables, charts, text blocks, and metadata rows should often sit directly on the page or within minimal surfaces
- if a card is used, it must have a specific grouping or interaction purpose
- shadows should be minimal; separation should come primarily from spacing, typography, and subtle borders

### Core Component Vocabulary

Alpha should standardize at least these primitives:

- trust strip
- topline metric block
- district ranking table
- quality badge
- freshness warning banner
- anomaly callout
- caveat block
- methodology link cluster
- export action group

Every new user-facing screen in alpha should be assembled from this vocabulary before introducing new primitives.

## Responsive And Accessibility Requirements

NyaayWatch must be intentionally designed for desktop, tablet, and mobile. Responsive behavior is not a visual afterthought; it determines whether the public evidence model remains legible on real devices.

### Responsive Layout Rules

- desktop should prioritize side-by-side comparison where it improves evidence reading
- tablet should preserve the public dossier rhythm while reducing simultaneous density
- mobile should preserve trust hierarchy and tap-through clarity rather than forcing desktop tables into cramped horizontal scroll patterns

### District Browsing On Mobile

The district index should use different primary patterns by viewport:

- desktop: full ranking table with meaningful comparison columns
- tablet: reduced-column comparison table with clear tap targets
- mobile: ranked stacked list where each item shows district name, status, 1 to 2 key metrics, and a direct link into the district evidence page

Mobile should not rely on a wide table with horizontal scrolling as the primary exploration pattern. Comparison can still exist, but the primary experience should be a scan-and-open list that respects small screens and thumb navigation.

### Accessibility Baseline

Alpha implementation must meet an explicit accessibility floor:

- keyboard navigation across all primary routes, filters, links, exports, and evidence-page actions
- semantic landmarks for header, main content, navigation, table/list regions, and footer
- visible focus states that do not rely on browser defaults disappearing into the visual system
- minimum touch targets of 44px for interactive controls
- text and status colors must meet accessible contrast requirements against their backgrounds
- charts must provide text summaries or data tables so their meaning is not color-only or pointer-only
- quality badges and freshness states must not rely on color alone; pair color with text labels
- district ranking and evidence pages should use heading structure that screen readers can traverse logically
- loading, empty, partial, and error states must be announced or represented in ways assistive technology can understand

Accessibility should be treated as part of public trust. If a surface cannot explain itself to keyboard users, screen-reader users, or low-vision users, it is not ready to claim civic usefulness.

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

## Immediate Next Steps

1. Define the exact Himachal NJDG source pages and fields.
2. Draft the canonical schema for sources, runs, facts, dimensions, and lineage.
3. Specify the methodology page and first-pass formula package.
4. Design the narrow API around the normalized evidence model.
5. Build one end-to-end dry run with static sample data.
6. Lock anomaly thresholds and publish-gate rules.

## Design Review Completion Summary

```text
+====================================================================+
|         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
+====================================================================+
| System Audit         | UI scope confirmed; no DESIGN.md            |
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
