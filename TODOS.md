# TODOS

`docs/MVP_EXECUTION_PLAN.md` is the ordered path to the Himachal alpha MVP.

Use this file for:

- review backlog
- post-MVP follow-up work
- important items that are not yet part of the ordered execution path

## Review

### Punjab Spaced Follow-Up Window

**What:** Run one additional live Punjab publish window at least 1 hour after the first 2026-04-16 internal trial window, with 2+ hours preferred, then re-evaluate whether Punjab can move from internal trial to narrow public expansion.

**Why:** The first real Punjab trial cleared source viability and operator safety, but it did not yet prove an independent second release window. That remaining gap is the main reason Punjab is still internal-only.

**Context:** `docs/EXPANSION_REVIEW_LOG.md` now records a successful live Punjab `fetch -> inspect -> publish -> replay -> rollback` session on 2026-04-16. The next check is not more scaffolding. It is a second evidence-backed Punjab window run later in time.

**Effort:** S
**Priority:** P1
**Depends on:** None

### Extract Alpha Design Foundation Into DESIGN.md

**What:** Move the alpha design foundation, token rules, and component vocabulary from `docs/NYAAYWATCH_DESIGN.md` into a dedicated `DESIGN.md`.

**Why:** The design review turned the plan into the current design-system source of truth. As implementation grows across more screens and eventually more states, contributors need one reusable foundation file instead of mining the product plan for typography, color, spacing, surface, and component rules.

**Context:** The repo currently has no standalone `DESIGN.md`. The plan now contains explicit UI foundations for the public dossier visual language, trust strips, quality badges, responsive rules, and accessibility expectations. Extracting those rules after the first implementation slice lands will keep the plan strategic and make the design system easier to evolve.

**Effort:** M
**Priority:** P2
**Depends on:** First implementation slice landing so the extracted design system reflects real component usage

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
