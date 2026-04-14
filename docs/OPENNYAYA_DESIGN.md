# OpenNyaya Design

Source of truth copied from the approved `/office-hours` design artifact so the repo can travel cleanly across new Codex threads.

## Canonical Product Definition

OpenNyaya makes Indian court-system data transparent and usable so the public can hold the judiciary accountable, starting with Himachal Pradesh.

## Problem Statement

Build a public judicial observability layer for Himachal Pradesh first, with an explicit path to broader Indian coverage only after the trust model proves itself. The job is to turn hard-to-use court-system aggregates into legible, trustworthy public evidence.

The first version should let an ordinary citizen, reporter, or civic group answer:

- How large is the backlog in Himachal Pradesh?
- Which districts are getting worse?
- How old are pending cases?
- Is filing outpacing disposal?
- Which districts look unusually slow right now?

## Release Posture

OpenNyaya v1 should launch as a clearly labeled public alpha with:

- explicit scope limits
- explicit data caveats
- visible freshness and methodology metadata
- clear language that the Himachal observability model is being proven before wider rollout

## Open Source Posture

OpenNyaya should be genuinely open source for:

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

OpenNyaya should assume a highly AI-native development workflow:

- heavy use of ChatGPT Pro and Codex
- rapid iteration on schemas, read models, tests, docs, and public copy
- explicit human review of formulas, methodology, caveats, and product claims

OpenNyaya should be AI-native in how it is built, not AI-branded in what it claims to be.

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

## Methodology Governance

OpenNyaya should publish visible change control for:

- metric formulas
- anomaly thresholds
- normalization rules
- transform logic

Public responses should make it possible to distinguish:

- upstream judicial system change
- OpenNyaya methodology or parser change

## Collection And Ethics Policy

OpenNyaya should:

- collect only publicly accessible aggregated data required for the observability product
- scrape at a conservative civic-tech frequency
- preserve source attribution on relevant public surfaces
- publish caveats when source data is delayed, partial, inconsistent, or limited
- avoid bypassing access restrictions or technical protections
- avoid case-level expansion until deliberately reviewed

## Success Criteria

The alpha is successful if:

- a non-technical user can understand Himachal backlog in under 60 seconds
- a reporter can cite the data without custom maintainer help
- every published metric can be traced to a dated public source and transformation note
- a developer can reproduce homepage toplines from the API
- historical snapshots make "what changed?" answerable
- anomaly callouts surface something hard to notice in the upstream UI

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
