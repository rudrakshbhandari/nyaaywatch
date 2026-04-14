# Storage And Operator Flow

This repository now ships the first real storage slice for NyaayWatch's published snapshot boundary.

## What Lives Where

- PostgreSQL stores canonical run state, run artifacts metadata, published snapshot payloads, and publication history.
- S3 stores the raw evidence artifacts that back a run and provide replayable operator inputs.
- The public API and UI read only the latest publication event for Himachal Pradesh.

## Storage Model

### PostgreSQL tables

- `runs` records ingestion/publish lifecycle state for a snapshot attempt.
- `run_artifacts` records raw evidence object keys, checksums, and metadata for each run.
- `published_snapshots` stores the immutable public payload served by the API and UI.
- `publication_history` records every publish and rollback event; the latest row is the active public snapshot.

### S3 layout

- Raw evidence inputs use `raw/<env>/hp/<source-date>/...`
- Replay copies use `raw/<env>/hp/replays/<run-id>/...`
- Buckets must be `nyaaywatch-` prefixed.
- Region is fixed to `ap-south-1`.
- All buckets are tagged with `project=nyaaywatch` and `env=dev` or `env=staging`.

## Operator Flow

### Publish

1. Store raw evidence input in S3.
2. Insert a `runs` row in PostgreSQL.
3. Insert `run_artifacts` metadata rows.
4. Materialize and store the immutable `published_snapshots` payload.
5. Append a `publication_history` row with `action=publish`.

### Replay

1. Read the existing run and its raw artifact metadata from PostgreSQL.
2. Copy the referenced S3 objects into an isolated replay prefix.
3. Create a new `runs` row with `replay_of_run_id`.
4. Re-materialize the published snapshot payload from the stored snapshot boundary.
5. Append a new `publication_history` publish event.

Current replay keeps the same public payload shape and source snapshot semantics. It does not yet rerun a separate extract/normalize pipeline because those modules have not landed in this slice.

### Rollback

1. Select a prior publication event.
2. Append a new `publication_history` row with `action=rollback` pointing at that older snapshot.
3. Public routes immediately read that snapshot because they always resolve the latest publication event.

## Operator Surfaces

- `GET /operator/runs`
- `GET /operator/publications`
- `POST /operator/runs/:runId/replay`
- `POST /operator/publications/:publicationId/rollback`

All operator endpoints require `x-operator-token`.

## Local Development

1. Copy `.env.example` to `.env`.
2. Run `npm run docker:up`.
3. Run `npm install`.
4. Run `npm run dev:bootstrap`.
5. Run `npm run dev`.

`docker-compose.yml` starts PostgreSQL plus LocalStack S3 with `ap-south-1` configured so the app exercises the same S3 code path in development.

## AWS Notes

- Use only isolated `nyaaywatch-` prefixed resources.
- Do not reuse unrelated buckets.
- The app is written against standard PostgreSQL plus S3, so deployment can target an AWS-hosted container and an isolated PostgreSQL instance without changing public behavior.
- Current provisioned dev bucket: `nyaaywatch-dev-artifacts-723951822728`
