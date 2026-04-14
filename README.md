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

The current repository now includes the first narrow alpha vertical slice:

- published snapshot boundary with explicit publish state
- operator API and CLI for publish control
- homepage for the latest published Himachal snapshot
- district evidence page
- `GET /v1/stats/himachal`
- regression tests for publish safety, stale and empty states, and UI/API parity

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
- [Development workflow](docs/DEVELOPMENT_WORKFLOW.md)
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

- `api/` holds the Express server, public routes, operator routes, publish logic, and read-model services
- `web/` holds the server-rendered React pages and styles
- `shared/` holds typed contracts and schemas shared by API, CLI, and tests
- `warehouse/fixtures/` holds reproducible snapshot-run fixtures for the current alpha slice
- `warehouse/state/` holds the currently published run pointer

This is a fixture-backed reference implementation of the public trust boundary. The production direction remains PostgreSQL for canonical state plus S3 for raw scrape artifacts.

## Local Development

```bash
npm install
npm run dev
```

Default server: [http://localhost:3000](http://localhost:3000)

Available routes in the current slice:

- `/` - homepage for the latest published Himachal snapshot
- `/districts/:slug` - district evidence page
- `/v1/stats/himachal` - public statewide stats payload
- `/v1/districts/:slug` - district detail payload
- `/operator/runs` - operator-only run inspection endpoint
- `POST /operator/publish/:runId` - operator-only publish endpoint

Operator routes require `x-operator-token`. The default local token is `dev-operator-token` unless `OPERATOR_TOKEN` is set.

CLI publish flow:

```bash
npm run publish:snapshot -- run-hp-2026-04-07
```

## Testing

```bash
npm run typecheck
npm test
```

Current regression coverage includes:

- publish safety for valid, failed, and empty runs
- homepage empty state when nothing is published
- stale snapshot presentation while keeping the last published data visible
- homepage and `/v1/stats/himachal` topline parity
- district evidence page availability for the published snapshot

## Credit-Aware Deployment Direction

The approved architecture already matches the strongest infrastructure credit available to this project: `AWS $10k in student credits`.

Use those credits first for the production version of this slice:

- one AWS-hosted containerized app for the Node service
- PostgreSQL as the canonical store
- S3 for raw scrape artifacts and replayable evidence inputs
- CloudWatch or equivalent AWS-native logging around publish runs and operator actions

Additional user-provided credits from the YC student pack can support development or operator tooling without changing the core product posture:

- `OpenAI` credits for internal developer workflows only, not public legal-analysis claims
- `Firecrawl` credits for operator-side scraping and extraction helpers
- `Browser Use` credits for browser QA and smoke testing
- `Langfuse` or equivalent observability credits for internal model and prompt evaluation if AI-assisted operator tooling is added later

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
