# NyaayWatch

> **How long is India waiting for justice?**

NyaayWatch publishes reviewed, versioned snapshots of pending caseloads, clearance rates, and wait times across India's Supreme Court, High Courts, and district courts — drawn from public NJDG data with full methodology disclosure. Every number links to a dated source. Nothing is shown without a click-reachable citation.

**Journalist quickstart** — pull the numbers without leaving your terminal:

```bash
curl https://nyaaywatch.in/v1/stats/himachal | jq
curl https://nyaaywatch.in/v1/districts | jq '.districts[0]'
```

→ [Press & embed kit](https://nyaaywatch.in/press) · [Methodology](https://nyaaywatch.in/methodology) · [API reference](https://nyaaywatch.in/api) · [Data downloads](https://nyaaywatch.in/data)

---

NyaayWatch makes Indian court-system data transparent and usable so the public can hold the judiciary accountable, starting with Himachal Pradesh and expanding state by state only after the same trust bar is met.

## What This Repo Is

This repository contains the public alpha implementation:

- public scorecards and district evidence pages backed by a published snapshot
- a narrow read-only public API for the same published snapshot
- operator workflows for fetch, inspect, publish, replay, and rollback
- reproducible raw-evidence storage and deterministic normalization

The public product is intentionally:

- Himachal-first as the lower-court proof surface, with a Supreme Court-first national homepage
- snapshot-based, not live
- transparency-first, not AI-forward
- open source, but source-aware about raw upstream redistribution

## Current Status

The Himachal alpha MVP path is complete and its launch gates are satisfied.

What is shipped now:

- PostgreSQL-backed canonical run, artifact, and publication state
- S3-backed stored raw HTML evidence and normalized snapshot-candidate artifacts
- a national homepage at `/` that stages Supreme Court, High Courts, and district/subordinate courts in one scroll
- explicit Himachal lower-court overview at `/states/himachal`, plus lower-court district, data, methodology, and API routes
- narrow public Supreme Court beta routes under `/supreme-court`
- public High Court beta routes for all 25 configured HC NJDG selector-backed High Court profiles under `/high-courts/...`
- explicit lower-court public routing for every currently supported state and Union Territory profile beyond Himachal Pradesh
- operator replay and rollback controls
- regression coverage for migration safety, publish gating, replay/rollback behavior, contract stability, and public trust surfaces

Post-MVP work continues in this repo, but the currently supported public lower-court rollout set is now complete on the live site. Himachal Pradesh remains the default lower-court proof surface through `/states/himachal` and the unscoped district-family routes, while explicit `/states/:stateSlug/...` public routes are now live for all 36 lower-court NJDG selector geographies: 28 states plus Andaman and Nicobar Islands, Chandigarh, Delhi, Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry, and Dadra and Nagar Haveli and Daman and Diu. The route namespace remains `/states/:stateSlug` for compatibility, but public copy distinguishes states from Union Territories.

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
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court himachal publications
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court himachal fetch "Internal Himachal High Court fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court andhra-pradesh fetch "Internal Andhra Pradesh High Court fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court telangana fetch "Internal Telangana High Court fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court gujarat fetch "Internal Gujarat High Court fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court madhya-pradesh fetch "Internal Madhya Pradesh High Court fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court uttar-pradesh fetch "Internal Allahabad High Court fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --high-court jammu-kashmir-and-ladakh fetch "Initial J-K and Ladakh High Court fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --supreme-court fetch "Internal Supreme Court fetch"
npm run operator:remote -- --base-url=https://nyaaywatch.in --supreme-court publications
npm run high-court:readiness -- --base-url=https://nyaaywatch.in --court-slug=himachal
npm run high-court:wave-readiness -- --base-url=https://nyaaywatch.in --court-slugs=andhra-pradesh,telangana
npm run operator:staging -- --state UP fetch "Internal Uttar Pradesh fetch"
npm run operator:reconcile-fetch-schedule
npm run release:prepublish -- --run-id=<run-id> --base-url=https://nyaaywatch.in
npm run release:prepublish -- --state-slug=<state-slug> --run-id=<run-id> --base-url=https://nyaaywatch.in
npm run release:postpublish -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in
npm run release:postpublish -- --state-slug=<state-slug> --publication-id=<publication-id> --base-url=https://nyaaywatch.in
npm run release:record -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
npm run release:record -- --state-slug=<state-slug> --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"
npm run release:purge-public-routes -- --supreme-court
npm run release:purge-public-routes -- --high-court=andhra-pradesh,telangana
npm run release:purge-public-routes -- --high-court=gujarat,madhya-pradesh
npm run release:purge-public-routes -- --high-court=uttar-pradesh,rajasthan
```

Use `npm run operator:remote` for live remote operator access from a local terminal. Use `npm run operator:staging` as the default heavy-state lane on the live AWS stack when long-running fetches should execute inside a one-off ECS task instead of through the Cloudflare-fronted public operator path.
Use `npm run release:purge-public-routes` when a newly exposed Supreme Court or High Court public-beta route family needs an explicit Cloudflare purge after a deploy-only rollout.

The live deploy path now supports three daily internal raw-fetch schedules plus a recurring public-alpha monitor:

- lower-court state and Union Territory profiles at `8:00 AM Asia/Kolkata` across all internally proven lower-court geographies
- Supreme Court at `8:10 AM Asia/Kolkata`
- reviewed High Courts at `8:20 AM Asia/Kolkata`
- public-alpha ops monitor at every `30` minutes, checking `https://nyaaywatch.in` through the same deployed runtime and operator history

Reconcile them against the current ECS task definition with `npm run operator:reconcile-fetch-schedule`; the deploy helper keeps all four schedules pointed at the latest ECS task definition without changing the public snapshot. The lower-court schedule targets all profiles returned by `listInternalFetchStateProfiles()`, including the proven UT profiles, while the High Court schedule automatically picks up only courts whose `sourceReviewStatus` is `reviewed`. The public-alpha monitor emits a dedicated alert log line when parity drift, stale public snapshots, or internal fetch lag is detected. Public publishes remain operator-reviewed and manual on their existing cadence.

## Public Surface

Public routes:

- `/`
- `/supreme-court`
- `/supreme-court/data`
- `/supreme-court/methodology`
- `/supreme-court/api`
- `/high-courts`
- `/high-courts/himachal`
- `/high-courts/himachal/data`
- `/high-courts/himachal/methodology`
- `/high-courts/himachal/api`
- `/high-courts/andhra-pradesh`
- `/high-courts/andhra-pradesh/data`
- `/high-courts/andhra-pradesh/methodology`
- `/high-courts/andhra-pradesh/api`
- `/high-courts/bombay`
- `/high-courts/bombay/data`
- `/high-courts/bombay/methodology`
- `/high-courts/bombay/api`
- `/high-courts/calcutta`
- `/high-courts/calcutta/data`
- `/high-courts/calcutta/methodology`
- `/high-courts/calcutta/api`
- `/high-courts/telangana`
- `/high-courts/telangana/data`
- `/high-courts/telangana/methodology`
- `/high-courts/telangana/api`
- `/high-courts/delhi`
- `/high-courts/delhi/data`
- `/high-courts/delhi/methodology`
- `/high-courts/delhi/api`
- `/high-courts/gujarat`
- `/high-courts/gujarat/data`
- `/high-courts/gujarat/methodology`
- `/high-courts/gujarat/api`
- `/high-courts/gauhati`
- `/high-courts/gauhati/data`
- `/high-courts/gauhati/methodology`
- `/high-courts/gauhati/api`
- `/high-courts/jammu-kashmir-and-ladakh`
- `/high-courts/jammu-kashmir-and-ladakh/data`
- `/high-courts/jammu-kashmir-and-ladakh/methodology`
- `/high-courts/jammu-kashmir-and-ladakh/api`
- `/high-courts/kerala`
- `/high-courts/kerala/data`
- `/high-courts/kerala/methodology`
- `/high-courts/kerala/api`
- `/high-courts/madras`
- `/high-courts/madras/data`
- `/high-courts/madras/methodology`
- `/high-courts/madras/api`
- `/high-courts/madhya-pradesh`
- `/high-courts/madhya-pradesh/data`
- `/high-courts/madhya-pradesh/methodology`
- `/high-courts/madhya-pradesh/api`
- `/high-courts/punjab-and-haryana`
- `/high-courts/punjab-and-haryana/data`
- `/high-courts/punjab-and-haryana/methodology`
- `/high-courts/punjab-and-haryana/api`
- `/high-courts/uttar-pradesh`
- `/high-courts/uttar-pradesh/data`
- `/high-courts/uttar-pradesh/methodology`
- `/high-courts/uttar-pradesh/api`
- `/high-courts/rajasthan`
- `/high-courts/rajasthan/data`
- `/high-courts/rajasthan/methodology`
- `/high-courts/rajasthan/api`
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
- Supreme Court now has a narrow public beta route family under `/supreme-court`
- the public High Court beta currently covers all 25 configured HC NJDG selector-backed High Court profiles under `/high-courts/...`
- all other supported state and Union Territory lower-court geographies now use explicit `/states/:stateSlug/...` routes
- the currently live additional lower-court public surfaces are Punjab, Haryana, Tamil Nadu, Assam, Telangana, Kerala, Meghalaya, Karnataka, Tripura, Nagaland, Andhra Pradesh, Arunachal Pradesh, Manipur, Uttarakhand, Rajasthan, Uttar Pradesh, Madhya Pradesh, Maharashtra, Bihar, Gujarat, Odisha, West Bengal, Jharkhand, Chhattisgarh, Goa, Sikkim, Mizoram, Andaman and Nicobar Islands, Chandigarh, Delhi, Jammu and Kashmir, Ladakh, Lakshadweep, Puducherry, and Dadra and Nagar Haveli and Daman and Diu
- deployment docs remain the source of truth for publication ids, snapshot ids, and live rollout evidence on `https://nyaaywatch.in`

Public API:

- `GET /v1/stats/himachal`
- `GET /v1/supreme-court/stats`
- `GET /v1/supreme-court/trends`
- `GET /v1/high-courts/himachal/stats`
- `GET /v1/high-courts/himachal/trends`
- `GET /v1/high-courts/andhra-pradesh/stats`
- `GET /v1/high-courts/andhra-pradesh/trends`
- `GET /v1/high-courts/bombay/stats`
- `GET /v1/high-courts/bombay/trends`
- `GET /v1/high-courts/calcutta/stats`
- `GET /v1/high-courts/calcutta/trends`
- `GET /v1/high-courts/telangana/stats`
- `GET /v1/high-courts/telangana/trends`
- `GET /v1/high-courts/delhi/stats`
- `GET /v1/high-courts/delhi/trends`
- `GET /v1/high-courts/gujarat/stats`
- `GET /v1/high-courts/gujarat/trends`
- `GET /v1/high-courts/gauhati/stats`
- `GET /v1/high-courts/gauhati/trends`
- `GET /v1/high-courts/jammu-kashmir-and-ladakh/stats`
- `GET /v1/high-courts/jammu-kashmir-and-ladakh/trends`
- `GET /v1/high-courts/kerala/stats`
- `GET /v1/high-courts/kerala/trends`
- `GET /v1/high-courts/madras/stats`
- `GET /v1/high-courts/madras/trends`
- `GET /v1/high-courts/madhya-pradesh/stats`
- `GET /v1/high-courts/madhya-pradesh/trends`
- `GET /v1/high-courts/punjab-and-haryana/stats`
- `GET /v1/high-courts/punjab-and-haryana/trends`
- `GET /v1/high-courts/uttar-pradesh/stats`
- `GET /v1/high-courts/uttar-pradesh/trends`
- `GET /v1/high-courts/rajasthan/stats`
- `GET /v1/high-courts/rajasthan/trends`
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
- `GET /operator/high-courts`
- `GET /operator/high-courts/:courtSlug`
- `GET /operator/high-courts/:courtSlug/runs`
- `GET /operator/high-courts/:courtSlug/runs/:runId`
- `POST /operator/high-courts/:courtSlug/runs/fetch`
- `POST /operator/high-courts/:courtSlug/runs/:runId/publish`
- `POST /operator/high-courts/:courtSlug/runs/:runId/replay`
- `GET /operator/high-courts/:courtSlug/publications`
- `POST /operator/high-courts/:courtSlug/publications/:publicationId/rollback`
- `GET /operator/supreme-court`
- `GET /operator/supreme-court/runs`
- `GET /operator/supreme-court/runs/:runId`
- `POST /operator/supreme-court/runs/fetch`
- `POST /operator/supreme-court/runs/:runId/publish`
- `POST /operator/supreme-court/runs/:runId/replay`
- `GET /operator/supreme-court/publications`
- `POST /operator/supreme-court/publications/:publicationId/rollback`

Operator routes default to the runtime's configured state, but they also accept explicit `stateCode` or `stateSlug` selectors on query params or JSON bodies for multi-state operations.
High Court operator routes use the explicit `/operator/high-courts/:courtSlug/...` namespace so the internal read and publish surface stays tier-aware instead of pretending High Court data is just another state snapshot.

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
- [Brand system](brand/BRAND.md)
- [Design doc](docs/NYAAYWATCH_DESIGN.md)
- [National product architecture](docs/NATIONAL_PRODUCT_ARCHITECTURE.md)
- [India court coverage audit](docs/INDIA_COURT_COVERAGE_AUDIT.md)
- [Himachal High Court pilot plan](docs/HIMACHAL_HIGH_COURT_PILOT_PLAN.md)
- [Himachal High Court source review](docs/HIMACHAL_HIGH_COURT_SOURCE_REVIEW.md)
- [Jammu & Kashmir and Ladakh High Court source review](docs/JAMMU_KASHMIR_LADAKH_HIGH_COURT_SOURCE_REVIEW.md)
- [Uttar Pradesh High Court source review](docs/UTTAR_PRADESH_HIGH_COURT_SOURCE_REVIEW.md)
- [Rajasthan High Court source review](docs/RAJASTHAN_HIGH_COURT_SOURCE_REVIEW.md)
- [Himachal High Court methodology draft](docs/HIMACHAL_HIGH_COURT_METHODOLOGY.md)
- [Himachal High Court internal readiness review](docs/HIMACHAL_HIGH_COURT_INTERNAL_READINESS_REVIEW.md)
- [Jammu & Kashmir and Ladakh High Court internal readiness review](docs/JAMMU_KASHMIR_LADAKH_HIGH_COURT_INTERNAL_READINESS_REVIEW.md)
- [Supreme Court internal readiness review](docs/SUPREME_COURT_INTERNAL_READINESS_REVIEW.md)
- [Supreme Court methodology draft](docs/SUPREME_COURT_METHODOLOGY.md)
- [Supreme Court pilot plan](docs/SUPREME_COURT_PILOT_PLAN.md)
- [Supreme Court source review](docs/SUPREME_COURT_SOURCE_REVIEW.md)
- [High Court internal wave 1](docs/HIGH_COURT_INTERNAL_WAVE_1.md)
- [High Court wave validation plan](docs/HIGH_COURT_WAVE_VALIDATION_PLAN.md)
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
- [Meghalaya public readiness review](docs/MEGHALAYA_PUBLIC_READINESS_REVIEW.md)
- [Meghalaya go-live checklist](docs/MEGHALAYA_GO_LIVE_CHECKLIST.md)
- [Karnataka public readiness review](docs/KARNATAKA_PUBLIC_READINESS_REVIEW.md)
- [Karnataka go-live checklist](docs/KARNATAKA_GO_LIVE_CHECKLIST.md)
- [Tripura public readiness review](docs/TRIPURA_PUBLIC_READINESS_REVIEW.md)
- [Tripura go-live checklist](docs/TRIPURA_GO_LIVE_CHECKLIST.md)
- [Nagaland public readiness review](docs/NAGALAND_PUBLIC_READINESS_REVIEW.md)
- [Nagaland go-live checklist](docs/NAGALAND_GO_LIVE_CHECKLIST.md)
- [Andhra Pradesh public readiness review](docs/ANDHRA_PRADESH_PUBLIC_READINESS_REVIEW.md)
- [Andhra Pradesh go-live checklist](docs/ANDHRA_PRADESH_GO_LIVE_CHECKLIST.md)
- [Arunachal Pradesh public readiness review](docs/ARUNACHAL_PRADESH_PUBLIC_READINESS_REVIEW.md)
- [Arunachal Pradesh go-live checklist](docs/ARUNACHAL_PRADESH_GO_LIVE_CHECKLIST.md)
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
- [Goa internal readiness review](docs/GOA_INTERNAL_READINESS_REVIEW.md)
- [Sikkim internal readiness review](docs/SIKKIM_INTERNAL_READINESS_REVIEW.md)
- [Mizoram internal readiness review](docs/MIZORAM_INTERNAL_READINESS_REVIEW.md)
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
