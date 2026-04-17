# TODOS

`docs/MVP_EXECUTION_PLAN.md` is the ordered path to the Himachal alpha MVP.

Use this file for:

- review backlog
- post-MVP follow-up work
- important items that are not yet part of the ordered execution path

## Review

### Publish-Time Cache Invalidation For Public Data

**What:** Ensure public CSV and other cacheable published artifacts invalidate or bypass stale CDN cache immediately after a publish.

**Why:** The state-aware live release flow is now working on AWS, but the latest Punjab verification showed a real parity break at the edge: the API moved to the new publication immediately while the CSV download still served a cached older publication until a cache-busting request forced a `MISS`.

**Context:** `docs/DEPLOYMENT_STATUS.md` and `docs/EXPANSION_REVIEW_LOG.md` now record the live state-aware Punjab verification on task definition `:28`, including the stale Cloudflare CSV `HIT` versus current API snapshot mismatch.

**Effort:** M
**Priority:** P1
**Depends on:** a decision on whether to solve this with cache-control changes, cache-busting asset URLs, or explicit publish-time purge logic

## Completed

### Source Terms And Redistribution Review

- completed in `docs/PUBLIC_DATA_EXPOSURE_POLICY.md`
- the current alpha now explicitly limits public exposure to published read-model outputs and citation metadata while keeping raw upstream captures and unpublished operator artifacts internal

### Multi-State Expansion Readiness Gates

- completed in `docs/MULTI_STATE_EXPANSION_GATES.md`
- expansion beyond Himachal now requires explicit gates for source viability, deterministic normalization, trust parity, publish safety, methodology defensibility, product IA discipline, and operating evidence

### Release Cadence And Observability Baseline

- completed in `docs/RELEASE_POLICY.md`, `docs/DEPLOYMENT_STATUS.md`, and `infra/aws/staging/stack.yaml`
- the alpha now has a fixed twice-weekly publish recommendation, a tight publisher allowlist, blocked-release rules, CloudWatch alarms for health and app errors, a release-review dashboard, and a documented log-review routine

### Release History And Operating Evidence Tracking

- completed in `docs/RELEASE_HISTORY.md`, `docs/OPERATING_EVIDENCE.md`, and the `release:record` workflow
- the alpha now writes markdown plus JSON evidence artifacts and keeps a tracked release ledger tied to publication ids, rollback targets, and reviewer notes

### Extracted Design System Foundation

- completed in `DESIGN.md` with follow-on source-of-truth updates in `README.md`, `AGENTS.md`, and `docs/NYAAYWATCH_DESIGN.md`
- the repo now keeps reusable visual-system rules in one file while leaving route hierarchy and product-specific trust-surface rationale in the product design plan

### Punjab Spaced Follow-Up Window

- completed in the second live Punjab window on 2026-04-16 with `run_726b1bb9-04c8-43dc-9dfe-c977abf812e0`, `publication_91b7a54b-5262-4dfe-8e28-8c3e315c3c4c`, replay `run_13854ef4-33c1-4204-bd66-37685148e7c4`, replay publication `publication_cb511366-8bfb-4467-9e5c-5a2db394d545`, and rollback `publication_3512d69b-35e0-4a63-b3f1-35f738af7441`
- Punjab has now cleared the independent-window operating-evidence gate; the next backlog slice is public-surface implementation and parity verification

### Narrow Punjab Public Surface

- completed in the public app with explicit `/states/punjab/...` routes, state-scoped API endpoints, dynamic supported-state navigation, and route-parity coverage
- Himachal remains the default unscoped surface, while Punjab is now available as the first approved explicit state-scoped public route family pending live deployment verification

### Punjab Live Rollout Verification

- completed on 2026-04-16 with live fetch `run_ff674e79-8752-4b4d-9b32-4c7a368d339c`, publication `publication_7db9a015-68d0-4182-8c77-f221797c7c2c`, and public verification on `https://nyaaywatch.in/states/punjab`
- release verification passed with `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab`, and the rollout evidence is now recorded in the deployment, release-history, and expansion-review docs

### State-Aware Live Release Tooling

- completed in the app operator routes and release helper scripts with explicit state selection by `stateCode` or `stateSlug`, plus release-evidence generation that now resolves the correct public URL for state-scoped rollouts
- regression coverage now proves Punjab operator fetch/publish over HTTP, Punjab release-history recording, and state-scoped verification summaries without Himachal-only assumptions
- completed live on 2026-04-16 with Punjab fetch/publish through the public operator routes on task definition `:28`, plus successful ECS-executed `release:prepublish`, `release:postpublish`, and `release:record`

### Internal Multi-Geography Pipeline Scaffolding

- completed in the operator and ingestion pipeline with state-profile-driven NJDG capture, state-scoped artifact prefixes, and a first internal candidate-state profile for Punjab
- the public app remains Himachal-only, but internal fetch / inspect / publish / replay / rollback work no longer requires a Himachal-specific code fork

### Responsive And Accessibility Trust-Surface QA

- `docs/ENG_REVIEW_TEST_PLAN.md` now treats responsive/mobile trust surfaces, keyboard navigation, and accessibility smoke checks as implemented coverage
- Playwright now verifies mobile district browsing behavior, trust-metadata visibility, keyboard navigation, and axe smoke checks across the public routes

### Narrow Alpha Vertical Slice

- published snapshot boundary with explicit published-run state
- operator API and CLI publish control
- homepage for latest published Himachal snapshot
- district evidence page
- `GET /v1/stats/himachal`
- regression coverage for publish safety, stale and empty states, and UI/API parity

### AWS-Backed Snapshot Store

- PostgreSQL-backed canonical run and publish state
- S3-backed raw artifact and replay input storage
- operator replay and rollback flows
- local Docker dev stack for PostgreSQL plus LocalStack S3
- automated migration, service, route, and persistent-stack integration coverage for the storage slice
