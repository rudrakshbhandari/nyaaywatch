# Public Alpha Release Checklist

Canonical go/no-go checklist for deciding whether the India-first public alpha is ready to stay public.

Run this checklist before the first public launch and before any materially different release of public copy, methodology, or publish workflow behavior.

Use `docs/RELEASE_POLICY.md` for cadence and blocking rules, `docs/internal/DEPLOYMENT_STATUS.md` for the live environment map, and `docs/DOMAIN_CUTOVER_CHECKLIST.md` only when a release also changes hostname, certificate, or DNS state.

## Release Metadata

Record the actual values for the release being reviewed:

- Release date: `<YYYY-MM-DD>`
- Reviewer: `<name or review label>`
- Published snapshot id: `<snapshot-id>`
- Publication id: `<publication-id>`
- Source snapshot date: `<YYYY-MM-DD>`
- Methodology version: `<methodology-version>`
- Scope checked: `Supreme Court`, `25 High Courts`, and `36 lower-court state/Union Territory geographies` unless the release is explicitly narrower

## Launch Gates

### 1. Published Snapshot Integrity

- [x] Public routes load only from the active published snapshot.
- [x] No route or download reads unpublished run state.
- [x] Supreme Court, High Court, and lower-court JSON endpoints match the active publication for the checked scope.
- [x] Lower-court CSVs, district history CSVs, and evidence packs match the same publication lineage.

### 2. Freshness And Caveat Discipline

- [x] Homepage shows snapshot date, publication date, freshness, methodology version, and source attribution.
- [x] Supreme Court, High Court, lower-court geography, district workspace, and district detail pages show the same trust metadata for their scope.
- [x] Stale-state behavior is visible and still pinned to the last safe publication.
- [x] Partial runs remain blocked from public publish.

### 3. Methodology And Copy

- [x] Methodology page explains formulas, quality states, and published snapshot lineage.
- [x] Public copy uses `published snapshot`, `flagged signal`, and `operator-published` semantics.
- [x] Public copy does not present the product as continuously refreshed, predictive, or verdict-like.
- [x] India-first scope remains explicit: Supreme Court, all 25 High Courts, and all 36 lower-court state/Union Territory geographies. Himachal remains only the unscoped lower-court default.

### 4. Source And Export Boundary

- [x] `docs/PUBLIC_DATA_EXPOSURE_POLICY.md` still matches the actual product behavior.
- [x] Public downloads are limited to normalized published read-model fields.
- [x] Raw upstream HTML bundles, replay copies, and unpublished candidates are not exposed publicly.
- [x] Public citation surfaces still include clear source attribution and dates.

### 5. Publish Safety

- [x] Operator `fetch -> inspect -> publish -> replay -> rollback` flow succeeds in dedicated staging or an equivalent isolated environment.
- [x] Publish gating still requires completed run state, required artifacts, and non-partial quality state.
- [x] Rollback returns the public API and UI to the intended prior publication.
- [x] Cloud logs and operator notes are available for the release run.
- [x] `docs/internal/DEPLOYMENT_STATUS.md` contains the actual live URL and current resource names for the target environment.

### 6. Domain And HTTPS

- [x] The intended public hostname is chosen explicitly.
- [x] HTTPS is active with a valid ACM-backed certificate.
- [x] DNS points at the intended AWS load balancer.
- [x] `docs/DOMAIN_CUTOVER_CHECKLIST.md` records the completed `nyaaywatch.in` cutover and any remaining optional legacy-host follow-up.

### 7. Verification

- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run test:e2e`
- [x] `RUN_PERSISTENT_STACK_TESTS=1 npm run test:persistent` or an explicit equivalent persistent-stack validation note

## Release Decision

- [x] Ready to keep public
- [ ] Blocked

If blocked, record the exact blocker and required follow-up:

- Blocker: `None`
- Owner: `N/A`
- Next action: `<required follow-up or N/A>`

## Release Evidence

Record release-specific evidence above this line. The evidence below is retained as the original April 2026 Himachal alpha launch record and is not the current India-first release scope.

- Public stats currently return `publishedFromRunId=run_5d8880eb-ed95-4e08-b3aa-96437d5f45d9`, `sourceSnapshotAt=2026-04-10T00:00:00.000Z`, `publishedAt=2026-04-15T04:44:05.159Z`, and `methodologyVersion=2026.04-alpha` after rollback.
- Fresh alpha review cycle completed before this checklist:
  - fetch run `run_0d2b486b-91fd-4592-9507-629076e8cd83`
  - publish `publication_60a42984-3fd2-4e59-88c6-230e0801d78e`
  - replay run `run_dfe8d4e5-a6e4-4211-ae4a-47ddc5a74faa`
  - rollback `publication_307fa07c-4e7d-4bff-a498-ad2ea17694be`
- Post-deploy validation cycle completed after task definition `nyaaywatch-staging:9` and observability changes rolled out:
  - fetch run `run_f225c213-4c88-4095-9653-5e0d065add95`
  - publish `publication_4a8ab19f-1d2a-4b9b-b6c4-1ab2d610f80a`
  - replay run `run_bac1bec6-b4cc-467c-9f77-31e2832cf64c`
  - rollback `publication_ce4939b3-0fdf-4044-9677-062ee0ae49b1`
- Structured CloudWatch logs now capture:
  - `server_started`
  - `http_request`
  - `operator_fetch_started` and `operator_fetch_completed`
  - `operator_publish_started` and `operator_publish_completed`
  - `operator_replay_started` and `operator_replay_completed`
  - `operator_rollback_started` and `operator_rollback_completed`
- CloudWatch alarms are present and currently `OK`:
  - `nyaaywatch-staging-health-endpoint`
  - `nyaaywatch-staging-alb-target-5xx`
  - `nyaaywatch-staging-app-errors`
- CloudWatch dashboard `nyaaywatch-staging` validates with no dashboard validation messages.
- Persistent-stack validation was re-run on 2026-04-15 with alternate local ports because `5432` was already occupied:
  - `POSTGRES_PORT=55432 LOCALSTACK_PORT=4567 npm run docker:up`
  - `POSTGRES_PORT=55432 LOCALSTACK_PORT=4567 DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/postgres AWS_ENDPOINT_URL_S3=http://127.0.0.1:4567 RUN_PERSISTENT_STACK_TESTS=1 npm run test:persistent`
