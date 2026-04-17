# Storage And Operator Flow

This repository now ships the real Himachal run pipeline for NyaayWatch's published snapshot boundary, plus the first approved state-scoped public expansion path for Punjab.

## What Lives Where

- PostgreSQL stores canonical run state, run artifact metadata, published snapshot payloads, and publication history.
- S3 stores the raw captured NJDG HTML bundles and normalized snapshot-candidate artifacts that back a run.
- The public API and UI read only the latest publication event for each explicitly exposed public state.
- Unscoped public routes remain the Himachal Pradesh default surface.
- Additional approved public states use explicit `/states/:stateSlug/...` routes and state-scoped API endpoints.
- Operator flows can target supported candidate states without requiring a separate code fork.

## Storage Model

### PostgreSQL tables

- `runs` records ingestion/publish lifecycle state for a snapshot attempt.
- `run_artifacts` records raw evidence object keys, checksums, and metadata for each run.
- `published_snapshots` stores the immutable public payload served by the API and UI.
- `publication_history` records every publish and rollback event; the latest row is the active public snapshot.

### S3 layout

- Raw evidence inputs use `raw/<env>/hp/<source-date>/...`
- Normalized candidates use `normalize/<env>/hp/<source-date>/...`
- Replay copies use `raw/<env>/hp/replays/<run-id>/...`
- Buckets must be `nyaaywatch-` prefixed.
- Region is fixed to `ap-south-1`.
- All buckets are tagged with `project=nyaaywatch` and `env=dev` or `env=staging`.

## Operator Flow

The live public product remains state-by-state and deployment-controlled.

Approved additional public states use the same fetch / inspect / publish / replay / rollback machinery plus the same published-snapshot read boundary. The current first additional state is Punjab (`PB`), exposed only through explicit state-scoped routes when a Punjab published snapshot is present in the current runtime.

### Fetch

1. Store raw evidence input in S3.
2. Insert a `runs` row in PostgreSQL.
3. Insert `run_artifacts` metadata rows for the captured NJDG HTML bundle.
4. Re-read the stored raw artifact and run deterministic `extract/` and `normalize/` transforms against it.
5. Store the resulting snapshot candidate as a second run artifact.
6. Mark the run `completed` only if the candidate is valid.

### Inspect

1. Read the run, artifact metadata, and stored snapshot candidate from PostgreSQL plus S3.
2. Confirm the run is `completed` and not `failed` or still `pending`.
3. Review the candidate payload before publish.

### Publish

1. Require a `completed` run.
2. Require both the raw capture artifact and the snapshot-candidate artifact to exist.
3. Require the candidate payload to validate and the run quality state to be non-partial.
4. Materialize the immutable `published_snapshots` payload from the stored candidate.
5. Append a `publication_history` row with `action=publish`.

### Replay

1. Read the existing run and its raw artifact metadata from PostgreSQL.
2. Copy the referenced S3 objects into an isolated replay prefix.
3. Create a new `runs` row with `replay_of_run_id`.
4. Re-run `extract/` and `normalize/` against the copied raw artifact.
5. Publish the replay run through the same gating rules as a normal run.

### Rollback

1. Select a prior publication event.
2. Append a new `publication_history` row with `action=rollback` pointing at that older snapshot.
3. Public routes immediately read that snapshot because they always resolve the latest publication event.

## Operator Surfaces

- `GET /operator/runs`
- `GET /operator/runs/:runId`
- `POST /operator/runs/fetch`
- `POST /operator/runs/:runId/publish`
- `GET /operator/publications`
- `POST /operator/runs/:runId/replay`
- `POST /operator/publications/:publicationId/rollback`

All operator endpoints require `x-operator-token`.

For multi-state operation, operator surfaces accept explicit state targeting through `stateCode` or `stateSlug` query params or JSON-body fields. If omitted, the runtime falls back to its configured default state.

### Remote Operator Lane

For live remote operation from a local terminal, use:

```bash
npm run operator:remote -- --base-url=https://nyaaywatch.in publications
```

For heavier internal states that may exceed Cloudflare's edge timeout, bypass Cloudflare while preserving `nyaaywatch.in` as the HTTP and TLS host:

```bash
npm run operator:remote -- \
  --base-url=https://nyaaywatch.in \
  --connect-host=<alb-dns> \
  --state=UP \
  fetch "Internal Uttar Pradesh fetch"
```

Notes:

- `OPERATOR_API_TOKEN` must be set in the shell that runs `operator:remote`.
- `--connect-host` changes only the network target. The request still carries the canonical host, so the app and certificate path behave like production origin traffic.
- Use the direct-origin lane for long-running internal operator requests only. Public verification should still run against `https://nyaaywatch.in`.

## Local Development

1. Copy `.env.example` to `.env`.
2. Run `npm run docker:up`.
3. Run `npm install`.
4. Run `npm run dev:bootstrap`.
5. Run `npm run dev`.

`docker-compose.yml` starts PostgreSQL plus LocalStack S3 with `ap-south-1` configured so the app exercises the same S3 code path in development.

If `5432` or `4566` are already occupied, set `POSTGRES_PORT` and `LOCALSTACK_PORT` in `.env` before starting the stack, then keep `DATABASE_URL` and `AWS_ENDPOINT_URL_S3` aligned with those host ports.

## Operator Runbook

### Fetch -> Inspect -> Publish

1. Start the local stack with `npm run docker:up`.
2. Bootstrap or run the app with `npm run dev`.
3. Create a run:
   `npm run operator:fetch -- "Manual Himachal fetch"`
4. For an internal candidate state trial, override the operator target explicitly:
   `npm run operator:fetch -- --state PB "Internal Punjab fetch"`
   For a live remote internal-state flow from a local terminal:
   `npm run operator:remote -- --base-url=https://nyaaywatch.in --state=PB fetch "Internal Punjab fetch"`
   For heavier states, add `--connect-host=<alb-dns>` to bypass Cloudflare.
5. Inspect the stored candidate:
   `npm run operator:inspect -- <run-id>`
   For a live remote flow:
   `npm run operator:remote -- --base-url=https://nyaaywatch.in inspect <run-id>`
6. Review publication history and the current rollback target:
   `npm run operator:publications`
   For a live remote flow:
   `npm run operator:remote -- --base-url=https://nyaaywatch.in publications`
7. Run prepublish verification against the public hostname:
   `npm run release:prepublish -- --run-id=<run-id> --base-url=https://nyaaywatch.in`
   For a state-scoped rollout, add `--state-slug=<state-slug>`.
8. Publish the completed run:
   `npm run operator:publish -- <run-id> "Publish completed snapshot"`
9. After publish, save a release evidence artifact:
   `npm run release:postpublish -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in`
   For a state-scoped rollout, add `--state-slug=<state-slug>`.
10. Record the release in the tracked ledger:
    `npm run release:record -- --publication-id=<publication-id> --base-url=https://nyaaywatch.in --reviewer="<name>"`
    For a state-scoped rollout, add `--state-slug=<state-slug>`.

If `CLOUDFLARE_API_TOKEN` is configured in the runtime, publish and rollback also purge the public data page plus CSV export URLs for that state so the stable download paths do not keep serving a stale cached snapshot after a release change.

The `--state` override targets the operator flow only. A state becomes publicly reachable only if the runtime includes that state's published snapshot service and the public app has been intentionally rolled out with the corresponding state-scoped routes.

### Heavy-State Live AWS Runbook

For heavier internal-only states on the live stack, do not rely on `https://nyaaywatch.in/operator/...` as the default fetch lane. Use the ECS-backed helper instead:

```bash
npm run operator:staging -- --state UP fetch "Internal Uttar Pradesh fetch"
```

Why this is the default heavy-state lane:

- it runs the operator command inside a one-off ECS task with the live service's current task definition
- it reuses the live service network configuration and task environment
- it avoids Cloudflare edge timeouts on long-running fetch requests
- it still returns the operator JSON payload locally after the task finishes

Additional examples:

```bash
npm run operator:staging -- --state UP inspect <run-id>
npm run operator:staging -- --state UP publish <run-id> "Publish Uttar Pradesh proof cycle"
npm run operator:staging -- --state UP replay <run-id> "Replay Uttar Pradesh proof cycle"
npm run operator:staging -- --state UP rollback <publication-id> "Rollback Uttar Pradesh proof cycle"
```

Requirements:

- AWS CLI configured with access to the staging stack
- access to run ECS and CloudWatch Logs commands in `ap-south-1`
- the local machine does not need direct database or operator-token access because the command runs inside ECS

The older ALB plus `curl --connect-to` path remains a recovery fallback only. It is no longer the default documented operator lane for heavier states.

### Replay -> Rollback

1. Replay a prior run from stored raw evidence:
   `npm run operator:replay -- <run-id> "Replay stored evidence"`
2. Roll back to an earlier publication if needed:
   `npm run operator:rollback -- <publication-id> "Rollback to prior publication"`

Local `npm run dev:bootstrap` and `npm run db:seed` use captured Himachal NJDG fixture HTML so the same fetch/inspect/publish path can run offline in development and tests.

## AWS Notes

- Use only isolated `nyaaywatch-` prefixed resources.
- Do not reuse unrelated buckets.
- The app is written against standard PostgreSQL plus S3, so deployment can target an AWS-hosted container and an isolated PostgreSQL instance without changing public behavior.
- Current provisioned dev bucket: `nyaaywatch-dev-artifacts-723951822728`
