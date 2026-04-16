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

The current repository now includes the Phase 3 public trust surfaces on top of the real-run pipeline:

- PostgreSQL-backed canonical run, candidate, and publish state
- S3-backed stored raw HTML evidence and normalized snapshot-candidate artifacts
- operator fetch, inspect, publish, replay, and rollback controls
- homepage, district workspace, district evidence, data download, methodology, and API surfaces backed by the latest published snapshot
- regression tests for migration safety, real-source fixture capture, publish gating, replay and rollback behavior, district history/export behavior, and public/operator route behavior
- Phase 5 launch policy docs for public exposure, release readiness, and public-copy guardrails

## Core Direction

The approved implementation direction is:

- one AWS-hosted containerized app
- PostgreSQL as the canonical store
- S3 for raw scrape artifacts
- persisted ingestion run state machine
- published snapshot read model for all public surfaces
- operator-only admin surface for publish / replay control

## Key Files

- [Design system](DESIGN.md)
- [Product design plan](docs/NYAAYWATCH_DESIGN.md)
- [Engineering test plan](docs/ENG_REVIEW_TEST_PLAN.md)
- [MVP execution plan](docs/MVP_EXECUTION_PLAN.md)
- [Public data exposure policy](docs/PUBLIC_DATA_EXPOSURE_POLICY.md)
- [Alpha release checklist](docs/ALPHA_RELEASE_CHECKLIST.md)
- [Alpha release policy](docs/RELEASE_POLICY.md)
- [Deployment status](docs/DEPLOYMENT_STATUS.md)
- [Domain cutover checklist](docs/DOMAIN_CUTOVER_CHECKLIST.md)
- [Multi-state expansion gates](docs/MULTI_STATE_EXPANSION_GATES.md)
- [Accelerated expansion plan](docs/ACCELERATED_EXPANSION_PLAN.md)
- [Expansion review log](docs/EXPANSION_REVIEW_LOG.md)
- [Punjab go-live checklist](docs/PUNJAB_GO_LIVE_CHECKLIST.md)
- [Punjab public readiness review](docs/PUNJAB_PUBLIC_READINESS_REVIEW.md)
- [Judiciary public data landscape](docs/JUDICIARY_PUBLIC_DATA_LANDSCAPE.md)
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
- `/data`
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
npm run test:e2e
RUN_PERSISTENT_STACK_TESTS=1 npm run test:persistent
```

Current regression coverage includes:

- migration safety and idempotence
- golden-fixture capture using stored Himachal NJDG HTML pages
- publish gating on run status and candidate presence
- latest published snapshot reads
- replay and rollback behavior
- district history and CSV export parity for published snapshots
- browser E2E for citizen, reporter, and developer-parity public flows
- browser E2E for responsive mobile trust surfaces and accessibility smoke checks
- stable API contract tests for `/v1/stats/himachal`, `/v1/districts`, and `/v1/trends`
- persistent-stack replay and rollback coverage through local PostgreSQL plus LocalStack S3
- public API and HTML route behavior
- operator token enforcement

GitHub Actions now runs `npm run typecheck`, `npm test`, `RUN_PERSISTENT_STACK_TESTS=1 npm run test:persistent`, and `npm run test:e2e` on pushes and pull requests. Pull requests from branches in this repo also get fixture-backed App Runner preview deployments for the public web surface, and pushes to `main` auto-build a `linux/amd64` image, publish it to ECR, and roll the live ECS service after verification passes.

If `5432` or `4566` are already in use locally, override `POSTGRES_PORT` and `LOCALSTACK_PORT` in `.env` before running `npm run docker:up`, then point `DATABASE_URL` and `AWS_ENDPOINT_URL_S3` at the same host ports.
