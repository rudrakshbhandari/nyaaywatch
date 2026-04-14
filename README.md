# NyaayWatch

NyaayWatch makes Indian court-system data transparent and usable so the public can hold the judiciary accountable, starting with Himachal Pradesh.

## Current Status

This repo is being started from an approved design and engineering review. The first release is a public alpha for Himachal Pradesh focused on:

- transparent public scorecards
- flagged district-level signals
- reproducible public evidence
- a narrow developer-friendly API

The product is intentionally:

- Himachal-first, not nationwide on day one
- snapshot-based, not "live"
- transparency-first, not AI-forward
- open source, but source-aware about raw data redistribution

## Core Direction

The approved implementation direction is:

- one AWS-hosted containerized app
- PostgreSQL as the canonical store
- S3 for raw scrape artifacts
- persisted ingestion run state machine
- published snapshot read model for all public surfaces
- operator-only admin surface for publish / replay control

## Key Files

- [Design doc](docs/NYAAYWATCH_DESIGN.md)
- [Engineering test plan](docs/ENG_REVIEW_TEST_PLAN.md)
- [TODOs](TODOS.md)

## Planned Repository Shape

The implementation is expected to evolve into these boundaries inside one repo:

- `ingest/`
- `extract/`
- `normalize/`
- `warehouse/`
- `api/`
- `web/`
- `docs/`

## Non-Goals For Alpha

- case-level search
- PDF parsing
- judge rankings
- predictive forecasting
- AI legal analysis
- nationwide parity
- real-time claims

## Product Voice

NyaayWatch should feel investigative, public-interest, calm, exact, and evidence-first.

## Development Workflow

This project is intended to be developed in a highly AI-native workflow using ChatGPT Pro and Codex, but product claims still need explicit human judgment and evidence discipline.
