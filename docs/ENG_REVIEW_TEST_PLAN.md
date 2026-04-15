# NyaayWatch Engineering Test Plan

Copied from the approved `/plan-eng-review` artifact so implementation in future threads has direct test guidance.

## Affected Pages / Routes

- `/` — verify Himachal topline scorecard, freshness metadata, quality status, anomaly callouts, and trust metadata parity
- `/districts/:id` — verify district evidence page, anomaly explanation, trust metadata, and shareability
- `/v1/stats/himachal` — verify stable observability payload and parity with homepage toplines
- `/v1/districts` — verify district payload, quality flags, and stable schema
- `/v1/trends` — verify trend payload, snapshot metadata, and schema stability
- operator/admin run controls — verify publish gating, replay, rollback, and safe operator-only access

## Key Interactions To Verify

- homepage loads only the latest published snapshot, never partial run data
- district page explains why a district was flagged and shows matching snapshot / methodology metadata
- evidence pack / CSV export matches the same published snapshot the UI shows
- operator can inspect a failed run, replay it safely, and block unsafe publish
- API responses match the same published snapshot numbers shown in the public UI
- API schema remains stable across snapshot updates and methodology version changes

## Edge Cases

- no published snapshot exists yet
- snapshot is stale but still served with an explicit freshness warning
- quality state is partial or inconsistent
- upstream source changes labels or HTML shape
- publish attempted from an unsafe or incomplete run
- replay attempted twice and remains idempotent
- methodology / formula version changes between snapshots
- API field or metadata drift across releases

## Critical Paths

- scheduled run -> fetch -> extract -> normalize -> derive -> publish snapshot -> homepage/API reflect new published data
- failed run -> operator review -> replay or block publish -> public still sees last known good snapshot
- citizen flow: homepage -> district page -> evidence pack download
- reporter flow: district trend -> methodology -> export
- developer flow: `/v1/stats/himachal` reproduces homepage toplines with stable schema

## Required Test Types

- golden-fixture ingestion tests using real Himachal source artifacts
- publish-gate regression tests
- browser E2E for the public trust flow
- API contract tests with stable schema snapshots
- operator replay / rollback tests

## Current Implemented Coverage

- migration tests covering PostgreSQL schema application and idempotent reruns
- service tests covering real-source fixture capture, publish gating, publish, replay, rollback, latest-publication reads, district history derivation, and CSV export parity
- HTTP tests covering public API parity plus the district workspace, district history/export surfaces, data downloads, methodology content, and operator fetch, inspect, publish, replay, rollback, and token enforcement
- browser E2E covering the citizen flow, reporter flow, and developer parity flow against a deterministic fixture-backed app server
- API contract tests enforcing stable schemas for `/v1/stats/himachal`, `/v1/districts`, and `/v1/trends`
- Playwright responsive/accessibility QA covering mobile trust surfaces, keyboard navigation, and axe smoke checks across the public routes
- persistent-stack integration coverage for fetch, publish, replay, and rollback using local Docker PostgreSQL plus LocalStack S3 with the real `pg` and AWS SDK code paths

Staging validation completed on 2026-04-15 with a live AWS `ap-south-1` stack covering `/health`, operator `fetch`, `inspect`, `publish`, `replay`, `rollback`, and confirmation that the public stats endpoint reflects the active publication after rollback.

## Implementation Note

The alpha should prefer complete test coverage over shortcuts. The public trust boundary, publish safety boundary, and API contract boundary are all non-negotiable.
