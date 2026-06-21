# NyaayWatch Engineering Test Plan

Copied from the approved `/plan-eng-review` artifact so implementation in future threads has direct test guidance.

## Affected Pages / Routes

- `/` — verify the Supreme Court-first hero, compact accountability metadata, High Courts section, lower-court handoff, and later state coverage directory
- `/states/:stateSlug` — verify the lower-court toplines and trust surface for any explicitly approved public state
- `/districts/:id` — verify district evidence page, anomaly explanation, trust metadata, and shareability
- `/states/:stateSlug/districts/:id` — verify state-scoped district evidence parity without cross-state leakage
- `/supreme-court` — verify apex-tier toplines, freshness/source labels, and parity with the homepage hero
- `/high-courts` — verify the beta entry surface and the published-court directory without fake all-India aggregation
- `/v1/supreme-court/stats` — verify stable Supreme Court payload and parity with homepage hero toplines
- `/v1/stats/himachal` — verify stable lower-court observability payload and parity with the Himachal lower-court overview / district-entry surfaces
- `/v1/districts` — verify district payload, quality flags, and stable schema
- `/v1/trends` — verify trend payload, snapshot metadata, and schema stability
- `/v1/states/:stateSlug/stats` — verify state-scoped observability payload, schema stability, and parity with the matching state page
- `/v1/states/:stateSlug/districts` — verify state-scoped district payload and quality flags
- `/v1/states/:stateSlug/trends` — verify state-scoped trend payload and snapshot metadata
- operator/admin run controls — verify publish gating, replay, rollback, and safe operator-only access

## Key Interactions To Verify

- homepage loads only published tier snapshots, never partial run data
- homepage keeps accountability metadata visible but visually subordinate to the Supreme Court opening
- homepage lower-court handoff avoids single-state public copy even though the legacy unscoped lower-court routes still resolve to the featured snapshot
- district page explains why a district was flagged and shows matching snapshot / methodology metadata
- citation surface / CSV export matches the same published snapshot the UI shows
- state-scoped routes only expose states with an active published snapshot in the current runtime
- homepage does not imply fake cross-tier totals or comparability between Supreme Court, High Courts, and lower courts
- High Courts cards default to visible pressure-first ordering while navigation switchers remain alphabetical
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
- a second public state appears in code or data before deployment is ready
- state switcher or state-scoped routes leak unpublished or wrong-state data

## Critical Paths

- scheduled run -> fetch -> extract -> normalize -> derive -> publish snapshot -> homepage/API reflect new published data
- failed run -> operator review -> replay or block publish -> public still sees last known good snapshot
- citizen flow: homepage -> Himachal lower-court overview -> district page -> citation surface / CSV download
- reporter flow: district trend -> methodology -> export
- developer flow: `/v1/supreme-court/stats` reproduces homepage hero toplines with stable schema
- approved additional-state flow: `/states/:stateSlug` -> `/states/:stateSlug/districts/:id` -> `/states/:stateSlug/data` -> `/v1/states/:stateSlug/stats`

## Required Test Types

- golden-fixture ingestion tests using real Himachal source artifacts
- publish-gate regression tests
- browser E2E for the public trust flow
- API contract tests with stable schema snapshots
- operator replay / rollback tests
- public-copy guardrail tests for published-snapshot framing
- route-parity tests for any additional approved public state

## Current Implemented Coverage

- migration tests covering PostgreSQL schema application and idempotent reruns
- service tests covering real-source fixture capture, publish gating, publish, replay, rollback, latest-publication reads, district history derivation, and CSV export parity
- HTTP tests covering public API parity plus the district workspace, district history/export surfaces, data downloads, methodology content, and operator fetch, inspect, publish, replay, rollback, and token enforcement
- browser E2E covering the citizen flow, reporter flow, and developer parity flow against a deterministic fixture-backed app server
- API contract tests enforcing stable schemas for `/v1/stats/himachal`, `/v1/districts`, `/v1/trends`, and the state-scoped Punjab public endpoints
- Playwright responsive/accessibility QA covering mobile trust surfaces, keyboard navigation, and axe smoke checks across the public routes
- persistent-stack integration coverage for fetch, publish, replay, and rollback using local Docker PostgreSQL plus LocalStack S3 with the real `pg` and AWS SDK code paths
- route-level copy guardrail tests enforcing published-snapshot, non-verdict, non-continuous-refresh public wording across the national homepage, explicit Himachal lower-court overview, and state-scoped Punjab public routes

Staging validation completed on 2026-04-15 with a live AWS `ap-south-1` stack covering `/health`, operator `fetch`, `inspect`, `publish`, `replay`, `rollback`, and confirmation that the public stats endpoint reflects the active publication after rollback.

## Implementation Note

The alpha should prefer complete test coverage over shortcuts. The public trust boundary, publish safety boundary, and API contract boundary are all non-negotiable.
