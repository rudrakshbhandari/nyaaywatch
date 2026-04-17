# TODOS

`docs/MVP_EXECUTION_PLAN.md` is the ordered path to the Himachal alpha MVP.

Use this file for:

- review backlog
- post-MVP follow-up work
- important items that are not yet part of the ordered execution path

## Review

### Haryana Public Readiness Review

**What:** Decide whether Haryana should become the next narrow public state rollout or remain internal-only while another state trial runs.

**Why:** Haryana has now cleared the internal fetch/publish/replay/rollback bar on the live stack, so the remaining question is public trust posture rather than extraction viability.

**Context:** The live Haryana trial completed on 2026-04-17 with fetch run `run_171cccad-9fef-47cb-9cc1-c1ae4449fe4e`, publication `publication_0d8a736d-1c27-4ae3-8cba-c0593057e3d2`, replay run `run_76e23910-ffd8-4dcc-a3be-3eda0b130356`, replay publication `publication_cc7b1068-b97e-470a-a079-570cad23061f`, and rollback `publication_09613d9d-ae89-4543-9028-8f5d971df587`. Public Haryana routes still return `404`, so the next move is a deliberate go/no-go review, not more hidden plumbing work.

**Effort:** S
**Priority:** P1

## Completed

### Publish-Time Cache Invalidation For Public Data

- partial code fix completed in PR #44 by marking `/data` and CSV export endpoints as `no-store` for browsers and CDNs, including the explicit Punjab state-scoped routes
- `npm run release:verify` now fails if the public data page or district CSV is still cacheable, which exposed that a cached pre-fix Cloudflare object still survives until an explicit purge runs
- completed live on 2026-04-17 after PR #45 merged, the Cloudflare token wiring was corrected, task definition `:34` rolled out with purge credentials, and `npm run release:verify -- --base-url https://nyaaywatch.in --state-slug punjab` passed without cache-busting

### Haryana Internal Trial

- completed live on 2026-04-17 after PR #46 merged and task definition `:35` rolled out with Haryana internal-only support
- first live Haryana fetch run `run_171cccad-9fef-47cb-9cc1-c1ae4449fe4e` published as `publication_0d8a736d-1c27-4ae3-8cba-c0593057e3d2`
- replay from stored evidence succeeded as `run_76e23910-ffd8-4dcc-a3be-3eda0b130356` with replay publication `publication_cc7b1068-b97e-470a-a079-570cad23061f`
- rollback `publication_09613d9d-ae89-4543-9028-8f5d971df587` restored the original Haryana publication, and public Haryana routes still returned `404`

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
