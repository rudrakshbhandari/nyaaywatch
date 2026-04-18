# NyaayWatch

NyaayWatch makes Indian court-system data transparent and usable so the public can hold the judiciary accountable, starting with Himachal Pradesh and expanding state by state only after the same trust bar is met.

## What This Repo Is

This repository contains the public alpha implementation:

- public scorecards and district evidence pages backed by a published snapshot
- a narrow read-only public API for the same published snapshot
- operator workflows for fetch, inspect, publish, replay, and rollback
- reproducible raw-evidence storage and deterministic normalization

The public product is intentionally:

- Himachal-first, not nationwide on day one
- snapshot-based, not live
- transparency-first, not AI-forward
- open source, but source-aware about raw upstream redistribution

## Current Status

The Himachal alpha MVP path is complete and its launch gates are satisfied.

What is shipped now:

- PostgreSQL-backed canonical run, artifact, and publication state
- S3-backed stored raw HTML evidence and normalized snapshot-candidate artifacts
- public routes for homepage, districts workspace, district detail, data downloads, methodology, and API docs
- explicit state-scoped public routing for approved expansion states, with Punjab, Haryana, Tamil Nadu, Assam, and Telangana now live as additional state surfaces
- operator replay and rollback controls
- regression coverage for migration safety, publish gating, replay/rollback behavior, contract stability, and public trust surfaces

Post-MVP work continues in this repo, but live rollout still happens state by state with explicit evidence. Telangana is now live on the public site after Assam, Kerala is the next public rollout slice in repo prep, Odisha, West Bengal, Jharkhand, and Chhattisgarh are the next internal-only batch, and the final unsupported-state wave is Goa, Sikkim, and Mizoram.

## Product Guardrails

- Build for Himachal Pradesh first.
- Treat public data as snapshot-based, not live.
- Do not make predictive, AI-forward, or legal-analysis claims.
- Every public metric must have reproducible provenance from stored evidence.
- Describe anomalies as flagged signals, not verdicts.
- Do not assume raw upstream artifacts are safe to expose publicly.

## Architecture

Default architecture direction:

- one AWS-hosted containerized app
- PostgreSQL as the canonical store
- S3 for raw scrape artifacts
- explicit ingestion run state and operator-controlled publish / replay flow
- published snapshot read models for public surfaces

## Repository Map

The long-term repository shape is:

- `ingest/`
- `extract/`
- `normalize/`
- `warehouse/`
- `api/`
- `web/`
- `docs/`

The current codebase maps those boundaries pragmatically:

- `src/api/` holds the Express app, public routes, operator routes, and HTML rendering
- `src/services/` holds published snapshot orchestration and run-pipeline logic
- `src/storage/` holds PostgreSQL and S3 adapters
- `src/db/` holds migrations and migration tooling
- `src/ingest/`, `src/extract/`, and `src/normalize/` hold the pipeline stages
- `fixtures/` holds reproducible captured Himachal NJDG inputs for local development and tests

## Quickstart

Prerequisites:

- Node `>=22`
- Docker with Compose
- npm

Local development:

```bash
cp .env.example .env
npm install
npm run docker:up
npm run dev:bootstrap
npm run dev
```

The app defaults to `http://127.0.0.1:3000`.

If `5432` or `4566` are already in use, override `POSTGRES_PORT` and `LOCALSTACK_PORT` in `.env` before `npm run docker:up`, then keep `DATABASE_URL` and `AWS_ENDPOINT_URL_S3` aligned with those host ports.

Local development uses PostgreSQL plus LocalStack S3. Keep `AWS_REGION=ap-south-1` even locally so the code path matches the AWS deployment target.

## Useful Commands

```bash
npm run db:migrate
npm run db:seed
npm run operator:fetch -- "Manual Himachal fetch"
npm run operator:inspect -- <run-id>
npm run operator:publications
npm run operator:publish -- <run-id> "Publish completed snapshot"
npm run operator:replay -- <run-id>
npm run operator:rollback -- <publication-id>
npm run operator:remote -- --base-url=https://nyaaywatch.in publications
npm run operator:remote -- --base-url=https://nyaaywatch.in --connect-host=<alb-dns> --state=UP fetch "Internal Uttar Pradesh fetch"
npm run operator:staging -- --state UP fetch "Internal Uttar Pradesh fetch"
npm run operator:reconcile-fetch-schedule
npm run release:prepublish -- --run-id=<run-id> --base-url=https://nyaaywatch.in
npm run release:prepublish -- --state-slug=<state-slug> --run-id=<run-id> --base-url=https://nyaaywatch.in
npm run release:postpublish -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in
npm run release:postpublish -- --state-slug=<state-slug> --publication-id=<publication-id> --base-url=https://nyaaywatch.in
npm run release:record -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
npm run release:record -- --state-slug=<state-slug> --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
```

Use `npm run operator:remote` for live remote operator access from a local terminal. Use `npm run operator:staging` as the default heavy-state lane on the live AWS stack when long-running fetches should execute inside a one-off ECS task instead of through the Cloudflare-fronted public operator path.

The live stack also supports a weekday internal raw-fetch schedule. Reconcile it against the current ECS task definition with `npm run operator:reconcile-fetch-schedule`. Public publishes remain operator-reviewed and manual.

## Public Surface

Public routes:

- `/`
- `/districts`
- `/districts/:id`
- `/data`
- `/methodology`
- `/api`
- `/states/:stateSlug`
- `/states/:stateSlug/districts`
- `/states/:stateSlug/districts/:id`
- `/states/:stateSlug/data`
- `/states/:stateSlug/methodology`
- `/states/:stateSlug/api`

Current route posture:

- unscoped routes remain the default Himachal Pradesh public surface
- additional approved states use explicit `/states/:stateSlug/...` routes
- Punjab, Haryana, and Tamil Nadu are the current live state-scoped public surfaces
- deployment docs still decide whether a given state is live on `https://nyaaywatch.in`

Public API:

- `GET /v1/stats/himachal`
- `GET /v1/districts`
- `GET /v1/trends`
- `GET /v1/states/:stateSlug/stats`
- `GET /v1/states/:stateSlug/districts`
- `GET /v1/states/:stateSlug/trends`

Operator endpoints require `x-operator-token`:

- `GET /operator/runs`
- `GET /operator/runs/:runId`
- `POST /operator/runs/fetch`
- `POST /operator/runs/:runId/publish`
- `POST /operator/runs/:runId/replay`
- `GET /operator/publications`
- `POST /operator/publications/:publicationId/rollback`

Operator routes default to the runtime's configured state, but they also accept explicit `stateCode` or `stateSlug` selectors on query params or JSON bodies for multi-state operations.

For live remote operation from a local terminal, use `npm run operator:remote`. Add `--connect-host=<alb-dns>` for heavier internal states when you need to bypass Cloudflare but still preserve `nyaaywatch.in` as the HTTP and TLS host.

## Testing

Core checks:

```bash
npm run typecheck
npm test
npm run test:e2e
RUN_PERSISTENT_STACK_TESTS=1 npm run test:persistent
```

If Playwright browsers are not installed yet, run:

```bash
npx playwright install
```

Current regression coverage includes:

- migration safety and idempotence
- golden-fixture capture using stored Himachal NJDG HTML pages
- publish gating on run status and candidate presence
- latest published snapshot reads
- replay and rollback behavior
- district history and CSV export parity for published snapshots
- browser E2E for citizen, reporter, and developer-parity public flows
- responsive and accessibility trust-surface checks
- stable API contract tests for `/v1/stats/himachal`, `/v1/districts`, and `/v1/trends`
- stable API contract tests for state-scoped Punjab public endpoints
- persistent-stack replay and rollback coverage through local PostgreSQL plus LocalStack S3
- public API and HTML route behavior
- operator token enforcement

## Key Docs

Start here:

- [Design system](DESIGN.md)
- [Design doc](docs/NYAAYWATCH_DESIGN.md)
- [Engineering test plan](docs/ENG_REVIEW_TEST_PLAN.md)
- [MVP execution plan](docs/MVP_EXECUTION_PLAN.md)
- [TODO backlog](TODOS.md)
- [Contributing guide](CONTRIBUTING.md)

Developer and operator workflow:

- [Development workflow](docs/DEVELOPMENT_WORKFLOW.md)
- [Storage and operator flow](docs/STORAGE_AND_OPERATIONS.md)
- [Public data exposure policy](docs/PUBLIC_DATA_EXPOSURE_POLICY.md)
- [Alpha release checklist](docs/ALPHA_RELEASE_CHECKLIST.md)
- [Release policy](docs/RELEASE_POLICY.md)
- [Deployment status](docs/DEPLOYMENT_STATUS.md)
- [Release history](docs/RELEASE_HISTORY.md)
- [Long-term data strategy](docs/LONG_TERM_DATA_STRATEGY.md)

Internal or post-MVP planning:

- [Multi-state expansion gates](docs/MULTI_STATE_EXPANSION_GATES.md)
- [Accelerated expansion plan](docs/ACCELERATED_EXPANSION_PLAN.md)
- [Expansion review log](docs/EXPANSION_REVIEW_LOG.md)
- [Punjab go-live checklist](docs/PUNJAB_GO_LIVE_CHECKLIST.md)
- [Punjab public readiness review](docs/PUNJAB_PUBLIC_READINESS_REVIEW.md)
- [Haryana public readiness review](docs/HARYANA_PUBLIC_READINESS_REVIEW.md)
- [Haryana go-live checklist](docs/HARYANA_GO_LIVE_CHECKLIST.md)
- [Assam public readiness review](docs/ASSAM_PUBLIC_READINESS_REVIEW.md)
- [Assam go-live checklist](docs/ASSAM_GO_LIVE_CHECKLIST.md)
- [Assam internal readiness review](docs/ASSAM_INTERNAL_READINESS_REVIEW.md)
- [Kerala public readiness review](docs/KERALA_PUBLIC_READINESS_REVIEW.md)
- [Kerala go-live checklist](docs/KERALA_GO_LIVE_CHECKLIST.md)
- [Tamil Nadu public readiness review](docs/TAMIL_NADU_PUBLIC_READINESS_REVIEW.md)
- [Tamil Nadu go-live checklist](docs/TAMIL_NADU_GO_LIVE_CHECKLIST.md)
- [Tamil Nadu internal readiness review](docs/TAMIL_NADU_INTERNAL_READINESS_REVIEW.md)
- [Karnataka internal readiness review](docs/KARNATAKA_INTERNAL_READINESS_REVIEW.md)
- [Tripura internal readiness review](docs/TRIPURA_INTERNAL_READINESS_REVIEW.md)
- [Nagaland internal readiness review](docs/NAGALAND_INTERNAL_READINESS_REVIEW.md)
- [Telangana internal readiness review](docs/TELANGANA_INTERNAL_READINESS_REVIEW.md)
- [Andhra Pradesh internal readiness review](docs/ANDHRA_PRADESH_INTERNAL_READINESS_REVIEW.md)
- [Arunachal Pradesh internal readiness review](docs/ARUNACHAL_PRADESH_INTERNAL_READINESS_REVIEW.md)
- [Manipur internal readiness review](docs/MANIPUR_INTERNAL_READINESS_REVIEW.md)
- [Kerala internal readiness review](docs/KERALA_INTERNAL_READINESS_REVIEW.md)
- [Meghalaya internal readiness review](docs/MEGHALAYA_INTERNAL_READINESS_REVIEW.md)
- [Judiciary public data landscape](docs/JUDICIARY_PUBLIC_DATA_LANDSCAPE.md)
- [AWS dev resources](infra/aws/dev/README.md)

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
