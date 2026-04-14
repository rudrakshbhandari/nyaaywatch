# NyaayWatch

NyaayWatch makes Indian court-system data transparent and usable so the public can hold the judiciary accountable, starting with Himachal Pradesh.

## Current Status

This repo is now implementing the approved design and engineering review for a Himachal Pradesh public alpha focused on:

- transparent public scorecards
- flagged district-level signals
- reproducible public evidence
- a narrow developer-friendly API

The product is intentionally:

- Himachal-first, not nationwide on day one
- snapshot-based, not "live"
- transparency-first, not AI-forward
- open source, but source-aware about raw data redistribution

The current repository now includes the Phase 2 real-run pipeline:

- PostgreSQL-backed canonical run, candidate, and publish state
- S3-backed stored raw HTML evidence and normalized snapshot-candidate artifacts
- operator fetch, inspect, publish, replay, and rollback controls
- homepage, district index, district detail, methodology, and API surfaces backed by the latest published snapshot
- regression tests for migration safety, real-source fixture capture, publish gating, replay and rollback behavior, and public/operator route behavior

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
- [MVP execution plan](docs/MVP_EXECUTION_PLAN.md)
- [Development workflow](docs/DEVELOPMENT_WORKFLOW.md)
- [Storage and operator flow](docs/STORAGE_AND_OPERATIONS.md)
- [AWS dev resources](infra/aws/dev/README.md)
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

The current code uses those boundaries in a pragmatic way:

- `src/api/` holds the Express server, public routes, operator routes, and HTML rendering
- `src/services/` holds published snapshot orchestration and the run pipeline
- `src/storage/` holds PostgreSQL and S3 adapters
- `src/db/` holds migrations and migration runner code
- `fixtures/` holds reproducible captured Himachal NJDG HTML inputs for local development and tests

## Local Development

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

## Local Storage Stack

The repository now includes a runnable real-run storage implementation:

- PostgreSQL is the canonical store for runs, publications, immutable published snapshot payloads, and run artifact metadata
- S3 is the raw evidence store for replayable NJDG HTML captures and normalized snapshot candidates
- the public API and UI read only the latest published snapshot

Quickstart:

```bash
cp .env.example .env
npm install
npm run docker:up
npm run dev:bootstrap
npm run dev
```

Public routes:

- `/`
- `/districts`
- `/districts/:id`
- `/methodology`
- `/api`

Public API:

- `GET /v1/stats/himachal`
- `GET /v1/districts`
- `GET /v1/trends`

Operator endpoints require `x-operator-token`:

- `POST /operator/runs/fetch`
- `GET /operator/runs/:runId`
- `POST /operator/runs/:runId/publish`
- `POST /operator/runs/:runId/replay`
- `POST /operator/publications/:publicationId/rollback`

## Testing

```bash
npm run typecheck
npm test
```

Current regression coverage includes:

- migration safety and idempotence
- golden-fixture capture using stored Himachal NJDG HTML pages
- publish gating on run status and candidate presence
- latest published snapshot reads
- replay and rollback behavior
- public API and HTML route behavior
- operator token enforcement
