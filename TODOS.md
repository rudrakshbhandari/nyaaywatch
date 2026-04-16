# TODOS

`docs/MVP_EXECUTION_PLAN.md` is the ordered path to the Himachal alpha MVP.

Use this file for:

- review backlog
- post-MVP follow-up work
- important items that are not yet part of the ordered execution path

## Review

### Narrow Punjab Public Rollout

**What:** Implement the narrowest credible public Punjab exposure now that two independent Punjab windows and repeatable replay / rollback evidence exist.

**Why:** The internal evidence blocker is cleared. The remaining work is no longer more ingestion proof. It is concrete public-surface implementation, UI/API/CSV parity, and live deploy verification without implying nationwide parity.

**Context:** `docs/EXPANSION_REVIEW_LOG.md` now records two live Punjab windows on 2026-04-16, including a second window more than 2 hours after the first. `docs/PUNJAB_GO_LIVE_CHECKLIST.md` now shows the independent-window gate as cleared, while public-surface and deployment gates remain open.

**Effort:** M
**Priority:** P1
**Depends on:** Concrete public-exposure shape selection

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
