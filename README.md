# NyaayWatch

> **How long is India waiting for justice?**

NyaayWatch publishes reviewed, versioned snapshots of pending caseloads, clearance rates, and wait times across India's Supreme Court, all 25 High Courts, and the lower courts in every state and Union Territory — drawn from public NJDG data with full methodology disclosure. Every number links to a dated source.

→ [Live site](https://nyaaywatch.in) · [Press & embed kit](https://nyaaywatch.in/press) · [Methodology](https://nyaaywatch.in/methodology) · [API reference](https://nyaaywatch.in/api) · [Data downloads](https://nyaaywatch.in/data)

```bash
curl https://nyaaywatch.in/v1/stats/himachal | jq
curl https://nyaaywatch.in/v1/districts | jq '.districts[0]'
```

## What's Live

The public alpha covers the full Indian court hierarchy:

- **Supreme Court** at `/supreme-court`
- **All 25 High Courts** at `/high-courts/:slug` — canonical list in [src/high-courts.ts](src/high-courts.ts)
- **All 36 lower-court geographies** (28 states + 8 Union Territories) at `/states/:slug` — canonical list in [src/geographies.ts](src/geographies.ts)
- **Himachal Pradesh** remains the unscoped lower-court default at `/`, `/districts`, `/data`, `/methodology`, `/api`

Each court family ships paired `/data`, `/methodology`, `/api` pages plus a stable `/v1/...` JSON contract. Cross-jurisdiction surfaces include `/movers`, `/compare/:slug`, and embeddable district and state widgets at `/embed/district/:id` and `/embed/state/:slug`.

## Product Guardrails

- Snapshot-based, not live.
- Every public metric has reproducible provenance from stored evidence.
- No predictive, AI-forward, or legal-analysis claims.
- Anomalies are flagged signals, not verdicts.
- Raw upstream artifacts are never exposed publicly.

## Architecture

- one AWS-hosted containerized app, fronted by Cloudflare
- PostgreSQL as the canonical store for runs, artifacts, and publication state
- S3 for raw scrape evidence and normalized snapshot candidates
- explicit ingestion pipeline: fetch → extract → normalize → publish, all operator-gated
- auto-publish runner validates fresh internal runs against guardrails; publishes automatically when quality and delta checks pass, and pages via SNS when the gate blocks or the publish step fails
- post-deploy publish-pending sweep attempts to publish the most recent quality-complete run per scope (within 3 days) that has no newer publication, using the same gate
- published snapshot read models drive every public surface; rollback is one operator call

## Repository Map

- `src/api/` — Express app, public routes, operator routes, HTML rendering
- `src/services/` — published snapshot orchestration and run-pipeline logic
- `src/storage/` — PostgreSQL and S3 adapters
- `src/db/` — migrations and migration tooling
- `src/ingest/`, `src/extract/`, `src/normalize/` — pipeline stages
- `src/ops/` — auto-publish gate, publish-pending sweep, and review alerting
- `fixtures/` — captured NJDG inputs for local dev and tests

## Quickstart

Prerequisites: Node `>=22`, Docker with Compose, npm.

```bash
cp .env.example .env
npm install
npm run docker:up
npm run dev:bootstrap
npm run dev
```

Defaults to `http://127.0.0.1:3000`. Local development uses PostgreSQL plus LocalStack S3; keep `AWS_REGION=ap-south-1` so the code path matches production. If `5432` or `4566` are already in use, override `POSTGRES_PORT` and `LOCALSTACK_PORT` in `.env` and keep `DATABASE_URL` and `AWS_ENDPOINT_URL_S3` aligned.

## Operator Workflow

```bash
npm run operator:fetch -- "Manual Himachal fetch"
npm run operator:inspect -- <run-id>
npm run operator:publish -- <run-id> "Publish completed snapshot"
npm run operator:replay -- <run-id>
npm run operator:rollback -- <publication-id>
```

For live remote operation against `https://nyaaywatch.in`:

```bash
npm run operator:remote -- --base-url=https://nyaaywatch.in publications
npm run operator:remote -- --base-url=https://nyaaywatch.in --state=UP fetch "Internal Uttar Pradesh fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court=gujarat fetch "Internal Gujarat HC fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --supreme-court fetch "Internal SC fetch"
```

Use `npm run operator:staging` for heavy-state lanes that should run inside a one-off ECS task instead of through the Cloudflare-fronted operator path. Add `--connect-host=<alb-dns>` to `operator:remote` to bypass Cloudflare while keeping `nyaaywatch.in` as the HTTP and TLS host.

Release helpers (run before, after, and to record a publication):

```bash
npm run release:prepublish -- --run-id=<run-id> --base-url=https://nyaaywatch.in
npm run release:postpublish -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in
npm run release:record -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
npm run release:purge-public-routes -- --high-court=<court-slug>
```

Each release helper accepts `--state-slug=<slug>` or `--high-court=<slug>` to scope to the right court family. `release:verify` also accepts `--supreme-court` for the apex-tier public surface.

## Scheduled Internal Fetches

The live deploy runs four daily ECS schedules, all reconciled to the latest task definition with `npm run operator:reconcile-fetch-schedule`:

- lower-court state and UT profiles — `8:00 AM Asia/Kolkata`
- Supreme Court — `8:10 AM Asia/Kolkata`
- reviewed High Courts — `8:20 AM Asia/Kolkata`
- public-alpha ops monitor — every `30` minutes against `https://nyaaywatch.in`

The lower-court schedule covers everything in `listInternalFetchStateProfiles()`. The High Court schedule auto-includes any court whose `sourceReviewStatus` is `reviewed`. The ops monitor pages on parity drift, stale public snapshots, or internal fetch lag. Auto-publish publishes directly when quality and delta checks pass; it pages via SNS when the gate blocks for human review or when the publish step itself fails. Each deploy also runs a publish-pending sweep that attempts to publish the most recent quality-complete run per scope from the past 3 days if no newer publication exists.

## Public API

State-scoped, court-scoped, and cross-jurisdiction endpoints all follow the same shape. Examples:

```
GET /v1/stats/himachal
GET /v1/districts
GET /v1/trends
GET /v1/states/:stateSlug/{stats,districts,trends}
GET /v1/high-courts/:courtSlug/{stats,trends}
GET /v1/supreme-court/{stats,trends}
```

Full contract is enforced by API contract tests under `src/api/__tests__/`.

## Operator API

All `/operator/*` routes require `x-operator-token`. Three parallel namespaces mirror the public surface:

- `/operator/runs`, `/operator/publications` — lower-court (state-scoped via `stateCode` or `stateSlug`)
- `/operator/high-courts/:courtSlug/...` — High Court runs and publications
- `/operator/supreme-court/...` — Supreme Court runs and publications

Each namespace exposes `runs`, `runs/:runId`, `runs/fetch`, `runs/:runId/{publish,replay}`, `publications`, and `publications/:publicationId/rollback`.

## Testing

```bash
npm run typecheck
npm test
npm run test:e2e
RUN_PERSISTENT_STACK_TESTS=1 npm run test:persistent
```

If Playwright browsers are not installed: `npx playwright install`.

Coverage spans migration safety, golden-fixture capture, publish gating, replay/rollback, district history and CSV export parity, browser E2E for citizen/reporter/developer flows, responsive and accessibility checks, stable API contracts, persistent-stack replay/rollback through local PostgreSQL plus LocalStack S3, and operator token enforcement.

## Key Docs

Design and product:

- [Design system](DESIGN.md)
- [Brand system](brand/BRAND.md)
- [National product architecture](docs/NATIONAL_PRODUCT_ARCHITECTURE.md)
- [Long-term data strategy](docs/LONG_TERM_DATA_STRATEGY.md)

Operations and release:

- [Development workflow](docs/DEVELOPMENT_WORKFLOW.md)
- [Storage and operator flow](docs/STORAGE_AND_OPERATIONS.md)
- [Release policy](docs/RELEASE_POLICY.md)
- [On-call policy](docs/ON_CALL_POLICY.md)
- [High Court freshness runbook](docs/HIGH_COURT_FRESHNESS_RUNBOOK.md)
- [Operating evidence](docs/OPERATING_EVIDENCE.md)
- [Public data exposure policy](docs/PUBLIC_DATA_EXPOSURE_POLICY.md)
- [Public alpha launch comms](docs/PUBLIC_ALPHA_LAUNCH_COMMS.md)
- [Domain cutover checklist](docs/DOMAIN_CUTOVER_CHECKLIST.md)
- [Deployment status](docs/DEPLOYMENT_STATUS.md)
- [Release history](docs/RELEASE_HISTORY.md)

Per-state and per-court readiness reviews, source reviews, methodology drafts, and go-live checklists live alongside these in `docs/`. Start from [INDIA_COURT_COVERAGE_AUDIT.md](docs/INDIA_COURT_COVERAGE_AUDIT.md) for the full jurisdiction map, or [TODOS.md](TODOS.md) for the working backlog.

## Non-Goals

Case-level search, PDF parsing, judge rankings, predictive forecasting, AI legal analysis, real-time claims.

## Voice

Investigative, public-interest, calm, exact, evidence-first.
